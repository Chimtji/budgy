import { NextResponse } from 'next/server';

export async function GET() {
  const res = await fetch('https://bankaccountdata.gocardless.com/api/v2/token/new/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret_id: process.env.NEXT_APP_SECRET_ID,
      secret_key: process.env.NEXT_APP_SECRET_KEY,
    }),
  });

  const data = await res.json();
  return NextResponse.json(data);
}
