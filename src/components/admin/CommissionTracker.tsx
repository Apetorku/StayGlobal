
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Calendar } from "lucide-react";

const CommissionTracker = () => {
  // Mock commission data
  const commissionData = [
    { id: 1, ownerId: "OWN001", ownerName: "John Smith", apartmentName: "Downtown Loft", amount: 150, percentage: 10, date: "2024-06-15", status: "paid" },
    { id: 2, ownerId: "OWN002", ownerName: "Maria Garcia", apartmentName: "Seaside Villa", amount: 300, percentage: 10, date: "2024-06-14", status: "paid" },
    { id: 3, ownerId: "OWN003", ownerName: "David Wilson", apartmentName: "City Center Apt", amount: 200, percentage: 10, date: "2024-06-13", status: "pending" },
    { id: 4, ownerId: "OWN001", ownerName: "John Smith", apartmentName: "Mountain Cabin", amount: 180, percentage: 10, date: "2024-06-12", status: "paid" },
  ];

  const totalCommission = commissionData.reduce((sum, item) => sum + item.amount, 0);
  const paidCommission = commissionData.filter(item => item.status === "paid").reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCommission}</div>
            <p className="text-xs text-muted-foreground">All time earnings</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Commission</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${paidCommission}</div>
            <p className="text-xs text-muted-foreground">Successfully collected</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${830}</div>
            <p className="text-xs text-muted-foreground">June 2024 earnings</p>
          </CardContent>
        </Card>
      </div>

      {/* Commission Table */}
      <Card>
        <CardHeader>
          <CardTitle>Commission Breakdown</CardTitle>
          <CardDescription>Detailed view of all commission transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Owner</TableHead>
                <TableHead>Apartment</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Percentage</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commissionData.map((commission) => (
                <TableRow key={commission.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{commission.ownerName}</div>
                      <div className="text-sm text-muted-foreground">{commission.ownerId}</div>
                    </div>
                  </TableCell>
                  <TableCell>{commission.apartmentName}</TableCell>
                  <TableCell className="font-medium">${commission.amount}</TableCell>
                  <TableCell>{commission.percentage}%</TableCell>
                  <TableCell>{commission.date}</TableCell>
                  <TableCell>
                    <Badge variant={commission.status === "paid" ? "default" : "secondary"}>
                      {commission.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommissionTracker;
