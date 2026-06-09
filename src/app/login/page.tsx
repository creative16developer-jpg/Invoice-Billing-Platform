'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FileText, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [emailError, setEmailError] = useState('');
  const [touched, setTouched] = useState(false);

  const validateEmail = (val: string) => {
    if (!val) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    if (touched) {
      setEmailError(validateEmail(val));
    }
  };

  const handleEmailBlur = () => {
    setTouched(true);
    setEmailError(validateEmail(email));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const emailValidationErr = validateEmail(email);
    if (emailValidationErr) {
      setEmailError(emailValidationErr);
      setTouched(true);
      setError('Please fix the errors in the form');
      return;
    }

    if (!password) {
      setError('Password is required');
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-emerald-50/20 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Logo & Header */}
        <div className="text-center">
          <Link 
            href="/" 
            className="inline-flex items-center justify-center gap-2"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#4f39f6] shadow-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <span className="bg-[#4f39f6] bg-clip-text text-3xl font-extrabold text-transparent">
              SmartInvoice
            </span>
          </Link>
          <p className="mt-3 text-sm text-slate-600">
            Log in to manage your bills and invoice templates
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-slate-200/60 shadow-xl px-2">
          <CardHeader className="space-y-1 pb-3 pt-2">
            <CardTitle className="text-2xl  font-bold tracking-tight text-slate-900">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-sm text-slate-500">
              Sign in with your admin credentials
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-3">
              {/* Error Alert */}
              {error && (
                <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-800">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label 
                  htmlFor="email" 
                  className="text-sm font-medium text-slate-700"
                >
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@yourshop.com"
                  value={email}
                  onBlur={handleEmailBlur}
                  onChange={handleEmailChange}
                  className={cn(
                    "h-11 border-slate-200 bg-white text-sm placeholder:text-slate-400 focus-visible:border-indigo-500 focus-visible:ring-indigo-500",
                    touched && emailError && "border-rose-400 focus-visible:border-rose-500 focus-visible:ring-rose-500"
                  )}
                  required
                />
                {touched && emailError && (
                  <p className="flex items-center gap-1.5 text-xs font-medium text-rose-600">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {emailError}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label 
                  htmlFor="password" 
                  className="text-sm font-medium text-slate-700"
                >
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 border-slate-200 bg-white pr-10 mb-4 text-sm placeholder:text-slate-400 focus-visible:border-indigo-500 focus-visible:ring-indigo-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-slate-400 transition-colors hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <Button 
                type="submit" 
                disabled={loading}
                className="h-11 w-full bg-[#4f39f6] cursor-pointer hover:bg-[#4f39f6] text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg disabled:opacity-50 mb-4"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing In...
                  </span>
                ) : (
                  'Sign In'
                )}
              </Button>

              {/* Forgot Password Link (Optional) */}
              {/* <Link 
                href="/forgot-password" 
                className="flex justify-center mb-2 text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700"
              >
                Forgot your password?
              </Link> */}
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
}