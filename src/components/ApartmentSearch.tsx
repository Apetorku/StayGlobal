
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { apartmentService, type ApartmentFilters } from "@/services/apartmentService";
import ApartmentCard from "./ApartmentCard";
import { Search, MapPin, Loader2 } from "lucide-react";
import { globalCountries } from "@/data/countries";

// Simple regions mapping for common countries
const getRegionsForCountry = (countryName: string): string[] => {
  const regionsMap: Record<string, string[]> = {
    'Ghana': ['Greater Accra', 'Ashanti', 'Northern', 'Western', 'Central', 'Eastern', 'Volta', 'Upper East', 'Upper West', 'Brong-Ahafo'],
    'Nigeria': ['Lagos', 'Abuja', 'Kano', 'Rivers', 'Oyo', 'Kaduna', 'Anambra', 'Plateau', 'Cross River', 'Delta'],
    'Kenya': ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi', 'Kitale', 'Garissa', 'Kakamega'],
    'South Africa': ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Limpopo', 'Mpumalanga', 'North West', 'Free State', 'Northern Cape'],
    'United States': ['California', 'Texas', 'Florida', 'New York', 'Pennsylvania', 'Illinois', 'Ohio', 'Georgia', 'North Carolina', 'Michigan'],
    'United Kingdom': ['England', 'Scotland', 'Wales', 'Northern Ireland'],
    'Canada': ['Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Manitoba', 'Saskatchewan', 'Nova Scotia', 'New Brunswick', 'Newfoundland and Labrador', 'Prince Edward Island'],
    'Australia': ['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia', 'Tasmania', 'Australian Capital Territory', 'Northern Territory']
  };

  return regionsMap[countryName] || ['Central Region', 'Northern Region', 'Southern Region', 'Eastern Region', 'Western Region'];
};

const mockApartments = [
  {
    id: 1,
    title: "Modern Downtown Apartment",
    location: "Manhattan, New York",
    price: 150,
    availableRooms: 3,
    totalRooms: 5,
    image: "/placeholder.svg",
    rating: 4.8,
    amenities: ["WiFi", "Kitchen", "Parking", "AC"],
  },
  {
    id: 2,
    title: "Cozy Studio in SoHo",
    location: "Manhattan, New York",
    price: 120,
    availableRooms: 1,
    totalRooms: 1,
    image: "/placeholder.svg",
    rating: 4.6,
    amenities: ["WiFi", "Kitchen", "AC"],
  },
  {
    id: 3,
    title: "Luxury Penthouse",
    location: "Brooklyn, New York",
    price: 300,
    availableRooms: 2,
    totalRooms: 3,
    image: "/placeholder.svg",
    rating: 4.9,
    amenities: ["WiFi", "Kitchen", "Parking", "AC", "Gym", "Pool"],
  },
];

const ApartmentSearch = () => {
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedTown, setSelectedTown] = useState("");
  const [filters, setFilters] = useState<ApartmentFilters>({});

  // Fetch apartments using React Query
  const { data: apartmentData, isLoading, error, refetch } = useQuery({
    queryKey: ['apartments', filters],
    queryFn: () => apartmentService.getApartments(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Reset region and town when country changes
  useEffect(() => {
    setSelectedRegion("");
    setSelectedTown("");
  }, [selectedCountry]);

  // Reset town when region changes
  useEffect(() => {
    setSelectedTown("");
  }, [selectedRegion]);

  const handleSearch = () => {
    const newFilters: ApartmentFilters = {};

    if (selectedCountry) newFilters.country = selectedCountry;
    if (selectedRegion) newFilters.region = selectedRegion;
    if (selectedTown) newFilters.town = selectedTown;

    setFilters(newFilters);
  };

  // Get available regions for selected country
  const availableRegions = selectedCountry ? getRegionsForCountry(selectedCountry) : [];

  // Get available towns for selected region (for now, we'll use a simple list)
  const availableTowns = selectedRegion ? [
    "Accra", "Kumasi", "Tamale", "Cape Coast", "Sekondi-Takoradi", "Sunyani", "Koforidua", "Ho", "Wa", "Bolgatanga"
  ] : [];

  return (
    <div className="space-y-6">
      {/* Search Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Search Apartments
          </CardTitle>
          <CardDescription>
            Filter by location to find your perfect apartment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {globalCountries.map((country) => (
                    <SelectItem key={country.code} value={country.name}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Select 
                value={selectedRegion} 
                onValueChange={setSelectedRegion}
                disabled={!selectedCountry}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {availableRegions.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="town">Town</Label>
              <Select 
                value={selectedTown} 
                onValueChange={setSelectedTown}
                disabled={!selectedRegion}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select town" />
                </SelectTrigger>
                <SelectContent>
                  {availableTowns.map((town) => (
                    <SelectItem key={town} value={town}>
                      {town}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={handleSearch} className="w-full">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <span className="ml-2 text-gray-600">Loading apartments...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">Failed to load apartments</p>
            <Button onClick={() => refetch()} variant="outline">
              Try Again
            </Button>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-semibold">
              Found {apartmentData?.pagination.total || 0} apartments
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {apartmentData?.apartments.map((apartment) => (
                <ApartmentCard key={apartment._id} apartment={{
                  id: apartment._id,
                  title: apartment.title,
                  location: `${apartment.location.town}, ${apartment.location.region}`,
                  price: apartment.price,
                  availableRooms: apartment.availableRooms,
                  totalRooms: apartment.totalRooms,
                  image: apartment.images[0] || '/placeholder.svg',
                  rating: apartment.rating,
                  amenities: apartment.amenities
                }} />
              ))}
            </div>
            {(!apartmentData?.apartments || apartmentData.apartments.length === 0) && (
              <div className="text-center py-12">
                <p className="text-gray-600">No apartments found. Try adjusting your search criteria.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ApartmentSearch;
