
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@clerk/clerk-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingService } from "@/services/bookingService";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, Loader2, Search } from "lucide-react";

const CheckInSystem = () => {
  const { toast } = useToast();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [ticketCode, setTicketCode] = useState("");
  const [bookingDetails, setBookingDetails] = useState<{
    _id: string;
    ticketCode: string;
    guestName: string;
    apartmentId: { title: string };
    checkIn: string;
    checkOut: string;
    guests: number;
    bookingStatus: string;
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Search booking by ticket code mutation
  const searchBookingMutation = useMutation({
    mutationFn: async (ticketCode: string) => {
      const token = await getToken();
      if (!token) throw new Error('Authentication required');
      return bookingService.getBookingByTicketCode(ticketCode, token);
    },
    onSuccess: (booking) => {
      setBookingDetails(booking);
      toast({
        title: "Booking Found",
        description: `Found booking for ${booking.guestName}`,
      });
    },
    onError: (error: Error) => {
      setBookingDetails(null);
      toast({
        title: "Not Found",
        description: error.message || "No booking found with this ticket code",
        variant: "destructive"
      });
    },
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const token = await getToken();
      if (!token) throw new Error('Authentication required');
      return bookingService.updateBookingStatus(bookingId, 'checked-in', token);
    },
    onSuccess: (updatedBooking) => {
      setBookingDetails(updatedBooking);
      queryClient.invalidateQueries({ queryKey: ['owner-bookings'] });
      toast({
        title: "Success!",
        description: `${updatedBooking.guestName || 'Guest'} has been checked in successfully`,
      });
    },
    onError: (error: any) => {
      // Handle specific "already checked in" error
      if (error.response?.data?.error === 'Guest already checked in') {
        toast({
          title: "Already Checked In",
          description: error.response.data.message || "Guest is already checked in",
          variant: "default"
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to check in guest",
          variant: "destructive"
        });
      }
    },
  });

  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const token = await getToken();
      if (!token) throw new Error('Authentication required');
      return bookingService.updateBookingStatus(bookingId, 'checked-out', token);
    },
    onSuccess: (updatedBooking) => {
      setBookingDetails(updatedBooking);
      queryClient.invalidateQueries({ queryKey: ['owner-bookings'] });
      toast({
        title: "Success!",
        description: `${updatedBooking.guestName || 'Guest'} has been checked out successfully`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to check out guest",
        variant: "destructive"
      });
    },
  });

  const handleSearchTicket = () => {
    if (!ticketCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a ticket code",
        variant: "destructive"
      });
      return;
    }

    searchBookingMutation.mutate(ticketCode);
  };

  const handleCheckIn = () => {
    if (bookingDetails) {
      checkInMutation.mutate(bookingDetails._id);
    }
  };

  const handleStatusUpdate = async (status: string) => {
    if (!bookingDetails) return;

    try {
      const token = await getToken();
      if (!token) throw new Error('Authentication required');

      const updatedBooking = await bookingService.updateBookingStatus(bookingDetails._id, status, token);
      setBookingDetails(updatedBooking);
      queryClient.invalidateQueries({ queryKey: ['owner-bookings'] });

      const statusMessages = {
        'completed': 'checked out successfully',
        'cancelled': 'booking cancelled'
      };

      toast({
        title: "Success!",
        description: `${updatedBooking.guestName || 'Guest'} has been ${statusMessages[status] || 'updated'}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update booking status",
        variant: "destructive"
      });
    }
  };

  const handleCheckOut = () => {
    if (bookingDetails) {
      checkOutMutation.mutate(bookingDetails._id);
    }
  };

  const getStatusIcon = (status: string | undefined) => {
    if (!status) return <Clock className="h-4 w-4" />;

    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "checked-in":
        return <CheckCircle className="h-4 w-4" />;
      case "checked-out":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string | undefined) => {
    if (!status) return "default";

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
              <Button
                onClick={handleSearchTicket}
                disabled={searchBookingMutation.isPending}
              >
                {searchBookingMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </>
                )}
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
                {bookingDetails.status ?
                  bookingDetails.status.charAt(0).toUpperCase() + bookingDetails.status.slice(1) :
                  'Unknown'
                }
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
              <div>
                <Label className="text-sm font-medium text-gray-500">Room Assignment</Label>
                {bookingDetails.roomNumber ? (
                  <p className="text-lg font-semibold text-blue-600">Room {bookingDetails.roomNumber}</p>
                ) : (
                  <p className="text-lg text-gray-500">
                    {bookingDetails.bookingStatus === 'confirmed' ? 'Room will be assigned at check-in' : 'Not assigned'}
                  </p>
                )}
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
              {bookingDetails.bookingStatus === "confirmed" && !bookingDetails.checkInTime && (
                <Button
                  onClick={handleCheckIn}
                  className="flex-1"
                  disabled={checkInMutation.isPending}
                >
                  {checkInMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Checking In...
                    </>
                  ) : (
                    'Check In Guest'
                  )}
                </Button>
              )}

              {bookingDetails.bookingStatus === "checked-in" && (
                <div className="flex gap-4 flex-1">
                  <div className="flex-1 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Already Checked In</span>
                    </div>
                    <p className="text-sm text-green-600 mt-1">
                      Guest is currently in Room {bookingDetails.roomNumber}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleStatusUpdate('completed')}
                    variant="outline"
                    className="px-6"
                    disabled={checkInMutation.isPending}
                  >
                    Check Out
                  </Button>
                </div>
              )}
              {bookingDetails.checkInTime && !bookingDetails.checkOutTime && (
                <Button
                  onClick={handleCheckOut}
                  variant="outline"
                  className="flex-1"
                  disabled={checkOutMutation.isPending}
                >
                  {checkOutMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Checking Out...
                    </>
                  ) : (
                    'Check Out Guest'
                  )}
                </Button>
              )}
              {bookingDetails.checkOutTime && (
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
