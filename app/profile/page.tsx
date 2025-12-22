'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user?.id)
      .single();

    if (data) {
      setName(data.name || '');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('profiles')
        .update({ name })
        .eq('id', user?.id);

      if (error) throw error;
      setMessage('Profile updated successfully!');
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <div className="container mx-auto p-8">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardContent className="pt-6">
            <p>Please sign in to view your profile.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user.email || ''} disabled />
            </div>

            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            {message && (
              <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
                {message}
              </div>
            )}

            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
