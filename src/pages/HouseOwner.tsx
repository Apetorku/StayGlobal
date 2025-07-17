
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth, UserButton } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apartmentService } from "@/services/apartmentService";
import { bookingService } from "@/services/bookingService";
import { Building, Plus, UserCheck, Calendar, DollarSign, MessageSquare, Bell, Loader2 } from "lucide-react";
import ListApartmentForm from "@/components/owner/ListApartmentForm";
import CheckInSystem from "@/components/owner/CheckInSystem";
import BookingTracker from "@/components/owner/BookingTracker";
import PaymentTracker from "@/components/owner/PaymentTracker";

import OwnerChat from "@/components/owner/OwnerChat";
import VerificationGate from "@/components/verification/VerificationGate";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import NotificationBadge from "@/components/notifications/NotificationBadge";

const HouseOwner = () => {
  const [activeTab, setActiveTab] = useState("list");
  const { getToken, userId, isSignedIn } = useAuth();
  const navigate = useNavigate();

  // Fetch owner's apartments
  const { data: apartmentData, isLoading: apartmentsLoading, error: apartmentError } = useQuery({
    queryKey: ['owner-apartments', userId],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('Authentication required');
      return await apartmentService.getOwnerApartments(token);
    },
    enabled: !!isSignedIn && !!userId,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch owner's bookings
  const { data: bookingData, isLoading: bookingsLoading, error: bookingError } = useQuery({
    queryKey: ['owner-bookings', userId],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('Authentication required');
      return await bookingService.getOwnerBookings(token);
    },
    enabled: !!isSignedIn && !!userId,
    staleTime: 5 * 60 * 1000,
  });



  // If no bookings data, let's try to get monthly earnings from a different source
  const { data: monthlyEarningsData } = useQuery({
    queryKey: ['monthly-earnings'],
    queryFn: async () => {
      try {
        const token = await getToken();
        // Try to get commission data for current user as a fallback
        const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/commissions?limit=50`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();

          const monthlyTotal = data.commissions?.reduce((total: number, commission: any) => {
            const commissionDate = new Date(commission.bookingDate);
            if (commissionDate.getMonth() === currentMonth && commissionDate.getFullYear() === currentYear) {
              return total + (commission.roomPrice || 0);
            }
            return total;
          }, 0) || 0;


          return monthlyTotal;
        }
        return 0;
      } catch (error) {
        console.error('Failed to fetch monthly earnings:', error);
        return 0;
      }
    },
    enabled: !bookingData?.bookings?.length // Only run if we don't have booking data
  });

  // Calculate real stats
  const stats = {
    totalProperties: apartmentData?.apartments?.length || 0,
    activeBookings: bookingData?.bookings?.filter(b => b.bookingStatus === 'confirmed').length || 0,
    monthlyEarnings: (() => {
      // If we have booking data, calculate from bookings
      if (bookingData?.bookings?.length > 0) {
        return bookingData.bookings.reduce((total, booking) => {
          // Only count paid/completed bookings
          if (booking.paymentStatus !== 'paid' && booking.paymentStatus !== 'completed') {
            return total;
          }

          const bookingDate = new Date(booking.createdAt);
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();

          if (bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear) {
            return total + (booking.totalAmount || 0);
          }
          return total;
        }, 0);
      }

      // Fallback: Use monthly earnings from commission data
      return monthlyEarningsData || 0;
    })(),
    totalGuests: bookingData?.bookings?.reduce((total, booking) => total + booking.guests, 0) || 0
  };

  const isLoading = apartmentsLoading || bookingsLoading;

  const apartments = apartmentData?.apartments || [];
  const bookings = bookingData?.bookings || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
              <Building className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 hover:text-green-700 transition-colors" />
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 hover:text-green-700 transition-colors">
                <span className="hidden sm:inline">StayGlobal Owner</span>
                <span className="sm:hidden">StayGlobal</span>
              </h1>
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
        <div className="text-center mb-6 sm:mb-10">
          <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">
            Property Owner Dashboard
          </h2>
          <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto px-4">
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
                {isLoading ? <Loader2 className="h-8 w-8 animate-spin mx-auto" /> : `GHS ${stats.monthlyEarnings}`}
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
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 lg:w-4/5 mx-auto mb-8 h-auto p-1">
            <TabsTrigger value="list" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3">
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">List Apartment</span>
              <span className="sm:hidden">List</span>
            </TabsTrigger>
            <TabsTrigger value="checkin" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3">
              <UserCheck className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Check-In</span>
              <span className="sm:hidden">Check</span>
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Bookings</span>
              <span className="sm:hidden">Books</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3">
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Payments</span>
              <span className="sm:hidden">Pay</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3">
              <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Chat</span>
              <span className="sm:hidden">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3">
              <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Notifications</span>
              <span className="sm:hidden">Alerts</span>
              <NotificationBadge />
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

          <TabsContent value="notifications" className="space-y-6">
            <NotificationCenter />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default HouseOwner;
