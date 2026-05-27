import { NextRequest, NextResponse } from 'next/server';

export const middleware = (req: NextRequest) => {
  if (process.env.READ_ONLY !== 'true') return NextResponse.next();

  const { pathname } = req.nextUrl;

  // Allow public routes
  if (pathname.startsWith('/view/') || pathname.startsWith('/api/') || pathname === '/') {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL('/', req.url));
};

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
