import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';
import QuickVerificationFlow from './QuickVerificationFlow';

interface IdentityVerificationFlowProps {
  onVerificationComplete?: () => void;
}

const IdentityVerificationFlow: React.FC<IdentityVerificationFlowProps> = ({
  onVerificationComplete
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
          Identity Verification
        </CardTitle>
        <CardDescription>
          Quick verification using your ID number and fingerprint - just like MTN
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6">
        {/* Security Notice */}
        <Alert className="mb-6">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Your personal information is encrypted and securely stored. We connect directly to
            government databases for instant verification and maximum security.
          </AlertDescription>
        </Alert>

        {/* Quick Verification Flow */}
        <QuickVerificationFlow
          onComplete={(data) => {
            setVerificationData(data);
            onVerificationComplete?.();
          }}
        />
      </CardContent>
    </Card>
  );
};

export default IdentityVerificationFlow;
