'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Settings, LogOut } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleLogout = async () => {
    try {
      logout();
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  if (authLoading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-screen bg-slate-50 text-slate-800">
        <p className="animate-pulse font-medium">Loading Dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  let description = "Here is a summary of your billing operations and recent invoices.";
  if (pathname === '/dashboard/invoices') {
    description = "Manage all invoices issued by your business.";
  } else if (pathname === '/dashboard/customers') {
    description = "Manage saved client contacts for quick invoice creation.";
  } else if (pathname === '/dashboard/settings') {
    description = "Update your primary business details and invoice templates.";
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 text-slate-900 min-h-screen">
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            {user.logoUrl ? (
              <img src={user.logoUrl} alt="Logo" className="h-8 w-8 sm:h-9 sm:w-9 object-contain rounded border border-slate-200 bg-white p-0.5 shrink-0" />
            ) : (
              <div className="bg-[#4f39f6] p-2 rounded-lg text-white font-bold shrink-0">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <span className="font-bold text-sm sm:text-lg block leading-tight text-slate-900 truncate" title={user.businessName}>
                {user.businessName}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-550 font-medium block truncate">
                <span className="sm:hidden">Dashboard</span>
                <span className="hidden sm:inline">Merchant Dashboard ({user.productCategory})</span>
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link href="/invoices/new">
              <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-sm shadow-indigo-900/10 cursor-pointer text-xs sm:text-sm px-2.5 sm:px-4 h-9">
                <Plus className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline">Create Invoice</span>
                <span className="sm:hidden">Create</span>
              </Button>
            </Link>
            <Link href="/dashboard/settings">
              <Button 
                variant="outline" 
                className={`border-slate-200 text-slate-650 cursor-pointer hover:bg-slate-50 flex items-center shadow-sm text-xs sm:text-sm px-2.5 sm:px-3 h-9 ${pathname === '/dashboard/settings' ? 'bg-slate-100 text-indigo-750 border-indigo-200' : ''}`}
              >
                <Settings className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline cursor-pointer">Settings</span>
              </Button>
            </Link>
            <Button size="sm" variant="ghost" onClick={handleLogout} className="text-slate-500 hover:text-rose-600 hover:bg-slate-100 cursor-pointer px-2 sm:px-3">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Greetings */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Hello, {user.ownerName}!</h1>
            <p className="text-slate-500 text-sm">{description}</p>
          </div>
          <div className="flex bg-slate-100 border border-slate-200 p-1 rounded-lg gap-1 select-none">
            <Link href="/dashboard">
              <button className={`px-4 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-all cursor-pointer ${pathname === '/dashboard' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>
                Overview
              </button>
            </Link>
            <Link href="/dashboard/invoices">
              <button className={`px-4 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-all cursor-pointer ${pathname === '/dashboard/invoices' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>
                Invoices
              </button>
            </Link>
            <Link href="/dashboard/customers">
              <button className={`px-4 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-all cursor-pointer ${pathname === '/dashboard/customers' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>
                Customers
              </button>
            </Link>
          </div>
        </div>

        {/* Dynamic page content */}
        {children}
      </main>
    </div>
  );
}
