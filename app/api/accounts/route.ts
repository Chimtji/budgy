import { NextRequest, NextResponse } from 'next/server';
import { GET as getToken } from '../token/route';

export async function GET(req: NextRequest) {
  const requisition_id = req.nextUrl.searchParams.get('requisition_id');

  const tokenRes = await getToken();
  const { access } = await tokenRes.json();

  const res = await fetch(
    `https://bankaccountdata.gocardless.com/api/v2/requisitions/${requisition_id}/`,
    {
      headers: { Authorization: `Bearer ${access}` },
    }
  );

  const data = await res.json();

  // Return account IDs for simplicity
  return NextResponse.json({ accounts: data.accounts });
}
