'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Upload, X } from 'lucide-react';
import Image from 'next/image';
import compressImage from 'browser-image-compression';

const itemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  category_id: z.string().optional(),
  location_id: z.string().optional(),
  storage_bin_id: z.string().optional(),
  quantity: z.number().int().min(0, 'Quantity must be 0 or more'),
  min_quantity: z.number().int().min(0, 'Min quantity must be 0 or more'),
  unit: z.string().min(1, 'Unit is required'),
  notes: z.string().optional(),
});

type ItemFormData = z.infer<typeof itemSchema>;

interface ItemFormProps {
  categories: any[];
  locations: any[];
  bins: any[];
  mode: 'new' | 'edit';
  item?: any;
}

export default function ItemForm({ categories, locations, bins, mode, item }: ItemFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(item?.image_url || null);
  const [uploading, setUploading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(item?.location_id || '');

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: item?.name || '',
      description: item?.description || '',
      category_id: item?.category_id || undefined,
      location_id: item?.location_id || undefined,
      storage_bin_id: item?.storage_bin_id || undefined,
      quantity: item?.quantity ?? 0,
      min_quantity: item?.min_quantity ?? 0,
      unit: item?.unit || 'each',
      notes: item?.notes || '',
    },
  });

  const filteredBins = bins.filter(b => b.location_id === selectedLocation);

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1200, useWebWorker: true });
    setImageFile(compressed);
    setImagePreview(URL.createObjectURL(compressed));
  }

  async function onSubmit(data: ItemFormData) {
    try {
      let image_url = item?.image_url || null;

      if (imageFile) {
        setUploading(true);
        const ext = imageFile.name.split('.').pop();
        const path = `items/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('item-images').upload(path, imageFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('item-images').getPublicUrl(path);
        image_url = publicUrl;
        setUploading(false);
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

      if (mode === 'new') {
        const itemId = crypto.randomUUID();
        const { error } = await supabase.from('items').insert({
          id: itemId,
          ...data,
          category_id: data.category_id || null,
          location_id: data.location_id || null,
          storage_bin_id: data.storage_bin_id || null,
          image_url,
          qr_code: `${appUrl}/items/${itemId}`,
        });
        if (error) throw error;
        toast({ title: 'Item added!', description: `${data.name} has been added to inventory.` });
        router.push(`/items/${itemId}`);
      } else {
        const { error } = await supabase.from('items').update({
          ...data,
          category_id: data.category_id || null,
          location_id: data.location_id || null,
          storage_bin_id: data.storage_bin_id || null,
          image_url,
        }).eq('id', item.id);
        if (error) throw error;
        toast({ title: 'Item updated!' });
        router.push(`/items/${item.id}`);
        router.refresh();
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Item Photo</Label>
            <div className="flex items-center gap-4">
              {imagePreview ? (
                <div className="relative h-24 w-24 rounded-xl overflow-hidden border">
                  <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                    className="absolute top-1 right-1 bg-white rounded-full p-0.5 shadow"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className="h-24 w-24 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-colors">
                  <Upload className="h-6 w-6 text-gray-400" />
                  <span className="text-xs text-gray-400 mt-1">Upload</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              )}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Item Name *</Label>
            <Input id="name" {...register('name')} placeholder="e.g. Bible Story Books" />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register('description')} placeholder="Brief description..." rows={2} />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={watch('category_id') || 'none'}
              onValueChange={(v) => setValue('category_id', v === 'none' ? undefined : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location & Bin */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Location</Label>
              <Select
                value={selectedLocation || 'none'}
                onValueChange={(v) => {
                  const val = v === 'none' ? '' : v;
                  setSelectedLocation(val);
                  setValue('location_id', val || undefined);
                  setValue('storage_bin_id', undefined);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {locations.map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Storage Bin</Label>
              <Select
                value={watch('storage_bin_id') || 'none'}
                onValueChange={(v) => setValue('storage_bin_id', v === 'none' ? undefined : v)}
                disabled={!selectedLocation}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedLocation ? 'Select bin' : 'Select location first'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {filteredBins.map((b: any) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quantity */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min={0}
                {...register('quantity', { valueAsNumber: true })}
              />
              {errors.quantity && <p className="text-xs text-red-500">{errors.quantity.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="min_quantity">Min Quantity</Label>
              <Input
                id="min_quantity"
                type="number"
                min={0}
                {...register('min_quantity', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select value={watch('unit')} onValueChange={(v) => setValue('unit', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="each">each</SelectItem>
                  <SelectItem value="pack">pack</SelectItem>
                  <SelectItem value="box">box</SelectItem>
                  <SelectItem value="set">set</SelectItem>
                  <SelectItem value="pair">pair</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register('notes')} placeholder="Any additional notes..." rows={2} />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting || uploading} className="flex-1">
          {isSubmitting || uploading ? 'Saving...' : mode === 'new' ? 'Add Item' : 'Save Changes'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
