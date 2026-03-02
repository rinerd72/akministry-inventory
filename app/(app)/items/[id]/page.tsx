import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Edit, Trash2, MapPin, Package, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn, formatDateTime, getStockStatus, stockStatusColor } from '@/lib/utils';
import QRCodeDisplay from '@/components/items/QRCodeDisplay';
import CheckoutSection from '@/components/items/CheckoutSection';
import { deleteItem } from '@/app/actions/items';

export default async function ItemDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile) redirect('/login');

  const { data: item } = await supabase
    .from('items')
    .select(`
      *,
      categories(id, name, color),
      locations(id, name, building, floor),
      storage_bins(id, name)
    `)
    .eq('id', params.id)
    .is('deleted_at', null)
    .single();

  if (!item) notFound();

  const { data: checkouts } = await supabase
    .from('checkouts')
    .select('*, profiles(full_name, email)')
    .eq('item_id', params.id)
    .order('created_at', { ascending: false })
    .limit(5);

  const activeCheckout = checkouts?.find(c => !c.checked_in_at);
  const stockStatus = getStockStatus(item.quantity, item.min_quantity);
  const isAdmin = profile.role === 'admin';
  const isUser = profile.role === 'admin' || profile.role === 'user';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/items" className="hover:text-foreground">Inventory</Link>
            <span>/</span>
            <span className="truncate">{item.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{item.name}</h1>
          {item.description && <p className="text-muted-foreground mt-1">{item.description}</p>}
        </div>
        {isUser && (
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/items/${item.id}/edit`}><Edit className="h-4 w-4 mr-1" />Edit</Link>
            </Button>
            {isAdmin && <DeleteItemButton itemId={item.id} itemName={item.name} />}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Image & QR */}
        <div className="space-y-4">
          {item.image_url ? (
            <div className="aspect-video relative rounded-xl overflow-hidden border bg-gray-100">
              <Image src={item.image_url} alt={item.name} fill className="object-cover" />
            </div>
          ) : (
            <div className="aspect-video rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <Package className="h-16 w-16 text-gray-400" />
            </div>
          )}

          {item.qr_code && (
            <QRCodeDisplay
              url={item.qr_code}
              itemName={item.name}
              location={item.locations?.name}
              bin={item.storage_bins?.name}
            />
          )}
        </div>

        {/* Details */}
        <div className="space-y-4">
          {/* Stock */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current Stock</p>
                  <p className="text-3xl font-bold">{item.quantity} <span className="text-lg font-normal text-muted-foreground">{item.unit}</span></p>
                  <p className="text-xs text-muted-foreground">Min: {item.min_quantity} {item.unit}</p>
                </div>
                <span className={cn('px-3 py-1 rounded-full border text-sm font-medium', stockStatusColor(stockStatus))}>
                  {stockStatus === 'ok' ? 'In Stock' : stockStatus === 'low' ? 'Low Stock' : 'Out of Stock'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardContent className="p-4 space-y-2">
              {item.categories && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.categories.color || '#6b7280' }} />
                  <span className="text-sm">{item.categories.name}</span>
                </div>
              )}
              {item.locations && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {item.locations.name}
                    {item.locations.building && ` · ${item.locations.building}`}
                    {item.locations.floor && `, Floor ${item.locations.floor}`}
                  </span>
                </div>
              )}
              {item.storage_bins && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Package className="h-4 w-4" />
                  <span>Bin: {item.storage_bins.name}</span>
                </div>
              )}
              {item.notes && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">{item.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Checkout Actions */}
          {isUser && (
            <CheckoutSection
              item={item}
              profile={profile}
              activeCheckout={activeCheckout || null}
            />
          )}
        </div>
      </div>

      {/* Checkout History */}
      {checkouts && checkouts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Checkout History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {checkouts.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{c.profiles?.full_name || c.profiles?.email || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(c.created_at)}
                      {c.purpose && ` · ${c.purpose}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={c.checked_in_at ? 'success' : 'warning'}>
                      {c.checked_in_at ? 'Returned' : 'Out'}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">{c.quantity} {item.unit}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DeleteItemButton({ itemId, itemName }: { itemId: string; itemName: string }) {
  return (
    <form action={deleteItem.bind(null, itemId)}>
      <Button variant="destructive" size="sm" type="submit">
        <Trash2 className="h-4 w-4" />
      </Button>
    </form>
  );
}
