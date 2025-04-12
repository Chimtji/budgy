import { NextRequest, NextResponse } from 'next/server';
import { GET as getToken } from '../token/route';

export async function GET(req: NextRequest) {
  const tokenRes = await getToken();
  const { access } = await tokenRes.json();

  const res = await fetch(
    `https://bankaccountdata.gocardless.com/api/v2/institutions/?country=dk`,
    {
      headers: { Authorization: `Bearer ${access}` },
    }
  );

  const data = await res.json();
  return NextResponse.json(data);
}
