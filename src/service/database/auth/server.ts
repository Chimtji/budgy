import { createNeonAuth } from '@neondatabase/auth/next/server';
import { neon } from '@neondatabase/serverless';

export const auth = createNeonAuth({
  baseUrl: 'https://ep-little-violet-aev918wb.neonauth.c-2.us-east-2.aws.neon.tech/neondb/auth',
  cookies: {
    secret: 'islVAvoCEMy/5ZV9KoZOs7+Bw6y/0DCmv5CZBhr7RAM=',
  },
});

export const sqlClient = neon(process.env.NEON_DATABASE_URL!);
