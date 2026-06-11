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

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Kunne ikke verificere deling' }, { status: 500 });
  }
};
