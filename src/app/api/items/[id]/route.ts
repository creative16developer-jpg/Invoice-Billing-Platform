import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Item } from '@/lib/models/item';
import { verifyAuth } from '@/lib/helpers/auth';

export async function PUT(req: NextRequest, context: { params: any }) {
  try {
    await dbConnect();
    const userId = await verifyAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'No token provided or token invalid' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const { name, description, rate, unit } = body;

    const item = await Item.findOne({ _id: id, userId });
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (name) item.name = name;
    if (description !== undefined) item.description = description;
    if (rate !== undefined) {
      if (Number(rate) < 0) {
        return NextResponse.json({ error: 'Rate cannot be negative' }, { status: 400 });
      }
      item.rate = Number(rate);
    }
    if (unit) item.unit = unit;

    await item.save();
    return NextResponse.json(item);
  } catch (err: any) {
    console.error('UpdateItem error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: any }) {
  try {
    await dbConnect();
    const userId = await verifyAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'No token provided or token invalid' }, { status: 401 });
    }

    const { id } = await context.params;
    const item = await Item.findOneAndDelete({ _id: id, userId });
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Item deleted successfully' });
  } catch (err: any) {
    console.error('DeleteItem error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
