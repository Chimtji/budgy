import { NextRequest, NextResponse } from 'next/server';
import { getShareMetadata, isShareValid } from '@/service/database/share/shareUtils';

export const GET = async (
  req: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) => {
  try {
    const { shareId } = await params;

    const isValid = await isShareValid(shareId);
    if (!isValid) {
      return NextResponse.json({ error: 'Del ikke tilgængelig' }, { status: 404 });
    }

    const metadata = await getShareMetadata(shareId);
    const passwordProtected = !!metadata?.passwordHash;

    return NextResponse.json({ passwordProtected });
  } catch {
    return NextResponse.json({ error: 'Kunne ikke hente metadata' }, { status: 500 });
  }
};
