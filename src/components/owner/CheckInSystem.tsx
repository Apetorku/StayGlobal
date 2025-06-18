
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock } from "lucide-react";

const CheckInSystem = () => {
  const { toast } = useToast();
  const [ticketCode, setTicketCode] = useState("");
  const [bookingDetails, setBookingDetails] = useState<any>(null);

  // Mock booking data
  const mockBookings = [
    {
      ticketCode: "TKT-2024-001",
      guestName: "John Doe",
      apartment: "Cozy Downtown Apartment",
      checkInDate: "2024-01-15",
      checkOutDate: "2024-01-20",
      status: "pending",
      totalAmount: 600
    },
    {
      ticketCode: "TKT-2024-002", 
      guestName: "Jane Smith",
      apartment: "Modern Studio",
      checkInDate: "2024-01-16",
      checkOutDate: "2024-01-18",
      status: "checked-in",
      checkInTime: "2024-01-16 14:30",
      totalAmount: 300
    }
  ];

  const handleSearchTicket = () => {
    if (!ticketCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a ticket code",
        variant: "destructive"
      });
      return;
    }

    const booking = mockBookings.find(b => b.ticketCode === ticketCode);
    if (booking) {
      setBookingDetails(booking);
    } else {
      toast({
        title: "Not Found",
        description: "No booking found with this ticket code",
        variant: "destructive"
      });
      setBookingDetails(null);
    }
  };

  const handleCheckIn = () => {
    if (bookingDetails) {
      const updatedBooking = {
        ...bookingDetails,
        status: "checked-in",
        checkInTime: new Date().toLocaleString()
      };
      setBookingDetails(updatedBooking);
      toast({
        title: "Success!",
        description: `${bookingDetails.guestName} has been checked in successfully`,
      });
    }
  };

  const handleCheckOut = () => {
    if (bookingDetails) {
      const updatedBooking = {
        ...bookingDetails,
        status: "checked-out",
        checkOutTime: new Date().toLocaleString()
      };
      setBookingDetails(updatedBooking);
      toast({
        title: "Success!",
        description: `${bookingDetails.guestName} has been checked out successfully`,
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "checked-in":
        return <CheckCircle className="h-4 w-4" />;
      case "checked-out":
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "default";
      case "checked-in":
        return "default";
      case "checked-out":
        return "secondary";
      default:
        return "default";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>Check-In System</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="ticketCode">Enter Ticket Code</Label>
              <Input
                id="ticketCode"
                value={ticketCode}
                onChange={(e) => setTicketCode(e.target.value)}
                placeholder="e.g., TKT-2024-001"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearchTicket}>
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking Details */}
      {bookingDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Booking Details
              <Badge variant={getStatusColor(bookingDetails.status)} className="flex items-center gap-2">
                {getStatusIcon(bookingDetails.status)}
                {bookingDetails.status.charAt(0).toUpperCase() + bookingDetails.status.slice(1)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Guest Name</Label>
                <p className="text-lg font-semibold">{bookingDetails.guestName}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Apartment</Label>
                <p className="text-lg font-semibold">{bookingDetails.apartment}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Check-in Date</Label>
                <p className="text-lg font-semibold">{bookingDetails.checkInDate}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Check-out Date</Label>
                <p className="text-lg font-semibold">{bookingDetails.checkOutDate}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Total Amount</Label>
                <p className="text-lg font-semibold">${bookingDetails.totalAmount}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Ticket Code</Label>
                <p className="text-lg font-semibold">{bookingDetails.ticketCode}</p>
              </div>
            </div>

            {bookingDetails.checkInTime && (
              <div>
                <Label className="text-sm font-medium text-gray-500">Check-in Time</Label>
                <p className="text-lg font-semibold">{bookingDetails.checkInTime}</p>
              </div>
            )}

            {bookingDetails.checkOutTime && (
              <div>
                <Label className="text-sm font-medium text-gray-500">Check-out Time</Label>
                <p className="text-lg font-semibold">{bookingDetails.checkOutTime}</p>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              {bookingDetails.status === "pending" && (
                <Button onClick={handleCheckIn} className="flex-1">
                  Check In Guest
                </Button>
              )}
              {bookingDetails.status === "checked-in" && (
                <Button onClick={handleCheckOut} variant="outline" className="flex-1">
                  Check Out Guest
                </Button>
              )}
              {bookingDetails.status === "checked-out" && (
                <p className="text-green-600 font-semibold">Guest has been checked out</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CheckInSystem;
