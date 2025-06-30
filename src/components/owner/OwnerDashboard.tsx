import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { 
  Home, 
  CreditCard, 
  Calendar, 
  DollarSign, 
  Users, 
  TrendingUp,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import PaymentAccountSetup from "./PaymentAccountSetup";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface DashboardStats {
  totalApartments: number;
  totalBookings: number;
  totalRevenue: number;
  pendingPayments: number;
  activeBookings: number;
}

const OwnerDashboard = () => {
  const { getToken } = useAuth();

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['owner-stats'],
    queryFn: async () => {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/users/owner/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      return data as DashboardStats;
    }
  });

  // Fetch payment account status
  const { data: paymentAccount } = useQuery({
    queryKey: ['payment-account'],
    queryFn: async () => {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/user-payments/account`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch payment account');
      const data = await response.json();
      return data.paymentAccount;
    }
  });

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    description, 
    trend 
  }: { 
    title: string; 
    value: string | number; 
    icon: any; 
    description: string;
    trend?: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <div className="flex items-center pt-1">
            <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
            <span className="text-xs text-green-500">{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Owner Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your properties and track your earnings
          </p>
        </div>
        <div className="flex items-center gap-2">
          {paymentAccount ? (
            <Badge variant="default" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Payment Setup Complete
            </Badge>
          ) : (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Payment Setup Required
            </Badge>
          )}
        </div>
      </div>

      {/* Payment Account Alert */}
      {!paymentAccount && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="h-5 w-5" />
              Payment Account Setup Required
            </CardTitle>
            <CardDescription className="text-orange-700">
              You need to set up your payment account to receive payments from renters. 
              Complete the setup in the "Payment Settings" tab below.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Properties"
          value={stats?.totalApartments || 0}
          icon={Home}
          description="Active listings"
          trend="+2 this month"
        />
        <StatCard
          title="Total Bookings"
          value={stats?.totalBookings || 0}
          icon={Calendar}
          description="All time bookings"
          trend="+12% from last month"
        />
        <StatCard
          title="Total Revenue"
          value={`GH₵${stats?.totalRevenue || 0}`}
          icon={DollarSign}
          description="Total earnings"
          trend="+8% from last month"
        />
        <StatCard
          title="Active Bookings"
          value={stats?.activeBookings || 0}
          icon={Users}
          description="Current guests"
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="payment-settings">Payment Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates on your properties</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">New booking received</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Payment received</p>
                      <p className="text-xs text-muted-foreground">5 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Property viewed 15 times</p>
                      <p className="text-xs text-muted-foreground">1 day ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <button className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                  <div className="font-medium">Add New Property</div>
                  <div className="text-sm text-muted-foreground">List a new apartment for rent</div>
                </button>
                <button className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                  <div className="font-medium">View Bookings</div>
                  <div className="text-sm text-muted-foreground">Check upcoming reservations</div>
                </button>
                <button className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                  <div className="font-medium">Payment History</div>
                  <div className="text-sm text-muted-foreground">Track your earnings</div>
                </button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="properties">
          <Card>
            <CardHeader>
              <CardTitle>Your Properties</CardTitle>
              <CardDescription>Manage your apartment listings</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Property management interface will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <CardTitle>Booking Management</CardTitle>
              <CardDescription>View and manage your bookings</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Booking management interface will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Track payments received from renters</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Payment history interface will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment-settings">
          <PaymentAccountSetup />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OwnerDashboard;
