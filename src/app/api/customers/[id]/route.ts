import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Customer } from '@/lib/models/customer';
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
    const { name, phone, address } = body;

    const customer = await Customer.findOne({ _id: id, userId });
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    if (name) customer.name = name;
    if (phone !== undefined) customer.phone = phone;
    if (address !== undefined) customer.address = address;

    await customer.save();
    return NextResponse.json(customer);
  } catch (err: any) {
    console.error('UpdateCustomer error:', err);
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
    const customer = await Customer.findOneAndDelete({ _id: id, userId });
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Customer deleted successfully' });
  } catch (err: any) {
    console.error('DeleteCustomer error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
