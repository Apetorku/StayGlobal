
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { bookingService } from "@/services/bookingService";
import { DollarSign, TrendingUp, Calendar, CreditCard, Loader2, RefreshCw } from "lucide-react";


const PaymentTracker = () => {
  const [filterPeriod, setFilterPeriod] = useState("all");
  const { getToken, userId } = useAuth();

  // Fetch owner's bookings (which contain payment information)
  const { data: bookingData, isLoading, error, refetch } = useQuery({
    queryKey: ['owner-payments', userId],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('Authentication required');
      return bookingService.getOwnerBookings(token);
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const payments = bookingData?.bookings?.filter(booking =>
    booking.paymentStatus === 'paid' || booking.paymentStatus === 'completed'
  ) || [];
  const filteredPayments = payments.filter(payment => {
    if (filterPeriod === "all") return true;
    const paymentDate = new Date(payment.createdAt);
    const now = new Date();

    switch (filterPeriod) {
      case "today":
        return paymentDate.toDateString() === now.toDateString();
      case "week": {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return paymentDate >= weekAgo;
      }
      case "month": {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return paymentDate >= monthAgo;
      }
      default:
        return true;
    }
  });

  const totalRevenue = filteredPayments.reduce((sum, payment) => sum + payment.totalAmount, 0);
  const averagePayment = filteredPayments.length > 0 ? totalRevenue / filteredPayments.length : 0;

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case "credit card":
        return <CreditCard className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payment History</h2>
          <p className="text-muted-foreground">
            Track all payments received from your rental bookings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterPeriod} onValueChange={setFilterPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : `GHS ${totalRevenue}`}
            </div>
            <p className="text-xs text-muted-foreground">
              From {filteredPayments.length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Payment</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : `GHS ${averagePayment.toFixed(0)}`}
            </div>
            <p className="text-xs text-muted-foreground">
              Per booking
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : filteredPayments.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Successful payments
            </p>
          </CardContent>
        </Card>
      </div>



      {/* Payments Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading payments...</span>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-red-600">Error loading payments. Please try again.</p>
          </CardContent>
        </Card>
      ) : filteredPayments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No payments found for the selected period.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPayments.map((payment) => (
            <Card key={payment._id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-semibold text-green-600">
                      GHS {payment.totalAmount}
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-green-600">
                    {payment.paymentStatus}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-semibold">{payment.guestName}</p>
                  <p className="text-sm text-gray-600">{payment.apartmentTitle}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CreditCard className="h-4 w-4" />
                    Card Payment
                  </div>
                  <p className="text-xs font-mono text-gray-500">
                    {payment.ticketCode}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentTracker;
