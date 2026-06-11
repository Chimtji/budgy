import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { put } from '@vercel/blob';

export const POST = async (req: NextRequest) => {
  try {
    const snapshot = await req.json();
    const id = randomUUID();
    await put(`snapshot:${id}`, JSON.stringify(snapshot), { access: 'public' });
    return NextResponse.json({ id });
  } catch {
    return NextResponse.json({ error: 'Kunne ikke gemme snapshot' }, { status: 500 });
  }
};
