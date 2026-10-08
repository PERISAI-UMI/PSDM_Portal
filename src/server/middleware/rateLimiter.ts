import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '../types.ts';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory sliding window rate limiter per worker isolate.
// Catatan Arsitektur: Pada Cloudflare Workers multi-isolate / distributed PoP,
// counter ini memproteksi brute-force lokal per-isolate dengan low-overhead.
// Untuk skala enterprise multi-colo, disarankan melapisinya dengan Cloudflare WAF / KV Rate Limiting.
const rateLimitMap = new Map<string, RateLimitRecord>();

// Bersihkan cache lama secara berkala agar memori isolate tetap bersih
let lastCleanup = Date.now();
function cleanupExpired() {
  const now = Date.now();
  if (now - lastCleanup < 60000) return;
  lastCleanup = now;

  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}

export function rateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (c: any) => string;
}): MiddlewareHandler<AppEnv> {
  const {
    windowMs,
    max,
    message = 'Terlalu banyak permintaan. Silakan coba lagi beberapa saat lagi.',
    keyGenerator = (c) => {
      const cfIp = c.req.header('cf-connecting-ip');
      const realIp = c.req.header('x-real-ip');
      const forwarded = c.req.header('x-forwarded-for')?.split(',')[0].trim();
      return cfIp || realIp || forwarded || 'global_client';
    },
  } = options;

  return async (c, next) => {
    cleanupExpired();

    const clientIp = keyGenerator(c);
    const key = `${c.req.path}:${clientIp}`;
    const now = Date.now();
    const record = rateLimitMap.get(key);

    if (!record || now > record.resetAt) {
      rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (record.count >= max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
      c.header('Retry-After', String(retryAfterSeconds));
      return c.json(
        {
          success: false,
          message,
          retryAfter: retryAfterSeconds,
        },
        429
      );
    }

    record.count += 1;
    return next();
  };
}
