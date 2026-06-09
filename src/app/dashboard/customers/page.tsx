'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ConfirmDialog, useDialog } from '@/components/ui/ConfirmDialog';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { 
  Plus, Search, Users, Trash2, Edit, User, Phone, CheckCircle2, AlertCircle, Save, MapPin, X, Loader2,
  ChevronLeft, ChevronRight
} from 'lucide-react';

function CustomersPageContent() {
  const { user } = useAuth();
  const { confirm, dialogProps } = useDialog();

  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', address: '' });
  const [savingCustomer, setSavingCustomer] = useState(false);

  // Pagination states
  const [customerPage, setCustomerPage] = useState(1);
  const itemsPerPage = 10;

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await api.get('/customers');
      setCustomers(data);
    } catch (err) {
      console.error('Failed to fetch customers', err);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Reset page when search input changes
  useEffect(() => {
    setCustomerPage(1);
  }, [customerSearch]);

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.name.trim()) {
      toast.error('Customer name is required.');
      return;
    }
    // If phone number is input but not 10 digits
    if (customerForm.phone && customerForm.phone.length !== 10) {
      toast.error('Phone number must be exactly 10 digits.');
      return;
    }
    try {
      setSavingCustomer(true);
      if (editingCustomer) {
        const updated = await api.put(`/customers/${editingCustomer._id}`, customerForm);
        setCustomers(prev => prev.map(c => c._id === editingCustomer._id ? updated : c));
        toast.success('Customer updated successfully.');
      } else {
        const created = await api.post('/customers', customerForm);
        setCustomers(prev => [created, ...prev]);
        toast.success('Customer created successfully.');
      }
      setCustomerForm({ name: '', phone: '', address: '' });
      setEditingCustomer(null);
      setShowAddCustomerModal(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save customer.');
    } finally {
      setSavingCustomer(false);
    }
  };

  const startEditCustomer = (customer: any) => {
    setEditingCustomer(customer);
    setCustomerForm({
      name: customer.name,
      phone: customer.phone || '',
      address: customer.address || ''
    });
    setShowAddCustomerModal(true);
  };

  const deleteCustomer = async (id: string) => {
    const isConfirmed = await confirm(
      'Delete Customer',
      'Are you sure you want to delete this customer? This will not affect existing invoices.',
      'Delete'
    );
    if (!isConfirmed) return;
    try {
      await api.delete(`/customers/${id}`);
      setCustomers(prev => prev.filter(c => c._id !== id));
      toast.success('Customer deleted successfully.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete customer.');
    }
  };

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
    (c.phone && c.phone.includes(customerSearch))
  );

  const totalCustomerPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginatedCustomers = filtered.slice(
    (customerPage - 1) * itemsPerPage,
    customerPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <Card className="bg-white border-slate-200 text-slate-900 shadow-sm pt-0">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-5 border-b border-slate-100 gap-4">
          <div>
            <CardTitle className="text-lg text-slate-900 font-extrabold flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-650" /> Customer Contacts
            </CardTitle>
            <CardDescription className="text-slate-500">Manage saved client contacts for quick invoice creation.</CardDescription>
          </div>
          <Button 
            onClick={() => {
              setEditingCustomer(null);
              setCustomerForm({ name: '', phone: '', address: '' });
              setShowAddCustomerModal(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-sm cursor-pointer text-xs sm:text-sm px-4 h-9"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Add Customer
          </Button>
        </CardHeader>
        <CardContent>
          {/* Search input */}
          <div className="relative max-w-sm mb-6">
            <Search className="absolute left-3 top-2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search by name or phone..." 
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="pl-9 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-550 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Filtered list */}
          {loading ? (
            <p className="text-slate-400 text-sm animate-pulse">Loading customers...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <User className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">No Customers Found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto">
                {customerSearch ? 'Try refining your search keyword.' : 'Add your first customer to quickly auto-populate invoice billing details.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-sm">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow className="border-slate-100 hover:bg-transparent">
                      <TableHead className="font-bold text-slate-700 w-[25%] py-3.5">Customer Name</TableHead>
                      <TableHead className="font-bold text-slate-700 w-[20%] py-3.5">Phone Number</TableHead>
                      <TableHead className="font-bold text-slate-700 w-[40%] py-3.5">Billing Address</TableHead>
                      <TableHead className="font-bold text-slate-700 text-right w-[15%] py-3.5">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCustomers.map((c) => (
                      <TableRow key={c._id} className="border-slate-100 hover:bg-slate-50/40">
                        <TableCell className="font-bold text-slate-800 py-3">{c.name}</TableCell>
                        <TableCell className="text-slate-600 py-3">{c.phone || <span className="text-slate-300 text-xs italic">N/A</span>}</TableCell>
                        <TableCell className="text-slate-500 py-3 truncate max-w-[320px]" title={c.address}>
                          {c.address || <span className="text-slate-300 text-xs italic">No address saved</span>}
                        </TableCell>
                        <TableCell className="text-right py-3">
                          <div className="flex justify-end space-x-1">
                            <Button 
                              size="icon" variant="ghost" 
                              onClick={() => startEditCustomer(c)}
                              className="h-8 w-8 text-slate-555 hover:text-indigo-650 hover:bg-indigo-50 cursor-pointer"
                              title="Edit Details"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="icon" variant="ghost" 
                              onClick={() => deleteCustomer(c._id)}
                              className="h-8 w-8 text-slate-555 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                              title="Delete Contact"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination Controls */}
              {totalCustomerPages > 1 && (
                <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-4 select-none">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCustomerPage(prev => Math.max(prev - 1, 1))}
                    disabled={customerPage === 1}
                    className="text-xs h-8 cursor-pointer text-slate-700 border-slate-200 hover:bg-slate-50"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                  </Button>
                  <span className="text-xs font-semibold text-slate-550">
                    Page {customerPage} of {totalCustomerPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCustomerPage(prev => Math.min(prev + 1, totalCustomerPages))}
                    disabled={customerPage === totalCustomerPages}
                    className="text-xs h-8 cursor-pointer text-slate-700 border-slate-200 hover:bg-slate-50"
                  >
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Customer Modal */}
      {showAddCustomerModal && (
        <div 
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-8 px-4"
          onClick={() => setShowAddCustomerModal(false)}
        >
          <div 
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 my-8 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button - Top Right */}
            <button
              onClick={() => setShowAddCustomerModal(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors z-10"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="border-b border-slate-100 px-6 py-5">
              <h3 className="text-xl font-bold text-slate-900">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h3>
              <p className="text-sm text-slate-500 mt-1.5">
                {editingCustomer 
                  ? 'Update customer contact information' 
                  : 'Add a new customer to your contact list'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleCustomerSubmit} className="p-6">
              <div className="space-y-5">
                {/* Customer Name */}
                <div className="space-y-2">
                  <Label htmlFor="custName" className="text-sm font-medium text-slate-700">
                    Customer Name <span className="text-rose-600">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input 
                      id="custName"
                      placeholder="e.g. Acme Corporation"
                      value={customerForm.name}
                      onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                      className="h-11 bg-white border-slate-200 text-slate-900 pl-10 focus-visible:border-indigo-500 focus-visible:ring-indigo-500"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <Label htmlFor="custPhone" className="text-sm font-medium text-slate-700">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input 
                      id="custPhone"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="9876543210"
                      value={customerForm.phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        setCustomerForm({ ...customerForm, phone: value });
                      }}
                      onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      className={cn(
                        "h-11 bg-white border-slate-200 text-slate-900 pl-10 pr-10 focus-visible:border-indigo-500 focus-visible:ring-indigo-500",
                        customerForm.phone && customerForm.phone.length === 10 && "border-emerald-400"
                      )}
                    />
                    {customerForm.phone && customerForm.phone.length === 10 && (
                      <CheckCircle2 className="absolute right-3 top-3 h-5 w-5 text-emerald-500" />
                    )}
                  </div>
                  {customerForm.phone && customerForm.phone.length > 0 && customerForm.phone.length !== 10 && (
                    <p className="text-xs text-amber-600 flex items-center gap-1.5 font-medium">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Phone number must be exactly 10 digits
                    </p>
                  )}
                  {!customerForm.phone && (
                    <p className="text-xs text-slate-500">Optional - Enter 10-digit mobile number</p>
                  )}
                </div>

                {/* Billing Address */}
                <div className="space-y-2">
                  <Label htmlFor="custAddress" className="text-sm font-medium text-slate-700">
                    Billing Address
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                    <textarea 
                      id="custAddress"
                      rows={3}
                      placeholder="e.g. Suite 404, Building 3B, Mumbai, MH - 400001"
                      value={customerForm.address}
                      onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 py-2.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 resize-none"
                    />
                  </div>
                  <p className="text-xs text-slate-500">Optional - Full billing address with pincode</p>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddCustomerModal(false)}
                  className="h-10 border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer hover:text-slate-900"
                  disabled={savingCustomer}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={savingCustomer || !customerForm.name.trim()}
                  className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm hover:shadow-md cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingCustomer ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {editingCustomer ? 'Update Contact' : 'Save Contact'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}

export default function CustomersPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-12 bg-white rounded-xl border border-slate-200">
        <p className="animate-pulse font-medium text-slate-500">Loading Customers...</p>
      </div>
    }>
      <CustomersPageContent />
    </Suspense>
  );
}
