
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@clerk/clerk-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apartmentService } from "@/services/apartmentService";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";
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

const ListApartmentForm = () => {
  const { toast } = useToast();
  const { getToken, userId, user } = useAuth();
  const queryClient = useQueryClient();

  // Debug user authentication
  useEffect(() => {
    console.log('🔍 ListApartmentForm - User Auth Status:', {
      userId,
      userEmail: user?.primaryEmailAddress?.emailAddress,
      isSignedIn: !!userId
    });
  }, [userId, user]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    address: "",
    country: "",
    region: "",
    town: "",
    totalRooms: "",
    availableRooms: "",
    price: "",
    amenities: [] as string[],
    images: [] as string[]
  });

  const [imageUrls, setImageUrls] = useState<string[]>([""]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get available regions for selected country
  const availableRegions = formData.country ? getRegionsForCountry(formData.country) : [];

  // Reset region when country changes
  useEffect(() => {
    if (formData.country) {
      setFormData(prev => ({ ...prev, region: "" }));
    }
  }, [formData.country]);

  const availableAmenities = ["WiFi", "AC", "Kitchen", "Parking", "Pool", "Gym", "Garden", "Security"];

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      address: "",
      country: "",
      region: "",
      town: "",
      totalRooms: "",
      availableRooms: "",
      price: "",
      amenities: [],
      images: []
    });
    setImageUrls([""]);
  };

  // Create apartment mutation
  const createApartmentMutation = useMutation({
    mutationFn: async (apartmentData: {
      title: string;
      description: string;
      location: {
        country: string;
        region: string;
        town: string;
        address: string;
      };
      price: number;
      totalRooms: number;
      availableRooms: number;
      amenities: string[];
      images: string[];
    }) => {
      console.log('🔑 Getting authentication token...');
      const token = await getToken();
      if (!token) {
        console.error('❌ No authentication token available');
        throw new Error('Authentication required');
      }
      console.log('✅ Token obtained, creating apartment...');
      console.log('📤 Sending apartment data:', apartmentData);
      return apartmentService.createApartment(apartmentData, token);
    },
    onSuccess: (data) => {
      console.log('✅ Apartment created successfully:', data);
      toast({
        title: 'Success!',
        description: 'Your apartment has been listed successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['owner-apartments'] });
      resetForm();
    },
    onError: (error: Error) => {
      console.error('❌ Failed to create apartment:', error);

      // Check if it's a payment account requirement error
      if (error.message.includes('Payment account required') || error.message.includes('payment account')) {
        toast({
          title: 'Payment Account Required',
          description: 'You must set up your payment account before listing apartments. Please complete your payment setup first.',
          variant: 'destructive',
        });
      } else if (error.message.includes('Identity verification')) {
        toast({
          title: 'Identity Verification Required',
          description: 'Please complete your identity verification before listing apartments.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: error.message || 'Failed to list apartment. Please try again.',
          variant: 'destructive',
        });
      }
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({
        ...prev,
        image: e.target.files![0]
      }));
    }
  };

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      amenities: checked
        ? [...prev.amenities, amenity]
        : prev.amenities.filter(a => a !== amenity)
    }));
  };

  const handleImageUrlChange = (index: number, url: string) => {
    const newUrls = [...imageUrls];
    newUrls[index] = url;
    setImageUrls(newUrls);

    // Update form data
    setFormData(prev => ({
      ...prev,
      images: newUrls.filter(url => url.trim() !== '')
    }));
  };

  const addImageUrl = () => {
    setImageUrls([...imageUrls, ""]);
  };

  const removeImageUrl = (index: number) => {
    const newUrls = imageUrls.filter((_, i) => i !== index);
    setImageUrls(newUrls);
    setFormData(prev => ({
      ...prev,
      images: newUrls.filter(url => url.trim() !== '')
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Debug form data
    console.log('🔍 Form submission - Current form data:', formData);
    console.log('🔍 Description value:', `"${formData.description}"`);
    console.log('🔍 Description length:', formData.description?.length);
    console.log('🔍 Description trimmed:', `"${formData.description?.trim()}"`);
    console.log('🔍 Description trimmed length:', formData.description?.trim()?.length);

    // Basic validation with proper trimming
    if (!formData.title?.trim() || !formData.description?.trim() || !formData.address?.trim() || !formData.price || !formData.country || !formData.region || !formData.town) {
      const missingFields = [];
      if (!formData.title?.trim()) missingFields.push('Title');
      if (!formData.description?.trim()) missingFields.push('Description');
      if (!formData.address?.trim()) missingFields.push('Address');
      if (!formData.price) missingFields.push('Price');
      if (!formData.country) missingFields.push('Country');
      if (!formData.region) missingFields.push('Region');
      if (!formData.town) missingFields.push('Town');

      console.log('❌ Missing fields:', missingFields);

      toast({
        title: "Missing Information",
        description: `Please fill in all required fields: ${missingFields.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    if (!formData.totalRooms || !formData.availableRooms) {
      toast({
        title: "Missing Information",
        description: "Please specify total and available rooms",
        variant: "destructive",
      });
      return;
    }

    if (parseInt(formData.availableRooms) > parseInt(formData.totalRooms)) {
      toast({
        title: "Invalid Data",
        description: "Available rooms cannot exceed total rooms",
        variant: "destructive",
      });
      return;
    }

    // Prepare apartment data for API
    const apartmentData = {
      title: formData.title,
      description: formData.description,
      location: {
        country: formData.country,
        region: formData.region,
        town: formData.town,
        address: formData.address,
      },
      price: parseFloat(formData.price),
      totalRooms: parseInt(formData.totalRooms),
      availableRooms: parseInt(formData.availableRooms),
      amenities: formData.amenities,
      images: formData.images.length > 0 ? formData.images : ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800"],
    };

    console.log('🏠 Submitting apartment data:', apartmentData);
    createApartmentMutation.mutate(apartmentData);
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>List New Apartment</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Property Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="e.g., Cozy Downtown Apartment"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price per Night ($) *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                placeholder="150"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Full Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="123 Main Street, Apartment 4B"
              />
            </div>

            <div className="space-y-2">
              <Label>Country *</Label>
              <Select value={formData.country} onValueChange={(value) => handleInputChange("country", value)}>
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
              <Label>Region *</Label>
              <Select 
                value={formData.region} 
                onValueChange={(value) => handleInputChange("region", value)}
                disabled={!formData.country}
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
              <Label htmlFor="town">Town/City *</Label>
              <Input
                id="town"
                value={formData.town}
                onChange={(e) => handleInputChange("town", e.target.value)}
                placeholder="Enter town or city"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalRooms">Total Rooms *</Label>
              <Input
                id="totalRooms"
                type="number"
                value={formData.totalRooms}
                onChange={(e) => handleInputChange("totalRooms", e.target.value)}
                placeholder="e.g., 3"
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="availableRooms">Available Rooms *</Label>
              <Input
                id="availableRooms"
                type="number"
                value={formData.availableRooms}
                onChange={(e) => handleInputChange("availableRooms", e.target.value)}
                placeholder="e.g., 2"
                min="1"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Describe your property, amenities, nearby attractions..."
                rows={4}
                required
              />
            </div>
          </div>

          {/* Amenities Section */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Amenities</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {availableAmenities.map((amenity) => (
                <div key={amenity} className="flex items-center space-x-2">
                  <Checkbox
                    id={amenity}
                    checked={formData.amenities.includes(amenity)}
                    onCheckedChange={(checked) => handleAmenityChange(amenity, checked as boolean)}
                  />
                  <Label htmlFor={amenity} className="text-sm font-normal">
                    {amenity}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Image URLs Section */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Property Images</Label>
            <p className="text-sm text-gray-600">Add image URLs for your property</p>
            {imageUrls.map((url, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={url}
                  onChange={(e) => handleImageUrlChange(index, e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1"
                />
                {imageUrls.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeImageUrl(index)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addImageUrl}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              Add Another Image
            </Button>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={createApartmentMutation.isPending}
          >
            {createApartmentMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Listing...
              </>
            ) : (
              'List Apartment'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ListApartmentForm;
