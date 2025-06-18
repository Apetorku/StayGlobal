
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Building, MessageSquare, AlertTriangle } from "lucide-react";

const OwnerProfiles = () => {
  // Mock owner data
  const owners = [
    {
      id: "OWN001",
      name: "John Smith",
      email: "john.smith@email.com",
      phone: "+1-555-0101",
      joinDate: "2024-01-15",
      apartments: 2,
      totalBookings: 20,
      complaints: 0,
      rating: 4.8,
      status: "active"
    },
    {
      id: "OWN002",
      name: "Maria Garcia",
      email: "maria.garcia@email.com",
      phone: "+1-555-0102",
      joinDate: "2024-02-20",
      apartments: 1,
      totalBookings: 15,
      complaints: 1,
      rating: 4.9,
      status: "active"
    },
    {
      id: "OWN003",
      name: "David Wilson",
      email: "david.wilson@email.com",
      phone: "+1-555-0103",
      joinDate: "2024-03-10",
      apartments: 1,
      totalBookings: 5,
      complaints: 2,
      rating: 4.2,
      status: "warning"
    },
    {
      id: "OWN004",
      name: "Sarah Johnson",
      email: "sarah.johnson@email.com",
      phone: "+1-555-0104",
      joinDate: "2024-04-05",
      apartments: 3,
      totalBookings: 35,
      complaints: 0,
      rating: 4.7,
      status: "active"
    },
  ];

  const handleContactOwner = (ownerId: string) => {
    console.log(`Contacting owner ${ownerId}`);
    // Implement contact logic
  };

  const handleViewApartments = (ownerId: string) => {
    console.log(`Viewing apartments for owner ${ownerId}`);
    // Implement view apartments logic
  };

  const getStatusBadge = (status: string, complaints: number) => {
    if (complaints > 1) return <Badge variant="destructive">High Risk</Badge>;
    if (status === "warning") return <Badge variant="secondary">Warning</Badge>;
    return <Badge variant="default">Active</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Owners</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{owners.length}</div>
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
            <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {owners.reduce((sum, owner) => sum + owner.complaints, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Pending resolution</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Owner Rating</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(owners.reduce((sum, owner) => sum + owner.rating, 0) / owners.length).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Platform average</p>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Owner</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead>Apartments</TableHead>
                <TableHead>Bookings</TableHead>
                <TableHead>Complaints</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {owners.map((owner) => (
                <TableRow key={owner.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{owner.name}</div>
                      <div className="text-sm text-muted-foreground">{owner.id}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm">{owner.email}</div>
                      <div className="text-sm text-muted-foreground">{owner.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>{owner.joinDate}</TableCell>
                  <TableCell>{owner.apartments}</TableCell>
                  <TableCell>{owner.totalBookings}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <span>{owner.complaints}</span>
                      {owner.complaints > 0 && <AlertTriangle className="h-4 w-4 text-red-500" />}
                    </div>
                  </TableCell>
                  <TableCell>{owner.rating}/5</TableCell>
                  <TableCell>
                    {getStatusBadge(owner.status, owner.complaints)}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewApartments(owner.id)}
                      >
                        <Building className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleContactOwner(owner.id)}
                      >
                        <MessageSquare className="h-4 w-4" />
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

export default OwnerProfiles;
