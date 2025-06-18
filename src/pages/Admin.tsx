
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, DollarSign, Building, Users, MessageSquare } from "lucide-react";
import CommissionTracker from "@/components/admin/CommissionTracker";
import ApartmentListings from "@/components/admin/ApartmentListings";
import OwnerProfiles from "@/components/admin/OwnerProfiles";
import AdminChat from "@/components/admin/AdminChat";

const Admin = () => {
  const [activeTab, setActiveTab] = useState("commissions");

  // Mock data for admin stats
  const stats = {
    totalCommission: 8500,
    totalApartments: 47,
    activeOwners: 23,
    pendingReports: 5
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900">StayGlobal Admin</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <button className="text-gray-600 hover:text-purple-600 transition-colors">
                Settings
              </button>
              <button className="text-gray-600 hover:text-purple-600 transition-colors">
                Support
              </button>
              <button className="text-gray-600 hover:text-purple-600 transition-colors">
                Logout
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
            Admin Control Center
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Monitor platform performance, manage listings, and oversee owner relationships
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-purple-600">${stats.totalCommission}</CardTitle>
              <CardDescription>Total Commission</CardDescription>
            </CardHeader>
          </Card>
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-blue-600">{stats.totalApartments}</CardTitle>
              <CardDescription>Total Apartments</CardDescription>
            </CardHeader>
          </Card>
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-green-600">{stats.activeOwners}</CardTitle>
              <CardDescription>Active Owners</CardDescription>
            </CardHeader>
          </Card>
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-red-600">{stats.pendingReports}</CardTitle>
              <CardDescription>Pending Reports</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-2/3 mx-auto mb-8">
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

          <TabsContent value="chat" className="space-y-6">
            <AdminChat />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
