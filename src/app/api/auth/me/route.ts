import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models/user';
import { verifyAuth } from '@/lib/helpers/auth';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const userId = await verifyAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'No token provided or token invalid' }, { status: 401 });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (err: any) {
    console.error('GetMe error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
