import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { AppEnv } from './types.ts';
import { dbMiddleware } from './middleware/db.ts';
import { authRouter } from './routes/auth.ts';
import { masterRouter } from './routes/master.ts';
import { usersRouter } from './routes/users.ts';
import { activitiesRouter } from './routes/activities.ts';
import { attendancesRouter } from './routes/attendances.ts';
import { permissionsRouter } from './routes/permissions.ts';
import { diagnosticsRouter } from './routes/diagnostics.ts';

const app = new Hono<AppEnv>();

// Global Middlewares
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: (origin, c) => {
      // credentials:true requires explicit origin, never wildcard
      const allowed = c.env?.ALLOWED_ORIGIN;
      if (allowed) return origin === allowed ? origin : null;
      // No ALLOWED_ORIGIN set: reflect the request origin (workers.dev / dev)
      return origin || null;
    },
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);

// Health check (Fast Edge Ping, zero DB dependency required)
app.get('/api/health', (c) => {
  const isCloudflare = typeof (globalThis as any).WebSocketPair !== 'undefined';
  return c.json({
    status: 'ok',
    service: 'PSDM.web 2.0 API (Cloudflare Workers)',
    timestamp: new Date().toISOString(),
    edgeRuntime: isCloudflare ? 'Cloudflare Workers' : 'Node/Vite Environment',
  });
});

// Inject Edge Turso DB for database-backed routes
app.use('/api/*', dbMiddleware);

// Domain Routes
app.route('/api/auth', authRouter);
app.route('/api/master', masterRouter);
app.route('/api/users', usersRouter);
app.route('/api/activities', activitiesRouter);
app.route('/api/attendances', attendancesRouter);
app.route('/api/permissions', permissionsRouter);
app.route('/api/diagnostics', diagnosticsRouter);

// Global Error Handler
app.onError((err, c) => {
  console.error('Unhandled Server Error:', err);
  return c.json(
    {
      success: false,
      message: err.message || 'Internal Server Error',
    },
    500
  );
});

// 404 fallback for unmatched API routes
app.notFound((c) => {
  return c.json({ success: false, message: 'Endpoint tidak ditemukan' }, 404);
});

export default app;
