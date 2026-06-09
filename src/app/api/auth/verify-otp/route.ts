import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models/user';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_123456';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log(`[Verify OTP Debug] Email: ${email}`);
    console.log(`[Verify OTP Debug] DB OTP: "${user.otp}", DB Expiry: ${user.otpExpires}`);
    console.log(`[Verify OTP Debug] Client OTP: "${otp}"`);

    if (user.isVerified) {
      // Create token anyway as they are already verified
      const token = jwt.sign({ userId: user._id.toString() }, JWT_SECRET, { expiresIn: '7d' });
      return NextResponse.json({
        success: true,
        message: 'Account is already verified.',
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role || 'Merchant',
          businessName: user.businessName,
          ownerName: user.ownerName,
          phone: user.phone,
          address: user.address,
          businessType: user.businessType,
          productCategory: user.productCategory,
          licenseNumber: user.licenseNumber,
          logoUrl: user.logoUrl,
          templateSettings: user.templateSettings
        }
      });
    }

    // Check OTP match and expiration
    if (!user.otp || user.otp !== otp) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    if (new Date() > new Date(user.otpExpires)) {
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Mark user as verified, clear OTP details
    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    // Generate JWT token
    const token = jwt.sign({ userId: user._id.toString() }, JWT_SECRET, { expiresIn: '7d' });

    return NextResponse.json({
      success: true,
      message: 'Account verified successfully!',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role || 'Merchant',
        businessName: user.businessName,
        ownerName: user.ownerName,
        phone: user.phone,
        address: user.address,
        businessType: user.businessType,
        productCategory: user.productCategory,
        licenseNumber: user.licenseNumber,
        logoUrl: user.logoUrl,
        templateSettings: user.templateSettings
      }
    });
  } catch (err: any) {
    console.error('Verify OTP error:', err);
    return NextResponse.json(
      { error: 'Server error during OTP verification' },
      { status: 500 }
    );
  }
}
