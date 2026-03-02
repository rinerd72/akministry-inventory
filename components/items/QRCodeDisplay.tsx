'use client';

import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { QrCode, Printer } from 'lucide-react';

interface QRCodeDisplayProps {
  url: string;
  itemName: string;
  location?: string;
  bin?: string;
}

export default function QRCodeDisplay({ url, itemName, location, bin }: QRCodeDisplayProps) {
  const printRef = useRef<HTMLDivElement>(null);

  function handlePrint() {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const qrEl = document.getElementById('qr-svg-container');
    const svgContent = qrEl?.innerHTML || '';
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>QR Label - ${itemName}</title>
        <style>
          body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
          .label { text-align: center; padding: 20px; border: 2px solid #000; display: inline-block; border-radius: 8px; }
          .label svg { width: 180px; height: 180px; }
          h2 { margin: 10px 0 5px; font-size: 16px; }
          p { margin: 3px 0; font-size: 12px; color: #555; }
        </style>
      </head>
      <body>
        <div class="label">
          ${svgContent}
          <h2>${itemName}</h2>
          ${location ? `<p>${location}${bin ? ` › ${bin}` : ''}</p>` : ''}
        </div>
        <script>window.onload = () => { window.print(); window.close(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <QrCode className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">QR Code</span>
        </div>
        <div id="qr-svg-container" className="flex justify-center mb-3">
          <QRCodeSVG
            value={url}
            size={160}
            level="M"
            includeMargin
          />
        </div>
        <Button variant="outline" size="sm" className="w-full" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Print QR Label
        </Button>
      </CardContent>
    </Card>
  );
}
