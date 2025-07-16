import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, Users, Shield, ArrowLeft } from 'lucide-react';

type AuthMode = 'role-selection' | 'sign-in' | 'sign-up';

export default function RoleSelectionAuth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('role-selection');
  const [selectedRole, setSelectedRole] = useState<'guest' | 'owner' | 'admin'>('guest');

  const handleRoleSelect = (role: 'guest' | 'owner' | 'admin', authType: 'sign-in' | 'sign-up') => {
    setSelectedRole(role);
    setMode(authType);
  };

  const getRedirectUrl = () => {
    // Store the selected role in localStorage so we can use it after auth
    localStorage.setItem('selectedRole', selectedRole);
    return '/dashboard';
  };

  const handleSignInError = () => {
    // When sign-in fails (user doesn't exist), switch to sign-up mode
    setMode('sign-up');
  };

  const handleSignUpSuccess = () => {
    // After successful sign-up, redirect immediately
    navigate('/dashboard');
  };

  if (mode === 'role-selection') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Welcome to StayGlobal</CardTitle>
            <CardDescription className="text-lg">
              Choose your role to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Role Selection Cards */}
            <div className="grid gap-4">
              <Card className="border-2 hover:border-blue-300 transition-colors cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <Users className="h-8 w-8 text-blue-600" />
                    <div>
                      <h3 className="text-xl font-semibold">Guest / Renter</h3>
                      <p className="text-gray-600">Find and book apartments worldwide</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleRoleSelect('guest', 'sign-in')}
                      variant="outline" 
                      className="flex-1"
                    >
                      Sign In
                    </Button>
                    <Button 
                      onClick={() => handleRoleSelect('guest', 'sign-up')}
                      className="flex-1"
                    >
                      Sign Up
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-green-300 transition-colors cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <Home className="h-8 w-8 text-green-600" />
                    <div>
                      <h3 className="text-xl font-semibold">Property Owner</h3>
                      <p className="text-gray-600">List and manage your apartments</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleRoleSelect('owner', 'sign-in')}
                      variant="outline" 
                      className="flex-1"
                    >
                      Sign In
                    </Button>
                    <Button 
                      onClick={() => handleRoleSelect('owner', 'sign-up')}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      Sign Up
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-purple-300 transition-colors cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <Shield className="h-8 w-8 text-purple-600" />
                    <div>
                      <h3 className="text-xl font-semibold">Administrator</h3>
                      <p className="text-gray-600">Manage platform operations</p>
                      <p className="text-sm text-purple-600 font-medium">Admin access only</p>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <Button
                      onClick={() => handleRoleSelect('admin', 'sign-in')}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      Admin Sign In
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="text-center pt-4">
              <Button variant="ghost" onClick={() => navigate('/')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (mode === 'sign-in') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">Sign In as {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}</h2>
            <p className="text-gray-600 mt-2">
              Don't have an account?
              <Button
                variant="link"
                onClick={() => setMode('sign-up')}
                className="p-0 ml-1 h-auto font-medium text-blue-600"
              >
                Sign up here
              </Button>
            </p>
            <Button
              variant="ghost"
              onClick={() => setMode('role-selection')}
              className="mt-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Change Role
            </Button>
          </div>
          <SignIn
            routing="hash"
            signUpUrl="#"
            afterSignInUrl={getRedirectUrl()}
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "w-full shadow-lg",
                formButtonPrimary: "bg-blue-600 hover:bg-blue-700",
                footerActionLink: "text-blue-600 hover:text-blue-700"
              }
            }}
            fallbackRedirectUrl={getRedirectUrl()}
            forceRedirectUrl={getRedirectUrl()}
          />
        </div>
      </div>
    );
  }

  if (mode === 'sign-up') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">Sign Up as {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}</h2>
            <p className="text-gray-600 mt-2">
              Already have an account?
              <Button
                variant="link"
                onClick={() => setMode('sign-in')}
                className="p-0 ml-1 h-auto font-medium text-blue-600"
              >
                Sign in here
              </Button>
            </p>
            <Button
              variant="ghost"
              onClick={() => setMode('role-selection')}
              className="mt-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Change Role
            </Button>
          </div>
          <SignUp
            routing="hash"
            signInUrl="#"
            afterSignUpUrl={getRedirectUrl()}
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "w-full shadow-lg",
                formButtonPrimary: "bg-blue-600 hover:bg-blue-700",
                footerActionLink: "text-blue-600 hover:text-blue-700"
              }
            }}
            fallbackRedirectUrl={getRedirectUrl()}
            forceRedirectUrl={getRedirectUrl()}
          />
        </div>
      </div>
    );
  }

  return null;
}
