import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { GET as getToken } from '../token/route';

export async function POST(req: NextRequest) {
  const { institution_id } = await req.json();
  const tokenRes = await getToken();
  const { access } = await tokenRes.json();

  const response = await fetch('https://bankaccountdata.gocardless.com/api/v2/requisitions/', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      redirect: process.env.NEXT_APP_REDIRECT_URL,
      institution_id,
      reference: `req-${Date.now()}`,
    }),
  });

  const requisition = await response.json();

  const filePath = path.join(process.cwd(), 'data', 'requisition.json');

  fs.writeFileSync(filePath, JSON.stringify(requisition, null, 2));

  return new Response(JSON.stringify(requisition), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
