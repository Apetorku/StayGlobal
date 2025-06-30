
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { bookingService } from "@/services/bookingService";
import { Clock, CheckCircle, XCircle, Calendar, Loader2, RefreshCw } from "lucide-react";

const BookingTracker = () => {
  const [filterStatus, setFilterStatus] = useState("all");
  const { getToken, userId } = useAuth();

  // Fetch owner's bookings
  const { data: bookingData, isLoading, error, refetch } = useQuery({
    queryKey: ['owner-bookings', userId],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('Authentication required');
      return bookingService.getOwnerBookings(token);
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const bookings = bookingData?.bookings || [];
  const filteredBookings = bookings.filter(booking =>
    filterStatus === "all" || booking.bookingStatus === filterStatus
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Clock className="h-4 w-4" />;
      case "checked-in":
        return <CheckCircle className="h-4 w-4" />;
      case "completed":
        return <XCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "default";
      case "checked-in":
        return "default";
      case "completed":
        return "secondary";
      case "cancelled":
        return "destructive";
      default:
        return "default";
    }
  };

  const isUpcomingCheckout = (booking: { checkInTime?: string; checkOutDate: string }) => {
    if (!booking.checkInTime) return false;
    const checkOutDate = new Date(booking.checkOutDate);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return checkOutDate <= tomorrow;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Booking Tracker
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Bookings</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="checked-in">Checked In</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Upcoming Checkouts Alert */}
      {!isLoading && bookings.some(isUpcomingCheckout) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Checkouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {bookings.filter(isUpcomingCheckout).map(booking => (
                <div key={booking._id} className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <div>
                    <p className="font-semibold">{booking.guestName}</p>
                    <p className="text-sm text-gray-600">{booking.apartmentTitle}</p>
                  </div>
                  <Badge variant="outline" className="text-orange-600">
                    Checkout: {new Date(booking.checkOutDate).toLocaleDateString()}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bookings Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading bookings...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center p-8 text-red-600">
              <p>Error loading bookings. Please try again.</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="flex items-center justify-center p-8 text-gray-500">
              <p>No bookings found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guest</TableHead>
                  <TableHead>Apartment</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Ticket Code</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking._id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold">{booking.guestName}</p>
                        <p className="text-sm text-gray-600">
                          Booked: {new Date(booking.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{booking.apartmentTitle}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>In: {new Date(booking.checkInDate).toLocaleDateString()}</p>
                        <p>Out: {new Date(booking.checkOutDate).toLocaleDateString()}</p>
                        {booking.checkInTime && (
                          <p className="text-green-600">
                            Checked in: {new Date(booking.checkInTime).toLocaleString()}
                          </p>
                        )}
                        {booking.checkOutTime && (
                          <p className="text-blue-600">
                            Checked out: {new Date(booking.checkOutTime).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(booking.bookingStatus)} className="flex items-center gap-2 w-fit">
                        {getStatusIcon(booking.bookingStatus)}
                        {booking.bookingStatus.charAt(0).toUpperCase() + booking.bookingStatus.slice(1)}
                      </Badge>
                      {isUpcomingCheckout(booking) && (
                        <Badge variant="outline" className="mt-1 text-orange-600">
                          Checkout Soon
                      </Badge>
                    )}
                  </TableCell>
                    <TableCell className="font-semibold">${booking.totalAmount}</TableCell>
                    <TableCell className="font-mono text-sm">{booking.ticketCode}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingTracker;
