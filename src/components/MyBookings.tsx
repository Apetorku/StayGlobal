
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChatModal from "./ChatModal";
import { Download, MessageSquare, Calendar, MapPin, Ticket, Clock } from "lucide-react";

// Mock booking data
const mockBookings = [
  {
    id: 1,
    apartmentTitle: "Modern Downtown Apartment",
    location: "Manhattan, New York",
    checkIn: "2024-01-15",
    checkOut: "2024-01-18",
    guests: 2,
    total: 450,
    status: "confirmed",
    ticketCode: "RNT-K8M2X9-ABCD",
    landlordId: "landlord1",
    apartmentImage: "/placeholder.svg",
  },
  {
    id: 2,
    apartmentTitle: "Cozy Studio in SoHo",
    location: "Manhattan, New York",
    checkIn: "2024-02-20",
    checkOut: "2024-02-22",
    guests: 1,
    total: 240,
    status: "upcoming",
    ticketCode: "RNT-L9N3Y8-EFGH",
    landlordId: "landlord2",
    apartmentImage: "/placeholder.svg",
  },
];

const MyBookings = () => {
  const [selectedBooking, setSelectedBooking] = useState<number | null>(null);
  const [showChat, setShowChat] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "upcoming":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const downloadTicket = (booking: any) => {
    // In a real app, this would generate a PDF ticket
    const ticketContent = `
      BOOKING TICKET
      ==============
      
      Apartment: ${booking.apartmentTitle}
      Location: ${booking.location}
      Check-in: ${booking.checkIn}
      Check-out: ${booking.checkOut}
      Guests: ${booking.guests}
      Total: $${booking.total}
      
      TICKET CODE: ${booking.ticketCode}
      
      Please present this code to your landlord upon arrival.
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

  const openChat = (bookingId: number) => {
    setSelectedBooking(bookingId);
    setShowChat(true);
  };

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

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Bookings</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {mockBookings.map((booking) => (
            <Card key={booking.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  {/* Image */}
                  <div className="md:w-1/3">
                    <img
                      src={booking.apartmentImage}
                      alt={booking.apartmentTitle}
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
                              {booking.apartmentTitle}
                            </h3>
                            <div className="flex items-center text-gray-600 mt-1">
                              <MapPin className="h-4 w-4 mr-1" />
                              {booking.location}
                            </div>
                          </div>
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            Check-in: {booking.checkIn}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2" />
                            Check-out: {booking.checkOut}
                          </div>
                          <div>Guests: {booking.guests}</div>
                          <div className="font-semibold">Total: ${booking.total}</div>
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
                          onClick={() => openChat(booking.id)}
                          className="flex-1"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Chat with Landlord
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          {mockBookings
            .filter((booking) => booking.status === "upcoming")
            .map((booking) => (
              <div key={booking.id}>
                {/* Same card structure as above */}
              </div>
            ))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <p className="text-center text-gray-500 py-8">
            No completed bookings yet.
          </p>
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
