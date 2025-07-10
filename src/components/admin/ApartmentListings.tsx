
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, Users, Eye, Ban, RefreshCw, Search, CheckCircle } from "lucide-react";
import { adminService, AdminApartment } from "@/services/adminService";
import { useToast } from "@/hooks/use-toast";

const ApartmentListings = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch apartments
  const { data: apartmentsData, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-apartments', currentPage, statusFilter, searchQuery],
    queryFn: async () => {
      console.log('🏠 Fetching apartments with params:', { currentPage, statusFilter, searchQuery });
      const result = await adminService.getAllApartments({
        page: currentPage,
        limit: 10,
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchQuery || undefined
      });
      console.log('🏠 Apartments fetched:', result);
      return result;
    },
    retry: 2,
  });

  // Update apartment status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ apartmentId, status }: { apartmentId: string; status: 'active' | 'inactive' | 'suspended' }) => {
      console.log('🔄 Updating apartment status:', { apartmentId, status });
      return adminService.updateApartmentStatus(apartmentId, status);
    },
    onSuccess: (data) => {
      console.log('✅ Apartment status updated:', data);
      queryClient.invalidateQueries({ queryKey: ['admin-apartments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast({
        title: "Success",
        description: "Apartment status updated successfully",
      });
    },
    onError: (error) => {
      console.error('❌ Failed to update apartment status:', error);
      toast({
        title: "Error",
        description: "Failed to update apartment status",
        variant: "destructive",
      });
    },
  });

  const apartments = apartmentsData?.apartments || [];

  console.log('🏠 Apartments data:', { apartmentsData, apartments, isLoading, error });

  const handleStatusUpdate = (apartmentId: string, status: 'active' | 'inactive' | 'suspended') => {
    console.log('🔄 Handle status update called:', { apartmentId, status });
    updateStatusMutation.mutate({ apartmentId, status });
  };

  const handleViewDetails = (apartmentId: string) => {
    // TODO: Implement apartment details modal or navigation
    console.log(`Viewing details for apartment ${apartmentId}`);
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading apartment data</p>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <RefreshCw className="h-6 w-6 animate-spin" />
              ) : (
                apartmentsData?.total || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">All apartments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <RefreshCw className="h-6 w-6 animate-spin" />
              ) : (
                apartments.filter((apt: AdminApartment) => apt.status === "active").length
              )}
            </div>
            <p className="text-xs text-muted-foreground">Currently available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <RefreshCw className="h-6 w-6 animate-spin" />
              ) : (
                apartments.reduce((sum: number, apt: AdminApartment) => sum + (apt.totalBookings || 0), 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">All time bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <RefreshCw className="h-6 w-6 animate-spin" />
              ) : apartments.length > 0 ? (
                (apartments.reduce((sum: number, apt: AdminApartment) => sum + (apt.rating || 0), 0) / apartments.length).toFixed(1)
              ) : (
                "0.0"
              )}
            </div>
            <p className="text-xs text-muted-foreground">Platform average</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search apartments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Status Legend */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-lg">Status Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Badge variant="default">Active</Badge>
              <span>Visible to users, accepting bookings</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">Inactive</Badge>
              <span>Hidden from users, temporarily disabled</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="destructive">Suspended</Badge>
              <span>Permanently disabled, requires admin review</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Apartments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Apartment Listings</CardTitle>
          <CardDescription>Manage all apartment listings on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading apartments...</p>
            </div>
          ) : apartments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No apartments found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Apartment</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Rooms</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Bookings</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apartments.map((apartment: AdminApartment) => (
                  <TableRow key={apartment._id}>
                    <TableCell className="font-medium">{apartment.title}</TableCell>
                    <TableCell>{apartment.ownerName}</TableCell>
                    <TableCell>
                      {apartment.location.town}, {apartment.location.region}
                    </TableCell>
                    <TableCell>{apartment.totalRooms}</TableCell>
                    <TableCell>${apartment.price}/night</TableCell>
                    <TableCell>{apartment.totalBookings || 0}</TableCell>
                    <TableCell>{apartment.rating ? apartment.rating.toFixed(1) : 'N/A'}/5</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          apartment.status === "active" ? "default" :
                          apartment.status === "suspended" ? "destructive" : "secondary"
                        }
                      >
                        {apartment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(apartment._id)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {/* Status Action Buttons */}
                        {apartment.status === "active" && (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleStatusUpdate(apartment._id, 'inactive')}
                              disabled={updateStatusMutation.isPending}
                              title="Set Inactive (temporarily disable)"
                            >
                              Inactive
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleStatusUpdate(apartment._id, 'suspended')}
                              disabled={updateStatusMutation.isPending}
                              title="Suspend (permanently disable)"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          </>
                        )}

                        {apartment.status === "inactive" && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleStatusUpdate(apartment._id, 'active')}
                              disabled={updateStatusMutation.isPending}
                              title="Activate"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleStatusUpdate(apartment._id, 'suspended')}
                              disabled={updateStatusMutation.isPending}
                              title="Suspend"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          </>
                        )}

                        {apartment.status === "suspended" && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleStatusUpdate(apartment._id, 'active')}
                            disabled={updateStatusMutation.isPending}
                            title="Reactivate"
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ApartmentListings;
