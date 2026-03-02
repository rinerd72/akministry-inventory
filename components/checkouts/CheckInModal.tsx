'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { formatDateTime } from '@/lib/utils';

interface CheckInModalProps {
  open: boolean;
  onClose: () => void;
  checkout: any;
  item: any;
  profileId: string;
}

export default function CheckInModal({ open, onClose, checkout, item, profileId }: CheckInModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCheckIn() {
    if (!checkout) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/checkouts/${checkout.id}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checked_in_by: profileId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      toast({ title: 'Checked in!', description: `${checkout.quantity} ${item.unit} of ${item.name} returned.` });
      onClose();
      router.refresh();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  if (!checkout) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Check In: {item.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="bg-blue-50 rounded-lg p-3 space-y-1 text-sm">
            <p><strong>Quantity out:</strong> {checkout.quantity} {item.unit}</p>
            <p><strong>Checked out:</strong> {formatDateTime(checkout.created_at)}</p>
            {checkout.purpose && <p><strong>Purpose:</strong> {checkout.purpose}</p>}
            {checkout.expected_return && <p><strong>Expected return:</strong> {formatDateTime(checkout.expected_return)}</p>}
          </div>
          <p className="text-sm text-muted-foreground">Confirming will return all {checkout.quantity} {item.unit} to inventory.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCheckIn} disabled={loading}>
            {loading ? 'Checking in...' : 'Confirm Return'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
