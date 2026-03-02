'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUpFromLine, ArrowDownToLine } from 'lucide-react';
import CheckoutModal from '@/components/checkouts/CheckoutModal';
import CheckInModal from '@/components/checkouts/CheckInModal';
import type { Profile } from '@/types/supabase';

interface CheckoutSectionProps {
  item: any;
  profile: Profile;
  activeCheckout: any | null;
}

export default function CheckoutSection({ item, profile, activeCheckout }: CheckoutSectionProps) {
  const [showCheckout, setShowCheckout] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);

  return (
    <>
      <div className="flex gap-2">
        {!activeCheckout ? (
          <Button
            onClick={() => setShowCheckout(true)}
            disabled={item.quantity === 0}
            className="flex-1"
          >
            <ArrowUpFromLine className="h-4 w-4 mr-2" />
            Check Out
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={() => setShowCheckIn(true)}
            className="flex-1"
          >
            <ArrowDownToLine className="h-4 w-4 mr-2" />
            Check In
          </Button>
        )}
      </div>

      <CheckoutModal
        open={showCheckout}
        onClose={() => setShowCheckout(false)}
        item={item}
        profileId={profile.id}
      />

      <CheckInModal
        open={showCheckIn}
        onClose={() => setShowCheckIn(false)}
        checkout={activeCheckout}
        item={item}
        profileId={profile.id}
      />
    </>
  );
}
