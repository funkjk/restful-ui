#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// MCPサーバの作成
const server = new Server(
  {
    name: 'current-time-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);


server.tool(
  "double_number",
  "与えられた数値を2倍にする",
  {num: z.number().describe("数値")},
  ({num}) => ({content: [{type: "text", text: (num * 2).toString()}]}),
);

// 利用可能なツールの一覧
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'current-time',
        description: 'Get the current date and time',
        inputSchema: {
          type: 'object',
          properties: {
            timezone: {
              type: 'string',
              description: 'Timezone (optional, defaults to local)',
            },
            format: {
              type: 'string',
              description: 'Format (iso, local, or timestamp)',
              enum: ['iso', 'local', 'timestamp'],
            },
          },
        },
      },
    ],
  };
});

// ツールの実行
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'current-time') {
    const timezone = args?.timezone || 'local';
    const format = args?.format || 'iso';
    
    const now = new Date();
    let timeString;
    
    switch (format) {
      case 'timestamp':
        timeString = now.getTime().toString();
        break;
      case 'local':
        timeString = now.toLocaleString();
        break;
      case 'iso':
      default:
        timeString = now.toISOString();
        break;
    }
    
    const result = {
      currentTime: timeString,
      timezone: timezone,
      format: format,
      unixTimestamp: now.getTime(),
    };

    return {
      content: [
        {
          type: 'text',
          text: `Current time: ${timeString}\nTimezone: ${timezone}\nFormat: ${format}\nUnix timestamp: ${now.getTime()}`,
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

// サーバーの起動
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Current Time MCP Server started');
}

main().catch((error) => {
  console.error('Error starting server:', error);
  process.exit(1);
}); 