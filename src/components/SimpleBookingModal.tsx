import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "sonner";

interface SimpleBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  apartment: any;
}

export const SimpleBookingModal = ({ isOpen, onClose, apartment }: SimpleBookingModalProps) => {
  const { getToken, isSignedIn } = useAuth();
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const calculateTotal = () => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
    return nights > 0 ? nights * apartment.price : 0;
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('🔐 Authentication check:');
    console.log('- isSignedIn:', isSignedIn);

    if (!isSignedIn) {
      toast.error('Please sign in to make a booking');
      return;
    }

    if (!checkIn || !checkOut) {
      toast.error('Please select check-in and check-out dates');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔐 User signed in:', isSignedIn);
      const token = await getToken();
      console.log('🎫 Auth token:', token ? 'Present' : 'Missing');
      console.log('🎫 Token length:', token ? token.length : 0);

      if (!token) {
        toast.error('Authentication failed. Please sign in again.');
        return;
      }

      const bookingData = {
        apartmentId: apartment._id || apartment.id,
        checkIn,
        checkOut,
        guests,
        specialRequests: specialRequests || ''
      };

      console.log('📤 Sending booking data:', bookingData);

      const response = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      });

      const result = await response.json();
      console.log('📥 Response status:', response.status);
      console.log('📥 Response data:', result);

      if (!response.ok) {
        console.log('❌ Booking failed with details:', result);
        if (result.details && Array.isArray(result.details)) {
          console.log('❌ Validation errors:', result.details);
          result.details.forEach((detail, index) => {
            console.log(`❌ Error ${index + 1}:`, detail);
          });
        }
        throw new Error(result.error || result.details || 'Failed to create booking');
      }

      toast.success('Booking created successfully!');
      console.log('Booking created:', result);
      onClose();

    } catch (error: any) {
      console.error('Booking error:', error);
      toast.error(error.message || 'Failed to create booking');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
  );
};
