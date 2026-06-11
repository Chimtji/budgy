import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/service/database/auth/isAuthenticated';
import { deleteShareData, updateShareInList } from '@/service/database/share/shareUtils';

export const POST = async (req: Request, { params }: { params: Promise<{ shareId: string }> }) => {
  try {
    const auth = await isAuthenticated();
    if (!auth.success) {
      return NextResponse.json({ error: 'Ikke godkendt' }, { status: 401 });
    }

    const { shareId } = await params;

    // Mark as revoked and optionally delete data
    await updateShareInList(shareId, { status: 'revoked' });
    await deleteShareData(shareId);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Kunne ikke tilbagekalde deling' }, { status: 500 });
  }
};
