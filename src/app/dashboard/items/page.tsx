'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ConfirmDialog, useDialog } from '@/components/ui/ConfirmDialog';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { 
  Plus, Search, Package, Trash2, Edit, CheckCircle2, AlertCircle, Save, X, Loader2,
  ChevronLeft, ChevronRight, FileText
} from 'lucide-react';

function ItemsPageContent() {
  const { user } = useAuth();
  const { confirm, dialogProps } = useDialog();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemSearch, setItemSearch] = useState('');
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [itemForm, setItemForm] = useState({ name: '', description: '', rate: '', unit: 'Pcs' });
  const [savingItem, setSavingItem] = useState(false);

  // Pagination states
  const [itemPage, setItemPage] = useState(1);
  const itemsPerPage = 10;

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await api.get('/items');
      setItems(data);
    } catch (err) {
      console.error('Failed to fetch items', err);
      toast.error('Failed to load items catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Reset page when search input changes
  useEffect(() => {
    setItemPage(1);
  }, [itemSearch]);

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.name.trim()) {
      toast.error('Item name is required.');
      return;
    }
    
    const rateNum = Number(itemForm.rate);
    if (isNaN(rateNum) || itemForm.rate === '' || rateNum < 0) {
      toast.error('Please enter a valid rate (greater than or equal to 0).');
      return;
    }

    try {
      setSavingItem(true);
      const payload = {
        ...itemForm,
        rate: rateNum
      };

      if (editingItem) {
        const updated = await api.put(`/items/${editingItem._id}`, payload);
        setItems(prev => prev.map(item => item._id === editingItem._id ? updated : item));
        toast.success('Item updated successfully.');
      } else {
        const created = await api.post('/items', payload);
        setItems(prev => [created, ...prev]);
        toast.success('Item created successfully.');
      }
      setItemForm({ name: '', description: '', rate: '', unit: 'Pcs' });
      setEditingItem(null);
      setShowAddItemModal(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save item.');
    } finally {
      setSavingItem(false);
    }
  };

  const startEditItem = (item: any) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      description: item.description || '',
      rate: String(item.rate),
      unit: item.unit || 'Pcs'
    });
    setShowAddItemModal(true);
  };

  const deleteItem = async (id: string) => {
    const isConfirmed = await confirm(
      'Delete Item',
      'Are you sure you want to delete this item? This will not affect existing invoices.',
      'Delete'
    );
    if (!isConfirmed) return;
    try {
      await api.delete(`/items/${id}`);
      setItems(prev => prev.filter(item => item._id !== id));
      toast.success('Item deleted successfully.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete item.');
    }
  };

  const filtered = items.filter(item => 
    item.name.toLowerCase().includes(itemSearch.toLowerCase()) || 
    (item.description && item.description.toLowerCase().includes(itemSearch.toLowerCase()))
  );

  const totalItemPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginatedItems = filtered.slice(
    (itemPage - 1) * itemsPerPage,
    itemPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <Card className="bg-white border-slate-200 text-slate-900 shadow-sm pt-0">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-5 border-b border-slate-100 gap-4">
          <div>
            <CardTitle className="text-lg text-slate-900 font-extrabold flex items-center gap-2">
              <Package className="h-5 w-5 text-indigo-650" /> Product/Service Catalog
            </CardTitle>
            <CardDescription className="text-slate-500 font-medium">Manage your items for quick invoice line item autocomplete.</CardDescription>
          </div>
          <Button 
            onClick={() => {
              setEditingItem(null);
              setItemForm({ name: '', description: '', rate: '', unit: user?.productCategory === 'Bakery' ? 'kg' : 'Pcs' });
              setShowAddItemModal(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-sm cursor-pointer text-xs sm:text-sm px-4 h-9"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Add Item
          </Button>
        </CardHeader>
        <CardContent>
          {/* Search input */}
          <div className="relative max-w-sm mb-6">
            <Search className="absolute left-3 top-2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search by name or description..." 
              value={itemSearch}
              onChange={(e) => setItemSearch(e.target.value)}
              className="pl-9 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-555 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Filtered list */}
          {loading ? (
            <p className="text-slate-400 text-sm animate-pulse">Loading items...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <Package className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">No Items Found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto">
                {itemSearch ? 'Try refining your search keyword.' : 'Add your first item to automatically populate line item descriptions, rates, and units during billing.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-sm">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow className="border-slate-100 hover:bg-transparent">
                      <TableHead className="font-bold text-slate-700 w-[30%] py-3.5">Item Name</TableHead>
                      <TableHead className="font-bold text-slate-700 w-[20%] py-3.5">Unit Price (₹)</TableHead>
                      <TableHead className="font-bold text-slate-700 w-[15%] py-3.5">Unit Type</TableHead>
                      <TableHead className="font-bold text-slate-700 w-[20%] py-3.5">Description</TableHead>
                      <TableHead className="font-bold text-slate-700 text-right w-[15%] py-3.5">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedItems.map((item) => (
                      <TableRow key={item._id} className="border-slate-100 hover:bg-slate-50/40">
                        <TableCell className="font-bold text-slate-800 py-3">{item.name}</TableCell>
                        <TableCell className="font-semibold text-slate-800 py-3">₹ {item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-slate-600 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                            {item.unit}
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-500 py-3 truncate max-w-[250px]" title={item.description}>
                          {item.description || <span className="text-slate-350 text-xs italic">N/A</span>}
                        </TableCell>
                        <TableCell className="text-right py-3">
                          <div className="flex justify-end space-x-1">
                            <Button 
                              size="icon" variant="ghost" 
                              onClick={() => startEditItem(item)}
                              className="h-8 w-8 text-slate-555 hover:text-indigo-650 hover:bg-indigo-50 cursor-pointer"
                              title="Edit Details"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="icon" variant="ghost" 
                              onClick={() => deleteItem(item._id)}
                              className="h-8 w-8 text-slate-555 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                              title="Delete Item"
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
              {totalItemPages > 1 && (
                <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-4 select-none">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setItemPage(prev => Math.max(prev - 1, 1))}
                    disabled={itemPage === 1}
                    className="text-xs h-8 cursor-pointer text-slate-700 border-slate-200 hover:bg-slate-50"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                  </Button>
                  <span className="text-xs font-semibold text-slate-550">
                    Page {itemPage} of {totalItemPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setItemPage(prev => Math.min(prev + 1, totalItemPages))}
                    disabled={itemPage === totalItemPages}
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

      {/* Add/Edit Item Modal */}
      {showAddItemModal && (
        <div 
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-8 px-4"
          onClick={() => setShowAddItemModal(false)}
        >
          <div 
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 my-8 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button - Top Right */}
            <button
              onClick={() => setShowAddItemModal(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors z-10"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="border-b border-slate-100 px-6 py-5">
              <h3 className="text-xl font-bold text-slate-900">
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </h3>
              <p className="text-sm text-slate-500 mt-1.5">
                {editingItem 
                  ? 'Update product or service catalog details' 
                  : 'Add a new product or service to your catalog'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleItemSubmit} className="p-6">
              <div className="space-y-5">
                {/* Item Name */}
                <div className="space-y-2">
                  <Label htmlFor="itemName" className="text-sm font-medium text-slate-700">
                    Item Name <span className="text-rose-600">*</span>
                  </Label>
                  <div className="relative">
                    <Package className="absolute left-3 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input 
                      id="itemName"
                      placeholder="e.g. Chocolate Truffle Cake 1kg"
                      value={itemForm.name}
                      onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                      className="h-11 bg-white border-slate-200 text-slate-900 pl-10 focus-visible:border-indigo-500 focus-visible:ring-indigo-500"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {/* Rate & Unit Row */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Rate */}
                  <div className="space-y-2">
                    <Label htmlFor="itemRate" className="text-sm font-medium text-slate-700">
                      Unit Rate (₹) <span className="text-rose-600">*</span>
                    </Label>
                    <Input 
                      id="itemRate"
                      type="number"
                      placeholder="e.g. 1500"
                      min={0}
                      step="any"
                      value={itemForm.rate}
                      onChange={(e) => setItemForm({ ...itemForm, rate: e.target.value })}
                      className="h-11 bg-white border-slate-200 text-slate-900 focus-visible:border-indigo-500 focus-visible:ring-indigo-500"
                      required
                    />
                  </div>

                  {/* Unit Selection */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      Unit Type <span className="text-rose-600">*</span>
                    </Label>
                    <Select
                      value={itemForm.unit}
                      onValueChange={(val) => setItemForm({ ...itemForm, unit: val || 'Pcs' })}
                    >
                      <SelectTrigger className="h-11 bg-white border-slate-200 text-slate-900 focus:border-indigo-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 text-slate-900">
                        <SelectItem value="Pcs">PCS (Pieces)</SelectItem>
                        <SelectItem value="kg">KG (Kilograms)</SelectItem>
                        <SelectItem value="gm">GM (Grams)</SelectItem>
                        <SelectItem value="liter">L (Liters)</SelectItem>
                        <SelectItem value="ml">ML (Milliliters)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="itemDescription" className="text-sm font-medium text-slate-700">
                    Description (Optional)
                  </Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                    <textarea 
                      id="itemDescription"
                      rows={3}
                      placeholder="e.g. Moist dark chocolate layers with fudge icing"
                      value={itemForm.description}
                      onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 py-2.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 resize-none"
                    />
                  </div>
                  <p className="text-xs text-slate-500">Optional description of the product or service.</p>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddItemModal(false)}
                  className="h-10 border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer hover:text-slate-900"
                  disabled={savingItem}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={savingItem || !itemForm.name.trim() || itemForm.rate === ''}
                  className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm hover:shadow-md cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingItem ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {editingItem ? 'Update Item' : 'Save Item'}
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

export default function ItemsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-12 bg-white rounded-xl border border-slate-200">
        <p className="animate-pulse font-medium text-slate-500">Loading Items...</p>
      </div>
    }>
      <ItemsPageContent />
    </Suspense>
  );
}
