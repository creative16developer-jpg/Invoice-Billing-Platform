'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  FileText, Sparkles, Package, Users, Download, BarChart3, 
  ChevronRight, ChevronDown, Shield, ArrowRight, Check, Menu, X, Play, 
  Award, RefreshCw, Zap, Coffee, HelpCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTemplateTab, setActiveTemplateTab] = useState<'classic' | 'modern' | 'elegant' | 'thermal'>('modern');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Sample data for the interactive mockup
  const sampleInvoice = {
    invoiceNumber: 'INV-2026-008',
    date: 'June 09, 2026',
    dueDate: 'June 23, 2026',
    merchant: {
      name: 'Sugar & Spice Bakery',
      phone: '+91 98765 43210',
      address: 'Shop 12, Galleria Market, New Delhi',
      category: 'Bakery'
    },
    customer: {
      name: 'Rohan Sharma',
      phone: '+91 99999 88888',
      address: 'A-45, Vasant Kunj, New Delhi'
    },
    items: [
      { name: 'Chocolate Truffle Cake', rate: 1200, qty: '1.5 kg', amount: 1800 },
      { name: 'Butterscotch Pastry', rate: 80, qty: '6 Pcs', amount: 480 },
      { name: 'Red Velvet Cupcake', rate: 60, qty: '4 Pcs', amount: 240 }
    ],
    subtotal: 2520,
    gst: 126,
    total: 2646
  };

  const toggleFaq = (idx: number) => {
    setActiveFaq(activeFaq === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-rose-50/15 text-slate-800 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Sticky Header Nav */}
      <header className="sticky top-0 z-50 border-b border-slate-200/40 bg-white/70 backdrop-blur-md transition-all duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4f39f6] shadow-md group-hover:scale-105 transition-transform duration-200">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Smart<span className="text-[#4f39f6]">Invoice</span>
                </span>
              </Link>
            </div>

            {/* Desktop Navigation links */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-semibold text-slate-600 hover:text-indigo-650 transition-colors">Features</a>
              <a href="#templates" className="text-sm font-semibold text-slate-600 hover:text-indigo-650 transition-colors">Templates</a>
              <a href="#faq" className="text-sm font-semibold text-slate-600 hover:text-indigo-650 transition-colors">FAQs</a>
            </nav>

            {/* Header Right Actions */}
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <Link 
                  href="/dashboard" 
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#4f39f6] px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-indigo-650 hover:shadow-lg transition-all cursor-pointer"
                >
                  Go to Dashboard <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <>
                  <Link 
                    href="/login" 
                    className="text-sm font-bold text-slate-600 hover:text-[#4f39f6] transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link 
                    href="/signup" 
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-slate-800 hover:shadow-lg transition-all cursor-pointer"
                  >
                    Start Free
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu panel */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200/50 bg-white/95 backdrop-blur-lg px-4 py-6 space-y-4 shadow-xl">
            <a 
              href="#features" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-semibold text-slate-700 hover:text-indigo-650"
            >
              Features
            </a>
            <a 
              href="#templates" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-semibold text-slate-700 hover:text-indigo-650"
            >
              Templates
            </a>
            <a 
              href="#faq" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-semibold text-slate-700 hover:text-indigo-650"
            >
              FAQs
            </a>
            <hr className="border-slate-100" />
            <div className="flex flex-col gap-3 pt-2">
              {user ? (
                <Link 
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center rounded-xl bg-[#4f39f6] py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-650"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link 
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center border border-slate-200 rounded-xl py-3 text-sm font-bold text-slate-700 hover:bg-slate-55"
                  >
                    Sign In
                  </Link>
                  <Link 
                    href="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center rounded-xl bg-slate-900 py-3 text-sm font-bold text-white shadow-md hover:bg-slate-800"
                  >
                    Start Free
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-28">
        {/* Background glow filters */}
        <div className="absolute top-1/4 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-indigo-455/15 blur-3xl" />
        <div className="absolute top-1/3 left-10 -z-10 h-72 w-72 rounded-full bg-rose-455/10 blur-3xl" />
        <div className="absolute top-1/2 right-10 -z-10 h-80 w-80 rounded-full bg-emerald-455/10 blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Hero text content */}
            <div className="lg:col-span-6 space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-xs font-bold text-indigo-750">
                <Sparkles className="h-3.5 w-3.5" /> Introducing Smart Items Autocomplete
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Invoicing & Billing <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-[#4f39f6] to-indigo-500 bg-clip-text text-transparent">
                  Made Effortless
                </span>
              </h1>
              <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 font-medium">
                Create premium invoices, organize customer contacts, and manage a saved items library. Automatically populates descriptions and rates instantly.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link 
                  href={user ? "/dashboard" : "/signup"}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#4f39f6] hover:bg-indigo-650 px-7 py-4 text-base font-bold text-white shadow-xl hover:shadow-2xl transition-all cursor-pointer duration-200"
                >
                  {user ? 'Go to Dashboard' : 'Get Started for Free'} <ChevronRight className="h-5 w-5" />
                </Link>
                <a 
                  href="#templates"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 px-7 py-4 text-base font-bold text-slate-700 shadow-sm transition-colors cursor-pointer"
                >
                  <Play className="h-4 w-4 text-indigo-600 fill-indigo-600" /> Explore Templates
                </a>
              </div>

              {/* Badges/Social Proof */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-200/50 max-w-md mx-auto lg:mx-0">
                <div>
                  <h4 className="text-xl font-extrabold text-slate-900">0%</h4>
                  <p className="text-xs text-slate-500 font-semibold mt-1">Transaction Fees</p>
                </div>
                <div>
                  <h4 className="text-xl font-extrabold text-slate-900">1-Click</h4>
                  <p className="text-xs text-slate-500 font-semibold mt-1">PDF Downloads</p>
                </div>
                <div>
                  <h4 className="text-xl font-extrabold text-slate-900">100%</h4>
                  <p className="text-xs text-slate-500 font-semibold mt-1">Data Isolation</p>
                </div>
              </div>
            </div>

            {/* Interactive Invoice Mockup */}
            <div className="lg:col-span-6">
              <div className="relative mx-auto max-w-lg lg:max-w-none rounded-3xl border border-slate-200/50 bg-white/40 p-4 shadow-2xl backdrop-blur-md">
                
                {/* Active Template Controls */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-200/50 mb-4 overflow-x-auto gap-2">
                  <span className="text-xs font-bold text-slate-500 flex-shrink-0">Click to preview style:</span>
                  <div className="flex gap-1.5 select-none">
                    {(['classic', 'modern', 'elegant', 'thermal'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTemplateTab(tab)}
                        className={`text-xs px-2.5 py-1 rounded-md font-bold transition-all uppercase cursor-pointer ${
                          activeTemplateTab === tab 
                            ? 'bg-[#4f39f6] text-white shadow-sm' 
                            : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/60'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Template Mockup Body */}
                <div className={`rounded-xl shadow-lg border p-3.5 sm:p-6 bg-white overflow-hidden transition-all duration-300 h-[520px] sm:h-[580px] flex flex-col justify-between ${
                  activeTemplateTab === 'thermal' 
                    ? 'font-mono max-w-sm mx-auto border-dashed border-slate-350 text-xs py-4 text-slate-800 shadow-sm' 
                    : 'text-sm'
                }`}>
                  
                  {/* Top Block: Header & Client Info */}
                  <div>
                    {/* Template header */}
                    {activeTemplateTab === 'classic' && (
                      <div className="border-b-2 border-[#4f39f6] pb-3 sm:pb-4 flex justify-between items-start">
                        <div>
                          <h3 className="font-extrabold text-slate-900 text-xs sm:text-base leading-tight">{sampleInvoice.merchant.name}</h3>
                          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">{sampleInvoice.merchant.address}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[#4f39f6] font-extrabold text-sm sm:text-lg uppercase">Invoice</span>
                          <p className="text-[10px] sm:text-xs text-slate-500">{sampleInvoice.invoiceNumber}</p>
                        </div>
                      </div>
                    )}

                    {activeTemplateTab === 'modern' && (
                      <div className="flex justify-between items-start bg-slate-50 p-3 sm:p-4 rounded-xl mb-3 sm:mb-4 border border-slate-100">
                        <div>
                          <span className="inline-block px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[9px] sm:text-[10px] font-bold mb-1">BAKERY</span>
                          <h3 className="font-extrabold text-slate-900 text-xs sm:text-base leading-tight">{sampleInvoice.merchant.name}</h3>
                          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">{sampleInvoice.merchant.phone}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 text-[9px] sm:text-xs font-bold block uppercase tracking-wider">Balance Due</span>
                          <span className="text-slate-900 font-extrabold text-sm sm:text-lg">₹{sampleInvoice.total}</span>
                        </div>
                      </div>
                    )}

                    {activeTemplateTab === 'elegant' && (
                      <div className="flex flex-col items-center text-center pb-3 sm:pb-4 border-b border-indigo-100">
                        <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm mb-1.5">S</div>
                        <h3 className="font-serif font-extrabold text-slate-800 text-xs sm:text-base italic leading-tight">{sampleInvoice.merchant.name}</h3>
                        <p className="text-[9px] sm:text-[11px] text-slate-400 tracking-wider uppercase mt-0.5">{sampleInvoice.invoiceNumber} | {sampleInvoice.date}</p>
                      </div>
                    )}

                    {activeTemplateTab === 'thermal' && (
                      <div className="text-center pb-2 border-b border-dashed border-slate-350 mb-2.5">
                        <h3 className="font-bold text-slate-900 text-xs sm:text-sm">{sampleInvoice.merchant.name.toUpperCase()}</h3>
                        <p className="text-[9px] sm:text-[10px]">{sampleInvoice.merchant.address}</p>
                        <p className="text-[9px] sm:text-[10px]">TEL: {sampleInvoice.merchant.phone}</p>
                        <p className="text-[9px] sm:text-[10px] mt-1 border-t border-dashed pt-1 border-slate-350">INVOICE: {sampleInvoice.invoiceNumber}</p>
                      </div>
                    )}

                    {/* Bill To & Dates Grid */}
                    {activeTemplateTab !== 'thermal' && (
                      <div className="grid grid-cols-2 gap-2 sm:gap-4 my-2.5 sm:my-4">
                        <div>
                          <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Billed To</span>
                          <p className="font-bold text-slate-800 text-[11px] sm:text-sm leading-tight">{sampleInvoice.customer.name}</p>
                          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">{sampleInvoice.customer.address}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Date Issued</span>
                          <p className="font-semibold text-slate-700 text-[10px] sm:text-xs">{sampleInvoice.date}</p>
                          <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-1.5">Payment Due</span>
                          <p className="font-semibold text-indigo-650 text-[10px] sm:text-xs">{sampleInvoice.dueDate}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Middle Block: Table of items */}
                  <div className="flex-grow my-2">
                    {activeTemplateTab !== 'thermal' ? (
                      <table className="w-full text-left">
                        <thead>
                          <tr className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 ${
                            activeTemplateTab === 'modern' ? 'bg-slate-50' : ''
                          }`}>
                            <th className="py-1.5 px-1 sm:py-2 sm:px-2">Item</th>
                            <th className="py-1.5 px-1 text-right sm:py-2 sm:px-2">Qty</th>
                            <th className="py-1.5 px-1 text-right sm:py-2 sm:px-2">Rate</th>
                            <th className="py-1.5 px-1 text-right sm:py-2 sm:px-2">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sampleInvoice.items.map((it, idx) => (
                            <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50">
                              <td className="py-1.5 px-1 sm:py-2 sm:px-2 font-bold text-slate-800 text-[10px] sm:text-xs md:text-sm leading-tight">{it.name}</td>
                              <td className="py-1.5 px-1 text-right text-slate-650 font-medium text-[10px] sm:text-xs md:text-sm">{it.qty}</td>
                              <td className="py-1.5 px-1 text-right text-slate-650 font-medium text-[10px] sm:text-xs md:text-sm">₹{it.rate}</td>
                              <td className="py-1.5 px-1 text-right font-bold text-slate-900 text-[10px] sm:text-xs md:text-sm">₹{it.amount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex justify-between border-b border-dashed border-slate-350 pb-1 font-bold text-[9px] sm:text-[10px]">
                          <span>ITEM</span>
                          <span>QTY x RATE</span>
                          <span>AMT</span>
                        </div>
                        {sampleInvoice.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between text-[10px] sm:text-[11px] py-0.5">
                            <span className="truncate max-w-[110px] sm:max-w-[150px]">{it.name}</span>
                            <span>{it.qty.split(' ')[0]} x {it.rate}</span>
                            <span>{it.amount}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bottom Block: Calculations and Summary */}
                  <div>
                    <div className={`border-t border-slate-100 pt-2.5 sm:pt-3 flex flex-col items-end ${
                      activeTemplateTab === 'thermal' ? 'border-dashed border-slate-350 pt-2 text-[10px] sm:text-[11px]' : ''
                    }`}>
                      <div className="w-full max-w-[170px] sm:max-w-[200px] space-y-1 text-right">
                        <div className="flex justify-between text-[11px] sm:text-xs text-slate-500">
                          <span>Subtotal:</span>
                          <span className="font-semibold text-slate-700">₹{sampleInvoice.subtotal}</span>
                        </div>
                        <div className="flex justify-between text-[11px] sm:text-xs text-slate-500">
                          <span>GST (5%):</span>
                          <span className="font-semibold text-slate-700">₹{sampleInvoice.gst}</span>
                        </div>
                        <div className={`flex justify-between pt-1 border-t border-slate-100 ${
                          activeTemplateTab === 'thermal' ? 'border-dashed border-slate-350' : ''
                        }`}>
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">Grand Total:</span>
                          <span className={`font-extrabold text-slate-900 text-xs sm:text-sm ${
                            activeTemplateTab === 'classic' ? 'text-[#4f39f6]' : ''
                          }`}>₹{sampleInvoice.total}</span>
                        </div>
                      </div>
                    </div>

                    {/* Terms */}
                    {activeTemplateTab !== 'thermal' ? (
                      <div className="mt-3.5 sm:mt-4 pt-2.5 sm:pt-3 border-t border-slate-100 text-[9px] sm:text-[10px] text-slate-400 text-center leading-tight">
                        Thank you for your business! Terms: Subject to local jurisdiction only.
                      </div>
                    ) : (
                      <div className="mt-2.5 sm:mt-3 pt-2 border-t border-dashed border-slate-350 text-[9px] sm:text-[10px] text-center text-slate-700">
                        * THANK YOU *<br />
                        HAVE A NICE DAY
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Brand Features Section */}
      <section id="features" className="py-20 lg:py-28 bg-white border-y border-slate-200/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Equipped with Everything You Need
            </h2>
            <p className="text-slate-500 font-medium">
              We built SmartInvoice to help you save time billing client transactions and downloading PDF receipts instantly.
            </p>
          </div>

          {/* Grid of features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="group rounded-2xl border border-slate-200/50 bg-slate-50/50 p-6 hover:bg-white hover:shadow-xl hover:border-indigo-100 transition-all duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-[#4f39f6] mb-5 group-hover:scale-110 transition-transform">
                <Package className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Item Library Catalog</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Save recurring items (bakery goods, consulting hours, products) with custom rates and default units (Pcs, kg, gm, L, ml).
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group rounded-2xl border border-slate-200/50 bg-slate-50/50 p-6 hover:bg-white hover:shadow-xl hover:border-indigo-100 transition-all duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-[#4f39f6] mb-5 group-hover:scale-110 transition-transform">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Smart Autocomplete</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Type in the description field while generating an invoice, and instantly search your saved items to auto-fill rates and amounts.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group rounded-2xl border border-slate-200/50 bg-slate-50/50 p-6 hover:bg-white hover:shadow-xl hover:border-indigo-100 transition-all duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-[#4f39f6] mb-5 group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Customer Directories</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Maintain contact sheets with details (phone, addresses). Retrieve client profiles with one click in the invoice builder.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group rounded-2xl border border-slate-200/50 bg-slate-50/50 p-6 hover:bg-white hover:shadow-xl hover:border-indigo-100 transition-all duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-[#4f39f6] mb-5 group-hover:scale-110 transition-transform">
                <Download className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">1-Click PDF Export</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Export and print invoices using jsPDF. Features high-resolution vector rendering with light compressed image footprints.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group rounded-2xl border border-slate-200/50 bg-slate-50/50 p-6 hover:bg-white hover:shadow-xl hover:border-indigo-100 transition-all duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-[#4f39f6] mb-5 group-hover:scale-110 transition-transform">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Analytics & Summary</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Track revenue, payment statistics, total items sold, and top customers directly inside your merchant dashboard.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group rounded-2xl border border-slate-200/50 bg-slate-50/50 p-6 hover:bg-white hover:shadow-xl hover:border-indigo-100 transition-all duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-[#4f39f6] mb-5 group-hover:scale-110 transition-transform">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Secure Multi-Tenancy</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Secure JWT authentication with email validation keeps your customer logs, inventory catalog, and invoice history isolated.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Templates Showcase Section */}
      <section id="templates" className="py-20 lg:py-28 bg-slate-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Professional A4 Layout Templates
            </h2>
            <p className="text-slate-500 font-medium">
              Instantly toggle styles depending on your business type. From retail stores to local bakeries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Template Card 1 */}
            <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-44 bg-[#4f39f6]/5 border-b border-slate-100 flex items-center justify-center p-4">
                <div className="h-28 w-20 border border-slate-200 bg-white rounded shadow-sm p-2 flex flex-col justify-between">
                  <div className="h-1 bg-indigo-650 w-8" />
                  <div className="space-y-1">
                    <div className="h-0.5 bg-slate-200 w-12" />
                    <div className="h-0.5 bg-slate-200 w-8" />
                  </div>
                  <div className="h-1 bg-[#4f39f6]/30 w-full" />
                </div>
              </div>
              <div className="p-5">
                <span className="text-[10px] font-bold text-[#4f39f6] uppercase tracking-wider block mb-1">Formal Layout</span>
                <h4 className="font-bold text-slate-950">Classic Template</h4>
                <p className="text-xs text-slate-500 mt-1">Symmetrical border-based lines, ideal for official corporate consulting and invoicing.</p>
              </div>
            </div>

            {/* Template Card 2 */}
            <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-44 bg-indigo-50/20 border-b border-slate-100 flex items-center justify-center p-4">
                <div className="h-28 w-20 border border-slate-200 bg-white rounded shadow-sm p-2 flex flex-col justify-between">
                  <div className="bg-slate-50 p-1 flex justify-between items-center rounded-sm">
                    <div className="h-1 bg-slate-400 w-4" />
                    <div className="h-1 bg-slate-600 w-4" />
                  </div>
                  <div className="space-y-1">
                    <div className="h-0.5 bg-slate-200 w-12" />
                    <div className="h-0.5 bg-slate-200 w-8" />
                  </div>
                  <div className="h-1 bg-slate-300 w-6 self-end" />
                </div>
              </div>
              <div className="p-5">
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block mb-1">Corporate Layout</span>
                <h4 className="font-bold text-slate-950">Modern Template</h4>
                <p className="text-xs text-slate-500 mt-1">Highlighted header block with balance details, perfect for retail stores and general agencies.</p>
              </div>
            </div>

            {/* Template Card 3 */}
            <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-44 bg-emerald-50/20 border-b border-slate-100 flex items-center justify-center p-4">
                <div className="h-28 w-20 border border-slate-200 bg-white rounded shadow-sm p-2 flex flex-col justify-between items-center">
                  <div className="h-2 w-2 rounded-full bg-emerald-600" />
                  <div className="space-y-1 w-full">
                    <div className="h-0.5 bg-slate-200 w-10 mx-auto" />
                    <div className="h-0.5 bg-slate-200 w-12 mx-auto" />
                  </div>
                  <div className="h-1 bg-slate-300 w-6" />
                </div>
              </div>
              <div className="p-5">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">Visual Layout</span>
                <h4 className="font-bold text-slate-950">Elegant Template</h4>
                <p className="text-xs text-slate-500 mt-1">Centred serif font headings with rounded table styles. Ideal for boutique stores and bakers.</p>
              </div>
            </div>

            {/* Template Card 4 */}
            <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-44 bg-amber-50/20 border-b border-slate-100 flex items-center justify-center p-4">
                <div className="h-28 w-14 border border-dashed border-slate-300 bg-white rounded shadow-sm p-1.5 flex flex-col justify-between">
                  <div className="h-1.5 bg-slate-400 w-8 mx-auto" />
                  <div className="space-y-1">
                    <div className="h-0.5 bg-slate-200 w-full" />
                    <div className="h-0.5 bg-slate-200 w-full" />
                  </div>
                  <div className="h-1 bg-slate-400 w-4 mx-auto" />
                </div>
              </div>
              <div className="p-5">
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block mb-1">Receipt Printout</span>
                <h4 className="font-bold text-slate-950">Thermal Template</h4>
                <p className="text-xs text-slate-500 mt-1">Mono-spaced 80mm roll dimensions, designed for POS receipt printers and instant slips.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section id="faq" className="py-20 lg:py-28 bg-white border-t border-slate-200/30">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-4 mb-16">
            <HelpCircle className="h-10 w-10 text-indigo-650 mx-auto" />
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-500 font-medium">
              Everything you need to know about the SmartInvoice catalog and invoice billing.
            </p>
          </div>

          <div className="space-y-4">
            {(() => {
              const faqs = [
                {
                  question: 'What is the "Items Library" catalog?',
                  answer: 'The Items Library is your saved inventory of products or services. Instead of retyping name descriptions, units, and rates every time you bill a transaction, you can save them once and autocomplete them in the invoice builder.'
                },
                {
                  question: 'Does it support GST / VAT tax calculation?',
                  answer: 'Yes! When generating an invoice, you can toggle or set the custom tax rate (e.g., GST or SGST). The invoice builder automatically computes taxes based on your line item subtotal.'
                },
                {
                  question: 'Can I print directly to a thermal printer?',
                  answer: 'Absolutely. Select the Thermal Template style inside the invoice viewer. It reformats the document layout structure to fit 80mm print receipts perfectly.'
                },
                {
                  question: 'Is my transaction data secure?',
                  answer: 'Yes. SmartInvoice uses a secured Mongoose database structure with dedicated tenant-level references (userId). Your contacts, items catalog, and invoices cannot be read or modified by other accounts.'
                }
              ];

              return faqs.map((faq, idx) => {
                const isOpen = activeFaq === idx;
                return (
                  <div 
                    key={idx} 
                    className={`rounded-xl border bg-white overflow-hidden transition-all duration-300 ${
                      isOpen ? 'border-indigo-200 shadow-md' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <button
                      onClick={() => toggleFaq(idx)}
                      type="button"
                      className="w-full flex items-center justify-between p-5 text-left font-bold text-slate-800 hover:bg-slate-50/50 cursor-pointer select-none transition-colors"
                    >
                      <span>{faq.question}</span>
                      <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${
                        isOpen ? 'rotate-180 text-indigo-650' : ''
                      }`} />
                    </button>
                    <div 
                      className={`grid transition-all duration-300 ease-in-out ${
                        isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="px-5 pb-5 text-sm text-slate-500 font-medium border-t border-slate-100 pt-3 leading-relaxed">
                          {faq.answer}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="relative overflow-hidden py-16 lg:py-24 bg-slate-900 text-white">
        <div className="absolute top-1/2 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl" />
        
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-3xl font-extrabold sm:text-4xl tracking-tight leading-tight">
            Ready to Streamline Your <br />
            Business Billing Experience?
          </h2>
          <p className="text-slate-350 text-base max-w-xl mx-auto font-medium">
            Join other merchants today. Add your items catalog, list customer directories, and download professional invoices in seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link 
              href={user ? "/dashboard" : "/signup"}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-white hover:bg-slate-100 px-8 py-3.5 text-base font-bold text-slate-950 shadow-md cursor-pointer duration-200"
            >
              Get Started Now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="bg-slate-950 py-12 border-t border-slate-900 text-slate-400 text-xs font-semibold">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-500" />
            <span className="text-white font-extrabold text-sm tracking-wide">SmartInvoice</span>
          </div>
          <div>
            &copy; 2026 SmartInvoice Platform. All rights reserved.
          </div>
          <div className="flex gap-4">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#templates" className="hover:text-white transition-colors">Templates</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQs</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
