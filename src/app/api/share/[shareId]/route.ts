import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { getShareMetadata } from '@/service/database/share/shareUtils';

export const POST = async (
  req: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) => {
  try {
    const { shareId } = await params;
    const { password } = await req.json();

    const metadata = await getShareMetadata(shareId);
    if (!metadata) {
      return NextResponse.json({ error: 'Del ikke fundet' }, { status: 404 });
    }

    if (metadata.passwordHash) {
      if (!password) {
        return NextResponse.json({ error: 'Adgangskode påkrævet' }, { status: 401 });
      }
      const isMatch = await compare(password, metadata.passwordHash);
      if (!isMatch) {
        return NextResponse.json({ error: 'Forkert adgangskode' }, { status: 401 });
      }
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: `budgy-share-auth-${shareId}`,
      value: '1',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30,
      path: `/view/${shareId}`,
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Kunne ikke verificere deling' }, { status: 500 });
  }
};
