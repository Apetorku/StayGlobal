import React, { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
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
import { useVerificationStatus } from '@/hooks/useVerificationStatus';
import IdentityVerificationFlow from './IdentityVerificationFlow';
import VerificationAndPaymentFlow from './VerificationAndPaymentFlow';

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
  const { user, isSignedIn } = useAuth();
  const [showVerificationFlow, setShowVerificationFlow] = useState(false);
  const [localVerificationComplete, setLocalVerificationComplete] = useState(false);

  // Use the new verification status hook
  const {
    isIdentityVerified,
    hasPaymentAccount,
    isPaymentVerified,
    canListApartments,
    isLoading,
    refetch,
    invalidateVerificationStatus,
    debug
  } = useVerificationStatus();

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

  // Check if user meets requirements - prioritize actual database status
  // Only use local state as a temporary optimistic update, but still require database confirmation
  const finalIsIdentityVerified = isIdentityVerified;
  const finalHasPaymentAccount = hasPaymentAccount;
  const finalIsPaymentVerified = isPaymentVerified;

  const finalCanListApartments = finalIsIdentityVerified && (!showPaymentRequirement || (finalHasPaymentAccount && finalIsPaymentVerified));

  // Enhanced debugging to understand the issue
  console.log('🔍 VerificationGate Debug - Raw Values:', {
    isIdentityVerified,
    hasPaymentAccount,
    isPaymentVerified,
    canListApartments,
    isLoading,
    showPaymentRequirement
  });

  console.log('🔍 VerificationGate Debug - Final Values:', {
    finalIsIdentityVerified,
    finalHasPaymentAccount,
    finalIsPaymentVerified,
    finalCanListApartments
  });

  console.log('🔍 VerificationGate Debug - Raw API Data:', {
    verificationQuery: debug?.verificationQuery?.data,
    paymentQuery: debug?.paymentQuery?.data,
    verificationError: debug?.verificationQuery?.error,
    paymentError: debug?.paymentQuery?.error
  });

  if (finalCanListApartments) {
    return <>{children}</>;
  }

  if (showVerificationFlow) {
    return (
      <VerificationAndPaymentFlow
        onComplete={() => {
          console.log('🎉 Verification and payment setup completed! Refreshing verification status...');
          setShowVerificationFlow(false);

          // Invalidate and refetch verification status to get fresh data from database
          invalidateVerificationStatus();

          // Also refetch immediately to get updated status
          refetch();

          // Note: We no longer set localVerificationComplete to avoid state mismatch
          // The user will see the updated status once the database is updated
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
    if (isIdentityVerified && hasPaymentAccount && isPaymentVerified) return 'completed';
    if (isIdentityVerified || hasPaymentAccount) return 'pending';
    return 'required';
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
          identity verification and payment account setup before listing apartments.
        </AlertDescription>
      </Alert>

      {/* Requirements */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Verification Requirements</h3>
        
        <RequirementCard
          icon={Fingerprint}
          title="Identity Verification & Payment Setup"
          description="Complete identity verification and set up your payment account in one simple flow"
          status={getIdentityStatus()}
          action={() => setShowVerificationFlow(true)}
        />

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
              <Badge variant={finalIsIdentityVerified ? 'default' : 'secondary'}>
                {finalIsIdentityVerified ? 'Verified' : 'Not Started'}
              </Badge>
            </div>

            {showPaymentRequirement && (
              <div className="flex items-center justify-between">
                <span className="text-sm">Payment Account</span>
                <Badge variant={finalHasPaymentAccount && finalIsPaymentVerified ? 'default' : 'secondary'}>
                  {finalHasPaymentAccount
                    ? (finalIsPaymentVerified ? 'Verified' : 'Pending')
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
