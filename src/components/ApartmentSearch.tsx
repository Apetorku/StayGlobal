
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ApartmentCard from "./ApartmentCard";
import { Search, MapPin } from "lucide-react";

// Mock data for demonstration
const countries = [
  { id: "us", name: "United States" },
  { id: "uk", name: "United Kingdom" },
  { id: "fr", name: "France" },
  { id: "de", name: "Germany" },
];

const regions = {
  us: [
    { id: "ny", name: "New York" },
    { id: "ca", name: "California" },
    { id: "fl", name: "Florida" },
  ],
  uk: [
    { id: "london", name: "London" },
    { id: "manchester", name: "Manchester" },
    { id: "birmingham", name: "Birmingham" },
  ],
};

const towns = {
  ny: ["Manhattan", "Brooklyn", "Queens"],
  ca: ["Los Angeles", "San Francisco", "San Diego"],
  london: ["Westminster", "Camden", "Kensington"],
  manchester: ["City Centre", "Northern Quarter", "Ancoats"],
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
  const [searchResults, setSearchResults] = useState(mockApartments);

  const handleSearch = () => {
    // Filter apartments based on selected criteria
    let filtered = mockApartments;
    
    if (selectedCountry || selectedRegion || selectedTown) {
      // In a real app, this would filter based on actual location data
      setSearchResults(filtered);
    }
  };

  const availableRegions = selectedCountry ? regions[selectedCountry] || [] : [];
  const availableTowns = selectedRegion ? towns[selectedRegion] || [] : [];

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
                  {countries.map((country) => (
                    <SelectItem key={country.id} value={country.id}>
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
                    <SelectItem key={region.id} value={region.id}>
                      {region.name}
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
        <h3 className="text-lg font-semibold">
          Found {searchResults.length} apartments
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {searchResults.map((apartment) => (
            <ApartmentCard key={apartment.id} apartment={apartment} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ApartmentSearch;
