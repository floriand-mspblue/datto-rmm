#!/usr/bin/env node

import { loadConfig } from './config.js';
import { runServer } from './server.js';
import { startHttpServer } from './http-server.js';

async function main() {
  try {
    // Determine transport mode from environment variable
    // - 'stdio': Local mode for Claude Desktop (default)
    // - 'http' or 'sse': Azure Web App mode
    const mode = (process.env.MCP_TRANSPORT_MODE || 'stdio').toLowerCase();

    console.log(`Starting Datto RMM MCP Server in ${mode.toUpperCase()} mode...`);

    if (mode === 'http' || mode === 'sse') {
      // Azure Web App mode - HTTP server with SSE transport
      await startHttpServer();
    } else {
      // Local mode - stdio transport for Claude Desktop
      console.log('Running in stdio mode (Claude Desktop/local integration)');
      const config = loadConfig();
      await runServer(config);
    }
  } catch (error) {
    console.error('Failed to start Datto RMM MCP server:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
    process.exit(1);
  }
}

main();
