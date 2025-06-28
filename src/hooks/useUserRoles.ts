
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type UserRole = 'admin' | 'user';

export const useUserRoles = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: userRoles, isLoading } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) throw error;
      return data?.map(r => r.role) || [];
    },
    enabled: !!user,
  });

  const { data: isAdmin, isLoading: isAdminLoading } = useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn: async () => {
      if (!user) return false;

      const { data, error } = await supabase.rpc('is_admin', {
        _user_id: user.id
      });

      if (error) throw error;
      return data || false;
    },
    enabled: !!user,
  });

  const assignAdminRole = useMutation({
    mutationFn: async (targetUserId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: targetUserId,
          role: 'admin'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      queryClient.invalidateQueries({ queryKey: ['is-admin'] });
      toast({
        title: "Success",
        description: "Admin role assigned successfully",
      });
    },
    onError: (error) => {
      // Don't show error toast for conflict errors (role already exists)
      if (!error.message?.includes('duplicate key') && !error.message?.includes('conflict')) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to assign admin role",
          variant: "destructive"
        });
      }
    },
  });

  const assignAdminByEmail = useMutation({
    mutationFn: async (email: string) => {
      // First get the user ID from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (profileError) throw new Error('User not found with that email');

      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: profile.id,
          role: 'admin'
        });

      if (error) throw error;
      return profile.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      queryClient.invalidateQueries({ queryKey: ['is-admin'] });
      toast({
        title: "Success",
        description: "Admin role assigned successfully",
      });
    },
    onError: (error) => {
      // Don't show error toast for conflict errors (role already exists)
      if (!error.message?.includes('duplicate key') && !error.message?.includes('conflict')) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to assign admin role",
          variant: "destructive"
        });
      }
    },
  });

  return {
    userRoles: userRoles || [],
    isAdmin: isAdmin || false,
    isLoading: isLoading || isAdminLoading,
    assignAdminRole,
    assignAdminByEmail,
  };
};
