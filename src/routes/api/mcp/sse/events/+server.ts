import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isServerInitialized } from '$lib/mcp/server-state';

// アクティブなSSE接続を管理
const activeConnections = new Map<string, {
  controller: ReadableStreamDefaultController;
  encoder: TextEncoder;
  cleanup: () => void;
}>();

// イベントを全ての接続に送信
export function broadcastEvent(event: any) {
  const message = `data: ${JSON.stringify(event)}\n\n`;
  activeConnections.forEach(({ controller, encoder }) => {
    try {
      controller.enqueue(encoder.encode(message));
    } catch (e) {
      // 接続が閉じられている場合は無視
    }
  });
}

// 特定の接続にイベントを送信
export function sendEventToConnection(connectionId: string, event: any) {
  const connection = activeConnections.get(connectionId);
  if (connection) {
    const message = `data: ${JSON.stringify(event)}\n\n`;
    try {
      connection.controller.enqueue(connection.encoder.encode(message));
    } catch (e) {
      // 接続が閉じられている場合は無視
      activeConnections.delete(connectionId);
    }
  }
}

export const GET: RequestHandler = async ({ url }) => {
    console.log("GET request received", url);
  // MCPサーバが初期化されていない場合はエラー
  if (!isServerInitialized()) {
    throw error(503, 'MCP server not initialized. Please call /api/mcp/init first.');
  }

  const connectionId = url.searchParams.get('connectionId') || 
    `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const encoder = new TextEncoder();
  let keepAliveInterval: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const sendData = (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      // 接続をマップに追加
      const cleanup = () => {
        if (keepAliveInterval) {
          clearInterval(keepAliveInterval);
          keepAliveInterval = null;
        }
        activeConnections.delete(connectionId);
      };

      activeConnections.set(connectionId, {
        controller,
        encoder,
        cleanup
      });

      // 接続確立の通知
      sendData({
        type: 'connected',
        connectionId,
        timestamp: new Date().toISOString(),
        message: 'SSE connection established'
      });

      // keepalive用のタイマー
      keepAliveInterval = setInterval(() => {
        sendData({
          type: 'keepalive',
          connectionId,
          timestamp: new Date().toISOString()
        });
      }, 30000); // 30秒ごと
    },

    cancel() {
      // 接続がクローズされた時のクリーンアップ
      const connection = activeConnections.get(connectionId);
      if (connection) {
        connection.cleanup();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control, X-Connection-Id',
      'X-Connection-Id': connectionId
    }
  });
};

// 接続の一覧を取得（デバッグ用）
export const POST: RequestHandler = async ({ request }) => {
  console.log("POST request received", request);
  const { action } = await request.json();
  
  if (action === 'list_connections') {
    return new Response(JSON.stringify({
      connections: Array.from(activeConnections.keys()),
      count: activeConnections.size
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (action === 'broadcast') {
    const { event } = await request.json();
    broadcastEvent(event);
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  throw error(400, 'Invalid action');
}; 