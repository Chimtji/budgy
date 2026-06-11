import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { put } from '@vercel/blob';

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
    const id = randomUUID();
    await put(`snapshot:${id}`, JSON.stringify(snapshot), { access: 'public' });
    return NextResponse.json({ id });
  } catch {
    return NextResponse.json({ error: 'Kunne ikke gemme snapshot' }, { status: 500 });
  }
};
