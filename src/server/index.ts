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
import { pointsRouter } from './routes/points.ts';
import { diagnosticsRouter } from './routes/diagnostics.ts';
import { storageRouter } from './routes/storage.ts';
import { syncRouter } from './routes/sync.ts';
import { waBroadcastRouter } from './routes/waBroadcast.ts';
import { settingsRouter } from './routes/settings.ts';

const app = new Hono<AppEnv>();

// Global Middlewares
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: (origin, c) => {
      // credentials:true requires explicit origin, never wildcard
      const allowed = c.env?.ALLOWED_ORIGIN || process.env.ALLOWED_ORIGIN;
      const isProd = c.env?.NODE_ENV === 'production' || process.env.NODE_ENV === 'production';

      if (allowed && typeof allowed === 'string' && allowed.trim() !== '') {
        const allowedList = allowed.split(',').map((o: string) => o.trim()).filter(Boolean);
        return origin && allowedList.includes(origin) ? origin : null;
      }

      if (isProd) {
        // In production, ALLOWED_ORIGIN must be explicitly configured; reject arbitrary origins
        console.error('CORS Security Alert: ALLOWED_ORIGIN is not configured in production environment.');
        return null;
      }

      // In local development, reflect request origin (e.g. localhost:3000)
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
app.route('/api/points', pointsRouter);
app.route('/api/storage', storageRouter);
app.route('/api/sync', syncRouter);
app.route('/api/diagnostics', diagnosticsRouter);
app.route('/api/wa-broadcast', waBroadcastRouter);
app.route('/api/broadcasts', waBroadcastRouter);
app.route('/api/settings', settingsRouter);

// Global Error Handler
app.onError((err, c) => {
  const causeMsg = (err as any)?.cause?.message;
  console.error('Unhandled Server Error:', err, causeMsg ? `Cause: ${causeMsg}` : '');
  const message = causeMsg ? `${err.message} (${causeMsg})` : (err.message || 'Internal Server Error');
  return c.json(
    {
      success: false,
      message,
    },
    500
  );
});

// 404 fallback for unmatched API routes
app.notFound((c) => {
  return c.json({ success: false, message: 'Endpoint tidak ditemukan' }, 404);
});

export default app;
