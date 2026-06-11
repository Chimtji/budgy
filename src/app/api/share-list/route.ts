import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/service/database/auth/isAuthenticated';
import { getShareList } from '@/service/database/share/shareUtils';

export const GET = async () => {
  try {
    const auth = await isAuthenticated();
    if (!auth.success) {
      return NextResponse.json({ error: 'Ikke godkendt' }, { status: 401 });
    }

    const list = await getShareList();
    return NextResponse.json({ shares: list });
  } catch {
    return NextResponse.json({ error: 'Kunne ikke hente delinger' }, { status: 500 });
  }
};
