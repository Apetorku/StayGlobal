
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, DollarSign, Building, Users, MessageSquare, RefreshCw, AlertCircle, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/clerk-react";
import CommissionTracker from "@/components/admin/CommissionTracker";
import ApartmentListings from "@/components/admin/ApartmentListings";
import OwnerProfiles from "@/components/admin/OwnerProfiles";
import AdminChat from "@/components/admin/AdminChat";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import { adminService } from "@/services/adminService";
import { adminChatService } from "@/services/adminChatService";
import { useIsAdmin } from "@/services/authService";

const Admin = () => {
  const [activeTab, setActiveTab] = useState("commissions");
  const isAdmin = useIsAdmin();

  // Fetch real admin stats (only if user is admin)
  const { data: stats, isLoading: statsLoading, error: statsError, refetch } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminService.getAdminStats(),
    retry: 2,
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled: isAdmin, // Only fetch if user is admin
  });

  const defaultStats = {
    totalCommission: 0,
    totalApartments: 0,
    activeOwners: 0,
    pendingReports: 0
  };

  const displayStats = stats || defaultStats;

  // Show access denied if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Access Denied</CardTitle>
            <CardDescription>
              Admin access is restricted to authorized users only.
              <br />
              <span className="text-sm text-gray-500 mt-2 block">
                Contact support if you need admin access.
              </span>
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <span className="text-3xl">🏠</span>
              <h1 className="text-2xl font-bold text-gray-900">StayGlobal Admin</h1>
            </div>
            <nav className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={statsLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${statsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
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
            Admin Control Center
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Monitor platform performance, manage listings, and oversee owner relationships
          </p>
        </div>

        {/* Stats Cards */}
        {statsError ? (
          <div className="text-center py-8 mb-8">
            <p className="text-red-600 mb-4">Error loading admin statistics</p>
            <Button onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-purple-600">
                  {statsLoading ? (
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto" />
                  ) : (
                    `$${displayStats.totalCommission.toFixed(2)}`
                  )}
                </CardTitle>
                <CardDescription>Total Commission (5% per booking)</CardDescription>
              </CardHeader>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-blue-600">
                  {statsLoading ? (
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto" />
                  ) : (
                    displayStats.totalApartments
                  )}
                </CardTitle>
                <CardDescription>Total Apartments</CardDescription>
              </CardHeader>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-green-600">
                  {statsLoading ? (
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto" />
                  ) : (
                    displayStats.activeOwners
                  )}
                </CardTitle>
                <CardDescription>Active Owners</CardDescription>
              </CardHeader>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-red-600">
                  {statsLoading ? (
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto" />
                  ) : (
                    displayStats.pendingReports
                  )}
                </CardTitle>
                <CardDescription>Pending Reports</CardDescription>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 lg:w-3/4 mx-auto mb-8">
            <TabsTrigger value="commissions" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Commissions
            </TabsTrigger>
            <TabsTrigger value="apartments" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Apartments
            </TabsTrigger>
            <TabsTrigger value="owners" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Owners
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="commissions" className="space-y-6">
            <CommissionTracker />
          </TabsContent>

          <TabsContent value="apartments" className="space-y-6">
            <ApartmentListings />
          </TabsContent>

          <TabsContent value="owners" className="space-y-6">
            <OwnerProfiles />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Admin Notifications</CardTitle>
                    <CardDescription>
                      View all system notifications including new apartments, bookings, verifications, and messages from owners.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
              <NotificationCenter />
            </div>
          </TabsContent>

          <TabsContent value="chat" className="space-y-6">
            <AdminChat />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
