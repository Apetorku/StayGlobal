import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useMutation } from '@tanstack/react-query';
import { userService } from '@/services/userService';

export default function UserSync() {
  const { user, isSignedIn } = useUser();
  const hasSyncedRef = useRef(false);
  const syncedUserIdRef = useRef<string | null>(null);

  const syncUserMutation = useMutation({
    mutationFn: (clerkUserId: string) => userService.syncUser(clerkUserId),
    retry: 2, // Limit retries to prevent resource exhaustion
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    onSuccess: (data) => {
      console.log('User synced successfully:', data);
      hasSyncedRef.current = true;
      syncedUserIdRef.current = user?.id || null;
    },
    onError: (error) => {
      console.error('Failed to sync user:', error);
      // Reset the flag on error so it can retry later
      hasSyncedRef.current = false;
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
