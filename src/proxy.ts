import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from './service/database/auth/server';

const authMiddleware = auth.middleware({
  loginUrl: '/auth/sign-in',
});

export default function middleware(req: NextRequest) {
  const isServerAction = req.method === 'POST' && req.headers.get('next-action') !== null;

  const headers = new Headers(req.headers);

  if (isServerAction) {
    return NextResponse.next({ request: { headers } });
  }

  return authMiddleware(req);
}

export const config = {
  matcher: [
    // Exclude Next.js internals and static files
    '/((?!_next/static|_next/image|_next/rsc|favicon.ico).*)',
  ],
};
