#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const SESSION_ID = process.env.DEVLINK_SESSION_ID;
const DEVLINK_PORT = process.env.DEVLINK_PORT || '3000';
const INTERNAL_SECRET = process.env.DEVLINK_INTERNAL_SECRET;
const DEVLINK_URL = `http://localhost:${DEVLINK_PORT}`;

const server = new McpServer({
  name: 'devlink',
  version: '1.0.0',
});

server.tool(
  'permission_prompt',
  'Handle permission prompts for Claude Code tools',
  {
    tool_name: z.string().describe('The name of the tool requesting permission'),
    input: z.record(z.unknown()).describe('The tool input parameters'),
    reason: z.string().optional().describe('Reason for the permission request'),
  },
  async ({ tool_name, input, reason }) => {
    try {
      const response = await fetch(`${DEVLINK_URL}/api/internal/permission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-devlink-secret': INTERNAL_SECRET },
        body: JSON.stringify({
          sessionId: SESSION_ID,
          toolName: tool_name,
          input,
          reason,
        }),
      });

      if (!response.ok) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ behavior: 'deny', message: 'Devlink server error' }) }],
        };
      }

      const result = await response.json();
      return {
        content: [{ type: 'text', text: JSON.stringify(result) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ behavior: 'deny', message: 'Could not reach devlink server' }) }],
      };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
