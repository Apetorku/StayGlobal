import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';
import SimpleVerificationFlow from './SimpleVerificationFlow';

interface IdentityVerificationFlowProps {
  onVerificationComplete?: () => void;
  onPaymentSetupRequired?: () => void;
  onClose?: () => void;
}

const IdentityVerificationFlow: React.FC<IdentityVerificationFlowProps> = ({
  onVerificationComplete,
  onPaymentSetupRequired,
  onClose
}) => {
  const [verificationData, setVerificationData] = useState({
    nationalId: null as any,
    documentImages: null as any,
    fingerprintData: null as any
  });

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-blue-600" />
          House Owner Verification
        </CardTitle>
        <CardDescription>
          Simple and secure verification for property owners
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6">
        {/* Security Notice */}
        <Alert className="mb-6">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Your personal information is encrypted and securely stored. We use fraud prevention
            measures to ensure the security of our platform.
          </AlertDescription>
        </Alert>

        {/* Simple Verification Flow */}
        <SimpleVerificationFlow
          onComplete={(data) => {
            setVerificationData(data);
            onVerificationComplete?.();
          }}
          onPaymentSetupRequired={() => {
            console.log('🔄 Verification complete, redirecting to payment setup...');
            onPaymentSetupRequired?.();
          }}
        />
      </CardContent>
    </Card>
  );
};

export default IdentityVerificationFlow;
