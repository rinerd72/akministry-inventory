import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStockStatus(quantity: number, minQuantity: number) {
  if (quantity === 0) return 'out';
  if (quantity <= minQuantity) return 'low';
  return 'ok';
}

export function stockStatusColor(status: 'out' | 'low' | 'ok') {
  switch (status) {
    case 'out': return 'bg-red-100 text-red-800 border-red-200';
    case 'low': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'ok': return 'bg-green-100 text-green-800 border-green-200';
  }
}
