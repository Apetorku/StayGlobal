
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Building, MessageSquare, AlertTriangle, RefreshCw, Search, Ban, CheckCircle, Eye } from "lucide-react";
import { adminService, AdminOwner } from "@/services/adminService";
import { adminChatService } from "@/services/adminChatService";
import { useToast } from "@/hooks/use-toast";

const OwnerProfiles = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch owners
  const { data: ownersData, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-owners', currentPage, statusFilter, searchQuery],
    queryFn: async () => {
      console.log('👥 Fetching owners with params:', { currentPage, statusFilter, searchQuery });
      const result = await adminService.getAllOwners({
        page: currentPage,
        limit: 10,
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchQuery || undefined
      });
      console.log('👥 Owners fetched:', result);
      return result;
    },
    retry: 2,
  });

  // Update owner status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ ownerId, status }: { ownerId: string; status: 'active' | 'suspended' }) => {
      console.log('🔄 Updating owner status:', { ownerId, status });
      return adminService.updateOwnerStatus(ownerId, status);
    },
    onSuccess: (data) => {
      console.log('✅ Owner status updated:', data);
      queryClient.invalidateQueries({ queryKey: ['admin-owners'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast({
        title: "Success",
        description: "Owner status updated successfully",
      });
    },
    onError: (error) => {
      console.error('❌ Failed to update owner status:', error);
      toast({
        title: "Error",
        description: "Failed to update owner status",
        variant: "destructive",
      });
    },
  });

  const owners = ownersData?.owners || [];

  console.log('👥 Owners data:', { ownersData, owners, isLoading, error });

  const handleStatusUpdate = (ownerId: string, status: 'active' | 'suspended') => {
    console.log('🔄 Handle status update called:', { ownerId, status });
    updateStatusMutation.mutate({ ownerId, status });
  };

  const handleViewDetails = (ownerId: string) => {
    // TODO: Implement owner details modal or navigation
    console.log(`Viewing details for owner ${ownerId}`);
  };

  const handleStartChat = async (ownerId: string) => {
    try {
      console.log(`Starting chat with owner ${ownerId}`);
      const result = await adminChatService.getOrCreateChat(ownerId);
      console.log('Chat created/retrieved:', result);
      toast({
        title: "Success",
        description: "Chat started! Go to the Chat tab to continue the conversation.",
      });
    } catch (error) {
      console.error('Failed to start chat:', error);
      toast({
        title: "Error",
        description: "Failed to start chat with owner",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      case 'warning':
        return <Badge variant="secondary">Warning</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Owner Management</CardTitle>
          <CardDescription>Manage property owners and their accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search owners by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Owners</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ownersData?.total || 0}</div>
            <p className="text-xs text-muted-foreground">Registered landlords</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Owners</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {owners.filter(owner => owner.status === "active").length}
            </div>
            <p className="text-xs text-muted-foreground">Currently hosting</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Apartments</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {owners.length > 0 ? (owners.reduce((sum, owner) => sum + owner.apartmentCount, 0) / owners.length).toFixed(1) : '0'}
            </div>
            <p className="text-xs text-muted-foreground">Per owner</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {owners.filter(owner => owner.status === "suspended").length}
            </div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Owners Table */}
      <Card>
        <CardHeader>
          <CardTitle>Owner Profiles</CardTitle>
          <CardDescription>Manage and monitor all property owners</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading owners...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">Error loading owners</p>
              <Button onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : owners.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No owners found</p>
              <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Owner</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead>Apartments</TableHead>
                  <TableHead>Bookings</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {owners.map((owner) => (
                  <TableRow key={owner._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{owner.firstName} {owner.lastName}</div>
                        <div className="text-sm text-muted-foreground">ID: {owner._id.slice(-8)}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">{owner.email}</div>
                        <div className="text-sm text-muted-foreground">{owner.phone || 'No phone'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(owner.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <span className="font-medium">{owner.apartmentCount}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <span className="font-medium">{owner.totalBookings}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-1">
                        {owner.isVerified ? (
                          <Badge variant="default" className="text-xs">Fully Verified</Badge>
                        ) : (
                          <div className="flex flex-col space-y-1">
                            <div className="flex space-x-1">
                              <Badge
                                variant={owner.identityVerified ? "default" : "secondary"}
                                className="text-xs"
                              >
                                ID: {owner.identityVerified ? "✓" : "✗"}
                              </Badge>
                              <Badge
                                variant={owner.paymentVerified ? "default" : "secondary"}
                                className="text-xs"
                              >
                                Pay: {owner.paymentVerified ? "✓" : "✗"}
                              </Badge>
                            </div>
                            {owner.verificationLevel && (
                              <Badge variant="outline" className="text-xs">
                                {owner.verificationLevel.replace('_', ' ')}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(owner.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(owner._id)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartChat(owner.clerkId)}
                          title="Start Chat"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>

                        {/* Status Action Buttons */}
                        {owner.status === "active" && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleStatusUpdate(owner._id, 'suspended')}
                            disabled={updateStatusMutation.isPending}
                            title="Suspend Owner"
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}

                        {owner.status === "suspended" && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleStatusUpdate(owner._id, 'active')}
                            disabled={updateStatusMutation.isPending}
                            title="Reactivate Owner"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {ownersData && ownersData.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {owners.length} of {ownersData.total} owners
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="flex items-center px-3 py-1 text-sm">
                  Page {currentPage} of {ownersData.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(ownersData.totalPages, prev + 1))}
                  disabled={currentPage === ownersData.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OwnerProfiles;
