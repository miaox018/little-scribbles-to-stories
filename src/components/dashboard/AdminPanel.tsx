
import { useState } from 'react';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, UserPlus } from 'lucide-react';

export const AdminPanel = () => {
  const { isAdmin, assignAdminByEmail } = useUserRoles();
  const [email, setEmail] = useState('');

  if (!isAdmin) {
    return null;
  }

  const handleAssignAdmin = () => {
    if (email.trim()) {
      assignAdminByEmail.mutate(email);
      setEmail('');
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Admin Panel
        </CardTitle>
        <CardDescription>
          Manage user roles and permissions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="admin-email" className="text-sm font-medium">
            Assign Admin Role by Email
          </label>
          <div className="flex gap-2">
            <Input
              id="admin-email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button 
              onClick={handleAssignAdmin}
              disabled={!email.trim() || assignAdminByEmail.isPending}
              size="sm"
            >
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
