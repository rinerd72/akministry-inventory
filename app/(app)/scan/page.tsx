'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, Keyboard } from 'lucide-react';

const QrScanner = dynamic(
  () => import('@yudiel/react-qr-scanner').then(mod => mod.QrScanner),
  { ssr: false, loading: () => <div className="aspect-square bg-gray-900 rounded-xl flex items-center justify-center"><p className="text-white">Loading camera...</p></div> }
);

export default function ScanPage() {
  const router = useRouter();
  const [manualUrl, setManualUrl] = useState('');
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(true);
  const [cameraError, setCameraError] = useState(false);

  function handleScan(result: string) {
    if (!result) return;
    // Extract item ID from URL like https://app.vercel.app/items/uuid
    try {
      const url = new URL(result);
      const match = url.pathname.match(/\/items\/([a-f0-9-]+)/i);
      if (match) {
        router.push(`/items/${match[1]}`);
      } else {
        setError('QR code does not link to a valid item. Try scanning again.');
      }
    } catch {
      // Not a URL, try as direct ID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(result)) {
        router.push(`/items/${result}`);
      } else {
        setError('Invalid QR code format. Try manual entry.');
      }
    }
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manualUrl.trim()) return;
    handleScan(manualUrl.trim());
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Scan QR Code</h1>
        <p className="text-muted-foreground">Point your camera at an item's QR code</p>
      </div>

      {/* Camera Scanner */}
      {scanning && !cameraError && (
        <Card>
          <CardContent className="p-4">
            <div className="rounded-xl overflow-hidden">
              <QrScanner
                onDecode={handleScan}
                onError={(err) => {
                  console.error(err);
                  setCameraError(true);
                }}
                containerStyle={{ borderRadius: '12px' }}
                videoStyle={{ borderRadius: '12px' }}
              />
            </div>
            {error && (
              <div className="mt-3 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {cameraError && (
        <Card>
          <CardContent className="p-6 text-center">
            <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-2">Camera not available or permission denied.</p>
            <p className="text-sm text-muted-foreground">Use manual entry below.</p>
          </CardContent>
        </Card>
      )}

      {/* Manual Entry */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Keyboard className="h-4 w-4" />
            Manual Entry
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="url">Item URL or ID</Label>
              <Input
                id="url"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                placeholder="https://app.vercel.app/items/... or item-uuid"
              />
            </div>
            <Button type="submit" className="w-full">Go to Item</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
