
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Home, Shield, MessageSquare, Clock, Star, MapPin, Users } from "lucide-react";
import ApartmentCard from "@/components/ApartmentCard";

const Landing = () => {
  const navigate = useNavigate();

  // Mock popular apartments data
  const popularApartments = [
    {
      id: 1,
      title: "Modern Downtown Loft",
      location: "New York, USA",
      price: 120,
      availableRooms: 2,
      totalRooms: 4,
      image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80",
      rating: 4.8,
      amenities: ["WiFi", "Kitchen", "AC", "Parking"]
    },
    {
      id: 2,
      title: "Cozy Seaside Villa",
      location: "Barcelona, Spain",
      price: 150,
      availableRooms: 1,
      totalRooms: 3,
      image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80",
      rating: 4.9,
      amenities: ["WiFi", "Kitchen", "AC"]
    },
    {
      id: 3,
      title: "Mountain Retreat Cabin",
      location: "Aspen, USA",
      price: 200,
      availableRooms: 3,
      totalRooms: 5,
      image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80",
      rating: 4.7,
      amenities: ["WiFi", "Kitchen", "Parking"]
    },
    {
      id: 4,
      title: "City Center Apartment",
      location: "London, UK",
      price: 180,
      availableRooms: 0,
      totalRooms: 2,
      image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80",
      rating: 4.6,
      amenities: ["WiFi", "AC"]
    },
    {
      id: 5,
      title: "Beachfront Studio",
      location: "Miami, USA",
      price: 90,
      availableRooms: 1,
      totalRooms: 1,
      image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80",
      rating: 4.5,
      amenities: ["WiFi", "Kitchen"]
    },
    {
      id: 6,
      title: "Historic Town House",
      location: "Paris, France",
      price: 160,
      availableRooms: 2,
      totalRooms: 4,
      image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80",
      rating: 4.8,
      amenities: ["WiFi", "Kitchen", "AC"]
    }
  ];

  const features = [
    {
      icon: Shield,
      title: "Secure Ticketing",
      description: "Every booking comes with a unique ticket code for secure check-in process"
    },
    {
      icon: MessageSquare,
      title: "Private Chat System",
      description: "Communicate directly with property owners through our secure messaging platform"
    },
    {
      icon: Clock,
      title: "Automated Check-in",
      description: "Streamlined check-in and check-out process with real-time tracking"
    },
    {
      icon: Star,
      title: "Verified Properties",
      description: "All properties are verified and rated by our community of travelers"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Home className="h-8 w-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-900">StayGlobal</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Your Global Home Away From Home
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
            Experience trustworthy, secure, and seamless apartment booking worldwide. 
            Connect directly with property owners, enjoy automated check-ins, and travel with confidence.
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <Button 
              size="lg" 
              className="w-full sm:w-auto px-8 py-4 text-lg"
              onClick={() => navigate("/owner")}
            >
              <Home className="mr-2 h-5 w-5" />
              List Your Apartment
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="w-full sm:w-auto px-8 py-4 text-lg"
              onClick={() => navigate("/search")}
            >
              <Users className="mr-2 h-5 w-5" />
              Find Apartments
            </Button>
            <Button 
              size="lg" 
              variant="secondary"
              className="w-full sm:w-auto px-8 py-4 text-lg"
              onClick={() => navigate("/admin")}
            >
              <Shield className="mr-2 h-5 w-5" />
              Admin Dashboard
            </Button>
          </div>
        </div>
      </section>

      {/* Popular Apartments Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Popular Destinations</h2>
            <p className="text-lg text-gray-600">Discover our most loved apartments around the world</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {popularApartments.map((apartment) => (
              <ApartmentCard key={apartment.id} apartment={apartment} />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose StayGlobal?</h2>
            <p className="text-lg text-gray-600">Experience the future of apartment rentals</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto mb-4 p-3 bg-indigo-100 rounded-full w-fit">
                    <feature.icon className="h-8 w-8 text-indigo-600" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Home className="h-6 w-6 text-indigo-400" />
                <h3 className="text-xl font-bold">StayGlobal</h3>
              </div>
              <p className="text-gray-400">
                Your trusted partner for global apartment rentals and seamless travel experiences.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Safety</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 StayGlobal. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
