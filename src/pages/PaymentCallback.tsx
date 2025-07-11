import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/clerk-react";
import { CheckCircle, XCircle, Loader2, Home, Receipt } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [paymentData, setPaymentData] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const reference = searchParams.get('reference');
  const trxref = searchParams.get('trxref');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!reference && !trxref) {
        setStatus('failed');
        setError('No payment reference found');
        return;
      }

      try {
        const token = await getToken();
        const paymentRef = reference || trxref;
        
        const response = await fetch(`${API_BASE_URL}/payments/verify/${paymentRef}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (response.ok && data.payment?.status === 'success') {
          setStatus('success');
          setPaymentData(data);
        } else {
          setStatus('failed');
          setError(data.error || data.reason || 'Payment verification failed');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setStatus('failed');
        setError('Failed to verify payment. Please contact support.');
      }
    };

    verifyPayment();
  }, [reference, trxref, getToken]);

  const handleGoHome = () => {
    navigate('/search');
  };

  const handleViewBookings = () => {
    navigate('/bookings'); // You'll need to create this route
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Verifying Payment</h2>
            <p className="text-muted-foreground text-center">
              Please wait while we confirm your payment...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">Payment Successful!</CardTitle>
            <CardDescription>
              Your booking has been confirmed and payment processed successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Payment Details */}
            {paymentData && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-green-800">Payment Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-green-700">Amount Paid:</span>
                    <p className="font-medium">GH₵{paymentData.payment?.amount || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-green-700">Payment Method:</span>
                    <p className="font-medium capitalize">{paymentData.payment?.paymentMethod || 'Card'}</p>
                  </div>
                  <div>
                    <span className="text-green-700">Transaction ID:</span>
                    <p className="font-mono text-xs">{paymentData.payment?.paystackTransactionId || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-green-700">Date:</span>
                    <p className="font-medium">
                      {paymentData.payment?.completedAt 
                        ? new Date(paymentData.payment.completedAt).toLocaleDateString()
                        : new Date().toLocaleDateString()
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Booking Information */}
            {paymentData?.payment?.metadata && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-blue-800">Booking Information</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-blue-700">Property:</span>
                    <p className="font-medium">{paymentData.payment.metadata.apartmentTitle}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-blue-700">Check-in:</span>
                      <p className="font-medium">
                        {new Date(paymentData.payment.metadata.checkIn).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-blue-700">Check-out:</span>
                      <p className="font-medium">
                        {new Date(paymentData.payment.metadata.checkOut).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div>
                    <span className="text-blue-700">Guests:</span>
                    <p className="font-medium">{paymentData.payment.metadata.guests} guests</p>
                  </div>
                </div>
              </div>
            )}

            {/* Next Steps */}
            <div className="bg-gray-50 border rounded-lg p-4">
              <h3 className="font-semibold mb-3">What's Next?</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  You'll receive a confirmation email shortly
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  The property owner will contact you with check-in details
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Your payment has been sent directly to the property owner
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button onClick={handleGoHome} className="flex-1" variant="outline">
                <Home className="mr-2 h-4 w-4" />
                Back to Search
              </Button>
              <Button onClick={handleViewBookings} className="flex-1">
                <Receipt className="mr-2 h-4 w-4" />
                View My Bookings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Failed status
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-red-600">Payment Failed</CardTitle>
          <CardDescription>
            We couldn't process your payment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-800 mb-2">Error Details</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>

          <div className="bg-gray-50 border rounded-lg p-4">
            <h3 className="font-semibold mb-3">What can you do?</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• Check your internet connection and try again</li>
              <li>• Ensure your card has sufficient funds</li>
              <li>• Contact your bank if the issue persists</li>
              <li>• Try a different payment method</li>
            </ul>
          </div>

          <div className="flex gap-4">
            <Button onClick={handleGoHome} className="flex-1" variant="outline">
              <Home className="mr-2 h-4 w-4" />
              Back to Search
            </Button>
            <Button onClick={() => window.history.back()} className="flex-1">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCallback;
