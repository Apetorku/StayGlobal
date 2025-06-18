
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, TrendingUp, Calendar, CreditCard } from "lucide-react";

const PaymentTracker = () => {
  const [filterPeriod, setFilterPeriod] = useState("all");

  // Mock payment data
  const mockPayments = [
    {
      id: 1,
      amount: 600,
      date: "2024-01-15",
      renterName: "John Doe",
      apartment: "Cozy Downtown Apartment",
      ticketCode: "TKT-2024-001",
      paymentMethod: "Credit Card",
      status: "completed"
    },
    {
      id: 2,
      amount: 300,
      date: "2024-01-16",
      renterName: "Jane Smith",
      apartment: "Modern Studio", 
      ticketCode: "TKT-2024-002",
      paymentMethod: "PayPal",
      status: "completed"
    },
    {
      id: 3,
      amount: 800,
      date: "2024-01-10",
      renterName: "Bob Johnson",
      apartment: "Luxury Penthouse",
      ticketCode: "TKT-2024-003",
      paymentMethod: "Bank Transfer",
      status: "completed"
    },
    {
      id: 4,
      amount: 900,
      date: "2024-01-18",
      renterName: "Alice Brown",
      apartment: "Seaside Villa",
      ticketCode: "TKT-2024-004",
      paymentMethod: "Credit Card",
      status: "completed"
    },
    {
      id: 5,
      amount: 450,
      date: "2024-01-12",
      renterName: "Charlie Wilson",
      apartment: "Mountain View Cabin",
      ticketCode: "TKT-2024-005",
      paymentMethod: "PayPal",
      status: "completed"
    }
  ];

  const filteredPayments = mockPayments.filter(payment => {
    if (filterPeriod === "all") return true;
    const paymentDate = new Date(payment.date);
    const now = new Date();
    
    switch (filterPeriod) {
      case "today":
        return paymentDate.toDateString() === now.toDateString();
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return paymentDate >= weekAgo;
      case "month":
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return paymentDate >= monthAgo;
      default:
        return true;
    }
  });

  const totalRevenue = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
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
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue}</div>
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
            <div className="text-2xl font-bold">${averagePayment.toFixed(0)}</div>
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
            <div className="text-2xl font-bold">{filteredPayments.length}</div>
            <p className="text-xs text-muted-foreground">
              Successful payments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Payment History
            <Select value={filterPeriod} onValueChange={setFilterPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Payments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPayments.map((payment) => (
          <Card key={payment.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg font-semibold text-green-600">
                    ${payment.amount}
                  </CardTitle>
                  <p className="text-sm text-gray-600">{payment.date}</p>
                </div>
                <Badge variant="outline" className="text-green-600">
                  {payment.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-semibold">{payment.renterName}</p>
                <p className="text-sm text-gray-600">{payment.apartment}</p>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {getPaymentMethodIcon(payment.paymentMethod)}
                  {payment.paymentMethod}
                </div>
                <p className="text-xs font-mono text-gray-500">
                  {payment.ticketCode}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPayments.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No payments found for the selected period.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PaymentTracker;
