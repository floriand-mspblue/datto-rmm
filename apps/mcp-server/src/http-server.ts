import express, { type Request, type Response, type Application } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from './server.js';
import { loadConfig } from './config.js';

/**
 * Create Express HTTP server with MCP Streamable HTTP endpoint.
 * Uses the MCP Streamable HTTP transport (POST-based) for Azure AI Foundry.
 */
export function createHttpServer(): Application {
  const app = express();

  // Parse JSON for all routes EXCEPT /mcp
  // The MCP StreamableHTTPServerTransport reads the raw body stream itself
  app.use((req, res, next) => {
    if (req.path === '/mcp') {
      next();
    } else {
      express.json()(req, res, next);
    }
  });

  // CORS headers for Azure AI Foundry integration
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Mcp-Session-Id');
    res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id');

    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Health check endpoint (required for Azure monitoring)
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      service: 'datto-rmm-mcp-server',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Root endpoint with service information
  app.get('/', (req: Request, res: Response) => {
    res.json({
      name: 'Datto RMM MCP Server',
      description: 'Model Context Protocol server for Datto RMM integration',
      version: '0.1.0',
      endpoints: {
        mcp: {
          path: '/mcp',
          method: 'POST',
          description: 'MCP Streamable HTTP endpoint',
          transport: 'StreamableHTTP',
        },
        health: {
          path: '/health',
          method: 'GET',
          description: 'Health check endpoint',
        },
      },
      documentation: 'https://github.com/josh-fisher/datto-rmm',
      tools: '39+ MCP tools available',
    });
  });

  // Store active transports by session ID
  const transports = new Map<string, StreamableHTTPServerTransport>();

  // MCP Streamable HTTP endpoint - POST for sending messages
  app.post('/mcp', async (req: Request, res: Response) => {
    try {
      const sessionId = req.headers['mcp-session-id'] as string | undefined;

      // Reuse existing transport for this session
      if (sessionId && transports.has(sessionId)) {
        const transport = transports.get(sessionId)!;
        await transport.handleRequest(req, res);
        return;
      }

      // New session - create MCP server and transport
      console.log('New MCP session initiated');

      const config = loadConfig();
      const { server: mcpServer } = createServer(config);

      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => crypto.randomUUID(),
        onsessioninitialized: (id) => {
          console.log(`MCP session created: ${id}`);
          transports.set(id, transport);
        },
      });

      // Clean up on close
      transport.onclose = () => {
        const id = transport.sessionId;
        if (id) {
          console.log(`MCP session closed: ${id}`);
          transports.delete(id);
        }
      };

      // Connect the MCP server to the transport
      await mcpServer.connect(transport);

      // Handle the initial request
      await transport.handleRequest(req, res);
    } catch (error) {
      console.error('MCP request error:', error);

      if (!res.headersSent) {
        res.status(500).json({
          error: 'Failed to process MCP request',
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
  });

  // MCP Streamable HTTP endpoint - GET for SSE stream (server-to-client notifications)
  app.get('/mcp', async (req: Request, res: Response) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    if (!sessionId || !transports.has(sessionId)) {
      res.status(400).json({
        error: 'Invalid or missing session ID',
        message: 'Send a POST to /mcp first to initialize a session',
      });
      return;
    }

    const transport = transports.get(sessionId)!;
    await transport.handleRequest(req, res);
  });

  // MCP Streamable HTTP endpoint - DELETE to terminate session
  app.delete('/mcp', async (req: Request, res: Response) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    if (!sessionId || !transports.has(sessionId)) {
      res.status(400).json({
        error: 'Invalid or missing session ID',
      });
      return;
    }

    const transport = transports.get(sessionId)!;
    await transport.handleRequest(req, res);
    transports.delete(sessionId);
  });

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Cannot ${req.method} ${req.path}`,
      availableEndpoints: ['/', '/health', 'POST /mcp'],
    });
  });

  // Global error handler
  app.use((err: Error, req: Request, res: Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message,
    });
  });

  return app;
}

/**
 * Start the HTTP server.
 * Port is read from environment variable PORT (set by Azure)
 * or defaults to 8080 for local development.
 */
export async function startHttpServer(): Promise<void> {
  const app = createHttpServer();
  const port = process.env['PORT'] || 8080;

  const server = app.listen(port, () => {
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║  Datto RMM MCP Server - Streamable HTTP Mode            ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`🚀 Server listening on port ${port}`);
    console.log(`🔍 Health check: http://localhost:${port}/health`);
    console.log(`🔌 MCP endpoint: POST http://localhost:${port}/mcp`);
    console.log(`📖 API info: http://localhost:${port}/`);
    console.log('');
    console.log('Ready for Azure AI Foundry connections!');
    console.log('');
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\n🛑 Shutting down gracefully...');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });

    setTimeout(() => {
      console.log('⚠️  Forced shutdown');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
