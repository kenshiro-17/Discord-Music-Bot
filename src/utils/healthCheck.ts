import http from 'http';
import fs from 'fs';
import path from 'path';
import { HealthCheckResponse } from '../types';
import { getAllQueues } from '../handlers/queueManager';
import { logger } from './logger';

/**
 * Bot start time for uptime calculation
 */
let startTime: number = Date.now();

/**
 * Sets the start time
 */
export function setStartTime(time: number): void {
  startTime = time;
}

/**
 * Gets health check data
 */
export function getHealthCheckData(): HealthCheckResponse {
  const memUsage = process.memoryUsage();
  const queues = getAllQueues();

  return {
    status: 'healthy',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    memory: {
      used: memUsage.heapUsed,
      total: memUsage.heapTotal,
      percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100,
    },
    activeQueues: queues.size,
    timestamp: Date.now(),
  };
}

/**
 * Helper to serve static files
 */
function serveStaticFile(res: http.ServerResponse, filePath: string, contentType: string) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('Not Found');
      } else {
        res.writeHead(500);
        res.end('Server Error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
}

/**
 * Creates HTTP health check server
 */
export function createHealthCheckServer(): http.Server {
  const server = http.createServer((req, res) => {
    const publicDir = path.join(process.cwd(), 'public');

    // API Endpoint
    if (req.url === '/health' && req.method === 'GET') {
      const healthData = getHealthCheckData();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(healthData, null, 2));
      return;
    }

    // Static File Serving
    let url = req.url || '/';
    if (url === '/') url = '/index.html';

    // Prevent directory traversal
    const safePath = path.normalize(url).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.join(publicDir, safePath);

    const extname = path.extname(filePath);
    let contentType = 'text/html';

    switch (extname) {
      case '.js':
        contentType = 'text/javascript';
        break;
      case '.css':
        contentType = 'text/css';
        break;
      case '.json':
        contentType = 'application/json';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.jpg':
        contentType = 'image/jpg';
        break;
      case '.ico':
        contentType = 'image/x-icon';
        break;
    }

    // Only serve files from public directory
    if (!filePath.startsWith(publicDir)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    serveStaticFile(res, filePath, contentType);
  });

  const port = parseInt(process.env.PORT || process.env.HEALTH_CHECK_PORT || '8080', 10);

  server.listen(port, '0.0.0.0', () => {
    logger.info(`Health check server listening on port ${port}`);
  });

  return server;
}
