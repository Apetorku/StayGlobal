
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const ListApartmentForm = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    address: "",
    country: "",
    region: "",
    town: "",
    rooms: "",
    description: "",
    price: "",
    image: null as File | null
  });

  const countries = ["USA", "Canada", "UK", "Germany", "France", "Spain", "Italy"];
  const regions = {
    USA: ["California", "New York", "Texas", "Florida"],
    Canada: ["Ontario", "Quebec", "British Columbia"],
    UK: ["England", "Scotland", "Wales"],
    Germany: ["Bavaria", "Berlin", "Hamburg"],
    France: ["Île-de-France", "Provence", "Normandy"],
    Spain: ["Madrid", "Catalonia", "Andalusia"],
    Italy: ["Tuscany", "Rome", "Milan"]
  };

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.contact || !formData.address || !formData.country || 
        !formData.region || !formData.town || !formData.rooms || !formData.price) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Mock save to database
    console.log("Saving apartment:", formData);
    
    toast({
      title: "Success!",
      description: "Your apartment has been listed successfully",
    });

    // Reset form
    setFormData({
      name: "",
      contact: "",
      address: "",
      country: "",
      region: "",
      town: "",
      rooms: "",
      description: "",
      price: "",
      image: null
    });
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
              <Label htmlFor="name">Property Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="e.g., Cozy Downtown Apartment"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact">Contact Number *</Label>
              <Input
                id="contact"
                value={formData.contact}
                onChange={(e) => handleInputChange("contact", e.target.value)}
                placeholder="+1 234 567 8900"
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
                  {countries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
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
                  {formData.country && regions[formData.country as keyof typeof regions]?.map((region) => (
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
              <Label htmlFor="rooms">Number of Rooms *</Label>
              <Input
                id="rooms"
                type="number"
                value={formData.rooms}
                onChange={(e) => handleInputChange("rooms", e.target.value)}
                placeholder="e.g., 3"
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price per Night ($) *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                placeholder="e.g., 120"
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Property Image</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Describe your property, amenities, nearby attractions..."
                rows={4}
              />
            </div>
          </div>

          <Button type="submit" className="w-full">
            List Apartment
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ListApartmentForm;
