
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, CheckCircle, XCircle, Calendar } from "lucide-react";

const BookingTracker = () => {
  const [filterStatus, setFilterStatus] = useState("all");

  // Mock booking data
  const mockBookings = [
    {
      id: 1,
      ticketCode: "TKT-2024-001",
      guestName: "John Doe",
      apartment: "Cozy Downtown Apartment",
      checkInDate: "2024-01-15",
      checkOutDate: "2024-01-20",
      status: "pending",
      totalAmount: 600,
      bookingDate: "2024-01-10"
    },
    {
      id: 2,
      ticketCode: "TKT-2024-002",
      guestName: "Jane Smith", 
      apartment: "Modern Studio",
      checkInDate: "2024-01-16",
      checkOutDate: "2024-01-18",
      status: "checked-in",
      totalAmount: 300,
      bookingDate: "2024-01-12",
      checkInTime: "2024-01-16 14:30"
    },
    {
      id: 3,
      ticketCode: "TKT-2024-003",
      guestName: "Bob Johnson",
      apartment: "Luxury Penthouse",
      checkInDate: "2024-01-10", 
      checkOutDate: "2024-01-14",
      status: "checked-out",
      totalAmount: 800,
      bookingDate: "2024-01-05",
      checkInTime: "2024-01-10 15:00",
      checkOutTime: "2024-01-14 11:00"
    },
    {
      id: 4,
      ticketCode: "TKT-2024-004",
      guestName: "Alice Brown",
      apartment: "Seaside Villa",
      checkInDate: "2024-01-22",
      checkOutDate: "2024-01-25", 
      status: "pending",
      totalAmount: 900,
      bookingDate: "2024-01-18"
    }
  ];

  const filteredBookings = mockBookings.filter(booking => 
    filterStatus === "all" || booking.status === filterStatus
  );

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

  const isUpcomingCheckout = (booking: any) => {
    if (booking.status !== "checked-in") return false;
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
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Bookings</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="checked-in">Checked In</SelectItem>
                  <SelectItem value="checked-out">Checked Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Upcoming Checkouts Alert */}
      {mockBookings.some(isUpcomingCheckout) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Checkouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mockBookings.filter(isUpcomingCheckout).map(booking => (
                <div key={booking.id} className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <div>
                    <p className="font-semibold">{booking.guestName}</p>
                    <p className="text-sm text-gray-600">{booking.apartment}</p>
                  </div>
                  <Badge variant="outline" className="text-orange-600">
                    Checkout: {booking.checkOutDate}
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
                <TableRow key={booking.id}>
                  <TableCell>
                    <div>
                      <p className="font-semibold">{booking.guestName}</p>
                      <p className="text-sm text-gray-600">Booked: {booking.bookingDate}</p>
                    </div>
                  </TableCell>
                  <TableCell>{booking.apartment}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>In: {booking.checkInDate}</p>
                      <p>Out: {booking.checkOutDate}</p>
                      {booking.checkInTime && (
                        <p className="text-green-600">Checked in: {booking.checkInTime}</p>
                      )}
                      {booking.checkOutTime && (
                        <p className="text-blue-600">Checked out: {booking.checkOutTime}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(booking.status)} className="flex items-center gap-2 w-fit">
                      {getStatusIcon(booking.status)}
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
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
        </CardContent>
      </Card>

      {filteredBookings.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No bookings found for the selected filter.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BookingTracker;
