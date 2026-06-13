import { NextRequest, NextResponse } from 'next/server';

export const middleware = (req: NextRequest) => {
  if (process.env.READ_ONLY !== 'true') return NextResponse.next();

  const { pathname } = req.nextUrl;

  // Allow public routes
  if (pathname.startsWith('/view/') || pathname.startsWith('/api/') || pathname === '/') {
    const response = NextResponse.next();

    if (pathname.startsWith('/view/')) {
      const shareId = pathname.split('/')[2];
      if (shareId) {
        response.cookies.set({
          name: 'budgy-share-id',
          value: shareId,
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          path: `/view/${shareId}`,
        });
      }
    }

    return response;
  }

  return NextResponse.redirect(new URL('/', req.url));
};

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
