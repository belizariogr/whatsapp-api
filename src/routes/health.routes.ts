import { Hono } from 'hono';
import { jsonSuccess } from '../utils/response.ts';
import { pingDb } from '../db/client.ts';

const app = new Hono();

app.get('/health', async (c) => {
  const dbOk = await pingDb();
  return jsonSuccess(c, {
    status: dbOk ? 'ok' : 'degraded',
    database: dbOk ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  }, dbOk ? 200 : 503);
});

export default app;
