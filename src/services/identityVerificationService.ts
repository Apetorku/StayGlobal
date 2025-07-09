const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export interface NationalIdData {
  idNumber: string;
  idType: 'national_id' | 'passport' | 'drivers_license' | 'voters_id';
  country: string;
  fullName: string;
  dateOfBirth: string;
  issuingAuthority?: string;
  expiryDate?: string;
  houseRegistrationNumber?: string;
}

export interface DocumentImages {
  frontImage: string; // Base64 or URL
  backImage?: string;
  selfieImage: string;
}

export interface FingerprintData {
  template: string; // Base64 encoded fingerprint template
  quality: number; // Quality score 0-100
  captureDevice?: string;
}

export interface BiometricData {
  documentFrontUploaded?: boolean;
  documentBackUploaded?: boolean;
  faceVerified?: boolean;
  verificationMethod?: string;
}

export interface PaymentAccountData {
  provider: string;
  accountDetails: any;
}

export interface VerificationSubmission {
  nationalId: NationalIdData;
  biometric?: BiometricData;
  paymentAccount?: PaymentAccountData;
  autoRetrieved?: boolean;
  verificationStatus?: string;
  // Legacy support
  documentImages?: DocumentImages;
  fingerprintData?: FingerprintData;
  metadata?: {
    deviceFingerprint?: string;
    submissionSource?: 'web' | 'mobile';
  };
}

export interface VerificationStatus {
  hasVerification: boolean;
  verificationStatus: 'none' | 'pending' | 'in_review' | 'verified' | 'rejected' | 'expired';
  verificationLevel: 'none' | 'id_submitted' | 'biometric_pending' | 'fully_verified' | 'rejected';
  isVerified: boolean;
  canListApartments: boolean;
  steps: {
    documentSubmitted: boolean;
    documentVerified: boolean;
    biometricCaptured: boolean;
    biometricVerified: boolean;
    manualReviewRequired: boolean;
    manualReviewCompleted: boolean;
  };
  results: {
    documentAuthenticity: 'pending' | 'passed' | 'failed';
    biometricMatch: 'pending' | 'passed' | 'failed';
    faceMatch: 'pending' | 'passed' | 'failed';
    duplicateCheck: 'pending' | 'passed' | 'failed';
    overallScore: number;
  };
}

class IdentityVerificationService {
  /**
   * Submit identity verification with documents and biometric data
   */
  async submitVerification(data: VerificationSubmission, token: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/identity-verification/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit verification');
    }

    return response.json();
  }

  /**
   * Submit simple verification (form-based only)
   */
  async submitSimpleVerification(data: any, token: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/identity-verification/simple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit verification');
    }

    return response.json();
  }

  /**
   * Get verification status for current user
   */
  async getVerificationStatus(token: string): Promise<VerificationStatus> {
    const response = await fetch(`${API_BASE_URL}/identity-verification/status`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get verification status');
    }

    return response.json();
  }

  /**
   * Verify fingerprint for authentication
   */
  async verifyFingerprint(fingerprintData: FingerprintData, token: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/identity-verification/verify-fingerprint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ fingerprintData })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Fingerprint verification failed');
    }

    return response.json();
  }

  /**
   * Upload additional documents
   */
  async uploadDocuments(documentImages: DocumentImages, token: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/identity-verification/upload-documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ documentImages })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload documents');
    }

    return response.json();
  }

  /**
   * Get verification history
   */
  async getVerificationHistory(token: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/identity-verification/history`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get verification history');
    }

    return response.json();
  }

  /**
   * Simulate fingerprint capture (for demo purposes)
   * In production, this would interface with actual biometric hardware
   */
  async captureFingerprint(): Promise<FingerprintData> {
    // Simulate fingerprint capture delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate a mock fingerprint template
    const mockTemplate = this.generateMockFingerprintTemplate();
    
    return {
      template: mockTemplate,
      quality: Math.floor(Math.random() * 40) + 60, // Random quality between 60-100
      captureDevice: 'Web Simulator'
    };
  }

  /**
   * Generate mock fingerprint template for demo
   */
  private generateMockFingerprintTemplate(): string {
    // Generate a random base64-like string to simulate fingerprint template
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    for (let i = 0; i < 256; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Convert file to base64
   */
  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Validate ID number format (basic validation)
   */
  validateIdNumber(idNumber: string, idType: string, country: string): boolean {
    // Basic validation - in production, use proper validation for each country/ID type
    if (!idNumber || idNumber.length < 5) return false;
    
    switch (idType) {
      case 'national_id':
        return idNumber.length >= 8 && idNumber.length <= 20;
      case 'passport':
        return idNumber.length >= 6 && idNumber.length <= 12;
      case 'drivers_license':
        return idNumber.length >= 6 && idNumber.length <= 15;
      case 'voters_id':
        return idNumber.length >= 8 && idNumber.length <= 15;
      default:
        return false;
    }
  }

  /**
   * Get device fingerprint for security
   */
  getDeviceFingerprint(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx!.textBaseline = 'top';
    ctx!.font = '14px Arial';
    ctx!.fillText('Device fingerprint', 2, 2);
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');
    
    // Simple hash
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return hash.toString(16);
  }
}

export default new IdentityVerificationService();
