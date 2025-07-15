import { useState } from 'react';
import { useSignUp } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Home, Users, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function RoleSelectionSignUp() {
  const { signUp, setActive } = useSignUp();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<'role' | 'details' | 'verification'>('role');
  const [selectedRole, setSelectedRole] = useState<'guest' | 'owner' | 'admin'>('guest');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleSelect = (role: 'guest' | 'owner' | 'admin') => {
    setSelectedRole(role);
    setStep('details');
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp) return;

    setIsLoading(true);
    try {
      // Create the sign-up with Clerk
      await signUp.create({
        firstName: formData.firstName,
        lastName: formData.lastName,
        emailAddress: formData.email,
        password: formData.password,
      });

      // Send email verification
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setStep('verification');
      toast.success('Verification code sent to your email!');
    } catch (error: any) {
      console.error('Sign-up error:', error);
      toast.error(error.errors?.[0]?.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp) return;

    setIsLoading(true);
    try {
      // Verify the email
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (completeSignUp.status === 'complete') {
        // Set the session as active
        await setActive({ session: completeSignUp.createdSessionId });
        
        // Update user role in backend
        const token = await completeSignUp.createdSessionId;
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users/update-role`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ role: selectedRole })
        });

        toast.success('Account created successfully!');
        
        // Redirect based on role
        switch (selectedRole) {
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
    } catch (error: any) {
      console.error('Verification error:', error);
      toast.error(error.errors?.[0]?.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'role') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Choose Your Role</CardTitle>
            <CardDescription>
              Select how you plan to use StayGlobal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50"
                onClick={() => handleRoleSelect('guest')}
              >
                <Users className="h-6 w-6 text-blue-600" />
                <div className="text-center">
                  <div className="font-semibold">Guest</div>
                  <div className="text-sm text-gray-500">Find and book apartments</div>
                </div>
              </Button>
              
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-green-50"
                onClick={() => handleRoleSelect('owner')}
              >
                <Home className="h-6 w-6 text-green-600" />
                <div className="text-center">
                  <div className="font-semibold">Property Owner</div>
                  <div className="text-sm text-gray-500">List and manage apartments</div>
                </div>
              </Button>
              
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-purple-50"
                onClick={() => handleRoleSelect('admin')}
              >
                <Shield className="h-6 w-6 text-purple-600" />
                <div className="text-center">
                  <div className="font-semibold">Administrator</div>
                  <div className="text-sm text-gray-500">Manage platform operations</div>
                </div>
              </Button>
            </div>
            
            <div className="text-center pt-4">
              <Button variant="ghost" onClick={() => navigate('/')}>
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'details') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription>
              Role: {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('role')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? 'Creating...' : 'Create Account'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'verification') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Verify Email</CardTitle>
            <CardDescription>
              Enter the verification code sent to {formData.email}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerification} className="space-y-4">
              <div>
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  required
                />
              </div>
              
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Verifying...' : 'Verify & Complete'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
