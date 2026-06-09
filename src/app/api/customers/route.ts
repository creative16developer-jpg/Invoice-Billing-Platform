import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Customer } from '@/lib/models/customer';
import { verifyAuth } from '@/lib/helpers/auth';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const userId = await verifyAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'No token provided or token invalid' }, { status: 401 });
    }

    const customers = await Customer.find({ userId }).sort({ name: 1 });
    return NextResponse.json(customers);
  } catch (err: any) {
    console.error('GetCustomers error:', err);
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
    const { name, phone, address } = body;

    if (!name) {
      return NextResponse.json({ error: 'Customer Name is required' }, { status: 400 });
    }

    const customer = new Customer({
      userId,
      name,
      phone: phone || '',
      address: address || ''
    });

    await customer.save();
    return NextResponse.json(customer, { status: 201 });
  } catch (err: any) {
    console.error('CreateCustomer error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
