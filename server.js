// Custom Next.js Server with WebSocket Support
// File: server.js
// Purpose: Custom server for handling WebSocket upgrades alongside Next.js

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = parseInt(process.env.PORT || '3000', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// WebSocket server setup
let wss = null;
const connections = new Map();

/**
 * Initialize WebSocket server
 */
function initWebSocketServer(server) {
  wss = new WebSocket.Server({ noServer: true });

  // Handle WebSocket connections
  wss.on('connection', (ws, req, ownerId) => {
    console.log(`[WebSocket] Client connected: ${ownerId}`);

    const connectionId = `${ownerId}-${Date.now()}`;
    connections.set(connectionId, { ws, ownerId, isAlive: true });

    // Handle messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        console.log(`[WebSocket] Message from ${ownerId}:`, message.type);
        // Future: handle incoming messages
      } catch (error) {
        console.error('[WebSocket] Message parse error:', error);
      }
    });

    // Handle pong
    ws.on('pong', () => {
      const conn = connections.get(connectionId);
      if (conn) conn.isAlive = true;
    });

    // Handle close
    ws.on('close', () => {
      connections.delete(connectionId);
      console.log(`[WebSocket] Client disconnected: ${connectionId}`);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error(`[WebSocket] Error (${connectionId}):`, error);
    });
  });

  return wss;
}

/**
 * Broadcast message to all connections for an owner
 */
function broadcastToOwner(ownerId, message) {
  let count = 0;
  connections.forEach((conn, key) => {
    if (conn.ownerId === ownerId && conn.ws.readyState === WebSocket.OPEN) {
      conn.ws.send(JSON.stringify(message));
      count++;
    }
  });
  return count;
}

/**
 * Start the server
 */
app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Initialize WebSocket server
  initWebSocketServer(server);

  // Handle WebSocket upgrade requests
  server.on('upgrade', (req, socket, head) => {
    const parsedUrl = parse(req.url, true);

    if (parsedUrl.pathname === '/api/ws') {
      // Extract token from Authorization header OR query parameter (for browser testing)
      const authHeader = req.headers.authorization;
      const queryToken = parsedUrl.query.token;
      
      let token;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7); // Remove "Bearer " prefix
      } else if (queryToken) {
        token = queryToken; // Support ?token=xxx for browser testing
      } else {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      // Verify token
      try {
        const payload = jwt.verify(token, JWT_SECRET);
        const ownerId = payload.ownerId || payload.id;

        if (!ownerId) {
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }

        // Handle upgrade
        wss.handleUpgrade(req, socket, head, (ws) => {
          wss.emit('connection', ws, req, ownerId);

          // Send welcome message
          ws.send(
            JSON.stringify({
              type: 'connection_established',
              data: {
                ownerId,
                message: 'Connected to real-time metrics',
              },
              timestamp: Date.now(),
            })
          );

          console.log(`[WebSocket] Upgrade successful for owner: ${ownerId}`);
        });
      } catch (error) {
        console.error('[WebSocket] Token verification failed:', error);
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
      }
    } else {
      // Default upgrade handling for other paths
      socket.destroy();
    }
  });

  // Heartbeat interval
  const heartbeatInterval = setInterval(() => {
    connections.forEach((conn, key) => {
      if (!conn.isAlive) {
        conn.ws.terminate();
        connections.delete(key);
        return;
      }
      conn.isAlive = false;
      conn.ws.ping();
    });
  }, 30000); // 30 seconds

  // Graceful shutdown
  const gracefulShutdown = () => {
    console.log('Shutting down gracefully...');
    clearInterval(heartbeatInterval);
    
    connections.forEach((conn) => {
      conn.ws.close(1001, 'Server shutting down');
    });
    
    server.close(() => {
      console.log('Server shut down complete');
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      console.error('Forced shutdown');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

  // Start server
  server.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
    console.log(`> WebSocket server ready at ws://localhost:${PORT}/api/ws`);
  });
});

// Export for testing
module.exports = { broadcastToOwner };
