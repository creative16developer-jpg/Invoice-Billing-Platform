import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models/user';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_123456';

const generateToken = (userId: string) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const {
      email,
      password,
      businessName,
      ownerName,
      phone,
      address,
      businessType,
      productCategory,
      licenseNumber
    } = body;

    // Validate required fields
    if (!email || !password || !businessName || !ownerName || !phone || !address) {
      return NextResponse.json(
        { error: 'Missing required registration fields' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Password length check
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'This email is already registered. Please log in.' },
        { status: 400 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create automatically verified user
    const newUser = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      businessName,
      ownerName,
      phone,
      address,
      businessType: businessType || 'Retailer',
      productCategory: productCategory || 'Bakery',
      licenseNumber: licenseNumber || '',
      isVerified: true,
      otp: null,
      otpExpires: null,
    });

    await newUser.save();

    // Generate session JWT token
    const token = generateToken(newUser._id.toString());

    return NextResponse.json({
      success: true,
      message: 'Registration successful!',
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role || 'Merchant',
        businessName: newUser.businessName,
        ownerName: newUser.ownerName,
        phone: newUser.phone,
        address: newUser.address,
        businessType: newUser.businessType,
        productCategory: newUser.productCategory,
        licenseNumber: newUser.licenseNumber,
        logoUrl: newUser.logoUrl,
        templateSettings: newUser.templateSettings
      }
    }, { status: 201 });
  } catch (err: any) {
    console.error('Signup error:', err);
    return NextResponse.json(
      { error: 'Server error during registration' },
      { status: 500 }
    );
  }
}
