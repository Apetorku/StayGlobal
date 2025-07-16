import { useEffect, useRef } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/userService';

export default function UserSync() {
  const { user, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const hasSyncedRef = useRef(false);
  const syncedUserIdRef = useRef<string | null>(null);
  const hasAssignedRoleRef = useRef(false);

  const syncUserMutation = useMutation({
    mutationFn: (clerkUserId: string) => userService.syncUser(clerkUserId),
    retry: 3, // Increase retries for better reliability
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    onSuccess: (data) => {
      console.log('✅ User sync successful:', data);
      hasSyncedRef.current = true;
      syncedUserIdRef.current = user?.id || null;

      // Check if we need to assign a role from localStorage
      const selectedRole = localStorage.getItem('selectedRole') as 'guest' | 'owner' | 'admin' | null;
      if (selectedRole && !hasAssignedRoleRef.current && data.role === 'guest') {
        console.log('🎯 Found selected role in localStorage:', selectedRole);
        // Trigger role assignment
        assignRoleMutation.mutate(selectedRole);
      }

      // Invalidate verification status queries to ensure fresh data after user sync
      // This ensures that if the user has verification status in the database,
      // it will be fetched and cached properly
      queryClient.invalidateQueries({ queryKey: ['verification-status'] });
      queryClient.invalidateQueries({ queryKey: ['payment-account-status'] });
      queryClient.invalidateQueries({ queryKey: ['user-role'] });
    },
    onError: (error) => {
      console.error('❌ Failed to sync user:', error);
      // Reset the flag on error so it can retry later
      hasSyncedRef.current = false;

      // Show user-friendly error message
      if (error instanceof Error) {
        if (error.message.includes('Network error')) {
          console.error('🌐 Network connectivity issue detected');
        } else if (error.message.includes('timeout')) {
          console.error('⏱️ Request timeout - server may be slow');
        }
      }
    },
  });

  const assignRoleMutation = useMutation({
    mutationFn: async (role: 'guest' | 'owner' | 'admin') => {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }
      return userService.updateUserRole(role, token);
    },
    onSuccess: (data, role) => {
      console.log('✅ Role assignment successful:', data);
      hasAssignedRoleRef.current = true;

      // Clear the selected role from localStorage since it's been assigned
      localStorage.removeItem('selectedRole');

      // Invalidate queries to refresh user data
      queryClient.invalidateQueries({ queryKey: ['user-role'] });
      queryClient.invalidateQueries({ queryKey: ['verification-status'] });
      queryClient.invalidateQueries({ queryKey: ['payment-account-status'] });
    },
    onError: (error) => {
      console.error('❌ Failed to assign role:', error);
      hasAssignedRoleRef.current = false;
    },
  });

  useEffect(() => {
    console.log('UserSync useEffect triggered:', {
      isSignedIn,
      userId: user?.id,
      hasSynced: hasSyncedRef.current,
      syncedUserId: syncedUserIdRef.current,
      isPending: syncUserMutation.isPending
    });

    // Only sync if:
    // 1. User is signed in
    // 2. User ID exists
    // 3. Haven't synced this user yet (or it's a different user)
    // 4. No sync operation is currently pending
    if (
      isSignedIn &&
      user?.id &&
      (!hasSyncedRef.current || syncedUserIdRef.current !== user.id) &&
      !syncUserMutation.isPending
    ) {
      console.log('✅ All conditions met, syncing user with backend:', user.id);
      syncUserMutation.mutate(user.id);
    } else {
      console.log('❌ Sync conditions not met:', {
        isSignedIn,
        hasUserId: !!user?.id,
        needsSync: !hasSyncedRef.current || syncedUserIdRef.current !== user.id,
        notPending: !syncUserMutation.isPending
      });
    }
  }, [isSignedIn, user?.id, syncUserMutation.isPending, syncUserMutation.mutate]);

  // Reset sync status when user signs out
  useEffect(() => {
    if (!isSignedIn) {
      console.log('🔄 User signed out, resetting sync status');
      hasSyncedRef.current = false;
      syncedUserIdRef.current = null;
      hasAssignedRoleRef.current = false;
    }
  }, [isSignedIn]);

  // Add a manual sync function for testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).testUserSync = () => {
        if (user?.id) {
          console.log('🧪 Manual sync test triggered for user:', user.id);
          hasSyncedRef.current = false; // Force sync
          syncUserMutation.mutate(user.id);
        } else {
          console.log('❌ No user ID available for manual sync');
        }
      };
    }
  }, [user?.id, syncUserMutation.mutate]);

  // This component doesn't render anything
  return null;
}
