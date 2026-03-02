'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, MapPin } from 'lucide-react';

export default function LocationsClient({ locations: initial }: { locations: any[] }) {
  const supabase = createClient();
  const [locations, setLocations] = useState(initial);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', building: '', floor: '' });
  const [loading, setLoading] = useState(false);

  function openNew() {
    setEditing(null);
    setForm({ name: '', description: '', building: '', floor: '' });
    setShowDialog(true);
  }

  function openEdit(loc: any) {
    setEditing(loc);
    setForm({ name: loc.name, description: loc.description || '', building: loc.building || '', floor: loc.floor || '' });
    setShowDialog(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        building: form.building || null,
        floor: form.floor || null,
      };
      if (editing) {
        const { error } = await supabase.from('locations').update(payload).eq('id', editing.id);
        if (error) throw error;
        setLocations(locs => locs.map(l => l.id === editing.id ? { ...l, ...payload } : l));
      } else {
        const { data, error } = await supabase.from('locations').insert(payload).select().single();
        if (error) throw error;
        setLocations(locs => [...locs, data]);
      }
      toast({ title: editing ? 'Location updated' : 'Location created' });
      setShowDialog(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this location?')) return;
    const { error } = await supabase.from('locations').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setLocations(locs => locs.filter(l => l.id !== id));
      toast({ title: 'Location deleted' });
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Add Location</Button>
      </div>

      <div className="space-y-2">
        {locations.map((loc) => (
          <Card key={loc.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <MapPin className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{loc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[loc.building, loc.floor ? `Floor ${loc.floor}` : null, loc.description].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(loc)}>
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(loc.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {locations.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No locations yet.</div>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Location' : 'New Location'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Main Classroom" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Building</Label>
                <Input value={form.building} onChange={(e) => setForm(f => ({ ...f, building: e.target.value }))} placeholder="Building A" />
              </div>
              <div className="space-y-1">
                <Label>Floor</Label>
                <Input value={form.floor} onChange={(e) => setForm(f => ({ ...f, floor: e.target.value }))} placeholder="1" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Optional description" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading || !form.name.trim()}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
