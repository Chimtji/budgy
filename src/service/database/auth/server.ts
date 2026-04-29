import { createNeonAuth } from '@neondatabase/auth/next/server';
import { neon } from '@neondatabase/serverless';

// Load configuration from environment variables
const neonAuthBaseUrl = process.env.NEON_AUTH_BASE_URL;
const neonAuthSecret = process.env.NEON_AUTH_COOKIE_SECRET;
const neonDatabaseUrl = process.env.NEON_DATABASE_URL;

// Validate required environment variables
if (!neonAuthBaseUrl) {
  throw new Error('NEON_AUTH_BASE_URL environment variable is not set');
}
if (!neonAuthSecret) {
  throw new Error('NEON_AUTH_COOKIE_SECRET environment variable is not set');
}
if (!neonDatabaseUrl) {
  throw new Error('NEON_DATABASE_URL environment variable is not set');
}

export const auth = createNeonAuth({
  baseUrl: neonAuthBaseUrl,
  cookies: {
    secret: neonAuthSecret,
  },
});

export const sqlClient = neon(neonDatabaseUrl);
