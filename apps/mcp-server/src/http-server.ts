import express, { type Request, type Response } from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { createServer } from './server.js';
import { loadConfig } from './config.js';

/**
 * Create Express HTTP server with MCP SSE endpoint.
 * This server is designed for cloud deployment (Azure Web Apps, etc.)
 */
export function createHttpServer() {
  const app = express();
  
  // Enable JSON parsing for any future POST endpoints
  app.use(express.json());

  // CORS headers for Azure AI Foundry integration
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
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
          method: 'GET',
          description: 'MCP Server-Sent Events endpoint',
          transport: 'SSE',
        },
        health: {
          path: '/health',
          method: 'GET',
          description: 'Health check endpoint',
        },
      },
      documentation: 'https://github.com/josh-fisher/datto-rmm',
      tools: '39+ MCP tools available',
      features: [
        'Device management',
        'Site management',
        'Alert monitoring',
        'Job execution',
        'Audit logging',
        'Activity tracking',
      ],
    });
  });

  // MCP SSE endpoint - the main integration point
  app.get('/mcp', async (req: Request, res: Response) => {
    try {
      console.log('New MCP connection established');

      // Set SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

      // Load configuration and create MCP server
      const config = loadConfig();
      const { server: mcpServer } = createServer(config);

      // Create SSE transport
      const transport = new SSEServerTransport('/mcp', res);

      // Connect the MCP server to the transport
      await mcpServer.connect(transport);

      console.log('MCP server connected via SSE');

      // Handle client disconnect
      req.on('close', async () => {
        console.log('MCP connection closed');
        try {
          await mcpServer.close();
        } catch (error) {
          console.error('Error closing MCP server:', error);
        }
      });

      // Handle errors on the response stream
      res.on('error', (error) => {
        console.error('SSE response error:', error);
      });

    } catch (error) {
      console.error('MCP connection error:', error);
      
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Failed to establish MCP connection',
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
  });

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Cannot ${req.method} ${req.path}`,
      availableEndpoints: ['/', '/health', '/mcp'],
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
  const port = process.env.PORT || 8080;

  const server = app.listen(port, () => {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  Datto RMM MCP Server - HTTP/SSE Mode                     ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`🚀 Server listening on port ${port}`);
    console.log(`📍 Health check: http://localhost:${port}/health`);
    console.log(`🔌 MCP endpoint: http://localhost:${port}/mcp`);
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

    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.log('⚠️  Forced shutdown');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
