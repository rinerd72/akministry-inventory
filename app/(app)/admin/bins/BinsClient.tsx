'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Box } from 'lucide-react';

export default function BinsClient({ bins: initial, locations }: { bins: any[]; locations: any[] }) {
  const supabase = createClient();
  const [bins, setBins] = useState(initial);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', location_id: '', description: '' });
  const [loading, setLoading] = useState(false);

  function openNew() {
    setEditing(null);
    setForm({ name: '', location_id: '', description: '' });
    setShowDialog(true);
  }

  function openEdit(bin: any) {
    setEditing(bin);
    setForm({ name: bin.name, location_id: bin.location_id, description: bin.description || '' });
    setShowDialog(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.location_id) return;
    setLoading(true);
    try {
      const payload = { name: form.name, location_id: form.location_id, description: form.description || null };
      if (editing) {
        const { error } = await supabase.from('storage_bins').update(payload).eq('id', editing.id);
        if (error) throw error;
        const loc = locations.find(l => l.id === form.location_id);
        setBins(b => b.map(bin => bin.id === editing.id ? { ...bin, ...payload, locations: loc } : bin));
      } else {
        const { data, error } = await supabase.from('storage_bins').insert(payload).select('*, locations(name)').single();
        if (error) throw error;
        setBins(b => [...b, data]);
      }
      toast({ title: editing ? 'Bin updated' : 'Bin created' });
      setShowDialog(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this bin?')) return;
    const { error } = await supabase.from('storage_bins').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setBins(b => b.filter(bin => bin.id !== id));
      toast({ title: 'Bin deleted' });
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Add Bin</Button>
      </div>

      <div className="space-y-2">
        {bins.map((bin) => (
          <Card key={bin.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Box className="h-5 w-5 text-orange-500 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{bin.name}</p>
                    <p className="text-xs text-muted-foreground">{bin.locations?.name || 'No location'}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(bin)}>
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(bin.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {bins.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No bins yet.</div>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Bin' : 'New Storage Bin'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Bin A1" />
            </div>
            <div className="space-y-1">
              <Label>Location *</Label>
              <Select value={form.location_id} onValueChange={(v) => setForm(f => ({ ...f, location_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                <SelectContent>
                  {locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading || !form.name.trim() || !form.location_id}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
