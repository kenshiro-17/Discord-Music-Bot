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
 * Creates HTTP health check server
 */
export function createHealthCheckServer(): http.Server {
  const server = http.createServer((req, res) => {
    if (req.url === '/health' && req.method === 'GET') {
      const healthData = getHealthCheckData();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(healthData, null, 2));
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
