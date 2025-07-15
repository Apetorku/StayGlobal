
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Calendar, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { adminService, CommissionRecord } from "@/services/adminService";
import { useToast } from "@/hooks/use-toast";

const CommissionTracker = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch commissions
  const { data: commissionsData, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-commissions', statusFilter],
    queryFn: () => adminService.getCommissions({
      page: 1,
      limit: 50,
      status: statusFilter === 'all' ? undefined : statusFilter
    }),
    retry: 2,
  });

  // Fetch admin stats for commission summary
  const { data: statsData } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminService.getAdminStats(),
    retry: 2,
  });

  // Update commission status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ commissionId, status }: { commissionId: string; status: 'paid' | 'failed' }) =>
      adminService.updateCommissionStatus(commissionId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-commissions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast({
        title: "Success",
        description: "Commission status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update commission status",
        variant: "destructive",
      });
    },
  });

  const commissions = commissionsData?.commissions || [];
  const totalCommission = statsData?.totalCommission || 0;
  const paidCommission = statsData?.paidCommission || 0;
  const pendingCommission = statsData?.pendingCommission || 0;

  // Calculate this month's commission
  const thisMonth = new Date();
  const thisMonthCommissions = commissions.filter((c: CommissionRecord) => {
    const commissionDate = new Date(c.createdAt);
    return commissionDate.getMonth() === thisMonth.getMonth() &&
           commissionDate.getFullYear() === thisMonth.getFullYear();
  });

  const thisMonthTotal = thisMonthCommissions.reduce((sum: number, item: CommissionRecord) => sum + item.commissionAmount, 0);
  const thisMonthPaid = thisMonthCommissions.filter(c => c.status === 'paid').reduce((sum: number, item: CommissionRecord) => sum + item.commissionAmount, 0);
  const thisMonthPending = thisMonthCommissions.filter(c => c.status === 'pending').reduce((sum: number, item: CommissionRecord) => sum + item.commissionAmount, 0);

  // Calculate commission rate and trends
  const commissionRate = 5; // 5% as per your memory
  const totalBookingValue = totalCommission > 0 ? totalCommission / (commissionRate / 100) : 0;
  const collectionRate = totalCommission > 0 ? (paidCommission / totalCommission) * 100 : 0;

  const handleStatusUpdate = (commissionId: string, status: 'paid' | 'failed') => {
    updateStatusMutation.mutate({ commissionId, status });
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading commission data</p>
        <Button onClick={() => refetch()} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GHS {totalCommission.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">All time earnings (5% rate)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Commission</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">GHS {paidCommission.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {collectionRate.toFixed(1)}% collection rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Commission</CardTitle>
            <XCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">GHS {pendingCommission.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Awaiting collection</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GHS {thisMonthTotal.toFixed(2)}</div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Paid: GHS {thisMonthPaid.toFixed(2)}</span>
              <span>Pending: GHS {thisMonthPending.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Booking Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">GHS {totalBookingValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Platform transaction volume</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Commission Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{commissionRate}%</div>
            <p className="text-xs text-muted-foreground">Per booking commission</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Active Commissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{commissions.length}</div>
            <p className="text-xs text-muted-foreground">Current page records</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Commission Insights */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Commission Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Collection Performance</h4>
              <p className="text-blue-600">
                {collectionRate.toFixed(1)}% of total commission has been collected successfully.
                {collectionRate < 80 && " Consider improving collection processes."}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">Monthly Performance</h4>
              <p className="text-green-600">
                This month: GHS {thisMonthTotal.toFixed(2)} total commission
                ({thisMonthCommissions.length} bookings)
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-semibold text-purple-800 mb-2">Platform Growth</h4>
              <p className="text-purple-600">
                Total platform value: GHS {totalBookingValue.toFixed(2)}
                (Commission represents {commissionRate}% of bookings)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commission Table */}
      <Card>
        <CardHeader>
          <CardTitle>Commission Breakdown</CardTitle>
          <CardDescription>
            Detailed view of all commission transactions (5% per room booked)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading commissions...</p>
            </div>
          ) : commissions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No commissions found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Owner</TableHead>
                  <TableHead>Apartment</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead>Room Price</TableHead>
                  <TableHead>Commission (5%)</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.map((commission: CommissionRecord) => (
                  <TableRow key={commission._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{commission.ownerName}</div>
                        <div className="text-sm text-muted-foreground">
                          {commission.ownerId.slice(-6)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{commission.apartmentTitle}</TableCell>
                    <TableCell>{commission.guestName}</TableCell>
                    <TableCell>GHS {commission.roomPrice.toFixed(2)}</TableCell>
                    <TableCell className="font-medium text-green-600">
                      GHS {commission.commissionAmount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {new Date(commission.bookingDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          commission.status === "paid" ? "default" :
                          commission.status === "failed" ? "destructive" : "secondary"
                        }
                      >
                        {commission.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {commission.status === 'pending' && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(commission._id, 'paid')}
                            disabled={updateStatusMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleStatusUpdate(commission._id, 'failed')}
                            disabled={updateStatusMutation.isPending}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CommissionTracker;
