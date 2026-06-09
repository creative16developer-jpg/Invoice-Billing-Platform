import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return NextResponse.json({ valid: false, error: 'Invitations are disabled' }, { status: 403 });
}
