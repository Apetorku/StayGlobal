import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@clerk/clerk-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { CreditCard, Smartphone, Loader2, CheckCircle, AlertCircle, DollarSign } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface BookingPaymentProps {
  bookingId: string;
  amount: number;
  currency?: string;
  apartmentTitle: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  onPaymentSuccess?: () => void;
  onPaymentError?: (error: string) => void;
}

const BookingPayment = ({
  bookingId,
  amount,
  currency = 'GHS',
  apartmentTitle,
  checkIn,
  checkOut,
  guests,
  onPaymentSuccess,
  onPaymentError
}: BookingPaymentProps) => {
  const { getToken } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<'paystack' | 'momo'>('paystack');

  // Initialize payment mutation
  const initializePaymentMutation = useMutation({
    mutationFn: async (paymentMethod: 'paystack' | 'momo') => {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/payments/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          bookingId,
          paymentMethod
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to initialize payment');
      }

      return response.json();
    },
    onSuccess: (data) => {
      if (selectedMethod === 'paystack' && data.payment.authorization_url) {
        // Redirect to Paystack payment page
        window.location.href = data.payment.authorization_url;
      } else if (selectedMethod === 'momo') {
        toast.success('Mobile Money payment initialized. Please follow the instructions.');
        onPaymentSuccess?.();
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
      onPaymentError?.(error.message);
    }
  });

  const handlePayment = () => {
    initializePaymentMutation.mutate(selectedMethod);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  const platformFee = Math.round((amount * 5) / 100); // 5% platform fee
  const totalAmount = amount;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Complete Your Payment
        </CardTitle>
        <CardDescription>
          Choose your preferred payment method to confirm your booking
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Booking Summary */}
        <div className="p-4 bg-gray-50 rounded-lg space-y-3">
          <h3 className="font-semibold text-lg">{apartmentTitle}</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Check-in:</span>
              <p className="font-medium">{new Date(checkIn).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Check-out:</span>
              <p className="font-medium">{new Date(checkOut).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Guests:</span>
              <p className="font-medium">{guests} {guests === 1 ? 'guest' : 'guests'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Booking ID:</span>
              <p className="font-mono text-xs">{bookingId.slice(-8)}</p>
            </div>
          </div>
        </div>

        {/* Payment Breakdown */}
        <div className="space-y-3">
          <h4 className="font-semibold">Payment Breakdown</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Accommodation fee</span>
              <span>{formatCurrency(amount - platformFee)}</span>
            </div>
            <div className="flex justify-between">
              <span>Platform fee (5%)</span>
              <span>{formatCurrency(platformFee)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="space-y-4">
          <h4 className="font-semibold">Select Payment Method</h4>
          
          <Tabs value={selectedMethod} onValueChange={(value) => setSelectedMethod(value as 'paystack' | 'momo')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="paystack" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Bank Card
              </TabsTrigger>
              <TabsTrigger value="momo" className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Mobile Money
              </TabsTrigger>
            </TabsList>

            <TabsContent value="paystack" className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <CreditCard className="h-6 w-6 text-blue-500" />
                  <div>
                    <h5 className="font-medium">Bank Card Payment</h5>
                    <p className="text-sm text-muted-foreground">
                      Pay securely with your debit or credit card via Paystack
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-700">Secure & Encrypted</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="momo" className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <Smartphone className="h-6 w-6 text-green-500" />
                  <div>
                    <h5 className="font-medium">Mobile Money</h5>
                    <p className="text-sm text-muted-foreground">
                      Pay with MTN, Vodafone, or AirtelTigo Mobile Money
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">MTN Mobile Money</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Vodafone Cash</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">AirtelTigo Money</span>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Payment Button */}
        <div className="space-y-4">
          <Button
            onClick={handlePayment}
            disabled={initializePaymentMutation.isPending}
            className="w-full h-12 text-lg"
            size="lg"
          >
            {initializePaymentMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Pay {formatCurrency(totalAmount)}
                {selectedMethod === 'paystack' ? ' with Card' : ' with Mobile Money'}
              </>
            )}
          </Button>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              By proceeding, you agree to our terms and conditions. 
              Your payment will be sent directly to the property owner.
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <p className="text-sm text-blue-800">
              <strong>Secure Payment:</strong> Your payment goes directly to the property owner's account. 
              We use bank-level security to protect your transaction.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookingPayment;
