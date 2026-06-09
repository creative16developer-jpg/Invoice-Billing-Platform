import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models/user';
import { sendOtpEmail } from '@/lib/helpers/email';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
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

    if (user.isVerified) {
      return NextResponse.json(
        { error: 'This account is already verified. Please log in.' },
        { status: 400 }
      );
    }

    // Generate new 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send new OTP email
    const emailSent = await sendOtpEmail(user.email, otp);

    const responseData: Record<string, any> = {
      success: true,
      message: 'New verification code sent successfully.',
      email: user.email,
    };

    // Include OTP in response for development environment
    if (process.env.NODE_ENV === 'development') {
      responseData.devOtp = otp;
    }

    return NextResponse.json(responseData);
  } catch (err: any) {
    console.error('Resend OTP error:', err);
    return NextResponse.json(
      { error: 'Server error while resending verification code' },
      { status: 500 }
    );
  }
}
