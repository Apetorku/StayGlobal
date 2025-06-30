import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Fingerprint, 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  User,
  Calendar,
  MapPin,
  Shield,
  Zap,
  Database
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { globalCountries } from '@/data/countries';
import identityVerificationService from '@/services/identityVerificationService';
import governmentDatabaseService from '@/services/governmentDatabaseService';
import biometricCaptureService from '@/services/biometricCaptureService';

interface QuickVerificationFlowProps {
  onComplete: (data: any) => void;
}

interface RetrievedData {
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  address: string;
  issuingAuthority: string;
  expiryDate: string;
  photo: string;
  verified: boolean;
}

const QuickVerificationFlow: React.FC<QuickVerificationFlowProps> = ({ onComplete }) => {
  const [step, setStep] = useState<'input' | 'fingerprint' | 'retrieving' | 'review'>('input');
  const [idNumber, setIdNumber] = useState('');
  const [idType, setIdType] = useState<'national_id' | 'passport' | 'drivers_license' | 'voters_id'>('national_id');
  const [country, setCountry] = useState('');
  const [fingerprintCaptured, setFingerprintCaptured] = useState(false);
  const [retrievedData, setRetrievedData] = useState<RetrievedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  const handleIdSubmit = () => {
    if (!idNumber || !country) {
      setError('Please enter your ID number and select your country');
      return;
    }

    // Validate ID format
    const validation = governmentDatabaseService.validateIdFormat(idNumber, country, idType);
    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      return;
    }

    setError('');
    setStep('fingerprint');
  };

  const handleFingerprintCapture = async () => {
    setLoading(true);
    setStep('retrieving');
    setProgress(0);

    try {
      // Step 1: Initialize fingerprint scanner
      setProgress(10);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate scanner initialization

      // Step 2: Capture actual fingerprint
      setProgress(25);
      const fingerprintData = await captureFingerprint();

      if (!fingerprintData) {
        throw new Error('Fingerprint capture failed. Please try again.');
      }

      setProgress(40);

      // Step 3: Verify fingerprint against government database
      setProgress(50);
      const biometricResult = await governmentDatabaseService.verifyBiometric(
        idNumber,
        fingerprintData,
        'fingerprint',
        country,
        idType
      );

      if (!biometricResult.matched) {
        throw new Error(`Fingerprint verification failed. Confidence: ${(biometricResult.confidence * 100).toFixed(1)}%. Please try again.`);
      }

      setFingerprintCaptured(true);
      setProgress(65);

      // Step 4: Only after successful biometric verification, query government database
      setProgress(75);
      const databaseResult = await governmentDatabaseService.queryCitizenRecord(
        idNumber,
        country,
        idType
      );

      if (!databaseResult.success) {
        throw new Error(databaseResult.error || 'Failed to retrieve data from government database');
      }

      // Step 5: Process retrieved data
      setProgress(90);
      const record = databaseResult.record!;

      const retrievedData: RetrievedData = {
        fullName: record.fullName,
        dateOfBirth: record.dateOfBirth,
        nationality: record.nationality,
        address: record.address,
        issuingAuthority: record.issuingAuthority,
        expiryDate: record.expiryDate,
        photo: record.photo,
        verified: true
      };

      setProgress(100);
      setRetrievedData(retrievedData);
      setStep('review');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to retrieve data. Please try again.');
      setStep('fingerprint');
    } finally {
      setLoading(false);
    }
  };

  // Actual fingerprint capture function using biometric service
  const captureFingerprint = async (): Promise<string | null> => {
    try {
      // Initialize biometric capture service
      await biometricCaptureService.initialize();

      // Get available biometric devices
      const devices = biometricCaptureService.getAvailableDevices();

      if (devices.length === 0) {
        throw new Error('No biometric capture devices available on this device');
      }

      // Capture fingerprint using the best available device
      const captureResult = await biometricCaptureService.captureFingerprint();

      if (!captureResult.success) {
        throw new Error('Fingerprint capture failed');
      }

      // Validate biometric quality
      const qualityCheck = biometricCaptureService.validateBiometricQuality(captureResult);

      if (!qualityCheck.isValid) {
        throw new Error(`Biometric quality issues: ${qualityCheck.issues.join(', ')}`);
      }

      console.log(`Fingerprint captured successfully with ${captureResult.quality} quality and ${(captureResult.confidence * 100).toFixed(1)}% confidence`);

      return captureResult.data || null;

    } catch (error) {
      console.error('Fingerprint capture error:', error);
      throw error instanceof Error ? error : new Error('Failed to capture fingerprint');
    }
  };

  const handleConfirmData = async () => {
    if (!retrievedData) return;

    try {
      setLoading(true);

      // Submit verification data
      const verificationData = {
        nationalId: {
          idNumber,
          idType,
          country,
          fullName: retrievedData.fullName,
          dateOfBirth: retrievedData.dateOfBirth,
          issuingAuthority: retrievedData.issuingAuthority,
          expiryDate: retrievedData.expiryDate
        },
        biometric: {
          fingerprintCaptured: true,
          verificationMethod: 'government_database'
        },
        autoRetrieved: true,
        verificationStatus: 'verified'
      };

      await identityVerificationService.submitVerification(verificationData);
      onComplete(verificationData);
    } catch (error) {
      setError('Failed to complete verification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for mock data generation
  const generateMockName = (): string => {
    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'James', 'Lisa', 'Robert', 'Maria'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  };

  const generateMockDOB = (): string => {
    const year = 1970 + Math.floor(Math.random() * 35);
    const month = 1 + Math.floor(Math.random() * 12);
    const day = 1 + Math.floor(Math.random() * 28);
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  };

  const generateMockAddress = (country: string): string => {
    const addresses = {
      'Ghana': ['123 Independence Avenue, Accra', '456 Kumasi Road, Ashanti Region', '789 Tamale Street, Northern Region'],
      'Nigeria': ['123 Victoria Island, Lagos', '456 Garki District, Abuja', '789 New Haven, Enugu'],
      'Kenya': ['123 Uhuru Highway, Nairobi', '456 Moi Avenue, Mombasa', '789 Kenyatta Road, Kisumu'],
      'South Africa': ['123 Nelson Mandela Square, Johannesburg', '456 Long Street, Cape Town', '789 Durban Road, KwaZulu-Natal']
    };
    
    const countryAddresses = addresses[country as keyof typeof addresses] || ['123 Main Street, City Center'];
    return countryAddresses[Math.floor(Math.random() * countryAddresses.length)];
  };

  const getIssuingAuthority = (country: string, idType: string): string => {
    const authorities = {
      'Ghana': {
        'national_id': 'National Identification Authority (NIA)',
        'passport': 'Ghana Immigration Service',
        'drivers_license': 'Driver and Vehicle Licensing Authority (DVLA)',
        'voters_id': 'Electoral Commission of Ghana'
      },
      'Nigeria': {
        'national_id': 'National Identity Management Commission (NIMC)',
        'passport': 'Nigeria Immigration Service',
        'drivers_license': 'Federal Road Safety Corps (FRSC)',
        'voters_id': 'Independent National Electoral Commission (INEC)'
      },
      'Kenya': {
        'national_id': 'Department of National Registration',
        'passport': 'Department of Immigration Services',
        'drivers_license': 'National Transport and Safety Authority (NTSA)',
        'voters_id': 'Independent Electoral and Boundaries Commission (IEBC)'
      }
    };

    return authorities[country as keyof typeof authorities]?.[idType] || 'Government Authority';
  };

  const generateMockExpiryDate = (): string => {
    const year = 2025 + Math.floor(Math.random() * 10);
    const month = 1 + Math.floor(Math.random() * 12);
    const day = 1 + Math.floor(Math.random() * 28);
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  };

  // Helper functions for ID format examples
  const getIdPlaceholder = (country: string, idType: string): string => {
    const placeholders = {
      'Ghana': {
        'national_id': 'GHA-123456789-1',
        'passport': 'A1234567',
        'drivers_license': 'DL12345678',
        'voters_id': 'VID12345678'
      },
      'Nigeria': {
        'national_id': 'NIN12345678901',
        'passport': 'A12345678',
        'drivers_license': 'ABC123456789',
        'voters_id': 'VIN1234567890'
      },
      'Kenya': {
        'national_id': 'KEN12345678',
        'passport': 'A1234567',
        'drivers_license': 'DL1234567',
        'voters_id': 'VR12345678'
      },
      'South Africa': {
        'national_id': 'ZA1234567890123',
        'passport': 'A12345678',
        'drivers_license': 'DL12345678',
        'voters_id': 'VID123456789'
      }
    };

    return placeholders[country as keyof typeof placeholders]?.[idType as keyof any] || 'Enter your ID number';
  };

  const getIdFormatExample = (country: string, idType: string): string => {
    const formats = {
      'Ghana': {
        'national_id': 'GHA-XXXXXXXXX-X (e.g., GHA-123456789-1)',
        'passport': 'AXXXXXXX (e.g., A1234567)',
        'drivers_license': 'DLXXXXXXXX (e.g., DL12345678)',
        'voters_id': 'VIDXXXXXXXX (e.g., VID12345678)'
      },
      'Nigeria': {
        'national_id': 'NINXXXXXXXXXXX (e.g., NIN12345678901)',
        'passport': 'AXXXXXXXX (e.g., A12345678)',
        'drivers_license': 'ABCXXXXXXXXX (e.g., ABC123456789)',
        'voters_id': 'VINXXXXXXXXXX (e.g., VIN1234567890)'
      },
      'Kenya': {
        'national_id': 'KENXXXXXXXX (e.g., KEN12345678)',
        'passport': 'AXXXXXXX (e.g., A1234567)',
        'drivers_license': 'DLXXXXXXX (e.g., DL1234567)',
        'voters_id': 'VRXXXXXXXX (e.g., VR12345678)'
      },
      'South Africa': {
        'national_id': 'ZAXXXXXXXXXXXXX (e.g., ZA1234567890123)',
        'passport': 'AXXXXXXXX (e.g., A12345678)',
        'drivers_license': 'DLXXXXXXXX (e.g., DL12345678)',
        'voters_id': 'VIDXXXXXXXXX (e.g., VID123456789)'
      }
    };

    return formats[country as keyof typeof formats]?.[idType as keyof any] || 'Follow your country\'s ID format';
  };

  if (step === 'input') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-blue-600" />
              Quick Verification
              {import.meta.env.VITE_USE_REAL_GOVERNMENT_DB === 'true' ? (
                <Badge variant="secondary" className="ml-auto bg-green-100 text-green-800">
                  <Database className="h-3 w-3 mr-1" />
                  Government Verified
                </Badge>
              ) : (
                <Badge variant="secondary" className="ml-auto bg-orange-100 text-orange-800">
                  <Database className="h-3 w-3 mr-1" />
                  Development Mode
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {import.meta.env.VITE_USE_REAL_GOVERNMENT_DB === 'true'
                ? "Enter your ID number and we'll retrieve your details automatically from government databases"
                : "Development mode: Enter any valid ID format to see simulated verification process"
              }
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              ID Information
            </CardTitle>
            <CardDescription>
              Just like MTN verification - quick and simple
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Country Selection */}
            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>
                <SelectContent>
                  {globalCountries.map((countryOption) => (
                    <SelectItem key={countryOption.code} value={countryOption.name}>
                      {countryOption.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ID Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="idType">ID Type *</Label>
              <Select value={idType} onValueChange={(value: any) => setIdType(value)}>
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

            {/* ID Number Input */}
            <div className="space-y-2">
              <Label htmlFor="idNumber">ID Number *</Label>
              <Input
                id="idNumber"
                type="text"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value.toUpperCase())}
                placeholder={getIdPlaceholder(country, idType)}
                className="font-mono"
              />
              {country && idType && (
                <p className="text-xs text-gray-500">
                  Format: {getIdFormatExample(country, idType)}
                </p>
              )}
            </div>

            {/* ID Format Examples */}
            {country && (
              <Alert>
                <Database className="h-4 w-4" />
                <AlertDescription>
                  <strong>ID Format Examples for {country}:</strong>
                  <div className="mt-2 space-y-1 text-sm">
                    {country === 'Ghana' && (
                      <>
                        <div>• National ID: <code className="bg-gray-100 px-1 rounded">GHA-123456789-1</code></div>
                        <div>• Passport: <code className="bg-gray-100 px-1 rounded">A1234567</code></div>
                        <div>• Driver's License: <code className="bg-gray-100 px-1 rounded">DL12345678</code></div>
                        <div>• Voter's ID: <code className="bg-gray-100 px-1 rounded">VID12345678</code></div>
                      </>
                    )}
                    {country === 'Nigeria' && (
                      <>
                        <div>• National ID (NIN): <code className="bg-gray-100 px-1 rounded">NIN12345678901</code></div>
                        <div>• Passport: <code className="bg-gray-100 px-1 rounded">A12345678</code></div>
                        <div>• Driver's License: <code className="bg-gray-100 px-1 rounded">ABC123456789</code></div>
                        <div>• Voter's ID: <code className="bg-gray-100 px-1 rounded">VIN1234567890</code></div>
                      </>
                    )}
                    {country === 'Kenya' && (
                      <>
                        <div>• National ID: <code className="bg-gray-100 px-1 rounded">KEN12345678</code></div>
                        <div>• Passport: <code className="bg-gray-100 px-1 rounded">A1234567</code></div>
                        <div>• Driver's License: <code className="bg-gray-100 px-1 rounded">DL1234567</code></div>
                        <div>• Voter's ID: <code className="bg-gray-100 px-1 rounded">VR12345678</code></div>
                      </>
                    )}
                    {country === 'South Africa' && (
                      <>
                        <div>• National ID: <code className="bg-gray-100 px-1 rounded">ZA1234567890123</code></div>
                        <div>• Passport: <code className="bg-gray-100 px-1 rounded">A12345678</code></div>
                        <div>• Driver's License: <code className="bg-gray-100 px-1 rounded">DL12345678</code></div>
                        <div>• Voter's ID: <code className="bg-gray-100 px-1 rounded">VID123456789</code></div>
                      </>
                    )}
                    {!['Ghana', 'Nigeria', 'Kenya', 'South Africa'].includes(country) && (
                      <div>• Enter your ID number as it appears on your document</div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-4 pt-4">
              <Button onClick={handleIdSubmit} className="w-full">
                Continue to Fingerprint
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'fingerprint') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fingerprint className="h-6 w-6 text-blue-600" />
              Fingerprint Verification
            </CardTitle>
            <CardDescription>
              {loading
                ? "Scanning your fingerprint and verifying with government database..."
                : "Place your finger on the scanner to verify your identity"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enhanced Fingerprint Scanner */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className={`w-32 h-32 bg-gradient-to-br rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                  loading
                    ? 'from-green-100 to-green-200 border-green-400'
                    : 'from-blue-100 to-blue-200 border-blue-300'
                }`}>
                  <Fingerprint className={`h-16 w-16 transition-colors duration-300 ${
                    loading ? 'text-green-600' : 'text-blue-600'
                  }`} />
                </div>

                {loading && (
                  <>
                    {/* Scanning animation */}
                    <div className="absolute inset-0 rounded-full border-4 border-green-400 animate-ping"></div>
                    <div className="absolute inset-2 rounded-full border-2 border-green-300 animate-pulse"></div>
                  </>
                )}

                {!loading && (
                  <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-pulse opacity-50"></div>
                )}
              </div>

              <div className="text-center">
                {loading ? (
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-green-600">Scanning in progress...</p>
                    <p className="text-sm text-gray-600">Keep your finger steady on the scanner</p>
                    <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Verifying with {country} government database</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-lg font-medium">Ready to scan fingerprint</p>
                    <p className="text-sm text-gray-600">Click below to start biometric verification</p>
                    <div className="text-xs text-gray-500">
                      {import.meta.env.VITE_USE_REAL_GOVERNMENT_DB === 'true'
                        ? "Real biometric authentication will be used"
                        : "Development mode: Simulated fingerprint scanning"
                      }
                    </div>
                  </div>
                )}
              </div>

              {!loading && (
                <Button
                  onClick={handleFingerprintCapture}
                  disabled={loading}
                  className="w-full max-w-xs"
                  size="lg"
                >
                  <Fingerprint className="h-5 w-5 mr-2" />
                  Start Biometric Scan
                </Button>
              )}

              {loading && (
                <div className="w-full max-w-xs">
                  <div className="text-center text-sm text-gray-600 mb-2">
                    Please wait while we verify your identity...
                  </div>
                  <div className="text-center text-xs text-gray-500">
                    This may take up to 30 seconds
                  </div>
                </div>
              )}
            </div>

            {/* Security Notice */}
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Secure Verification:</strong> Your fingerprint is encrypted and verified directly
                with government databases. No biometric data is stored on our servers.
              </AlertDescription>
            </Alert>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'retrieving') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-6 w-6 text-blue-600" />
              Retrieving Your Details
            </CardTitle>
            <CardDescription>
              Connecting to government databases...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Progress value={progress} className="w-full" />
              
              <div className="space-y-2">
                {progress >= 25 && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Fingerprint verified</span>
                  </div>
                )}
                {progress >= 50 && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Connected to government database</span>
                  </div>
                )}
                {progress >= 75 && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Personal details retrieved</span>
                  </div>
                )}
                {progress >= 100 && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Verification complete</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'review' && retrievedData) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              Verification Successful
            </CardTitle>
            <CardDescription>
              Your details have been automatically retrieved and verified
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Retrieved Information
            </CardTitle>
            <CardDescription>
              Please review your details below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Full Name</Label>
                <p className="font-medium">{retrievedData.fullName}</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Date of Birth</Label>
                <p className="font-medium">{new Date(retrievedData.dateOfBirth).toLocaleDateString()}</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Nationality</Label>
                <p className="font-medium">{retrievedData.nationality}</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">ID Number</Label>
                <p className="font-medium font-mono">{idNumber}</p>
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label className="text-sm font-medium text-gray-600">Address</Label>
                <p className="font-medium">{retrievedData.address}</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Issuing Authority</Label>
                <p className="font-medium">{retrievedData.issuingAuthority}</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Expiry Date</Label>
                <p className="font-medium">{new Date(retrievedData.expiryDate).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Shield className="h-3 w-3 mr-1" />
                Verified by Government Database
              </Badge>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-4 pt-4">
              <Button
                onClick={handleConfirmData}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Completing...
                  </>
                ) : (
                  'Confirm & Complete'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default QuickVerificationFlow;
