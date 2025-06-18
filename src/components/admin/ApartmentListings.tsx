
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building, Users, Eye, Ban } from "lucide-react";

const ApartmentListings = () => {
  // Mock apartment data
  const apartments = [
    { 
      id: 1, 
      name: "Downtown Loft", 
      owner: "John Smith", 
      location: "New York, NY", 
      rooms: 2, 
      price: 1500, 
      bookings: 8, 
      status: "active",
      rating: 4.8
    },
    { 
      id: 2, 
      name: "Seaside Villa", 
      owner: "Maria Garcia", 
      location: "Miami, FL", 
      rooms: 4, 
      price: 3000, 
      bookings: 15, 
      status: "active",
      rating: 4.9
    },
    { 
      id: 3, 
      name: "City Center Apt", 
      owner: "David Wilson", 
      location: "Chicago, IL", 
      rooms: 1, 
      price: 1200, 
      bookings: 5, 
      status: "inactive",
      rating: 4.2
    },
    { 
      id: 4, 
      name: "Mountain Cabin", 
      owner: "John Smith", 
      location: "Denver, CO", 
      rooms: 3, 
      price: 1800, 
      bookings: 12, 
      status: "active",
      rating: 4.7
    },
  ];

  const handleDeactivate = (apartmentId: number) => {
    console.log(`Deactivating apartment ${apartmentId}`);
    // Implement deactivation logic
  };

  const handleViewDetails = (apartmentId: number) => {
    console.log(`Viewing details for apartment ${apartmentId}`);
    // Implement view details logic
  };

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
            <div className="text-2xl font-bold">{apartments.length}</div>
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
              {apartments.filter(apt => apt.status === "active").length}
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
              {apartments.reduce((sum, apt) => sum + apt.bookings, 0)}
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
              {(apartments.reduce((sum, apt) => sum + apt.rating, 0) / apartments.length).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Platform average</p>
          </CardContent>
        </Card>
      </div>

      {/* Apartments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Apartment Listings</CardTitle>
          <CardDescription>Manage all apartment listings on the platform</CardDescription>
        </CardHeader>
        <CardContent>
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
              {apartments.map((apartment) => (
                <TableRow key={apartment.id}>
                  <TableCell className="font-medium">{apartment.name}</TableCell>
                  <TableCell>{apartment.owner}</TableCell>
                  <TableCell>{apartment.location}</TableCell>
                  <TableCell>{apartment.rooms}</TableCell>
                  <TableCell>${apartment.price}/night</TableCell>
                  <TableCell>{apartment.bookings}</TableCell>
                  <TableCell>{apartment.rating}/5</TableCell>
                  <TableCell>
                    <Badge variant={apartment.status === "active" ? "default" : "secondary"}>
                      {apartment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewDetails(apartment.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeactivate(apartment.id)}
                        disabled={apartment.status === "inactive"}
                      >
                        <Ban className="h-4 w-4" />
                      </Button>
                    </div>
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

export default ApartmentListings;
