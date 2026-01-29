import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express from 'express';
import { createDattoClient, type DattoClient } from 'datto-rmm-api';
import { type ServerConfig } from './config.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { tools, getTool } from './tools/index.js';
import { resources, resourceTemplates, readResource } from './resources/index.js';

/**
 * Create and configure the MCP server.
 */
export function createServer(config: ServerConfig): { server: Server; client: DattoClient } {
  const client = createDattoClient({
    platform: config.platform,
    auth: {
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
    },
  });

  const server = new Server(
    {
      name: 'datto-rmm',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  );

  // Register tool handlers
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const tool = getTool(name);
    if (!tool) {
      return {
        content: [{ type: 'text', text: `Unknown tool: ${name}` }],
        isError: true,
      };
    }

    try {
      const result = await tool.handler(client, args ?? {});
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: 'text', text: `Error executing ${name}: ${message}` }],
        isError: true,
      };
    }
  });

  // Register resource handlers
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return { resources };
  });

  server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
    return { resourceTemplates };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    return readResource(client, uri);
  });

  return { server, client };
}

/**
 * Run the server with SSE transport for HTTP access.
 */
export async function runHttpServer(config: ServerConfig): Promise<void> {
  const app = express();
  const port = process.env.PORT || 3000;

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'datto-rmm-mcp-server' });
  });

  // SSE endpoint for MCP
  app.get('/sse', async (req, res) => {
    console.log('New SSE connection established');
    
    const { server } = createServer(config);
    const transport = new SSEServerTransport('/message', res);
    
    await server.connect(transport);
    
    // Keep connection alive
    req.on('close', () => {
      console.log('SSE connection closed');
      server.close();
    });
  });

  // Message endpoint for client requests
  app.post('/message', express.json(), async (req, res) => {
    // This is handled by the SSE transport
    res.json({ received: true });
  });

  app.listen(port, () => {
    console.log(`Datto RMM MCP server listening on port ${port}`);
    console.log(`Health check: http://localhost:${port}/health`);
    console.log(`SSE endpoint: http://localhost:${port}/sse`);
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('Shutting down server...');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('Shutting down server...');
    process.exit(0);
  });
}
