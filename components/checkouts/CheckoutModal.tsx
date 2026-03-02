'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Minus, Plus } from 'lucide-react';

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  item: any;
  profileId: string;
}

export default function CheckoutModal({ open, onClose, item, profileId }: CheckoutModalProps) {
  const router = useRouter();
  const supabase = createClient();
  const [quantity, setQuantity] = useState(1);
  const [purpose, setPurpose] = useState('');
  const [expectedReturn, setExpectedReturn] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    if (quantity < 1 || quantity > item.quantity) return;
    setLoading(true);
    try {
      const response = await fetch('/api/checkouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: item.id,
          checked_out_by: profileId,
          quantity,
          purpose: purpose || null,
          expected_return: expectedReturn || null,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      toast({ title: 'Checked out!', description: `${quantity} ${item.unit} of ${item.name} checked out.` });
      onClose();
      router.refresh();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Check Out: {item.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="text-sm text-muted-foreground">
            Available: <strong>{item.quantity} {item.unit}</strong>
          </div>

          <div className="space-y-2">
            <Label>Quantity</Label>
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                min={1}
                max={item.quantity}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-20 text-center"
              />
              <Button type="button" variant="outline" size="icon" onClick={() => setQuantity(Math.min(item.quantity, quantity + 1))}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose</Label>
            <Textarea
              id="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="What is this being used for?"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="return">Expected Return Date</Label>
            <Input
              id="return"
              type="date"
              value={expectedReturn}
              onChange={(e) => setExpectedReturn(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCheckout} disabled={loading || quantity < 1 || quantity > item.quantity}>
            {loading ? 'Checking out...' : 'Confirm Checkout'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
