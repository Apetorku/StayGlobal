import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface UserData {
  role: 'guest' | 'owner' | 'admin';
  email: string;
  firstName?: string;
  lastName?: string;
}

export default function RoleBasedRedirect() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch user data from backend to get role
  const { data: userData, isLoading, error } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async (): Promise<UserData> => {
      if (!user?.id) throw new Error('No user ID');

      console.log('🔍 Fetching user data from backend...');
      const token = await user.getToken();
      console.log('🔑 Token obtained:', !!token);

      const response = await fetch(`${API_BASE_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📡 Backend response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend error:', errorText);

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
    enabled: !!user?.id && isLoaded,
    retry: 1
  });

  // Log any errors
  if (error) {
    console.error('❌ Query error:', error);
  }

  useEffect(() => {
    const handleRoleAndRedirect = async () => {
      console.log('🔍 RoleBasedRedirect - Effect triggered');
      console.log('   isLoaded:', isLoaded);
      console.log('   userData:', userData);
      console.log('   isLoading:', isLoading);
      console.log('   error:', error);
      console.log('   user:', !!user);

      // Check if user selected a role during auth
      const selectedRole = localStorage.getItem('selectedRole') as 'guest' | 'owner' | 'admin' | null;
      console.log('🎯 Selected role from localStorage:', selectedRole);

      if (isLoaded && user) {
        // If we have a selected role, use it immediately
        if (selectedRole) {
          console.log('🚀 Using selected role for immediate redirect:', selectedRole);
          localStorage.removeItem('selectedRole');

          // Update role in backend (async, don't wait for it)
          if (userData && selectedRole !== userData.role) {
            console.log('🔄 Updating user role in background from', userData.role, 'to', selectedRole);
            try {
              const token = await user.getToken();
              fetch(`${API_BASE_URL}/users/update-role`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ role: selectedRole })
              }).catch(err => console.error('❌ Background role update failed:', err));
            } catch (err) {
              console.error('❌ Failed to get token for role update:', err);
            }
          }

          redirectBasedOnRole(selectedRole);
          return;
        }

        // If no selected role and we have user data, use current role
        if (userData && !isLoading) {
          console.log('🎯 Current user role from database:', userData.role);
          redirectBasedOnRole(userData.role);
          return;
        }

        // If backend call failed but user is authenticated, check if we have a selected role
        if (error && !isLoading) {
          console.log('⚠️ Backend call failed, checking for selected role or defaulting to guest');
          const fallbackRole = selectedRole || 'guest';
          console.log('🎯 Using fallback role:', fallbackRole);
          if (selectedRole) {
            localStorage.removeItem('selectedRole');
          }
          redirectBasedOnRole(fallbackRole);
          return;
        }
      }
    };

    const redirectBasedOnRole = (role: string) => {
      console.log('🚀 Redirecting user based on role:', role);
      switch (role) {
        case 'admin':
          console.log('   → Navigating to /admin');
          navigate('/admin');
          break;
        case 'owner':
          console.log('   → Navigating to /owner');
          navigate('/owner');
          break;
        case 'guest':
        default:
          console.log('   → Navigating to /search');
          navigate('/search');
          break;
      }
    };

    handleRoleAndRedirect();
  }, [isLoaded, userData, isLoading, error, navigate, user]);

  // Add a timeout fallback to prevent infinite loops
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoaded && user && !userData && !isLoading) {
        console.log('⏰ Timeout reached, forcing redirect to guest dashboard');
        const selectedRole = localStorage.getItem('selectedRole') as 'guest' | 'owner' | 'admin' | null;
        const fallbackRole = selectedRole || 'guest';
        localStorage.removeItem('selectedRole');

        switch (fallbackRole) {
          case 'admin':
            navigate('/admin');
            break;
          case 'owner':
            navigate('/owner');
            break;
          case 'guest':
          default:
            navigate('/search');
            break;
        }
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [isLoaded, user, userData, isLoading, navigate]);

  // Show loading while determining role
  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Setting up your dashboard...</p>
          <div className="mt-4 text-sm text-gray-500">
            <p>Debug: isLoaded={String(isLoaded)}, isLoading={String(isLoading)}</p>
            <p>User ID: {user?.id || 'None'}</p>
            <p>Selected Role: {localStorage.getItem('selectedRole') || 'None'}</p>
            <p>Error: {error?.message || 'None'}</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
