import React, { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Fingerprint, 
  CreditCard, 
  CheckCircle, 
  AlertCircle,
  Lock,
  ArrowRight
} from 'lucide-react';
import identityVerificationService from '@/services/identityVerificationService';
import { bookingService } from '@/services/bookingService';

interface SecureBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  apartment: any;
  bookingData: {
    checkIn: string;
    checkOut: string;
    guests: number;
    totalAmount: number;
    paymentMethod: string;
  };
  onBookingSuccess: (booking: any) => void;
}

const SecureBookingModal: React.FC<SecureBookingModalProps> = ({
  isOpen,
  onClose,
  apartment,
  bookingData,
  onBookingSuccess
}) => {
  const { getToken } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [fingerprintData, setFingerprintData] = useState<any>(null);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'capturing' | 'verifying' | 'success' | 'failed'>('idle');

  // Secure booking mutation
  const secureBookingMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/bookings/secure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create secure booking');
      }

      return response.json();
    },
    onSuccess: (data) => {
      onBookingSuccess(data.booking);
      onClose();
    }
  });

  const handleFingerprintCapture = async () => {
    setVerificationStatus('capturing');
    
    try {
      // Capture fingerprint
      const capturedData = await identityVerificationService.captureFingerprint();
      setFingerprintData(capturedData);
      setVerificationStatus('success');
      setCurrentStep(2);
    } catch (error) {
      setVerificationStatus('failed');
    }
  };

  const handleSecureBooking = async () => {
    if (!fingerprintData) {
      return;
    }

    setVerificationStatus('verifying');

    const secureBookingData = {
      apartmentId: apartment._id,
      checkIn: bookingData.checkIn,
      checkOut: bookingData.checkOut,
      guests: bookingData.guests,
      paymentMethod: bookingData.paymentMethod,
      fingerprintData
    };

    try {
      await secureBookingMutation.mutateAsync(secureBookingData);
    } catch (error) {
      setVerificationStatus('failed');
    }
  };

  const resetFlow = () => {
    setCurrentStep(1);
    setFingerprintData(null);
    setVerificationStatus('idle');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            Secure Payment Authorization
          </DialogTitle>
          <DialogDescription>
            Complete biometric verification to authorize payment to the property owner
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Security Notice */}
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              <strong>Enhanced Security:</strong> Your fingerprint verification ensures secure 
              payment authorization and protects against unauthorized transactions.
            </AlertDescription>
          </Alert>

          {/* Booking Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Booking Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Property</p>
                  <p className="text-gray-600">{apartment.title}</p>
                </div>
                <div>
                  <p className="font-medium">Owner</p>
                  <p className="text-gray-600">{apartment.ownerName}</p>
                </div>
                <div>
                  <p className="font-medium">Check-in</p>
                  <p className="text-gray-600">{new Date(bookingData.checkIn).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="font-medium">Check-out</p>
                  <p className="text-gray-600">{new Date(bookingData.checkOut).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="font-medium">Guests</p>
                  <p className="text-gray-600">{bookingData.guests}</p>
                </div>
                <div>
                  <p className="font-medium">Total Amount</p>
                  <p className="text-gray-600 font-semibold">GHS {bookingData.totalAmount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-green-600" />
                Direct Payment to Owner
              </CardTitle>
              <CardDescription>
                Your payment will be sent directly to the property owner's verified account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Secure Transfer
                </Badge>
                <Badge className="bg-blue-100 text-blue-800">
                  <Shield className="h-3 w-3 mr-1" />
                  Verified Account
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Step 1: Fingerprint Verification */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fingerprint className="h-5 w-5" />
                  Step 1: Biometric Verification
                </CardTitle>
                <CardDescription>
                  Verify your identity with fingerprint to authorize payment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className={`w-24 h-24 mx-auto rounded-full border-4 flex items-center justify-center ${
                    verificationStatus === 'capturing' 
                      ? 'border-blue-500 bg-blue-50 animate-pulse' 
                      : verificationStatus === 'success'
                      ? 'border-green-500 bg-green-50'
                      : verificationStatus === 'failed'
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300 bg-gray-50'
                  }`}>
                    <Fingerprint className={`h-12 w-12 ${
                      verificationStatus === 'capturing' 
                        ? 'text-blue-500' 
                        : verificationStatus === 'success'
                        ? 'text-green-500'
                        : verificationStatus === 'failed'
                        ? 'text-red-500'
                        : 'text-gray-400'
                    }`} />
                  </div>
                  
                  <div className="mt-4">
                    {verificationStatus === 'idle' && (
                      <p className="text-gray-600">Ready to capture fingerprint</p>
                    )}
                    {verificationStatus === 'capturing' && (
                      <p className="text-blue-600 font-medium">Capturing fingerprint...</p>
                    )}
                    {verificationStatus === 'success' && (
                      <p className="text-green-600 font-medium">Fingerprint captured successfully!</p>
                    )}
                    {verificationStatus === 'failed' && (
                      <p className="text-red-600 font-medium">Capture failed. Please try again.</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 justify-center">
                  {verificationStatus === 'idle' && (
                    <Button onClick={handleFingerprintCapture}>
                      Capture Fingerprint
                    </Button>
                  )}
                  {verificationStatus === 'capturing' && (
                    <Button disabled>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Capturing...
                    </Button>
                  )}
                  {verificationStatus === 'failed' && (
                    <Button onClick={handleFingerprintCapture} variant="outline">
                      Try Again
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Payment Authorization */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Step 2: Authorize Payment
                </CardTitle>
                <CardDescription>
                  Confirm payment authorization with your verified fingerprint
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Fingerprint verified successfully. You can now authorize the payment.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={resetFlow}>
                    Back
                  </Button>
                  <Button 
                    onClick={handleSecureBooking}
                    disabled={secureBookingMutation.isPending || verificationStatus === 'verifying'}
                    className="flex-1"
                  >
                    {secureBookingMutation.isPending || verificationStatus === 'verifying' ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Authorizing Payment...
                      </>
                    ) : (
                      <>
                        Authorize Payment
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {secureBookingMutation.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {secureBookingMutation.error.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Cancel Button */}
          <div className="flex justify-end">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SecureBookingModal;
