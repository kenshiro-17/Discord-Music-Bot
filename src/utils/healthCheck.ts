import http from 'http';
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
 * Formats seconds into readable duration
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(' ');
}

/**
 * Generates HTML status page
 */
function generateHtml(data: HealthCheckResponse): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thankan Chettan Music Bot</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #1a1b1e;
      color: #e0e0e0;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
    }
    .container {
      background-color: #2b2d31;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
      text-align: center;
      min-width: 300px;
      border: 1px solid #3f4147;
    }
    h1 {
      color: #5865f2;
      margin-bottom: 0.5rem;
    }
    .subtitle {
      color: #949ba4;
      margin-bottom: 2rem;
      font-style: italic;
    }
    .status-item {
      margin: 1rem 0;
      font-size: 1.1rem;
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #3f4147;
      padding-bottom: 0.5rem;
    }
    .status-label {
      color: #b5bac1;
    }
    .status-value {
      font-weight: bold;
      color: #f2f3f5;
    }
    .healthy {
      color: #57f287;
    }
    .footer {
      margin-top: 2rem;
      font-size: 0.8rem;
      color: #5c5e66;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Thankan Chettan</h1>
    <div class="subtitle">"Ividuthe niyamam Thankan Chettan aanu"</div>
    
    <div class="status-item">
      <span class="status-label">Status</span>
      <span class="status-value healthy">● Online</span>
    </div>
    
    <div class="status-item">
      <span class="status-label">Uptime</span>
      <span class="status-value">${formatUptime(data.uptime)}</span>
    </div>
    
    <div class="status-item">
      <span class="status-label">Active Queues</span>
      <span class="status-value">${data.activeQueues}</span>
    </div>
    
    <div class="status-item">
      <span class="status-label">Memory Usage</span>
      <span class="status-value">${Math.round(data.memory.used / 1024 / 1024)} MB</span>
    </div>

    <div class="footer">
      Running on Node.js ${process.version}
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Creates HTTP health check server
 */
export function createHealthCheckServer(): http.Server {
  const server = http.createServer((req, res) => {
    if (req.url === '/health' && req.method === 'GET') {
      const healthData = getHealthCheckData();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(healthData, null, 2));
    } else if ((req.url === '/' || req.url === '/index.html') && req.method === 'GET') {
      const healthData = getHealthCheckData();
      const html = generateHtml(healthData);
      
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });

  // Railway and other cloud platforms may set PORT env variable
  const port = parseInt(process.env.PORT || process.env.HEALTH_CHECK_PORT || '8080', 10);

  server.listen(port, '0.0.0.0', () => {
    logger.info(`Health check server listening on port ${port}`);
  });

  return server;
}
