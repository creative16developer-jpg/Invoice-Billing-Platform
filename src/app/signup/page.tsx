'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Eye, EyeOff, AlertCircle, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

function SignupFormContent() {
  const { signup } = useAuth();

  // Multi-step phase: 'details' | 'business'
  const [step, setStep] = useState<'details' | 'business'>('details');

  // Input states
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  
  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');
  const [businessType, setBusinessType] = useState('Retailer');
  const [productCategory, setProductCategory] = useState('Bakery');
  const [licenseNumber, setLicenseNumber] = useState('');

  // UX States
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form errors
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateEmail = (val: string) => {
    if (!val) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const validatePassword = (val: string) => {
    if (!val) return 'Password is required';
    if (val.length < 8) return 'Password must be at least 8 characters';
    return '';
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);

    if (emailErr || passErr) {
      setEmailError(emailErr);
      setPasswordError(passErr);
      return;
    }

    if (!ownerName || !phone) {
      setError('Please fill in your name and phone number');
      return;
    }

    setStep('business');
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!businessName || !address) {
      setError('Business name and address are required.');
      return;
    }

    setLoading(true);

    try {
      await signup({
        ownerName,
        email,
        password,
        phone,
        businessName,
        address,
        businessType,
        productCategory,
        licenseNumber,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to complete registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-emerald-50/20 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center justify-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#4f39f6] shadow-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <span className="bg-[#4f39f6] bg-clip-text text-3xl font-extrabold text-transparent">
              SmartInvoice
            </span>
          </Link>
          <p className="mt-3 text-sm text-slate-600">
            Create a free merchant account to get started
          </p>
        </div>

        {/* Form Card */}
        <Card className="border-slate-200/60 shadow-xl px-2 relative overflow-hidden bg-white/80 backdrop-blur-md">
          {/* Progress bar at the top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300"
              style={{
                width: step === 'details' ? '50%' : '100%'
              }}
            />
          </div>

          <CardHeader className="space-y-1 pb-3 pt-6">
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 flex items-center justify-between">
              <span>
                {step === 'details' && 'Owner Details'}
                {step === 'business' && 'Business Details'}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
                {step === 'details' && 'Step 1 of 2'}
                {step === 'business' && 'Step 2 of 2'}
              </span>
            </CardTitle>
            <CardDescription className="text-sm text-slate-500">
              {step === 'details' && 'Set up your personal access credentials'}
              {step === 'business' && 'Provide company details for your invoices'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Messages */}
            {error && (
              <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-800 animate-in fade-in-50 duration-200">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Step 1: Owner Details */}
            {step === 'details' && (
              <form onSubmit={handleNextStep} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ownerName" className="text-sm font-medium text-slate-700">Full Name</Label>
                    <Input
                      id="ownerName"
                      type="text"
                      placeholder="John Doe"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="h-11 border-slate-200 bg-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-slate-700">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-11 border-slate-200 bg-white"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError('');
                    }}
                    className={cn("h-11 border-slate-200 bg-white", emailError && "border-rose-400")}
                    required
                  />
                  {emailError && <p className="text-xs font-semibold text-rose-600">{emailError}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimum 8 characters"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setPasswordError('');
                      }}
                      className={cn("h-11 border-slate-200 bg-white pr-10", passwordError && "border-rose-400")}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordError && <p className="text-xs font-semibold text-rose-600">{passwordError}</p>}
                </div>

                <Button 
                  type="submit" 
                  className="h-11 w-full bg-[#4f39f6] cursor-pointer hover:bg-[#4f39f6]/90 text-sm font-semibold text-white mt-6 flex items-center justify-center gap-2"
                >
                  Next: Business Info
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            )}

            {/* Step 2: Business Info */}
            {step === 'business' && (
              <form onSubmit={handleSignupSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName" className="text-sm font-medium text-slate-700">Business Name</Label>
                  <Input
                    id="businessName"
                    type="text"
                    placeholder="Your Shop Name"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="h-11 border-slate-200 bg-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium text-slate-700">Business Address</Label>
                  <Input
                    id="address"
                    type="text"
                    placeholder="123 Main St, New Delhi"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="h-11 border-slate-200 bg-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Business Type</Label>
                    <Select
                      value={businessType}
                      onValueChange={(val) => setBusinessType(val || 'Retailer')}
                    >
                      <SelectTrigger className="h-11 w-full border-slate-200 bg-white text-sm text-slate-800 cursor-pointer">
                        <SelectValue placeholder="Select Business Type" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 text-slate-900">
                        <SelectItem value="Retailer">Retailer</SelectItem>
                        <SelectItem value="Wholesaler">Wholesaler</SelectItem>
                        <SelectItem value="Manufacturer">Manufacturer</SelectItem>
                        <SelectItem value="Baker">Baker</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Product Category</Label>
                    <Select
                      value={productCategory}
                      onValueChange={(val) => setProductCategory(val || 'Bakery')}
                    >
                      <SelectTrigger className="h-11 w-full border-slate-200 bg-white text-sm text-slate-800 cursor-pointer">
                        <SelectValue placeholder="Select Product Category" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 text-slate-900">
                        <SelectItem value="Bakery">Bakery</SelectItem>
                        <SelectItem value="Electronics">Electronics</SelectItem>
                        <SelectItem value="Groceries">Groceries</SelectItem>
                        <SelectItem value="Apparel">Apparel</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="licenseNumber" className="text-sm font-medium text-slate-700">License Number <span className="text-slate-400 font-normal">(Optional)</span></Label>
                  <Input
                    id="licenseNumber"
                    type="text"
                    placeholder="GSTIN, FSSAI, etc."
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="h-11 border-slate-200 bg-white"
                  />
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={() => setStep('details')}
                    className="h-11 w-1/3 border border-slate-200 hover:bg-slate-50 bg-white text-slate-700 font-semibold flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-11 w-2/3 bg-[#4f39f6] cursor-pointer hover:bg-[#4f39f6]/90 text-sm font-semibold text-white flex items-center justify-center gap-1.5"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </span>
                    ) : (
                      <>
                        Create Account
                        <Check className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}

            {/* Back to Login Link */}
            <div className="text-center text-sm text-slate-500 mt-6 pt-4 border-t border-slate-100">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-[#4f39f6] hover:text-indigo-700 transition-colors">
                Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-sm font-semibold text-slate-500 animate-pulse font-sans">Loading registration...</div>
      </div>
    }>
      <SignupFormContent />
    </Suspense>
  );
}