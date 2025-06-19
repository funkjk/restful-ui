#!/usr/bin/env node

import { spawn } from 'child_process';

// MCPサーバとのやり取りをテストする関数
async function testCurrentTime() {
  console.log('Testing current-time MCP server...');
  
  const server = spawn('node', ['test/mcp-test.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: process.cwd()
  });
  
  let output = '';
  
  server.stdout.on('data', (data) => {
    output += data.toString();
  });
  
  server.stderr.on('data', (data) => {
    console.error('Server stderr:', data.toString());
  });
  
  // Initializeリクエストを送信
  const initRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {}
      },
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    }
  };
  
  server.stdin.write(JSON.stringify(initRequest) + '\n');
  
  // ツールリストを取得
  const listToolsRequest = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {}
  };
  
  server.stdin.write(JSON.stringify(listToolsRequest) + '\n');
  
  // current-timeツールを実行
  const callToolRequest = {
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'current-time',
      arguments: {
        format: 'iso'
      }
    }
  };
  
  server.stdin.write(JSON.stringify(callToolRequest) + '\n');
  
  // 少し待ってからサーバーを終了
  setTimeout(() => {
    server.kill();
    console.log('Server output:', output);
    
    // レスポンスを解析
    const lines = output.split('\n').filter(line => line.trim());
    lines.forEach((line, index) => {
      try {
        if (line.startsWith('{')) {
          const response = JSON.parse(line);
          console.log(`Response ${index + 1}:`, JSON.stringify(response, null, 2));
        }
      } catch (e) {
        console.log(`Non-JSON line: ${line}`);
      }
    });
  }, 2000);
}

testCurrentTime().catch(console.error); 