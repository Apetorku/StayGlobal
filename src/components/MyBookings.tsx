
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { bookingService, type Booking } from "@/services/bookingService";
import ChatModal from "./ChatModal";
import { Download, MessageSquare, Calendar, MapPin, Ticket, Clock, Loader2, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MyBookings = () => {
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch user's bookings
  const { data: bookingData, isLoading, error, refetch } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No authentication token');
      return bookingService.getMyBookings(token);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Cancel booking mutation
  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const token = await getToken();
      if (!token) throw new Error('No authentication token');
      return bookingService.cancelBooking(bookingId, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
    },
  });

  // Self-checkout mutation
  const selfCheckoutMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const token = await getToken();
      if (!token) throw new Error('No authentication token');
      return bookingService.selfCheckout(bookingId, token);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      toast({
        title: "✅ Checked Out Successfully",
        description: `You have successfully checked out from ${data.booking.apartmentTitle}${data.booking.roomNumber ? ` - Room ${data.booking.roomNumber}` : ''}. ${data.booking.earlyCheckout ? 'Thank you for the early checkout!' : ''}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Checkout Failed",
        description: error.message || "Failed to check out. Please try again.",
        variant: "destructive"
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "no_show":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Filter bookings based on status and dates
  const getFilteredBookings = (filterType: string) => {
    if (!bookingData?.bookings) return [];

    const now = new Date();

    switch (filterType) {
      case "upcoming":
        return bookingData.bookings.filter(booking => {
          const checkInDate = new Date(booking.checkIn);
          return checkInDate > now && booking.bookingStatus === 'confirmed';
        });
      case "completed":
        return bookingData.bookings.filter(booking =>
          booking.bookingStatus === 'completed' ||
          (booking.bookingStatus === 'confirmed' && new Date(booking.checkOut) < now)
        );
      default:
        return bookingData.bookings;
    }
  };

  const downloadTicket = (booking: Booking) => {
    // Generate a proper ticket with all booking details
    const ticketContent = `
      BOOKING TICKET
      ==============

      Apartment: ${booking.apartmentId?.title || 'Apartment'}
      Location: ${booking.apartmentId?.location ?
        `${booking.apartmentId.location.town}, ${booking.apartmentId.location.region}, ${booking.apartmentId.location.country}` :
        'Location not available'}
      Check-in: ${new Date(booking.checkIn).toLocaleDateString()}
      Check-out: ${new Date(booking.checkOut).toLocaleDateString()}
      Guests: ${booking.guests}
      Total: $${booking.totalAmount}
      Payment Status: ${booking.paymentStatus}

      TICKET CODE: ${booking.ticketCode}

      Please present this code to your landlord upon arrival.

      Guest Information:
      Name: ${booking.guestName}
      Email: ${booking.guestEmail}
      Phone: ${booking.guestPhone}

      ${booking.specialRequests ? `Special Requests: ${booking.specialRequests}` : ''}
    `;

    const blob = new Blob([ticketContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-${booking.ticketCode}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const openChat = (bookingId: string) => {
    setSelectedBooking(bookingId);
    setShowChat(true);
  };

  // Render booking card component
  const renderBookingCard = (booking: Booking) => (
    <Card key={booking._id} className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Image */}
          <div className="md:w-1/3">
            <img
              src={booking.apartmentId?.images?.[0] || '/placeholder.svg'}
              alt={booking.apartmentId?.title || 'Apartment'}
              className="w-full h-48 md:h-full object-cover"
            />
          </div>

          {/* Content */}
          <div className="md:w-2/3 p-6">
            <div className="flex flex-col h-full">
              <div className="flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {booking.apartmentId?.title || 'Apartment'}
                    </h3>
                    <div className="flex items-center text-gray-600 mt-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      {booking.apartmentId?.location ?
                        `${booking.apartmentId.location.town}, ${booking.apartmentId.location.region}` :
                        'Location not available'
                      }
                    </div>
                  </div>
                  <Badge className={getStatusColor(booking.bookingStatus)}>
                    {booking.bookingStatus}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Check-in: {new Date(booking.checkIn).toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Check-out: {new Date(booking.checkOut).toLocaleDateString()}
                  </div>
                  {booking.checkOutTime && (
                    <div className="flex items-center text-sm text-green-600">
                      <LogOut className="h-4 w-4 mr-2" />
                      Checked out: {new Date(booking.checkOutTime).toLocaleString()}
                      {new Date(booking.checkOutTime) < new Date(booking.checkOut) && (
                        <span className="ml-2 text-orange-600 font-medium">(Early checkout)</span>
                      )}
                    </div>
                  )}
                  <div>Guests: {booking.guests}</div>
                  <div className="font-semibold">Total: ${booking.totalAmount}</div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Ticket className="h-4 w-4 mr-2" />
                        Ticket Code
                      </div>
                      <div className="font-mono font-semibold text-lg">
                        {booking.ticketCode}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadTicket(booking)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => openChat(booking._id)}
                  className="flex-1"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chat with Landlord
                </Button>
                {booking.bookingStatus === 'confirmed' && (
                  <Button
                    variant="destructive"
                    onClick={() => cancelBookingMutation.mutate(booking._id)}
                    disabled={cancelBookingMutation.isPending}
                    className="flex-1"
                  >
                    {cancelBookingMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      'Cancel Booking'
                    )}
                  </Button>
                )}
                {booking.bookingStatus === 'checked-in' && !booking.checkOutTime && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to check out now? This action cannot be undone.')) {
                        selfCheckoutMutation.mutate(booking._id);
                      }
                    }}
                    disabled={selfCheckoutMutation.isPending}
                    className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-50"
                  >
                    {selfCheckoutMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <>
                        <LogOut className="h-4 w-4 mr-2" />
                        Check Out Now
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            My Bookings
          </CardTitle>
          <CardDescription>
            Manage your apartment bookings and view tickets
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Bookings</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <span className="ml-2 text-gray-600">Loading bookings...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">Failed to load bookings</p>
              <Button onClick={() => refetch()} variant="outline">
                Try Again
              </Button>
            </div>
          ) : (
            <>
              {getFilteredBookings("all").length > 0 ? (
                getFilteredBookings("all").map((booking) => renderBookingCard(booking))
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600">No bookings found.</p>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <span className="ml-2 text-gray-600">Loading bookings...</span>
            </div>
          ) : (
            <>
              {getFilteredBookings("upcoming").length > 0 ? (
                getFilteredBookings("upcoming").map((booking) => renderBookingCard(booking))
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600">No upcoming bookings found.</p>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <span className="ml-2 text-gray-600">Loading bookings...</span>
            </div>
          ) : (
            <>
              {getFilteredBookings("completed").length > 0 ? (
                getFilteredBookings("completed").map((booking) => renderBookingCard(booking))
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600">No completed bookings found.</p>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {selectedBooking && (
        <ChatModal
          bookingId={selectedBooking}
          isOpen={showChat}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
};

export default MyBookings;
