'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText } from 'lucide-react';

export default function ReportsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [checkouts, setCheckouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const [itemsRes, checkoutsRes] = await Promise.all([
        supabase.from('items').select('*, categories(name), locations(name), storage_bins(name)').is('deleted_at', null).order('name'),
        supabase.from('checkouts').select('*, items(name, unit), profiles!checkouts_checked_out_by_fkey(full_name, email)').order('created_at', { ascending: false }),
      ]);
      setItems(itemsRes.data || []);
      setCheckouts(checkoutsRes.data || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  async function exportItemsCSV() {
    const Papa = (await import('papaparse')).default;
    const rows = items.map(item => ({
      Name: item.name,
      Category: item.categories?.name || '',
      Location: item.locations?.name || '',
      'Storage Bin': item.storage_bins?.name || '',
      Quantity: item.quantity,
      'Min Quantity': item.min_quantity,
      Unit: item.unit,
      Description: item.description || '',
      Notes: item.notes || '',
      'Created At': new Date(item.created_at).toLocaleDateString(),
    }));
    const csv = Papa.unparse(rows);
    downloadCSV(csv, 'inventory-items.csv');
  }

  async function exportCheckoutsCSV() {
    const Papa = (await import('papaparse')).default;
    const rows = checkouts.map(c => ({
      Item: c.items?.name || '',
      'Checked Out By': c.profiles?.full_name || c.profiles?.email || '',
      Quantity: c.quantity,
      Unit: c.items?.unit || '',
      Purpose: c.purpose || '',
      'Checked Out': new Date(c.created_at).toLocaleDateString(),
      'Expected Return': c.expected_return ? new Date(c.expected_return).toLocaleDateString() : '',
      'Checked In': c.checked_in_at ? new Date(c.checked_in_at).toLocaleDateString() : 'Still out',
    }));
    const csv = Papa.unparse(rows);
    downloadCSV(csv, 'checkout-history.csv');
  }

  function downloadCSV(csv: string, filename: string) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }

  const lowStockItems = items.filter(i => i.quantity <= i.min_quantity);
  const activeCheckouts = checkouts.filter(c => !c.checked_in_at);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-muted-foreground">Export and analyze your inventory data</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Items', value: items.length },
          { label: 'Low Stock', value: lowStockItems.length },
          { label: 'Active Checkouts', value: activeCheckouts.length },
          { label: 'Total Checkouts', value: checkouts.length },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{loading ? '...' : value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Export Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Inventory Export
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Export all inventory items with categories, locations, quantities, and details.
            </p>
            <Button onClick={exportItemsCSV} disabled={loading} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download Items CSV
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Checkout History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Export complete checkout history including who checked out what and when.
            </p>
            <Button onClick={exportCheckoutsCSV} disabled={loading} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download Checkouts CSV
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Table */}
      {!loading && lowStockItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-red-700">Low Stock Items ({lowStockItems.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Item</th>
                    <th className="pb-2 font-medium">Current</th>
                    <th className="pb-2 font-medium">Minimum</th>
                    <th className="pb-2 font-medium">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-2 font-medium">{item.name}</td>
                      <td className="py-2 text-red-600 font-semibold">{item.quantity} {item.unit}</td>
                      <td className="py-2">{item.min_quantity} {item.unit}</td>
                      <td className="py-2 text-muted-foreground">{item.locations?.name || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
