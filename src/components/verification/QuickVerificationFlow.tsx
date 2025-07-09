import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Camera,
  Upload,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Loader2,
  User,
  Calendar,
  MapPin,
  Shield,
  Zap,
  Database,
  FileImage,
  Scan
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { globalCountries } from '@/data/countries';
import identityVerificationService from '@/services/identityVerificationService';
import governmentDatabaseService from '@/services/governmentDatabaseService';
import biometricCaptureService from '@/services/biometricCaptureService';
import { useAuth } from '@clerk/clerk-react';

interface QuickVerificationFlowProps {
  onComplete: (data: any) => void;
}

interface RetrievedData {
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  composary: string;
  issuingAuthority: string;
  expiryDate: string;
  photo: string;
  verified: boolean;
  houseRegistrationNumber?: string;
}

const QuickVerificationFlow: React.FC<QuickVerificationFlowProps> = ({ onComplete }) => {
  const { getToken, user } = useAuth();
  const [step, setStep] = useState<'input' | 'document_upload' | 'face_scan' | 'retrieving' | 'review' | 'payment_setup'>('input');
  const [idNumber, setIdNumber] = useState('');
  const [idType, setIdType] = useState<'national_id' | 'passport' | 'drivers_license' | 'voters_id'>('national_id');
  const [country, setCountry] = useState('');
  const [houseRegistrationNumber, setHouseRegistrationNumber] = useState('');
  const [documentFrontImage, setDocumentFrontImage] = useState<File | null>(null);
  const [documentBackImage, setDocumentBackImage] = useState<File | null>(null);
  const [faceImage, setFaceImage] = useState<File | null>(null);
  const [isCapturingFace, setIsCapturingFace] = useState(false);
  const [retrievedData, setRetrievedData] = useState<RetrievedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  // Payment account setup state
  const [paymentProvider, setPaymentProvider] = useState<'paystack' | 'mtn_momo' | 'vodafone_cash' | 'bank_transfer'>('paystack');
  const [accountDetails, setAccountDetails] = useState({
    accountNumber: '',
    accountName: '',
    bankName: '',
    mobileNumber: '',
    email: ''
  });

  // Pre-populate email from user account
  useEffect(() => {
    if (user?.primaryEmailAddress?.emailAddress && !accountDetails.email) {
      setAccountDetails(prev => ({
        ...prev,
        email: user.primaryEmailAddress.emailAddress
      }));
    }
  }, [user, accountDetails.email]);

  // Reset verification state
  const resetVerification = () => {
    setLoading(false);
    setProgress(0);
    setError('');
    setStep('face_scan');
  };

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
    setStep('document_upload');
  };

  const handleDocumentFrontUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setDocumentFrontImage(file);
    }
  };

  const handleDocumentBackUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setDocumentBackImage(file);
    }
  };

  const startFaceCapture = async () => {
    setIsCapturingFace(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      // Create video element to show camera feed
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true;

      // Create canvas to capture image
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      // Wait for video to load
      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Show video in modal or overlay
        showCameraModal(video, canvas, stream);
      };
    } catch (error) {
      console.error('Error accessing camera:', error);
      setError('Unable to access camera. Please check permissions and try again.');
      setIsCapturingFace(false);
    }
  };

  const showCameraModal = (video: HTMLVideoElement, canvas: HTMLCanvasElement, stream: MediaStream) => {
    // Create a modal overlay
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';

    const modalContent = document.createElement('div');
    modalContent.className = 'bg-white rounded-lg p-6 max-w-md w-full mx-4';

    const title = document.createElement('h3');
    title.className = 'text-lg font-semibold mb-4 text-center';
    title.textContent = 'Position Your Face';

    const videoContainer = document.createElement('div');
    videoContainer.className = 'relative mb-4';
    video.className = 'w-full rounded-lg';
    videoContainer.appendChild(video);

    // Add face outline overlay
    const overlay = document.createElement('div');
    overlay.className = 'absolute inset-0 flex items-center justify-center pointer-events-none';
    overlay.innerHTML = '<div class="w-48 h-64 border-4 border-white rounded-full opacity-50"></div>';
    videoContainer.appendChild(overlay);

    const instructions = document.createElement('p');
    instructions.className = 'text-sm text-gray-600 text-center mb-4';
    instructions.textContent = 'Position your face within the oval and click capture';

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'flex gap-2';

    const captureBtn = document.createElement('button');
    captureBtn.className = 'flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700';
    captureBtn.textContent = 'Capture Photo';
    captureBtn.onclick = () => {
      captureFaceImage(video, canvas, stream);
      document.body.removeChild(modal);
    };

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = () => {
      stream.getTracks().forEach(track => track.stop());
      document.body.removeChild(modal);
      setIsCapturingFace(false);
    };

    buttonContainer.appendChild(captureBtn);
    buttonContainer.appendChild(cancelBtn);

    modalContent.appendChild(title);
    modalContent.appendChild(videoContainer);
    modalContent.appendChild(instructions);
    modalContent.appendChild(buttonContainer);
    modal.appendChild(modalContent);

    document.body.appendChild(modal);
  };

  const captureFaceImage = (video: HTMLVideoElement, canvas: HTMLCanvasElement, stream: MediaStream) => {
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'face-capture.jpg', { type: 'image/jpeg' });
          setFaceImage(file);
        }
      }, 'image/jpeg', 0.8);
    }

    // Stop camera stream
    stream.getTracks().forEach(track => track.stop());
    setIsCapturingFace(false);
  };

  const handleVerificationProcess = async () => {
    if (!documentFrontImage || !documentBackImage || !faceImage) {
      setError('Please upload both front and back of your ID document and take a selfie photo');
      return;
    }

    setError(''); // Clear any previous errors
    setLoading(true);
    setStep('retrieving');
    setProgress(0);

    try {
      console.log('Starting verification process...');

      // Step 1: Process front document image
      setProgress(15);
      console.log('Processing front document...');
      await new Promise(resolve => setTimeout(resolve, 800));

      // Step 2: Process back document image
      setProgress(30);
      console.log('Processing back document...');
      await new Promise(resolve => setTimeout(resolve, 800));

      // Step 3: Process face image and compare
      setProgress(45);
      console.log('Processing face image...');
      await new Promise(resolve => setTimeout(resolve, 800));

      setProgress(60);

      // Step 4: Query government database with timeout
      setProgress(75);
      console.log('Querying government database...');

      const databaseResult = await Promise.race([
        governmentDatabaseService.queryCitizenRecord(idNumber, country, idType),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Database query timeout')), 10000)
        )
      ]) as any;

      console.log('Database result:', databaseResult);

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
        composary: record.address, // Using address field as composary
        issuingAuthority: record.issuingAuthority,
        expiryDate: record.expiryDate,
        photo: record.photo,
        verified: true,
        houseRegistrationNumber: houseRegistrationNumber || record.houseRegistrationNumber
      };

      setProgress(100);
      setRetrievedData(retrievedData);

      // Small delay before showing review
      await new Promise(resolve => setTimeout(resolve, 500));
      setStep('review');

      console.log('Verification completed successfully');
    } catch (error) {
      console.error('Verification error:', error);
      setError(error instanceof Error ? error.message : 'Failed to retrieve data. Please try again.');
      // Don't automatically reset to face_scan - let user retry from current step
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };



  const handleConfirmData = () => {
    if (!retrievedData) return;
    setError('');
    setStep('payment_setup');
  };

  // Validate payment form
  const isPaymentFormValid = () => {
    const { accountNumber, accountName, bankName, mobileNumber, email } = accountDetails;

    console.log('🔍 Payment form validation:', {
      paymentProvider,
      accountDetails,
      hasEmail: !!email,
      hasAccountNumber: !!accountNumber,
      hasAccountName: !!accountName,
      hasBankName: !!bankName,
      hasMobileNumber: !!mobileNumber
    });

    if (!email) {
      console.log('❌ Email is required');
      return false;
    }

    if (paymentProvider === 'paystack' || paymentProvider === 'bank_transfer') {
      const isValid = accountNumber && accountName && bankName;
      console.log(`✅ Bank/Paystack validation: ${isValid}`);
      return isValid;
    }

    if (paymentProvider === 'mtn_momo' || paymentProvider === 'vodafone_cash') {
      const isValid = mobileNumber && accountName;
      console.log(`✅ Mobile money validation: ${isValid}`);
      return isValid;
    }

    console.log('❌ Unknown payment provider');
    return false;
  };

  // Complete the entire setup
  const handleCompleteSetup = async () => {
    if (!retrievedData) {
      setError('Verification data is missing. Please restart the verification process.');
      return;
    }

    // Validate that we have the required document images
    if (!documentFrontImage || !documentBackImage || !faceImage) {
      setError('Document images are missing. Please go back and upload all required documents.');
      console.error('❌ Missing document images:', {
        hasFrontImage: !!documentFrontImage,
        hasBackImage: !!documentBackImage,
        hasFaceImage: !!faceImage
      });
      return;
    }

    if (!isPaymentFormValid()) {
      const { accountNumber, accountName, bankName, mobileNumber, email } = accountDetails;
      const missingFields = [];

      if (!email) missingFields.push('Email');

      if (paymentProvider === 'paystack' || paymentProvider === 'bank_transfer') {
        if (!accountNumber) missingFields.push('Account Number');
        if (!accountName) missingFields.push('Account Name');
        if (!bankName) missingFields.push('Bank Name');
      }

      if (paymentProvider === 'mtn_momo' || paymentProvider === 'vodafone_cash') {
        if (!mobileNumber) missingFields.push('Mobile Number');
        if (!accountName) missingFields.push('Account Name');
      }

      setError(`Please fill in the following required fields: ${missingFields.join(', ')}`);
      return;
    }

    try {
      setLoading(true);
      setError('');

      console.log('🚀 Starting verification submission...');

      // Get authentication token
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      console.log('✅ Token obtained successfully');

      // Convert images to base64 for submission
      let frontImageBase64 = '';
      let backImageBase64 = '';
      let faceImageBase64 = '';

      if (documentFrontImage) {
        frontImageBase64 = await identityVerificationService.fileToBase64(documentFrontImage);
      }
      if (documentBackImage) {
        backImageBase64 = await identityVerificationService.fileToBase64(documentBackImage);
      }
      if (faceImage) {
        faceImageBase64 = await identityVerificationService.fileToBase64(faceImage);
      }

      // Submit verification data with payment account and actual document images
      const verificationData = {
        nationalId: {
          idNumber,
          idType,
          country,
          fullName: retrievedData.fullName,
          dateOfBirth: retrievedData.dateOfBirth,
          issuingAuthority: retrievedData.issuingAuthority,
          expiryDate: retrievedData.expiryDate,
          houseRegistrationNumber: retrievedData.houseRegistrationNumber
        },
        biometric: {
          documentFrontUploaded: !!documentFrontImage,
          documentBackUploaded: !!documentBackImage,
          faceVerified: !!faceImage,
          verificationMethod: 'government_database_auto_verification'
        },
        // Include actual document images for backend processing
        documentImages: {
          frontImage: frontImageBase64,
          backImage: backImageBase64,
          selfieImage: faceImageBase64
        },
        paymentAccount: {
          provider: paymentProvider,
          accountDetails: accountDetails
        },
        autoRetrieved: true,
        verificationStatus: 'verified'
      };

      console.log('📤 Submitting verification data:', verificationData);
      console.log('🖼️ Document images status:', {
        hasFrontImage: !!documentFrontImage,
        hasBackImage: !!documentBackImage,
        hasFaceImage: !!faceImage,
        frontImageBase64Length: frontImageBase64.length,
        backImageBase64Length: backImageBase64.length,
        faceImageBase64Length: faceImageBase64.length
      });

      // Submit verification with token
      const result = await identityVerificationService.submitVerification(verificationData, token);

      console.log('✅ Verification submitted successfully:', result);

      // Show success message
      setError('');

      // Small delay to show success state
      await new Promise(resolve => setTimeout(resolve, 500));

      // Call onComplete to close the verification flow and unlock house listing
      console.log('🎉 Calling onComplete to close verification flow and unlock house listing...');
      onComplete(verificationData);

      console.log('🎉 Verification flow completed! House listing should now be unlocked!');
    } catch (error) {
      console.error('❌ Verification submission error:', error);

      // Log more details about the error
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }

      setError(error instanceof Error ? error.message : 'Failed to complete setup. Please try again.');

      // Don't reset to face_scan on error - stay on payment_setup step
      // so user can retry without losing their progress
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

  const generateMockHouseRegistration = (country: string): string => {
    const prefixes = {
      'Ghana': 'GH-HR-',
      'Nigeria': 'NG-HR-',
      'Kenya': 'KE-HR-',
      'South Africa': 'ZA-HR-'
    };

    const prefix = prefixes[country as keyof typeof prefixes] || 'XX-HR-';
    const number = Math.floor(Math.random() * 900000) + 100000;
    return `${prefix}${number}`;
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

            {/* House Registration Number Input */}
            <div className="space-y-2">
              <Label htmlFor="houseRegNumber">House Registration Number</Label>
              <Input
                id="houseRegNumber"
                type="text"
                value={houseRegistrationNumber}
                onChange={(e) => setHouseRegistrationNumber(e.target.value.toUpperCase())}
                placeholder="Enter your house registration number (optional)"
                className="font-mono"
              />
              <p className="text-xs text-gray-500">
                This helps verify your residential address
              </p>
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

  if (step === 'document_upload') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-6 w-6 text-blue-600" />
              Upload ID Document
            </CardTitle>
            <CardDescription>
              Please upload a clear photo of your {idType.replace('_', ' ')} document
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {/* Front Document Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <FileImage className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">Upload Front of ID Document</p>
                  <p className="text-sm text-gray-600">
                    Take a clear photo of the front side of your {idType.replace('_', ' ')}
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleDocumentFrontUpload}
                  className="hidden"
                  id="document-front-upload"
                />
                <label htmlFor="document-front-upload">
                  <Button className="mt-4" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Front
                    </span>
                  </Button>
                </label>
                {documentFrontImage && (
                  <div className="mt-4">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Front uploaded
                    </Badge>
                  </div>
                )}
              </div>

              {/* Back Document Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <FileImage className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">Upload Back of ID Document</p>
                  <p className="text-sm text-gray-600">
                    Take a clear photo of the back side of your {idType.replace('_', ' ')}
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleDocumentBackUpload}
                  className="hidden"
                  id="document-back-upload"
                />
                <label htmlFor="document-back-upload">
                  <Button className="mt-4" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Back
                    </span>
                  </Button>
                </label>
                {documentBackImage && (
                  <div className="mt-4">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Back uploaded
                    </Badge>
                  </div>
                )}
              </div>

              <Alert>
                <FileImage className="h-4 w-4" />
                <AlertDescription>
                  <strong>Tips for best results:</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• Ensure good lighting</li>
                    <li>• Keep document flat and straight</li>
                    <li>• Make sure all text is clearly visible</li>
                    <li>• Avoid shadows or glare</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep('input')} className="flex-1">
                Back
              </Button>
              <Button
                onClick={() => setStep('face_scan')}
                disabled={!documentFrontImage || !documentBackImage}
                className="flex-1"
              >
                Next: Face Verification
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'face_scan') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-6 w-6 text-blue-600" />
              Face Verification
            </CardTitle>
            <CardDescription>
              Take a selfie photo to verify your identity matches the ID document
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {isCapturingFace ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                      <Camera className="h-8 w-8 text-blue-600 animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-lg font-medium text-blue-600">Camera Starting...</p>
                      <p className="text-sm text-gray-600">
                        Please allow camera access and position your face in the center
                      </p>
                    </div>
                  </div>
                ) : faceImage ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-lg font-medium text-green-600">Face Captured Successfully!</p>
                      <p className="text-sm text-gray-600">
                        Your selfie has been captured and is ready for verification
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Selfie captured
                    </Badge>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFaceImage(null);
                        setIsCapturingFace(false);
                      }}
                      className="mt-2"
                    >
                      Retake Photo
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Camera className="h-12 w-12 text-gray-400 mx-auto" />
                    <div className="space-y-2">
                      <p className="text-lg font-medium">Instant Face Scan</p>
                      <p className="text-sm text-gray-600">
                        Click below to open your camera and take an instant selfie
                      </p>
                    </div>
                    <Button
                      onClick={startFaceCapture}
                      disabled={isCapturingFace}
                      className="mt-4"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Open Camera
                    </Button>
                  </div>
                )}
              </div>

              <Alert>
                <Scan className="h-4 w-4" />
                <AlertDescription>
                  <strong>Face verification tips:</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• Look directly at the camera</li>
                    <li>• Remove glasses or hat if possible</li>
                    <li>• Ensure good lighting on your face</li>
                    <li>• Keep a neutral expression</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep('document_upload')} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleVerificationProcess}
                disabled={!faceImage || loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Identity'
                )}
              </Button>
            </div>
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
                {progress >= 15 && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Front document processed</span>
                  </div>
                )}
                {progress >= 30 && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Back document processed</span>
                  </div>
                )}
                {progress >= 45 && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Face verification completed</span>
                  </div>
                )}
                {progress >= 75 && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Connected to government database</span>
                  </div>
                )}
                {progress >= 90 && (
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

              {/* Cancel button */}
              <div className="pt-4">
                <Button
                  variant="outline"
                  onClick={resetVerification}
                  className="w-full"
                >
                  Cancel Verification
                </Button>
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
                <Label className="text-sm font-medium text-gray-600">Composary</Label>
                <p className="font-medium">{retrievedData.composary}</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Issuing Authority</Label>
                <p className="font-medium">{retrievedData.issuingAuthority}</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Expiry Date</Label>
                <p className="font-medium">{new Date(retrievedData.expiryDate).toLocaleDateString()}</p>
              </div>

              {retrievedData.houseRegistrationNumber && (
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm font-medium text-gray-600">House Registration Number</Label>
                  <p className="font-medium font-mono">{retrievedData.houseRegistrationNumber}</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-4 flex-wrap">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Shield className="h-3 w-3 mr-1" />
                Front & Back Document
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                <Camera className="h-3 w-3 mr-1" />
                Instant Face Scan
              </Badge>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                <Database className="h-3 w-3 mr-1" />
                Government Database
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
                  'Continue to Payment Setup'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'payment_setup') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-blue-600" />
              Payment Account Setup
            </CardTitle>
            <CardDescription>
              Set up your payment account to receive rental payments from tenants
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Payment Provider Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Payment Provider *</Label>
              <div className="grid grid-cols-2 gap-3">
                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    paymentProvider === 'paystack'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPaymentProvider('paystack')}
                >
                  <div className="text-center">
                    <CreditCard className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <p className="font-medium">Paystack</p>
                    <p className="text-xs text-gray-600">Bank Transfer</p>
                  </div>
                </div>

                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    paymentProvider === 'mtn_momo'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPaymentProvider('mtn_momo')}
                >
                  <div className="text-center">
                    <div className="w-8 h-8 bg-yellow-500 rounded mx-auto mb-2 flex items-center justify-center">
                      <span className="text-white font-bold text-xs">MTN</span>
                    </div>
                    <p className="font-medium">MTN MoMo</p>
                    <p className="text-xs text-gray-600">Mobile Money</p>
                  </div>
                </div>

                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    paymentProvider === 'vodafone_cash'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPaymentProvider('vodafone_cash')}
                >
                  <div className="text-center">
                    <div className="w-8 h-8 bg-red-500 rounded mx-auto mb-2 flex items-center justify-center">
                      <span className="text-white font-bold text-xs">VOD</span>
                    </div>
                    <p className="font-medium">Vodafone Cash</p>
                    <p className="text-xs text-gray-600">Mobile Money</p>
                  </div>
                </div>

                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    paymentProvider === 'bank_transfer'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPaymentProvider('bank_transfer')}
                >
                  <div className="text-center">
                    <div className="w-8 h-8 bg-green-500 rounded mx-auto mb-2 flex items-center justify-center">
                      <span className="text-white font-bold text-xs">BANK</span>
                    </div>
                    <p className="font-medium">Bank Transfer</p>
                    <p className="text-xs text-gray-600">Direct Transfer</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Details Form */}
            <div className="space-y-4">
              {(paymentProvider === 'paystack' || paymentProvider === 'bank_transfer') && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number *</Label>
                    <Input
                      id="accountNumber"
                      type="text"
                      value={accountDetails.accountNumber}
                      onChange={(e) => setAccountDetails(prev => ({
                        ...prev,
                        accountNumber: e.target.value
                      }))}
                      placeholder="Enter your account number"
                      className="font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountName">Account Name *</Label>
                    <Input
                      id="accountName"
                      type="text"
                      value={accountDetails.accountName}
                      onChange={(e) => setAccountDetails(prev => ({
                        ...prev,
                        accountName: e.target.value
                      }))}
                      placeholder="Enter account holder name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name *</Label>
                    <Input
                      id="bankName"
                      type="text"
                      value={accountDetails.bankName}
                      onChange={(e) => setAccountDetails(prev => ({
                        ...prev,
                        bankName: e.target.value
                      }))}
                      placeholder="Enter your bank name"
                    />
                  </div>
                </>
              )}

              {(paymentProvider === 'mtn_momo' || paymentProvider === 'vodafone_cash') && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="mobileNumber">Mobile Number *</Label>
                    <Input
                      id="mobileNumber"
                      type="tel"
                      value={accountDetails.mobileNumber}
                      onChange={(e) => setAccountDetails(prev => ({
                        ...prev,
                        mobileNumber: e.target.value
                      }))}
                      placeholder="Enter your mobile money number"
                      className="font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountName">Account Name *</Label>
                    <Input
                      id="accountName"
                      type="text"
                      value={accountDetails.accountName}
                      onChange={(e) => setAccountDetails(prev => ({
                        ...prev,
                        accountName: e.target.value
                      }))}
                      placeholder="Enter account holder name"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={accountDetails.email}
                  onChange={(e) => setAccountDetails(prev => ({
                    ...prev,
                    email: e.target.value
                  }))}
                  placeholder="Enter your email address"
                />
              </div>
            </div>

            {/* Important Notice */}
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Payment Security:</strong> Your payment details are encrypted and secure.
                Tenants will pay directly to your account, and you'll receive notifications for all transactions.
              </AlertDescription>
            </Alert>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-4 pt-4">
              <Button variant="outline" onClick={() => setStep('review')} className="flex-1">
                Back to Review
              </Button>
              <Button
                onClick={handleCompleteSetup}
                disabled={loading || !isPaymentFormValid()}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  'Complete Setup'
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
