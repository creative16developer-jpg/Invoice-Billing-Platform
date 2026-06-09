import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return NextResponse.json({ error: 'Invitations are disabled' }, { status: 403 });
}

export async function POST(req: NextRequest) {
  return NextResponse.json({ error: 'Invitations are disabled' }, { status: 403 });
}
