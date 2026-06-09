import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models/user';
import { verifyAuth } from '@/lib/helpers/auth';

export async function PUT(req: NextRequest) {
  try {
    await dbConnect();
    const userId = await verifyAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'No token provided or token invalid' }, { status: 401 });
    }

    const body = await req.json();
    const {
      businessName,
      ownerName,
      phone,
      address,
      businessType,
      productCategory,
      licenseNumber,
      logoUrl,
      templateSettings
    } = body;

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (businessName) user.businessName = businessName;
    if (ownerName) user.ownerName = ownerName;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (businessType) user.businessType = businessType;
    if (productCategory) user.productCategory = productCategory;
    if (licenseNumber !== undefined) user.licenseNumber = licenseNumber;
    if (logoUrl !== undefined) user.logoUrl = logoUrl;
    if (templateSettings) {
      user.templateSettings = {
        ...user.templateSettings,
        ...templateSettings
      };
    }

    await user.save();
    return NextResponse.json(user);
  } catch (err: any) {
    console.error('UpdateProfile error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
