'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/supabase';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  QrCode,
  ArrowLeftRight,
  BarChart3,
  Users,
  Tag,
  MapPin,
  Box,
  LogOut,
  Menu,
  X,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface AppSidebarProps {
  profile: Profile;
}

export default function AppSidebar({ profile }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [lowStockCount, setLowStockCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    async function fetchLowStock() {
      const { data } = await supabase
        .from('items')
        .select('id, quantity, min_quantity')
        .is('deleted_at', null);
      if (data) {
        setLowStockCount(data.filter(i => i.quantity <= i.min_quantity).length);
      }
    }
    fetchLowStock();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const isAdmin = profile.role === 'admin';
  const isUser = profile.role === 'admin' || profile.role === 'user';

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/items', label: 'Inventory', icon: Package },
    ...(isUser ? [
      { href: '/scan', label: 'Scan QR', icon: QrCode },
      { href: '/checkouts', label: 'Checkouts', icon: ArrowLeftRight },
      { href: '/reports', label: 'Reports', icon: BarChart3 },
    ] : []),
  ];

  const adminItems = isAdmin ? [
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/categories', label: 'Categories', icon: Tag },
    { href: '/admin/locations', label: 'Locations', icon: MapPin },
    { href: '/admin/bins', label: 'Storage Bins', icon: Box },
  ] : [];

  const initials = profile.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : profile.email.slice(0, 2).toUpperCase();

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0">
            <Image src="/icons/icon-192x192.png" alt="Ark Kids" width={36} height={36} className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="font-semibold text-sm">Ark Kids Inventory</p>
            <p className="text-xs text-muted-foreground capitalize">{profile.role}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname.startsWith(href) && href !== '/dashboard'
                ? 'bg-blue-600 text-white'
                : pathname === href
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span>{label}</span>
            {href === '/dashboard' && lowStockCount > 0 && (
              <Badge variant="warning" className="ml-auto text-xs">{lowStockCount}</Badge>
            )}
          </Link>
        ))}

        {adminItems.length > 0 && (
          <>
            <div className="pt-4 pb-2 px-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Admin</p>
            </div>
            {adminItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  pathname.startsWith(href) ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{label}</span>
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* User */}
      <div className="p-3 border-t">
        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{profile.full_name || 'User'}</p>
            <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut} className="flex-shrink-0 h-8 w-8">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="icon" onClick={() => setOpen(!open)} className="bg-white shadow-md">
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setOpen(false)} />
      )}

      {/* Mobile drawer */}
      <div className={cn(
        'lg:hidden fixed inset-y-0 left-0 z-40 w-64 bg-white border-r shadow-xl transition-transform duration-300',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        <SidebarContent />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:bg-white lg:border-r lg:shrink-0">
        <SidebarContent />
      </div>
    </>
  );
}
