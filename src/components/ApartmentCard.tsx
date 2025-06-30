
import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BookingModal from "./WorkingBookingModal";
import { Star, Users, MapPin, Wifi, Car, Coffee, Snowflake } from "lucide-react";

interface Apartment {
  id: number;
  title: string;
  location: string;
  price: number;
  availableRooms: number;
  totalRooms: number;
  image: string;
  rating: number;
  amenities: string[];
}

interface ApartmentCardProps {
  apartment: Apartment;
}

const ApartmentCard = ({ apartment }: ApartmentCardProps) => {
  const [showBooking, setShowBooking] = useState(false);

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'wifi':
        return <Wifi className="h-4 w-4" />;
      case 'parking':
        return <Car className="h-4 w-4" />;
      case 'kitchen':
        return <Coffee className="h-4 w-4" />;
      case 'ac':
        return <Snowflake className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="p-0">
          <div className="relative">
            <img 
              src={apartment.image} 
              alt={apartment.title}
              className="w-full h-48 object-cover"
            />
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="bg-white/90">
                ${apartment.price}/night
              </Badge>
            </div>
            <div className="absolute top-2 left-2">
              <Badge 
                variant={apartment.availableRooms > 0 ? "default" : "destructive"}
                className="bg-white/90 text-gray-900"
              >
                {apartment.availableRooms > 0 
                  ? `${apartment.availableRooms} rooms available` 
                  : "Fully booked"
                }
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-lg text-gray-900">{apartment.title}</h3>
              <div className="flex items-center text-gray-600 text-sm">
                <MapPin className="h-4 w-4 mr-1" />
                {apartment.location}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-sm text-gray-600 ml-1">{apartment.rating}</span>
              </div>
              <div className="flex items-center text-gray-600 text-sm">
                <Users className="h-4 w-4 mr-1" />
                {apartment.totalRooms} total rooms
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {apartment.amenities.map((amenity) => (
                <Badge key={amenity} variant="outline" className="text-xs">
                  <span className="mr-1">{getAmenityIcon(amenity)}</span>
                  {amenity}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <Button 
            onClick={() => setShowBooking(true)}
            disabled={apartment.availableRooms === 0}
            className="w-full"
          >
            {apartment.availableRooms > 0 ? "Book Now" : "Fully Booked"}
          </Button>
        </CardFooter>
      </Card>

      <BookingModal
        apartment={apartment}
        isOpen={showBooking}
        onClose={() => setShowBooking(false)}
      />
    </>
  );
};

export default ApartmentCard;
