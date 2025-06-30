import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, AlertCircle } from 'lucide-react';
import { globalCountries } from '@/data/countries';
import identityVerificationService, { NationalIdData } from '@/services/identityVerificationService';

interface NationalIdFormProps {
  onComplete: (data: NationalIdData) => void;
  initialData?: NationalIdData;
}

const NationalIdForm: React.FC<NationalIdFormProps> = ({ onComplete, initialData }) => {
  const [formData, setFormData] = useState<NationalIdData>({
    idNumber: initialData?.idNumber || '',
    idType: initialData?.idType || 'national_id',
    country: initialData?.country || '',
    fullName: initialData?.fullName || '',
    dateOfBirth: initialData?.dateOfBirth || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);

  const idTypes = [
    { value: 'national_id', label: 'National ID Card' },
    { value: 'passport', label: 'Passport' },
    { value: 'drivers_license', label: 'Driver\'s License' },
    { value: 'voters_id', label: 'Voter\'s ID Card' }
  ];

  const handleInputChange = (field: keyof NationalIdData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required field validation
    if (!formData.idNumber.trim()) {
      newErrors.idNumber = 'ID number is required';
    } else if (!identityVerificationService.validateIdNumber(formData.idNumber, formData.idType, formData.country)) {
      newErrors.idNumber = 'Invalid ID number format';
    }

    if (!formData.country) {
      newErrors.country = 'Country is required';
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 18) {
        newErrors.dateOfBirth = 'You must be at least 18 years old';
      }
      
      if (birthDate > today) {
        newErrors.dateOfBirth = 'Date of birth cannot be in the future';
      }
    }



    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsValidating(true);
    
    try {
      // Additional validation could be done here (e.g., API call to verify ID)
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate validation
      
      onComplete(formData);
    } catch (error) {
      setErrors({ general: 'Failed to validate ID information. Please try again.' });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          National ID Information
        </CardTitle>
        <CardDescription>
          Enter your national identification details exactly as they appear on your ID document
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ID Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="idType">ID Document Type *</Label>
            <Select 
              value={formData.idType} 
              onValueChange={(value) => handleInputChange('idType', value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select ID type" />
              </SelectTrigger>
              <SelectContent>
                {idTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Country Selection */}
          <div className="space-y-2">
            <Label htmlFor="country">Country of Issue *</Label>
            <Select 
              value={formData.country} 
              onValueChange={(value) => handleInputChange('country', value)}
            >
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
            {errors.country && (
              <p className="text-sm text-red-600">{errors.country}</p>
            )}
          </div>

          {/* ID Number */}
          <div className="space-y-2">
            <Label htmlFor="idNumber">ID Number *</Label>
            <Input
              id="idNumber"
              type="text"
              value={formData.idNumber}
              onChange={(e) => handleInputChange('idNumber', e.target.value)}
              placeholder="Enter your ID number"
              className={errors.idNumber ? 'border-red-500' : ''}
            />
            {errors.idNumber && (
              <p className="text-sm text-red-600">{errors.idNumber}</p>
            )}
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name (as on ID) *</Label>
            <Input
              id="fullName"
              type="text"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              placeholder="Enter your full name"
              className={errors.fullName ? 'border-red-500' : ''}
            />
            {errors.fullName && (
              <p className="text-sm text-red-600">{errors.fullName}</p>
            )}
          </div>

          {/* Date of Birth */}
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth *</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              className={errors.dateOfBirth ? 'border-red-500' : ''}
            />
            {errors.dateOfBirth && (
              <p className="text-sm text-red-600">{errors.dateOfBirth}</p>
            )}
          </div>



          {/* General Error */}
          {errors.general && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.general}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full"
            disabled={isValidating}
          >
            {isValidating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Validating...
              </>
            ) : (
              'Continue to Document Upload'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default NationalIdForm;
