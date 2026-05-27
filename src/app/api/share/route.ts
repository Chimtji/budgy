import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getStore } from '@netlify/blobs';

export const POST = async (req: NextRequest) => {
  const secret = process.env.SHARE_API_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Ikke godkendt' }, { status: 401 });
    }
  }

  try {
    const snapshot = await req.json();
    const store = getStore('snapshots');
    const id = randomUUID();
    await store.setJSON(id, snapshot);
    return NextResponse.json({ id });
  } catch {
    return NextResponse.json({ error: 'Kunne ikke gemme snapshot' }, { status: 500 });
  }
};
