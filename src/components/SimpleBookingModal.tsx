import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "sonner";
import { usePaystackInlinePayment } from "@/hooks/usePaystackInlinePayment";

interface SimpleBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  apartment: any;
}

export const SimpleBookingModal = ({ isOpen, onClose, apartment }: SimpleBookingModalProps) => {
  const { getToken, isSignedIn } = useAuth();
  const { initializePayment } = usePaystackInlinePayment();
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);

  const calculateTotal = () => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
    return nights > 0 ? nights * apartment.price : 0;
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSignedIn) {
      toast.error('Please sign in to make a booking');
      return;
    }

    if (!checkIn || !checkOut) {
      toast.error('Please select check-in and check-out dates');
      return;
    }

    // Payment account validation will be done in the backend

    const totalAmount = calculateTotal();
    if (totalAmount <= 0) {
      toast.error('Invalid booking dates');
      return;
    }

    setIsLoading(true);

    try {
      const token = await getToken();
      if (!token) {
        toast.error('Authentication failed. Please sign in again.');
        setIsLoading(false);
        return;
      }

      console.log('💳 Starting payment-first booking flow...');

      // Get user data for payment
      const userResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!userResponse.ok) {
        throw new Error('Failed to get user information');
      }

      const userData = await userResponse.json();

      // Get apartment payment account - fetch fresh data from backend if needed
      let paymentAccount = apartment.ownerPaymentAccount;

      if (!paymentAccount || (!paymentAccount.subaccountCode && !paymentAccount.momoNumber)) {
        console.log('⚠️ No payment account in apartment data, fetching fresh apartment data...');

        // Fetch fresh apartment data from backend
        const apartmentResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/apartments/${apartment._id || apartment.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (apartmentResponse.ok) {
          const freshApartmentData = await apartmentResponse.json();
          paymentAccount = freshApartmentData.ownerPaymentAccount;
          console.log('🔄 Fresh apartment data:', paymentAccount);
        }

        if (!paymentAccount || (!paymentAccount.subaccountCode && !paymentAccount.momoNumber)) {
          throw new Error('Payment account not configured for this property. Please try another property.');
        }
      }

      console.log('💳 Payment account type:', paymentAccount.provider);

      // Determine payment flow based on owner's payment account type
      let subaccountCode = null;
      let paymentNote = '';

      if (paymentAccount.provider === 'paystack' && paymentAccount.subaccountCode) {
        // Paystack account with subaccount - use split payment
        subaccountCode = paymentAccount.subaccountCode;
        paymentNote = 'Split payment: 90% to owner, 10% to platform';
        console.log('💳 Using Paystack split payment');
      } else {
        // Mobile Money or missing subaccount - full payment to platform
        subaccountCode = null; // This will make payment go fully to platform
        paymentNote = 'Full payment to platform (owner will be paid separately)';
        console.log('💳 Using platform payment (owner has Mobile Money)');
      }

      // Process payment first
      console.log('💳 Processing payment first...');

      // Hide the booking modal before showing payment form to avoid conflicts
      setIsPaymentProcessing(true);

      const paymentSuccess = await initializePayment({
        email: userData.email,
        amount: totalAmount,
        subaccountCode: subaccountCode, // null for MoMo, actual code for Paystack
        apartmentId: apartment._id || apartment.id,
        bookingId: null, // No booking ID yet
        metadata: {
          apartmentTitle: apartment.title,
          checkIn,
          checkOut,
          guests,
          paymentType: paymentAccount.provider,
          paymentNote: paymentNote
        }
      });

      if (paymentSuccess) {
        console.log('✅ Payment successful, now creating booking...');

        // Create booking after successful payment
        const bookingData = {
          apartmentId: apartment._id || apartment.id,
          guestId: userData.clerkId,
          guestName: userData.fullName || `${userData.firstName} ${userData.lastName}`,
          guestEmail: userData.email,
          guestPhone: userData.phone || '',
          checkIn,
          checkOut,
          guests,
          specialRequests: specialRequests || '',
          totalAmount,
          paymentReference: 'payment_ref_from_paystack', // TODO: Get actual reference
          paymentStatus: 'paid',
          paymentMethod: 'paystack'
        };

        const token = await getToken();
        const bookingResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/bookings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(bookingData)
        });

        if (bookingResponse.ok) {
          const bookingResult = await bookingResponse.json();
          console.log('✅ Booking created after payment:', bookingResult);
          toast.success('Payment and booking completed successfully!');
          onClose();
          // Reset form
          setCheckIn('');
          setCheckOut('');
          setGuests(1);
          setSpecialRequests('');
        } else {
          const bookingError = await bookingResponse.json();
          console.error('❌ Booking creation failed:', bookingError);
          toast.error('Payment successful but booking creation failed. Please contact support.');
        }
      } else {
        console.log('❌ Payment was cancelled or failed');
        toast.error('Payment was cancelled or failed. Booking was not created.');
        // Reset payment processing state so modal can be shown again
        setIsPaymentProcessing(false);
      }

    } catch (error: any) {
      console.error('Booking error:', error);
      toast.error(error.message || 'Failed to create booking');
      // Reset payment processing state on error
      setIsPaymentProcessing(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle modal close - reset payment processing state
  const handleClose = () => {
    if (!isPaymentProcessing) {
      setIsPaymentProcessing(false);
      onClose();
    }
  };

  // Reset states when modal is closed externally
  React.useEffect(() => {
    if (!isOpen) {
      setIsPaymentProcessing(false);
      setIsLoading(false);
    }
  }, [isOpen]);

  return (
    <>
    <Dialog open={isOpen && !isPaymentProcessing} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Book {apartment.title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="checkin">Check-in</Label>
              <Input
                id="checkin"
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div>
              <Label htmlFor="checkout">Check-out</Label>
              <Input
                id="checkout"
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                min={checkIn || new Date().toISOString().split('T')[0]}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="guests">Guests</Label>
            <Input
              id="guests"
              type="number"
              min="1"
              max="10"
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              required
            />
          </div>

          <div>
            <Label htmlFor="requests">Special Requests (Optional)</Label>
            <Input
              id="requests"
              type="text"
              placeholder="Any special requirements or requests..."
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
            />
          </div>

          {checkIn && checkOut && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span className="font-bold">GH₵{calculateTotal()}</span>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Creating Booking...' : 'Book Now'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    {/* Payment Processing Overlay */}
    {isPaymentProcessing && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-sm mx-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold mb-2">Processing Payment</h3>
          <p className="text-gray-600 text-sm">
            Please complete your payment in the Paystack window.
            <br />
            Do not close this page.
          </p>
        </div>
      </div>
    )}
  </>
  );
};
