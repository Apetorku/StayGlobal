
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Plus, Users, DollarSign, MessageSquare, CheckCircle } from "lucide-react";
import ListApartmentForm from "@/components/owner/ListApartmentForm";
import CheckInSystem from "@/components/owner/CheckInSystem";
import BookingTracker from "@/components/owner/BookingTracker";
import PaymentTracker from "@/components/owner/PaymentTracker";
import OwnerChat from "@/components/owner/OwnerChat";

const HouseOwner = () => {
  const [activeTab, setActiveTab] = useState("list-apartment");

  // Mock data for stats
  const stats = {
    totalApartments: 12,
    activeBookings: 8,
    monthlyRevenue: 15800,
    pendingCheckouts: 3
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Home className="h-8 w-8 text-emerald-600" />
              <h1 className="text-2xl font-bold text-gray-900">StayGlobal Owner</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <button className="text-gray-600 hover:text-emerald-600 transition-colors">
                Profile
              </button>
              <button className="text-gray-600 hover:text-emerald-600 transition-colors">
                Settings
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Property Management Dashboard
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Manage your properties, track bookings, and communicate with renters all in one place
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-emerald-600">{stats.totalApartments}</CardTitle>
              <CardDescription>Listed Properties</CardDescription>
            </CardHeader>
          </Card>
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-blue-600">{stats.activeBookings}</CardTitle>
              <CardDescription>Active Bookings</CardDescription>
            </CardHeader>
          </Card>
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-green-600">${stats.monthlyRevenue}</CardTitle>
              <CardDescription>Monthly Revenue</CardDescription>
            </CardHeader>
          </Card>
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-orange-600">{stats.pendingCheckouts}</CardTitle>
              <CardDescription>Pending Checkouts</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 lg:w-2/3 mx-auto mb-8">
            <TabsTrigger value="list-apartment" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              List Property
            </TabsTrigger>
            <TabsTrigger value="checkin" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Check-In
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
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

          <TabsContent value="list-apartment" className="space-y-6">
            <ListApartmentForm />
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
