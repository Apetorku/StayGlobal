
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useUser, UserButton } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import ApartmentSearch from "@/components/ApartmentSearch";
import MyBookings from "@/components/MyBookings";
import RenterChat from "@/components/renter/RenterChat";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import NotificationBadge from "@/components/notifications/NotificationBadge";
import MaintenanceButton from "@/components/MaintenanceButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Search, Calendar, MessageSquare, Bell, Settings } from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState("search");
  const { user } = useUser();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
              <Home className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-600 hover:text-indigo-700 transition-colors" />
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 hover:text-indigo-700 transition-colors">
                StayGlobal
              </h1>
            </div>
            <nav className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-gray-600 text-sm sm:text-base hidden sm:inline">
                Welcome, {user?.firstName || 'User'}!
              </span>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "h-7 w-7 sm:h-8 sm:w-8"
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
            Find Your Perfect Stay
          </h2>
          <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto px-4">
            Discover and book apartments worldwide with real-time availability and secure payments
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-indigo-600">1000+</CardTitle>
              <CardDescription>Available Apartments</CardDescription>
            </CardHeader>
          </Card>
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-green-600">50+</CardTitle>
              <CardDescription>Countries & Regions</CardDescription>
            </CardHeader>
          </Card>
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-purple-600">24/7</CardTitle>
              <CardDescription>Customer Support</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 lg:w-2/3 mx-auto mb-8 h-auto p-1">
            <TabsTrigger value="search" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3">
              <Search className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Search</span>
              <span className="sm:hidden">Search</span>
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">My Bookings</span>
              <span className="sm:hidden">Bookings</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3">
              <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Messages</span>
              <span className="sm:hidden">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3">
              <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Notifications</span>
              <span className="sm:hidden">Alerts</span>
              <NotificationBadge />
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3 col-span-2 sm:col-span-1">
              <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Maintenance</span>
              <span className="sm:hidden">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6">
            <ApartmentSearch />
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6">
            <MyBookings />
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <RenterChat />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <NotificationCenter />
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-6">
            <div className="max-w-4xl mx-auto">
              <MaintenanceButton />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
