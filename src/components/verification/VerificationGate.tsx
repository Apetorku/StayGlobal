import React, { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Fingerprint, 
  CreditCard,
  Lock,
  ArrowRight
} from 'lucide-react';
import identityVerificationService from '@/services/identityVerificationService';
import IdentityVerificationFlow from './IdentityVerificationFlow';

interface VerificationGateProps {
  children: React.ReactNode;
  requiredLevel?: 'basic' | 'full';
  showPaymentRequirement?: boolean;
}

const VerificationGate: React.FC<VerificationGateProps> = ({ 
  children, 
  requiredLevel = 'full',
  showPaymentRequirement = true 
}) => {
  const { getToken, user } = useAuth();
  const [showVerificationFlow, setShowVerificationFlow] = useState(false);

  // Get verification status
  const { data: verificationStatus, isLoading, refetch } = useQuery({
    queryKey: ['verification-status'],
    queryFn: async () => {
      const token = await getToken();
      return identityVerificationService.getVerificationStatus(token!);
    },
    staleTime: 30000 // 30 seconds
  });

  // Get user payment account status (you'll need to implement this)
  const { data: paymentStatus } = useQuery({
    queryKey: ['payment-account-status'],
    queryFn: async () => {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/user-payments/account`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) return { hasAccount: false, isVerified: false };
      return response.json();
    },
    staleTime: 30000
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking verification status...</p>
        </CardContent>
      </Card>
    );
  }

  // Check if user meets requirements
  const isIdentityVerified = verificationStatus?.isVerified || false;
  const hasPaymentAccount = paymentStatus?.hasAccount || false;
  const isPaymentVerified = paymentStatus?.isVerified || false;
  
  const canListApartments = isIdentityVerified && (!showPaymentRequirement || (hasPaymentAccount && isPaymentVerified));

  if (canListApartments) {
    return <>{children}</>;
  }

  if (showVerificationFlow) {
    return (
      <IdentityVerificationFlow
        onVerificationComplete={() => {
          setShowVerificationFlow(false);
          refetch();
        }}
        onClose={() => setShowVerificationFlow(false)}
      />
    );
  }

  const RequirementCard = ({ 
    icon: Icon, 
    title, 
    description, 
    status, 
    action 
  }: {
    icon: any;
    title: string;
    description: string;
    status: 'completed' | 'pending' | 'required';
    action?: () => void;
  }) => (
    <Card className={`border-2 ${
      status === 'completed' 
        ? 'border-green-200 bg-green-50' 
        : status === 'pending'
        ? 'border-yellow-200 bg-yellow-50'
        : 'border-red-200 bg-red-50'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              status === 'completed' 
                ? 'bg-green-100' 
                : status === 'pending'
                ? 'bg-yellow-100'
                : 'bg-red-100'
            }`}>
              <Icon className={`h-5 w-5 ${
                status === 'completed' 
                  ? 'text-green-600' 
                  : status === 'pending'
                  ? 'text-yellow-600'
                  : 'text-red-600'
              }`} />
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription className="text-sm">{description}</CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {status === 'completed' && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Complete
              </Badge>
            )}
            {status === 'pending' && (
              <Badge className="bg-yellow-100 text-yellow-800">
                <Clock className="h-3 w-3 mr-1" />
                Pending
              </Badge>
            )}
            {status === 'required' && (
              <Badge variant="destructive">
                <AlertCircle className="h-3 w-3 mr-1" />
                Required
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      {action && status !== 'completed' && (
        <CardContent className="pt-0">
          <Button onClick={action} className="w-full">
            {status === 'pending' ? 'Check Status' : 'Complete Now'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      )}
    </Card>
  );

  const getIdentityStatus = () => {
    if (!verificationStatus?.hasVerification) return 'required';
    if (verificationStatus.verificationStatus === 'verified') return 'completed';
    return 'pending';
  };

  const getPaymentStatus = () => {
    if (!hasPaymentAccount) return 'required';
    if (!isPaymentVerified) return 'pending';
    return 'completed';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Lock className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Security Verification Required</CardTitle>
          <CardDescription className="text-lg">
            Complete the following steps to list apartments and ensure platform security
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Security Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Enhanced Security:</strong> To prevent fraud and protect all users, we require 
          identity verification with biometric authentication and payment account setup before 
          listing apartments.
        </AlertDescription>
      </Alert>

      {/* Requirements */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Verification Requirements</h3>
        
        <RequirementCard
          icon={Fingerprint}
          title="Identity Verification"
          description="Verify your identity with national ID and fingerprint biometric authentication"
          status={getIdentityStatus()}
          action={() => setShowVerificationFlow(true)}
        />
        
        {showPaymentRequirement && (
          <RequirementCard
            icon={CreditCard}
            title="Payment Account Setup"
            description="Set up your payment account to receive direct payments from renters"
            status={getPaymentStatus()}
            action={() => {
              // Navigate to payment setup - you'll need to implement this
              window.location.href = '/owner?tab=payment-setup';
            }}
          />
        )}
      </div>

      {/* Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Current Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Identity Verification</span>
              <Badge variant={isIdentityVerified ? 'default' : 'secondary'}>
                {verificationStatus?.verificationStatus || 'Not Started'}
              </Badge>
            </div>
            
            {showPaymentRequirement && (
              <div className="flex items-center justify-between">
                <span className="text-sm">Payment Account</span>
                <Badge variant={hasPaymentAccount && isPaymentVerified ? 'default' : 'secondary'}>
                  {hasPaymentAccount 
                    ? (isPaymentVerified ? 'Verified' : 'Pending') 
                    : 'Not Set Up'
                  }
                </Badge>
              </div>
            )}
            
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="font-medium">Can List Apartments</span>
              <Badge variant={canListApartments ? 'default' : 'destructive'}>
                {canListApartments ? 'Yes' : 'No'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Need Help?</strong> If you're having trouble with verification, please contact 
          our support team. The verification process typically takes 1-2 business days.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default VerificationGate;
