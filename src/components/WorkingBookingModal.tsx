import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, SignInButton } from "@clerk/clerk-react";
import { useToast } from "@/hooks/use-toast";

interface Apartment {
  _id?: string;
  id?: number;
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

const BookingModal = ({ apartment, isOpen, onClose }: BookingModalProps) => {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  
  const { toast } = useToast();
  const { isSignedIn } = useAuth();

  const calculateTotal = () => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
    return nights > 0 ? nights * apartment.price : 0;
  };

  const handleBooking = () => {
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

    toast({
      title: "Booking Confirmed!",
      description: "Your booking has been confirmed.",
    });
    onClose();
  };

  const total = calculateTotal();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book {apartment.title}</DialogTitle>
          <DialogDescription>
            Complete your booking for {apartment.location}
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
                <h4 className="font-semibold mb-2">Booking Summary</h4>
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
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleBooking} 
                disabled={total === 0 || !checkIn || !checkOut}
                className="flex-1"
              >
                Book Now - ${total}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;
