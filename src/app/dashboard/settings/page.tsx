'use client';

import React, { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { 
  Store, Shield, Settings, Pen, Folder, Image, Eye, CheckCircle2, X
} from 'lucide-react';

// Templates for live preview
import { ClassicTemplate } from '@/components/templates/ClassicTemplate';
import { ModernTemplate } from '@/components/templates/ModernTemplate';
import { ElegantTemplate } from '@/components/templates/ElegantTemplate';
import { ThermalTemplate } from '@/components/templates/ThermalTemplate';

// ─── Signature Widget ────────────────────────────────────────────────────────
interface SignatureWidgetProps {
  signatureUrl: string;
  signatureName: string;
  onSignatureChange: (url: string) => void;
  onNameChange: (name: string) => void;
}

function SignatureWidget({
  signatureUrl,
  signatureName,
  onSignatureChange,
  onNameChange,
}: SignatureWidgetProps) {
  const [mode, setMode] = useState<'draw' | 'upload'>('draw');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  useEffect(() => {
    if (mode === 'draw') initCanvas();
  }, [mode, initCanvas]);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: ((e as React.MouseEvent).clientX - rect.left) * scaleX,
      y: ((e as React.MouseEvent).clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    setIsDrawing(true);
    lastPos.current = getPos(e, canvas);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    const ctx = canvas.getContext('2d');
    if (!ctx || !lastPos.current) return;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
    setHasDrawn(true);
  };

  const stopDraw = () => {
    setIsDrawing(false);
    lastPos.current = null;
  };

  const clearCanvas = () => {
    initCanvas();
    setHasDrawn(false);
  };

  const saveDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    onSignatureChange(url);
    toast.success('Signature captured!');
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onSignatureChange(ev.target?.result as string);
      toast.success('Signature uploaded!');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3 border border-slate-200 rounded-xl p-4 bg-slate-50">
      <div className="flex gap-1 bg-slate-200 p-1 rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setMode('draw')}
          className={`text-xs font-semibold cursor-pointer flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors ${mode === 'draw' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Pen size={14} /> Draw
        </button>
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`text-xs font-semibold cursor-pointer flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors ${mode === 'upload' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Folder size={14} /> Upload
        </button>
      </div>

      {mode === 'draw' && (
        <div className="space-y-2">
          <p className="text-[11px] text-slate-400">Draw your signature in the box below</p>
          <div className="relative border-2 border-dashed border-slate-300 rounded-lg overflow-hidden bg-white" style={{ touchAction: 'none' }}>
            <canvas
              ref={canvasRef}
              width={600}
              height={160}
              className="w-full cursor-crosshair"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={stopDraw}
            />
            {!hasDrawn && (
              <p className="absolute inset-0 flex items-center justify-center text-slate-300 text-sm pointer-events-none select-none">
                Sign here…
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={clearCanvas}
              className="text-xs px-3 py-1.5 cursor-pointer border border-slate-200 rounded-lg text-slate-600 hover:bg-white transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={saveDrawing}
              disabled={!hasDrawn}
              className="text-xs px-3 py-1.5 cursor-pointer bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Use This Signature
            </button>
          </div>
        </div>
      )}

      {mode === 'upload' && (
        <div className="space-y-2">
          <p className="text-[11px] text-slate-400">Upload a PNG/JPG image of your signature (transparent background recommended)</p>
          <label
            htmlFor="sig-upload-settings"
            className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-lg p-6 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors"
          >
            <span className="text-2xl flex justify-center items-center"><Image size={24} /></span>
            <span className="text-xs text-slate-500 font-medium">Click to choose a file</span>
            <span className="text-[10px] text-slate-400">PNG, JPG, SVG — max 2 MB</span>
            <input
              id="sig-upload-settings"
              type="file"
              accept="image/png,image/jpeg,image/svg+xml"
              className="hidden"
              onChange={handleUpload}
            />
          </label>
        </div>
      )}

      {signatureUrl && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Current Signature Preview</p>
          <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between gap-3">
            <img src={signatureUrl} alt="Signature preview" className="h-12 object-contain max-w-[240px]" />
            <button
              type="button"
              onClick={() => onSignatureChange('')}
              className="text-[11px] text-rose-505 hover:text-rose-700 font-medium shrink-0"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      <div className="space-y-1.5 pt-1 border-t border-slate-200">
        <Label htmlFor="sigName" className="text-xs text-slate-650">Signature Display Name <span className="text-slate-400">(fallback text)</span></Label>
        <Input
          id="sigName"
          placeholder="e.g. John Doe"
          value={signatureName}
          onChange={(e) => onNameChange(e.target.value)}
          className="bg-white border-slate-200 text-slate-900 text-sm focus:border-indigo-550 focus:ring-1 focus:ring-indigo-500"
        />
      </div>
    </div>
  );
}

// ─── Main Settings Content ───────────────────────────────────────────────────
function SettingsPageContent() {
  const { user, updateProfile } = useAuth();

  const [profileForm, setProfileForm] = useState({
    businessName: '',
    ownerName: '',
    phone: '',
    address: '',
    licenseNumber: '',
    logoUrl: '',
    templateSettings: {
      primaryColor: '#b91c1c',
      secondaryColor: '#1f2937',
      fontFamily: 'Inter',
      headerLayout: 'classic',
      showLogo: true,
      showSignature: true,
      signatureName: '',
      signatureUrl: '',
      customTerms: ''
    }
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        businessName: user.businessName,
        ownerName: user.ownerName,
        phone: user.phone,
        address: user.address,
        licenseNumber: user.licenseNumber || '',
        logoUrl: user.logoUrl || '',
        templateSettings: {
          primaryColor: user.templateSettings?.primaryColor || '#b91c1c',
          secondaryColor: user.templateSettings?.secondaryColor || '#1f2937',
          fontFamily: user.templateSettings?.fontFamily || 'Inter',
          headerLayout: user.templateSettings?.headerLayout || 'classic',
          showLogo: user.templateSettings?.showLogo !== false,
          showSignature: user.templateSettings?.showSignature !== false,
          signatureName: user.templateSettings?.signatureName || user.ownerName,
          signatureUrl: user.templateSettings?.signatureUrl || '',
          customTerms: user.templateSettings?.customTerms || ''
        }
      });
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(profileForm);
      toast.success('Shop profile and template preferences updated successfully!');
    } catch (err) {
      toast.error('Failed to update profile. Please try again.');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }
    if (passwordForm.newPassword === passwordForm.currentPassword) {
      toast.error('New password must be different from your current password');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setPasswordLoading(true);
    try {
      await api.put('/auth/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      toast.success('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileForm({ ...profileForm, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  if (!user) return null;

  // Mock template preview data
  const settingsTemplateProps = {
    invoice: {
      invoiceNumber: 'INV-1024',
      customerName: 'Sample Corporation',
      customerPhone: '9876543210',
      date: '2026-06-09',
      dueDate: '2026-06-23',
      items: [
        { date: '2026-06-09', description: 'Standard Service Item', weightOrQty: '2', rate: 500, amount: 1000 },
        { date: '2026-06-09', description: 'Premium Consultant Hours', weightOrQty: '1', rate: 800, amount: 800 }
      ],
      subtotal: 1800,
      taxPercent: user.productCategory === 'Bakery' ? 0 : 18,
      taxAmount: user.productCategory === 'Bakery' ? 0 : 324,
      discountAmount: 150,
      totalAmount: user.productCategory === 'Bakery' ? 1650 : 1974,
      totalAmountInWords: user.productCategory === 'Bakery' ? 'One Thousand Six Hundred and Fifty Rupees Only' : 'One Thousand Nine Hundred and Seventy Four Rupees Only',
      terms: profileForm.templateSettings.customTerms || 'Thank you for choosing our business!'
    },
    business: {
      businessName: profileForm.businessName || 'Your Business Name',
      ownerName: profileForm.ownerName || 'Owner Name',
      phone: profileForm.phone || '9876543210',
      address: profileForm.address || '123 Sweet Street, Capital City',
      logoUrl: profileForm.logoUrl || '',
      licenseNumber: profileForm.licenseNumber || 'LIC-1234567890',
      productCategory: user.productCategory
    },
    customization: {
      primaryColor: profileForm.templateSettings.primaryColor,
      secondaryColor: '#1f2937',
      fontFamily: profileForm.templateSettings.fontFamily,
      showLogo: profileForm.templateSettings.showLogo,
      showSignature: profileForm.templateSettings.showSignature,
      signatureName: profileForm.templateSettings.signatureName || profileForm.ownerName,
      signatureUrl: profileForm.templateSettings.signatureUrl || ''
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Column: Form Cards */}
      <div className="space-y-6">
        <form onSubmit={handleProfileSubmit} className="space-y-6">
          {/* Shop Profile details */}
          <Card className="bg-white border-slate-200 text-slate-900 shadow-sm pt-0">
            <CardHeader className="py-5 border-b border-slate-100">
              <CardTitle className="text-lg text-slate-900 font-extrabold flex items-center gap-2">
                <Store className="h-5 w-5 text-indigo-650" /> Shop Profile Settings
              </CardTitle>
              <CardDescription className="text-slate-500">Update your primary business details shown on invoices.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bName" className="text-slate-700">Business Name</Label>
                  <Input 
                    id="bName" 
                    value={profileForm.businessName}
                    onChange={(e) => setProfileForm({ ...profileForm, businessName: e.target.value })}
                    className="bg-white border-slate-200 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="oName" className="text-slate-700">Owner Name</Label>
                  <Input 
                    id="oName" 
                    value={profileForm.ownerName}
                    onChange={(e) => setProfileForm({ ...profileForm, ownerName: e.target.value })}
                    className="bg-white border-slate-200 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700">Account Email <span className="text-slate-400 font-normal">(Read-only)</span></Label>
                  <Input 
                    id="email" 
                    value={user.email}
                    disabled
                    className="bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ph" className="text-slate-700">Phone Number</Label>
                  <Input 
                    id="ph" 
                    type="tel"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    maxLength={10}
                    value={profileForm.phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setProfileForm({ ...profileForm, phone: value });
                    }}
                    placeholder="9876543210"
                    className="bg-white border-slate-200 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lic" className="text-slate-700">GSTIN / Business License <span className="text-slate-400 font-normal">(Optional)</span></Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input 
                      id="lic" 
                      placeholder="e.g. 22AAAAA0000A1Z5"
                      maxLength={15}
                      value={profileForm.licenseNumber}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, '');
                        setProfileForm({ ...profileForm, licenseNumber: value });
                      }}
                      className={cn(
                        "h-11 bg-white border-slate-200 text-slate-900 pl-10 pr-10 font-mono tracking-wide uppercase focus-visible:border-indigo-500 focus-visible:ring-1 focus-visible:ring-indigo-500",
                        profileForm.licenseNumber && profileForm.licenseNumber.length === 15 && /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/.test(profileForm.licenseNumber) && "border-emerald-400"
                      )}
                    />
                    {profileForm.licenseNumber && profileForm.licenseNumber.length === 15 && /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/.test(profileForm.licenseNumber) && (
                      <CheckCircle2 className="absolute right-3 top-3 h-5 w-5 text-emerald-500" />
                    )}
                  </div>
                  {profileForm.licenseNumber && profileForm.licenseNumber.length > 0 && (
                    <p className="text-xs text-slate-500 mt-1.5">
                      {profileForm.licenseNumber.length}/15 characters
                      {profileForm.licenseNumber.length === 15 && (
                        /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/.test(profileForm.licenseNumber) 
                          ? <span className="text-emerald-600 ml-2">✓ Valid GSTIN format</span>
                          : <span className="text-rose-600 ml-2">✗ Invalid GSTIN format</span>
                      )}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-slate-700">Business Category <span className="text-slate-400 font-normal">(Read-only)</span></Label>
                  <Input 
                    id="category" 
                    value={user.productCategory}
                    disabled
                    className="bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="addr" className="text-slate-700">Shop Address</Label>
                <Input 
                  id="addr" 
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  className="bg-white border-slate-200 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" 
                />
              </div>
            </CardContent>
          </Card>

          {/* Layout & Invoice branding preferences */}
          <Card className="bg-white border-slate-200 text-slate-900 shadow-sm pt-0">
            <CardHeader className="py-5 border-b border-slate-100">
              <CardTitle className="text-lg text-slate-900 font-extrabold flex items-center gap-2">
                <Settings className="h-5 w-5 text-indigo-650" /> Template Styling & Defaults
              </CardTitle>
              <CardDescription className="text-slate-500">Configure default templates, color themes, custom fonts, logo uploads, and signatures.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              {/* Logo Uploader */}
              <div className="space-y-2">
                <Label className="text-slate-700">Brand / Business Logo</Label>
                <div className="flex items-center space-x-4 bg-slate-50 p-4 rounded-xl border border-slate-200 hover:bg-slate-100/50 transition-colors">
                  <div className="h-16 w-16 bg-white border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                    {profileForm.logoUrl ? (
                      <img src={profileForm.logoUrl} alt="Logo" className="h-full w-full object-contain" />
                    ) : (
                      <Store className="h-7 w-7 text-slate-350" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <input 
                      type="file" 
                      accept="image/*" 
                      id="logo-upload-settings-page"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => document.getElementById('logo-upload-settings-page')?.click()}
                      className="border-slate-200 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer"
                    >
                      Upload Shop Logo
                    </Button>
                    <p className="text-[10px] text-slate-455">PNG, JPG, or SVG. Square ratios recommended.</p>
                  </div>
                </div>
              </div>

              {/* Header Layout */}
              <div className="space-y-2">
                <Label className="text-slate-700">Preferred Template Layout</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'classic', label: 'Bakery Classic' },
                    { id: 'modern', label: 'Modern Clean' },
                    { id: 'elegant', label: 'Elegant Serif' },
                    { id: 'thermal', label: 'Thermal POS' }
                  ].map((tpl) => (
                    <Button
                      key={tpl.id}
                      type="button"
                      variant={profileForm.templateSettings.headerLayout === tpl.id ? 'default' : 'outline'}
                      onClick={() => setProfileForm({
                        ...profileForm,
                        templateSettings: {
                          ...profileForm.templateSettings,
                          headerLayout: tpl.id as any
                        }
                      })}
                      className={`text-[10px] py-2 h-auto font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                        profileForm.templateSettings.headerLayout === tpl.id
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-0 shadow-sm'
                          : 'border-slate-200 text-slate-650 bg-white hover:bg-slate-50'
                      }`}
                    >
                      {tpl.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Color preset selector */}
              <div className="space-y-2">
                <Label className="text-slate-700">Primary Color Theme</Label>
                <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {[
                    { name: 'Red', value: '#b91c1c' },
                    { name: 'Indigo', value: '#4f46e5' },
                    { name: 'Rose', value: '#e11d48' },
                    { name: 'Emerald', value: '#059669' },
                    { name: 'Amber', value: '#d97706' },
                    { name: 'Slate', value: '#334155' }
                  ].map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setProfileForm({
                        ...profileForm,
                        templateSettings: {
                          ...profileForm.templateSettings,
                          primaryColor: preset.value
                        }
                      })}
                      className={`h-7 w-7 rounded-full transition-transform duration-200 hover:scale-110 relative border-2 ${
                        profileForm.templateSettings.primaryColor === preset.value
                          ? 'border-slate-800 scale-105 shadow-sm'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: preset.value }}
                      title={preset.name}
                    />
                  ))}
                  
                  {/* Custom Color Input */}
                  <div className="flex items-center space-x-1.5 ml-2 pl-3 border-l border-slate-250">
                    <input 
                      type="color" 
                      value={profileForm.templateSettings.primaryColor}
                      onChange={(e) => setProfileForm({
                        ...profileForm,
                        templateSettings: {
                          ...profileForm.templateSettings,
                          primaryColor: e.target.value
                        }
                      })}
                      className="h-7 w-9 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-[10px] font-mono text-slate-450">{profileForm.templateSettings.primaryColor}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label className="text-slate-700">Font Family</Label>
                  <Select
                    value={profileForm.templateSettings.fontFamily}
                    onValueChange={(val) => setProfileForm({
                      ...profileForm,
                      templateSettings: {
                        ...profileForm.templateSettings,
                        fontFamily: val || 'Inter'
                      }
                    })}
                  >
                    <SelectTrigger className="bg-white border-slate-200 cursor-pointer text-slate-900 text-xs h-11 hover:border-slate-350 transition-colors">
                      <SelectValue placeholder="Select Font" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 text-slate-900">
                      <SelectItem value="Inter">Inter (Sans-Serif)</SelectItem>
                      <SelectItem value="Lora">Lora (Elegant Serif)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3 col-span-2">
                  <Label className="text-slate-705">Signature Settings</Label>
                  <SignatureWidget
                    signatureUrl={profileForm.templateSettings.signatureUrl}
                    signatureName={profileForm.templateSettings.signatureName}
                    onSignatureChange={(url) => setProfileForm(p => ({ ...p, templateSettings: { ...p.templateSettings, signatureUrl: url } }))}
                    onNameChange={(name) => setProfileForm(p => ({ ...p, templateSettings: { ...p.templateSettings, signatureName: name } }))}
                  />
                </div>
              </div>

              {/* Display toggles */}
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sLogo" className="text-xs text-slate-700 font-medium">Display Business Logo</Label>
                  <input 
                    type="checkbox"
                    id="sLogo"
                    checked={profileForm.templateSettings.showLogo}
                    onChange={(e) => setProfileForm({
                      ...profileForm,
                      templateSettings: {
                        ...profileForm.templateSettings,
                        showLogo: e.target.checked
                      }
                    })}
                    className="h-4 w-4 accent-indigo-650 rounded bg-white border-slate-200 cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sSig" className="text-xs text-slate-700 font-medium">Display Signature Block</Label>
                  <input 
                    type="checkbox"
                    id="sSig"
                    checked={profileForm.templateSettings.showSignature}
                    onChange={(e) => setProfileForm({
                      ...profileForm,
                      templateSettings: {
                        ...profileForm.templateSettings,
                        showSignature: e.target.checked
                      }
                    })}
                    className="h-4 w-4 accent-indigo-650 rounded bg-white border-slate-200 cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="terms" className="text-slate-700">Default Terms & Conditions</Label>
                <textarea
                  id="terms"
                  rows={3}
                  value={profileForm.templateSettings.customTerms}
                  onChange={(e) => setProfileForm({
                    ...profileForm,
                    templateSettings: {
                      ...profileForm.templateSettings,
                      customTerms: e.target.value
                    }
                  })}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-905 focus:outline-none focus:border-indigo-505 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end pt-4 border-t border-slate-100 pb-5">
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all px-6 cursor-pointer">
                Save Preferences
              </Button>
            </CardFooter>
          </Card>
        </form>

        {/* Change Password Card */}
        <Card className="bg-white border-slate-200 text-slate-900 shadow-sm pt-0">
          <CardHeader className="py-5 border-b border-slate-100">
            <CardTitle className="text-lg text-slate-900 font-extrabold flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-650" /> Change Account Password
            </CardTitle>
            <CardDescription className="text-slate-500">Ensure your account remains secure by updating your password regularly.</CardDescription>
          </CardHeader>
          <form onSubmit={handlePasswordSubmit}>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label htmlFor="currPass" className="text-slate-700">Current Password</Label>
                <Input
                  id="currPass"
                  type="password"
                  placeholder="••••••••"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="bg-white border-slate-200 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newPass" className="text-slate-700">New Password</Label>
                  <Input
                    id="newPass"
                    type="password"
                    placeholder="••••••••"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="bg-white border-slate-200 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confPass" className="text-slate-700">Confirm New Password</Label>
                  <Input
                    id="confPass"
                    type="password"
                    placeholder="••••••••"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="bg-white border-slate-200 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end pt-4 border-t border-slate-100 pb-5">
              <Button type="submit" disabled={passwordLoading} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all px-6 cursor-pointer">
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      {/* Right Column: Branding live preview */}
      <div className="hidden lg:block">
        <div className="sticky top-20 bg-slate-100 p-4 rounded-xl border border-slate-200 shadow-inner">
          <h4 className="text-xs font-bold text-slate-505 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Eye className="h-4 w-4 text-indigo-505" /> Branding Live Preview
          </h4>
          <p className="text-[10px] text-slate-450 mb-4">See your invoice structure update instantly as you change default styles.</p>
          
          <div className="w-full overflow-hidden rounded-lg border border-slate-200 bg-white scale-[0.82] origin-top shadow-md">
            {profileForm.templateSettings.headerLayout === 'classic' && (
              <ClassicTemplate {...settingsTemplateProps} />
            )}
            {profileForm.templateSettings.headerLayout === 'modern' && (
              <ModernTemplate {...settingsTemplateProps} />
            )}
            {profileForm.templateSettings.headerLayout === 'elegant' && (
              <ElegantTemplate {...settingsTemplateProps} />
            )}
            {profileForm.templateSettings.headerLayout === 'thermal' && (
              <ThermalTemplate {...settingsTemplateProps} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-12 bg-white rounded-xl border border-slate-200">
        <p className="animate-pulse font-medium text-slate-500">Loading settings...</p>
      </div>
    }>
      <SettingsPageContent />
    </Suspense>
  );
}
