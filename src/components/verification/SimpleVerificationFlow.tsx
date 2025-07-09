import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  User,
  Home,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { globalCountries } from '@/data/countries';
import { useAuth } from '@clerk/clerk-react';
import identityVerificationService from '@/services/identityVerificationService';

interface SimpleVerificationFlowProps {
  onComplete: (data: any) => void;
  onPaymentSetupRequired?: () => void;
}

const SimpleVerificationFlow: React.FC<SimpleVerificationFlowProps> = ({ onComplete, onPaymentSetupRequired }) => {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Personal Information
  const [personalInfo, setPersonalInfo] = useState({
    fullName: '',
    idNumber: '',
    idType: 'national_id' as 'national_id' | 'passport' | 'drivers_license' | 'voters_id',
    country: '',
    dateOfBirth: '',
    phoneNumber: ''
  });

  // House Registration
  const [houseRegistration, setHouseRegistration] = useState({
    registrationNumber: '',
    address: '',
    registrationDate: '',
    issuingAuthority: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('🚀 Starting verification submission...');
    console.log('📋 Personal Info:', personalInfo);
    console.log('🏠 House Registration:', houseRegistration);

    try {
      // Validate required fields
      if (!personalInfo.fullName || !personalInfo.idNumber || !personalInfo.country ||
          !personalInfo.dateOfBirth || !personalInfo.phoneNumber) {
        throw new Error('Please fill in all personal information fields');
      }

      if (!houseRegistration.registrationNumber || !houseRegistration.address) {
        throw new Error('Please fill in house registration number and address');
      }

      console.log('✅ Validation passed');

      // Get authentication token
      const token = await getToken();
      console.log('🔑 Token obtained:', token ? 'Yes' : 'No');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Actually submit verification to backend
      console.log('🔄 Submitting verification to backend...');

      const verificationData = {
        personalInfo: personalInfo,
        houseRegistration: houseRegistration
      };

      const result = await identityVerificationService.submitSimpleVerification(verificationData, token);
      console.log('📥 Backend response:', result);

      console.log('✅ Verification submitted successfully:', result);
      setSuccess(true);

      // Call onPaymentSetupRequired to redirect to payment setup after a short delay
      setTimeout(() => {
        if (onPaymentSetupRequired) {
          console.log('🔄 Redirecting to payment setup...');
          onPaymentSetupRequired();
        } else {
          onComplete(result);
        }
      }, 2000);

    } catch (error) {
      console.error('❌ Verification error:', error);
      setError(error instanceof Error ? error.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-2xl mx-auto border-green-200 bg-green-50">
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-green-800 mb-2">
            Verification Submitted Successfully!
          </h3>
          <p className="text-green-700">
            Your house owner verification has been processed. Redirecting to payment setup...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-blue-600" />
          House Owner Verification
        </CardTitle>
        <CardDescription>
          Simple and secure verification for property owners
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={personalInfo.fullName}
                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    value={personalInfo.phoneNumber}
                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    placeholder="+1234567890"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Select value={personalInfo.country} onValueChange={(value) => setPersonalInfo(prev => ({ ...prev, country: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your country" />
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
                  <Label htmlFor="idType">ID Type *</Label>
                  <Select value={personalInfo.idType} onValueChange={(value: any) => setPersonalInfo(prev => ({ ...prev, idType: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ID type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="national_id">National ID</SelectItem>
                      <SelectItem value="passport">Passport</SelectItem>
                      <SelectItem value="drivers_license">Driver's License</SelectItem>
                      <SelectItem value="voters_id">Voter's ID</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="idNumber">ID Number *</Label>
                  <Input
                    id="idNumber"
                    value={personalInfo.idNumber}
                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, idNumber: e.target.value.toUpperCase() }))}
                    placeholder="Enter your ID number"
                    className="font-mono"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={personalInfo.dateOfBirth}
                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* House Registration Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Home className="h-5 w-5" />
                House Registration Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">House Registration Number *</Label>
                  <Input
                    id="registrationNumber"
                    value={houseRegistration.registrationNumber}
                    onChange={(e) => setHouseRegistration(prev => ({ ...prev, registrationNumber: e.target.value.toUpperCase() }))}
                    placeholder="HR-123456789"
                    className="font-mono"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Official house registration number from local authorities
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="issuingAuthority">Issuing Authority</Label>
                  <Input
                    id="issuingAuthority"
                    value={houseRegistration.issuingAuthority}
                    onChange={(e) => setHouseRegistration(prev => ({ ...prev, issuingAuthority: e.target.value }))}
                    placeholder="Local Government Authority"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Property Address *</Label>
                  <Input
                    id="address"
                    value={houseRegistration.address}
                    onChange={(e) => setHouseRegistration(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="123 Main Street, City, Region"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registrationDate">Registration Date</Label>
                  <Input
                    id="registrationDate"
                    type="date"
                    value={houseRegistration.registrationDate}
                    onChange={(e) => setHouseRegistration(prev => ({ ...prev, registrationDate: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Fraud Prevention:</strong> We verify all information against government databases 
              and check for duplicate registrations to prevent fraud. Your data is encrypted and secure.
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              'Submit Verification'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SimpleVerificationFlow;
