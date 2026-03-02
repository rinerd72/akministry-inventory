'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { UserPlus, Mail } from 'lucide-react';
import type { Profile } from '@/types/supabase';

export default function UsersClient({ users: initial }: { users: Profile[] }) {
  const supabase = createClient();
  const [users, setUsers] = useState(initial);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'user' | 'guest'>('user');
  const [loading, setLoading] = useState(false);

  async function handleInvite() {
    if (!inviteEmail.trim()) return;
    setLoading(true);
    try {
      const response = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, full_name: inviteName, role: inviteRole }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      toast({ title: 'Invite sent!', description: `Invitation sent to ${inviteEmail}` });
      setShowInvite(false);
      setInviteEmail('');
      setInviteName('');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  async function updateRole(userId: string, role: 'admin' | 'user' | 'guest') {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setUsers(u => u.map(user => user.id === userId ? { ...user, role } : user));
      toast({ title: 'Role updated' });
    }
  }

  async function toggleActive(userId: string, isActive: boolean) {
    const { error } = await supabase.from('profiles').update({ is_active: isActive }).eq('id', userId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setUsers(u => u.map(user => user.id === userId ? { ...user, is_active: isActive } : user));
      toast({ title: isActive ? 'User activated' : 'User deactivated' });
    }
  }

  const roleColor: Record<string, any> = {
    admin: 'default',
    user: 'secondary',
    guest: 'outline',
  };

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setShowInvite(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite User
        </Button>
      </div>

      <div className="space-y-2">
        {users.map((user) => {
          const initials = user.full_name
            ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
            : user.email.slice(0, 2).toUpperCase();

          return (
            <Card key={user.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-semibold">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{user.full_name || 'No name'}</p>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Select
                      value={user.role}
                      onValueChange={(v) => updateRole(user.id, v as any)}
                    >
                      <SelectTrigger className="w-24 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="guest">Guest</SelectItem>
                      </SelectContent>
                    </Select>
                    <Switch
                      checked={user.is_active}
                      onCheckedChange={(v) => toggleActive(user.id, v)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent>
          <DialogHeader><DialogTitle>Invite User</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Full Name</Label>
              <Input value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Jane Smith" />
            </div>
            <div className="space-y-1">
              <Label>Email *</Label>
              <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="jane@church.org" />
            </div>
            <div className="space-y-1">
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin — full access</SelectItem>
                  <SelectItem value="user">User — can check out items</SelectItem>
                  <SelectItem value="guest">Guest — view only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvite(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={loading || !inviteEmail.trim()}>
              <Mail className="h-4 w-4 mr-2" />
              {loading ? 'Sending...' : 'Send Invite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
