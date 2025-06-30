
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth, UserButton } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { apartmentService } from "@/services/apartmentService";
import { bookingService } from "@/services/bookingService";
import { Building, Plus, UserCheck, Calendar, DollarSign, MessageSquare, Loader2 } from "lucide-react";
import ListApartmentForm from "@/components/owner/ListApartmentForm";
import CheckInSystem from "@/components/owner/CheckInSystem";
import BookingTracker from "@/components/owner/BookingTracker";
import PaymentTracker from "@/components/owner/PaymentTracker";
import OwnerChat from "@/components/owner/OwnerChat";
import VerificationGate from "@/components/verification/VerificationGate";

const HouseOwner = () => {
  const [activeTab, setActiveTab] = useState("list");
  const { getToken, userId } = useAuth();

  // Fetch owner's apartments
  const { data: apartmentData, isLoading: apartmentsLoading } = useQuery({
    queryKey: ['owner-apartments', userId],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('Authentication required');
      return apartmentService.getOwnerApartments(token);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch owner's bookings
  const { data: bookingData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['owner-bookings', userId],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('Authentication required');
      return bookingService.getOwnerBookings(token);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  // Calculate real stats
  const stats = {
    totalProperties: apartmentData?.apartments?.length || 0,
    activeBookings: bookingData?.bookings?.filter(b => b.bookingStatus === 'confirmed').length || 0,
    monthlyEarnings: bookingData?.bookings?.reduce((total, booking) => {
      const bookingDate = new Date(booking.createdAt);
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      if (bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear) {
        return total + booking.totalAmount;
      }
      return total;
    }, 0) || 0,
    totalGuests: bookingData?.bookings?.reduce((total, booking) => total + booking.guests, 0) || 0
  };

  const isLoading = apartmentsLoading || bookingsLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Building className="h-8 w-8 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-900">StayGlobal Owner</h1>
            </div>
            <nav className="flex items-center space-x-4">
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8"
                  }
                }}
              />
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Property Owner Dashboard
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Manage your properties, track bookings, and communicate with guests
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-green-600">
                {isLoading ? <Loader2 className="h-8 w-8 animate-spin mx-auto" /> : stats.totalProperties}
              </CardTitle>
              <CardDescription>Listed Properties</CardDescription>
            </CardHeader>
          </Card>
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-blue-600">
                {isLoading ? <Loader2 className="h-8 w-8 animate-spin mx-auto" /> : stats.activeBookings}
              </CardTitle>
              <CardDescription>Active Bookings</CardDescription>
            </CardHeader>
          </Card>
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-purple-600">
                {isLoading ? <Loader2 className="h-8 w-8 animate-spin mx-auto" /> : `$${stats.monthlyEarnings}`}
              </CardTitle>
              <CardDescription>Monthly Earnings</CardDescription>
            </CardHeader>
          </Card>
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-orange-600">
                {isLoading ? <Loader2 className="h-8 w-8 animate-spin mx-auto" /> : stats.totalGuests}
              </CardTitle>
              <CardDescription>Total Guests</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 lg:w-3/4 mx-auto mb-8">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              List Apartment
            </TabsTrigger>
            <TabsTrigger value="checkin" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Check-In
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Bookings
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-6">
            <VerificationGate>
              <ListApartmentForm />
            </VerificationGate>
          </TabsContent>

          <TabsContent value="checkin" className="space-y-6">
            <CheckInSystem />
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6">
            <BookingTracker />
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <PaymentTracker />
          </TabsContent>

          <TabsContent value="chat" className="space-y-6">
            <OwnerChat />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default HouseOwner;
