import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Shield,
  CreditCard,
  CheckCircle,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import SimpleVerificationFlow from './SimpleVerificationFlow';
import PaymentAccountSetup from '../owner/PaymentAccountSetup';

interface VerificationAndPaymentFlowProps {
  onComplete?: () => void;
  onClose?: () => void;
}

type FlowStep = 'verification' | 'payment_setup' | 'complete';

const VerificationAndPaymentFlow: React.FC<VerificationAndPaymentFlowProps> = ({
  onComplete,
  onClose
}) => {
  const [currentStep, setCurrentStep] = useState<FlowStep>('verification');
  const [verificationData, setVerificationData] = useState<any>(null);

  const handleVerificationComplete = (data: any) => {
    console.log('✅ Verification completed:', data);
    setVerificationData(data);
    setCurrentStep('payment_setup');
  };

  const handlePaymentSetupComplete = () => {
    console.log('✅ Payment setup completed');
    setCurrentStep('complete');
    
    // Auto-complete after showing success message
    setTimeout(() => {
      onComplete?.();
    }, 3000);
  };

  const handleBackToVerification = () => {
    setCurrentStep('verification');
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      <div className="flex items-center space-x-4">
        {/* Step 1: Verification */}
        <div className="flex items-center">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            currentStep === 'verification' ? 'bg-blue-600 text-white' :
            currentStep === 'payment_setup' || currentStep === 'complete' ? 'bg-green-600 text-white' :
            'bg-gray-300 text-gray-600'
          }`}>
            {currentStep === 'payment_setup' || currentStep === 'complete' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <Shield className="h-4 w-4" />
            )}
          </div>
          <span className="ml-2 text-sm font-medium">Identity Verification</span>
        </div>

        {/* Arrow */}
        <ArrowRight className="h-4 w-4 text-gray-400" />

        {/* Step 2: Payment Setup */}
        <div className="flex items-center">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            currentStep === 'payment_setup' ? 'bg-blue-600 text-white' :
            currentStep === 'complete' ? 'bg-green-600 text-white' :
            'bg-gray-300 text-gray-600'
          }`}>
            {currentStep === 'complete' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
          </div>
          <span className="ml-2 text-sm font-medium">Payment Setup</span>
        </div>

        {/* Arrow */}
        <ArrowRight className="h-4 w-4 text-gray-400" />

        {/* Step 3: Complete */}
        <div className="flex items-center">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            currentStep === 'complete' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
          }`}>
            <CheckCircle className="h-4 w-4" />
          </div>
          <span className="ml-2 text-sm font-medium">Complete</span>
        </div>
      </div>
    </div>
  );

  if (currentStep === 'verification') {
    return (
      <div className="w-full max-w-6xl mx-auto space-y-6">
        {renderStepIndicator()}
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" />
              House Owner Verification
            </CardTitle>
            <CardDescription>
              First, let's verify your identity and house registration details
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
              onComplete={handleVerificationComplete}
              onPaymentSetupRequired={() => setCurrentStep('payment_setup')}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentStep === 'payment_setup') {
    return (
      <div className="w-full max-w-6xl mx-auto space-y-6">
        {renderStepIndicator()}
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-blue-600" />
              Payment Account Setup
            </CardTitle>
            <CardDescription>
              Set up your payment account to receive rental payments from tenants
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            {/* Success Notice */}
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Identity Verification Complete!</strong> Now let's set up your payment account
                to receive rental payments directly from tenants.
              </AlertDescription>
            </Alert>

            {/* Back Button */}
            <div className="mb-6">
              <Button
                variant="outline"
                onClick={handleBackToVerification}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Verification
              </Button>
            </div>

            {/* Payment Account Setup */}
            <PaymentAccountSetup onSetupComplete={handlePaymentSetupComplete} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentStep === 'complete') {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {renderStepIndicator()}
        
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-20 w-20 text-green-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-green-800 mb-4">
              Setup Complete! 🎉
            </h2>
            <p className="text-green-700 mb-6 text-lg">
              Your house owner verification and payment account have been successfully set up.
              You can now list your properties and start receiving rental payments!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Badge variant="default" className="flex items-center gap-2 px-4 py-2">
                <CheckCircle className="h-4 w-4" />
                Identity Verified
              </Badge>
              <Badge variant="default" className="flex items-center gap-2 px-4 py-2">
                <CheckCircle className="h-4 w-4" />
                Payment Account Ready
              </Badge>
            </div>

            <p className="text-sm text-green-600 mt-4">
              Redirecting to your dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default VerificationAndPaymentFlow;
