import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, SignInButton } from "@clerk/clerk-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { Loader2, CreditCard, Shield, DollarSign, ArrowLeft } from "lucide-react";
import RenterPaymentMethodSetup from "./RenterPaymentMethodSetup";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://web-production-8ffb7.up.railway.app/api';
const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_your_public_key';

interface Apartment {
  id: string | number; // Support both string and number IDs
  _id?: string; // Optional MongoDB ID
  title: string;
  location: string;
  price: number;
  availableRooms: number;
  totalRooms: number;
  image: string;
  rating: number;
  amenities: string[];
}

interface BookingModalProps {
  apartment: Apartment;
  isOpen: boolean;
  onClose: () => void;
}

interface PaymentMethod {
  type: 'card' | 'momo';
  details?: {
    momoNumber?: string;
    momoProvider?: 'mtn' | 'vodafone' | 'airteltigo';
    useCard?: boolean;
  };
}

const OnlinePaymentBookingModal = ({ apartment, isOpen, onClose }: BookingModalProps) => {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [currentStep, setCurrentStep] = useState<'booking' | 'payment'>('booking');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);

  const { toast } = useToast();
  const { isSignedIn, getToken } = useAuth();

  const calculateTotal = () => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
    return nights > 0 ? nights * apartment.price : 0;
  };

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create booking');
      }

      return response.json();
    }
  });

  // Initialize payment mutation
  const initializePaymentMutation = useMutation({
    mutationFn: async ({ bookingId, paymentMethod }: { bookingId: string, paymentMethod: 'paystack' | 'momo' }) => {
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
    }
  });

  const handlePaymentRedirect = (authorizationUrl: string) => {
    // Redirect to Paystack's hosted payment page
    window.location.href = authorizationUrl;
  };

  const handleBookingDetailsSubmit = () => {
    if (!isSignedIn) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to make a booking",
        variant: "destructive",
      });
      return;
    }

    if (!checkIn || !checkOut) {
      toast({
        title: "Missing Information",
        description: "Please select check-in and check-out dates",
        variant: "destructive",
      });
      return;
    }

    // Move to payment method selection
    setCurrentStep('payment');
  };

  const handlePaymentMethodSelected = async (paymentMethod: PaymentMethod) => {
    setSelectedPaymentMethod(paymentMethod);
    setIsProcessingPayment(true);

    // Debug authentication
    console.log('User signed in:', isSignedIn);
    const token = await getToken();
    console.log('Auth token:', token ? 'Present' : 'Missing');

    try {
      // Step 1: Create booking
      const bookingData = {
        apartmentId: apartment._id || apartment.id,
        checkIn,
        checkOut,
        guests,
        paymentMethod: paymentMethod.type === 'momo' ? 'momo' : 'paystack',
        paymentDetails: paymentMethod.details
      };

      console.log('Creating booking with data:', bookingData);
      console.log('Payment will be processed through:',
        paymentMethod.type === 'momo'
          ? `${paymentMethod.details?.momoProvider?.toUpperCase()} - ${paymentMethod.details?.momoNumber}`
          : 'Bank Card'
      );

      const bookingResponse = await createBookingMutation.mutateAsync(bookingData);

      // Step 2: Initialize payment
      const paymentMethodType = paymentMethod.type === 'momo' ? 'momo' : 'paystack';
      const paymentResponse = await initializePaymentMutation.mutateAsync({
        bookingId: bookingResponse.booking._id,
        paymentMethod: paymentMethodType
      });

      // Step 3: Handle payment based on method
      if (paymentMethod.type === 'momo') {
        // For mobile money, show user the phone prompt message
        toast({
          title: "Mobile Money Payment Initiated!",
          description: paymentResponse.payment.display_text || `Check your phone (${paymentMethod.details?.momoNumber}) for a payment prompt and enter your ${paymentMethod.details?.momoProvider?.toUpperCase()} Mobile Money PIN.`,
          duration: 10000, // Show for 10 seconds
        });

        // Start polling for payment status
        const pollPaymentStatus = async () => {
          try {
            const token = await getToken();
            const statusResponse = await fetch(`${API_BASE_URL}/payments/verify/${paymentResponse.payment.reference}`, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            });

            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              if (statusData.data.status === 'success') {
                toast({
                  title: "Payment Successful!",
                  description: "Your mobile money payment has been confirmed and your booking is complete.",
                });
                onClose();
                return true;
              } else if (statusData.data.status === 'failed') {
                toast({
                  title: "Payment Failed",
                  description: "Your mobile money payment was not successful. Please try again.",
                  variant: "destructive",
                });
                return true;
              }
            }
            return false;
          } catch (error) {
            console.error('Payment status check error:', error);
            return false;
          }
        };

        // Poll every 5 seconds for up to 5 minutes
        let attempts = 0;
        const maxAttempts = 60; // 5 minutes
        const pollInterval = setInterval(async () => {
          attempts++;
          const completed = await pollPaymentStatus();

          if (completed || attempts >= maxAttempts) {
            clearInterval(pollInterval);
            if (attempts >= maxAttempts) {
              toast({
                title: "Payment Timeout",
                description: "Payment verification timed out. Please check your booking status or contact support.",
                variant: "destructive",
              });
            }
          }
        }, 5000);

      } else {
        // For card/bank payments, redirect to Paystack's hosted payment page
        if (paymentResponse.payment.authorization_url) {
          toast({
            title: "Redirecting to Payment...",
            description: "You will be redirected to complete your payment securely.",
            duration: 3000,
          });

          // Small delay to show the toast, then redirect
          setTimeout(() => {
            handlePaymentRedirect(paymentResponse.payment.authorization_url);
          }, 1500);
        } else {
          throw new Error('Payment authorization URL not received');
        }
      }



    } catch (error: any) {
      console.error('Booking/Payment error:', error);
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const total = calculateTotal();

  const handleBackToBooking = () => {
    setCurrentStep('booking');
    setSelectedPaymentMethod(null);
  };

  const handleModalClose = () => {
    setCurrentStep('booking');
    setSelectedPaymentMethod(null);
    setIsProcessingPayment(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {currentStep === 'payment' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToBooking}
                className="mr-2 p-1"
                disabled={isProcessingPayment}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <CreditCard className="h-5 w-5" />
            {currentStep === 'booking' ? `Book ${apartment.title}` : 'Select Payment Method'}
          </DialogTitle>
          <DialogDescription>
            {currentStep === 'booking'
              ? `Complete your booking for ${apartment.location}`
              : 'Choose how you want to pay for your booking'
            }
          </DialogDescription>
        </DialogHeader>

        {!isSignedIn ? (
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold mb-4">Sign in to Book</h3>
            <p className="text-gray-600 mb-6">
              You need to be signed in to make a booking.
            </p>
            <SignInButton mode="modal" afterSignInUrl="/search">
              <Button className="w-full">
                Sign In to Continue
              </Button>
            </SignInButton>
          </div>
        ) : currentStep === 'payment' ? (
          <RenterPaymentMethodSetup
            amount={total}
            currency="GHS"
            onPaymentMethodSelected={handlePaymentMethodSelected}
            onCancel={handleBackToBooking}
          />
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="checkin">Check-in Date</Label>
                  <Input
                    id="checkin"
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="checkout">Check-out Date</Label>
                  <Input
                    id="checkout"
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    min={checkIn || new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="guests">Number of Guests</Label>
                <Input
                  id="guests"
                  type="number"
                  min="1"
                  max="4"
                  value={guests}
                  onChange={(e) => setGuests(parseInt(e.target.value))}
                />
              </div>
            </div>

            {total > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Booking Summary
                </h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>
                      ${apartment.price} × {Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 3600 * 24))} nights
                    </span>
                    <span>${total}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>${total}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm font-medium">Secure Payment</span>
                  </div>
                  <p className="text-xs text-blue-700 mt-1">
                    Payment goes directly to the property owner via Paystack
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleModalClose} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleBookingDetailsSubmit}
                disabled={total === 0 || !checkIn || !checkOut}
                className="flex-1"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Continue to Payment - ${total}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OnlinePaymentBookingModal;
