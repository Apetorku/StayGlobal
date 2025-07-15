import { useAuth, SignIn } from '@clerk/clerk-react';
import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isSignedIn, isLoaded } = useAuth();

  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Show sign-in if user is not authenticated
  if (!isSignedIn) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-md w-full">
          <SignIn
            routing="hash"
            signUpUrl="/sign-up"
            afterSignInUrl="/dashboard"
          />
        </div>
      </div>
    );
  }

  // User is authenticated, show the protected content
  return <>{children}</>;
}
