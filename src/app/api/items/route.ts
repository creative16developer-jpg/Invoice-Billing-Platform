import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Item } from '@/lib/models/item';
import { verifyAuth } from '@/lib/helpers/auth';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const userId = await verifyAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'No token provided or token invalid' }, { status: 401 });
    }

    const items = await Item.find({ userId }).sort({ name: 1 });
    return NextResponse.json(items);
  } catch (err: any) {
    console.error('GetItems error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const userId = await verifyAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'No token provided or token invalid' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, rate, unit } = body;

    if (!name) {
      return NextResponse.json({ error: 'Item Name is required' }, { status: 400 });
    }

    if (rate === undefined || rate === null) {
      return NextResponse.json({ error: 'Item Rate is required' }, { status: 400 });
    }

    if (Number(rate) < 0) {
      return NextResponse.json({ error: 'Rate cannot be negative' }, { status: 400 });
    }

    const item = new Item({
      userId,
      name,
      description: description || '',
      rate: Number(rate),
      unit: unit || 'Pcs'
    });

    await item.save();
    return NextResponse.json(item, { status: 201 });
  } catch (err: any) {
    console.error('CreateItem error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
