'use client';

import { useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Search, Grid3X3, List, Package, MapPin, Tag, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn, getStockStatus, stockStatusColor } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import Image from 'next/image';

interface ItemsClientProps {
  items: any[];
  categories: any[];
  locations: any[];
  canEdit: boolean;
  initialSearch: string;
  initialCategory: string;
  initialLocation: string;
  initialStock: string;
  initialView: string;
}

function ItemCard({ item }: { item: any }) {
  const stockStatus = getStockStatus(item.quantity, item.min_quantity);
  return (
    <Link href={`/items/${item.id}`} className="block">
      <div className="bg-white border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
        {item.image_url ? (
          <div className="aspect-video relative bg-gray-100">
            <Image src={item.image_url} alt={item.name} fill className="object-cover" />
          </div>
        ) : (
          <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <Package className="h-10 w-10 text-gray-400" />
          </div>
        )}
        <div className="p-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-sm truncate">{item.name}</h3>
            <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0', stockStatusColor(stockStatus))}>
              {item.quantity} {item.unit}
            </span>
          </div>
          {item.categories && (
            <div className="flex items-center gap-1 mb-1">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.categories.color || '#6b7280' }} />
              <span className="text-xs text-muted-foreground truncate">{item.categories.name}</span>
            </div>
          )}
          {item.locations && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="text-xs text-muted-foreground truncate">
                {item.locations.name}{item.storage_bins ? ` › ${item.storage_bins.name}` : ''}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function ItemRow({ item }: { item: any }) {
  const stockStatus = getStockStatus(item.quantity, item.min_quantity);
  return (
    <Link href={`/items/${item.id}`} className="block">
      <div className="bg-white border rounded-xl p-3 hover:shadow-md transition-shadow flex items-center gap-4">
        <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {item.image_url ? (
            <Image src={item.image_url} alt={item.name} width={48} height={48} className="object-cover w-full h-full" />
          ) : (
            <Package className="h-6 w-6 text-gray-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{item.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {item.categories?.name && <span>{item.categories.name}</span>}
            {item.locations && <span> · {item.locations.name}</span>}
          </p>
        </div>
        <span className={cn('text-xs px-2.5 py-1 rounded-full border font-medium', stockStatusColor(stockStatus))}>
          {item.quantity} {item.unit}
        </span>
      </div>
    </Link>
  );
}

export default function ItemsClient({
  items,
  categories,
  locations,
  canEdit,
  initialSearch,
  initialCategory,
  initialLocation,
  initialStock,
  initialView,
}: ItemsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(initialSearch);
  const [view, setView] = useState<'grid' | 'list'>(initialView as any || 'grid');

  function updateFilters(params: Record<string, string>) {
    const url = new URL(window.location.href);
    Object.entries(params).forEach(([k, v]) => {
      if (v && v !== 'all' && v !== '') url.searchParams.set(k, v);
      else url.searchParams.delete(k);
    });
    router.push(url.pathname + '?' + url.searchParams.toString());
  }

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    const url = new URL(window.location.href);
    if (value) url.searchParams.set('search', value);
    else url.searchParams.delete('search');
    router.push(url.pathname + '?' + url.searchParams.toString());
  }, [router]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={initialCategory} onValueChange={(v) => updateFilters({ category: v })}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={initialLocation} onValueChange={(v) => updateFilters({ location: v })}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations.map((l) => (
              <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={initialStock} onValueChange={(v) => updateFilters({ stock: v })}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Stock" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stock</SelectItem>
            <SelectItem value="low">Low Stock</SelectItem>
            <SelectItem value="out">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          <Button
            variant={view === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setView('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setView('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-muted-foreground">No items found</p>
          {canEdit && (
            <Link href="/items/new" className="text-blue-600 hover:underline text-sm mt-1 block">Add your first item</Link>
          )}
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {items.map((item) => <ItemCard key={item.id} item={item} />)}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => <ItemRow key={item.id} item={item} />)}
        </div>
      )}
    </div>
  );
}
