import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useQuery } from '@tanstack/react-query';
import AuthLoadingState from './AuthLoadingState';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://web-production-8ffb7.up.railway.app/api';

interface UserData {
  role: 'guest' | 'owner' | 'admin';
  email: string;
  firstName?: string;
  lastName?: string;
}

export default function RoleBasedRedirect() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [hasRedirected, setHasRedirected] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'guest' | 'owner' | 'admin' | null>(null);

  // Check for selected role on component mount and periodically
  useEffect(() => {
    const checkForSelectedRole = () => {
      const storedRole = localStorage.getItem('selectedRole') as 'guest' | 'owner' | 'admin' | null;
      if (storedRole && storedRole !== selectedRole) {
        console.log('🎯 Found selected role in localStorage:', storedRole);
        setSelectedRole(storedRole);
      }
    };

    // Check immediately
    checkForSelectedRole();

    // Also check periodically in case localStorage is updated
    const interval = setInterval(checkForSelectedRole, 500);

    return () => clearInterval(interval);
  }, [selectedRole]);

  // Fetch user data from backend to get role (only if no selected role)
  const { data: userData, isLoading, error } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async (): Promise<UserData> => {
      if (!user?.id) throw new Error('No user ID');

      console.log('🔍 Fetching user data from backend...');
      const token = await user.getToken();

      const response = await fetch(`${API_BASE_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        // If user not found (401), it means they haven't been synced yet
        if (response.status === 401) {
          console.log('👤 User not found in database, will wait for sync...');
          throw new Error('USER_NOT_SYNCED');
        }
        throw new Error(`Failed to fetch user data: ${response.status}`);
      }

      const data = await response.json();
      console.log('👤 User data received:', data);
      return data;
    },
    enabled: !!user?.id && isLoaded && !selectedRole && !hasRedirected,
    retry: (failureCount, error) => {
      // Don't retry if user is not synced, let UserSync handle it
      if (error?.message === 'USER_NOT_SYNCED') return false;
      return failureCount < 2;
    },
    retryDelay: 1000
  });

  const redirectBasedOnRole = (role: string) => {
    if (hasRedirected) return;

    console.log('🚀 Redirecting user based on role:', role);
    setHasRedirected(true);

    switch (role) {
      case 'admin':
        navigate('/admin', { replace: true });
        break;
      case 'owner':
        navigate('/owner', { replace: true });
        break;
      case 'guest':
      default:
        navigate('/search', { replace: true });
        break;
    }
  };

  // Immediate redirect effect for selected role
  useEffect(() => {
    if (selectedRole && isLoaded && user && !hasRedirected) {
      console.log('🚀 Immediate redirect triggered for selected role:', selectedRole);
      localStorage.removeItem('selectedRole');
      setSelectedRole(null);
      redirectBasedOnRole(selectedRole);
    }
  }, [selectedRole, isLoaded, user, hasRedirected]);

  // Fallback redirect effect for when no selected role is available
  useEffect(() => {
    if (!isLoaded || !user || hasRedirected || selectedRole) return;

    console.log('🔍 RoleBasedRedirect - Fallback effect triggered');
    console.log('   userData:', userData);
    console.log('   isLoading:', isLoading);
    console.log('   error:', error);

    // Use user data from backend
    if (userData && !isLoading) {
      console.log('🎯 Using role from database:', userData.role);
      redirectBasedOnRole(userData.role);
      return;
    }

    // Handle error cases or fallback
    if (error && !isLoading) {
      console.log('⚠️ Backend call failed, defaulting to guest');
      redirectBasedOnRole('guest');
      return;
    }
  }, [isLoaded, user, selectedRole, userData, isLoading, error, hasRedirected]);

  // Timeout fallback to prevent infinite loops
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoaded && user && !hasRedirected) {
        console.log('⏰ Timeout reached, forcing redirect to guest dashboard');
        redirectBasedOnRole('guest');
      }
    }, 3000); // 3 second timeout

    return () => clearTimeout(timeout);
  }, [isLoaded, user, hasRedirected]);

  // Show loading while determining role
  if (!isLoaded || (!hasRedirected && !selectedRole && isLoading)) {
    const roleMessage = selectedRole
      ? `Setting up your ${selectedRole} dashboard...`
      : "Setting up your account...";

    return (
      <AuthLoadingState
        message={roleMessage}
        description="Please wait while we prepare your personalized experience"
      />
    );
  }

  return null;
}
