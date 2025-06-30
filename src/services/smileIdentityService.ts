/**
 * Smile Identity Service
 * 
 * Real identity verification service for African countries
 * Provides actual ID verification and biometric authentication
 */

export interface SmileIdentityVerificationRequest {
  partner_id: string;
  country: string;
  id_type: string;
  id_number: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  callback_url?: string;
}

export interface SmileIdentityVerificationResponse {
  success: boolean;
  result_code: string;
  result_text: string;
  actions: {
    verify_id_number: string;
    return_personal_info: string;
  };
  country: string;
  id_type: string;
  id_number: string;
  full_name: string;
  phone_number: string;
  photo: string;
  address: string;
  date_of_birth: string;
  gender: string;
  id_expiry_date: string;
  document_image_base64: string;
}

export interface SmileBiometricRequest {
  partner_id: string;
  user_id: string;
  job_type: number; // 1 for enhanced KYC, 5 for biometric KYC
  biometric_data: string;
  id_info: {
    country: string;
    id_type: string;
    id_number: string;
  };
}

export interface SmileBiometricResponse {
  success: boolean;
  smile_job_id: string;
  result: {
    result_code: string;
    result_text: string;
    confidence_value: number;
    actions: {
      verify_id_number: string;
      return_personal_info: string;
      liveness_check: string;
      register_selfie: string;
    };
  };
  id_info: {
    country: string;
    id_type: string;
    id_number: string;
    full_name: string;
    date_of_birth: string;
    phone_number: string;
    address: string;
    photo: string;
  };
}

class SmileIdentityService {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly partnerId: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_SMILE_IDENTITY_BASE_URL || '';
    this.apiKey = import.meta.env.VITE_SMILE_IDENTITY_API_KEY || '';
    this.partnerId = import.meta.env.VITE_SMILE_IDENTITY_PARTNER_ID || '';
  }

  /**
   * Verify ID number with Smile Identity
   */
  async verifyIdNumber(
    idNumber: string,
    country: string,
    idType: string
  ): Promise<SmileIdentityVerificationResponse> {
    if (!this.apiKey || !this.partnerId) {
      throw new Error('Smile Identity credentials not configured. Please add API key and partner ID.');
    }

    const request: SmileIdentityVerificationRequest = {
      partner_id: this.partnerId,
      country: this.mapCountryCode(country),
      id_type: this.mapIdType(idType),
      id_number: idNumber,
      callback_url: `${window.location.origin}/api/smile-webhook`
    };

    try {
      const response = await fetch(`${this.baseUrl}/identity_verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Smile Identity API error: ${response.status}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Smile Identity verification failed:', error);
      throw error instanceof Error ? error : new Error('Identity verification failed');
    }
  }

  /**
   * Verify biometric data with Smile Identity
   */
  async verifyBiometric(
    idNumber: string,
    country: string,
    idType: string,
    biometricData: string
  ): Promise<SmileBiometricResponse> {
    if (!this.apiKey || !this.partnerId) {
      throw new Error('Smile Identity credentials not configured');
    }

    const request: SmileBiometricRequest = {
      partner_id: this.partnerId,
      user_id: `user_${Date.now()}`,
      job_type: 5, // Biometric KYC
      biometric_data: biometricData,
      id_info: {
        country: this.mapCountryCode(country),
        id_type: this.mapIdType(idType),
        id_number: idNumber
      }
    };

    try {
      const response = await fetch(`${this.baseUrl}/biometric_kyc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Biometric verification failed: ${response.status}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Smile Identity biometric verification failed:', error);
      throw error instanceof Error ? error : new Error('Biometric verification failed');
    }
  }

  /**
   * Map country names to Smile Identity country codes
   */
  private mapCountryCode(country: string): string {
    const countryMap: Record<string, string> = {
      'Ghana': 'GH',
      'Nigeria': 'NG',
      'Kenya': 'KE',
      'South Africa': 'ZA',
      'Uganda': 'UG',
      'Tanzania': 'TZ',
      'Rwanda': 'RW',
      'Zambia': 'ZM',
      'Botswana': 'BW',
      'Namibia': 'NA'
    };

    return countryMap[country] || country;
  }

  /**
   * Map ID types to Smile Identity format
   */
  private mapIdType(idType: string): string {
    const idTypeMap: Record<string, string> = {
      'national_id': 'NATIONAL_ID',
      'passport': 'PASSPORT',
      'drivers_license': 'DRIVERS_LICENSE',
      'voters_id': 'VOTER_ID'
    };

    return idTypeMap[idType] || 'NATIONAL_ID';
  }

  /**
   * Check if Smile Identity is properly configured
   */
  isConfigured(): boolean {
    return !!(this.apiKey && this.partnerId && this.baseUrl);
  }

  /**
   * Get supported countries
   */
  getSupportedCountries(): string[] {
    return [
      'Ghana',
      'Nigeria', 
      'Kenya',
      'South Africa',
      'Uganda',
      'Tanzania',
      'Rwanda',
      'Zambia',
      'Botswana',
      'Namibia'
    ];
  }

  /**
   * Transform Smile Identity response to our standard format
   */
  transformToStandardFormat(smileResponse: SmileIdentityVerificationResponse): any {
    return {
      idNumber: smileResponse.id_number,
      idType: smileResponse.id_type,
      fullName: smileResponse.full_name,
      dateOfBirth: smileResponse.date_of_birth,
      nationality: smileResponse.country,
      address: smileResponse.address,
      issuingAuthority: this.getIssuingAuthority(smileResponse.country, smileResponse.id_type),
      issueDate: '', // Not provided by Smile Identity
      expiryDate: smileResponse.id_expiry_date,
      photo: smileResponse.photo,
      biometricHash: '',
      status: smileResponse.success ? 'active' : 'inactive',
      verificationLevel: 'enhanced'
    };
  }

  /**
   * Get issuing authority for country and ID type
   */
  private getIssuingAuthority(country: string, idType: string): string {
    const authorities: Record<string, Record<string, string>> = {
      'GH': {
        'NATIONAL_ID': 'National Identification Authority (NIA)',
        'PASSPORT': 'Ghana Immigration Service',
        'DRIVERS_LICENSE': 'Driver and Vehicle Licensing Authority (DVLA)'
      },
      'NG': {
        'NATIONAL_ID': 'National Identity Management Commission (NIMC)',
        'PASSPORT': 'Nigeria Immigration Service',
        'DRIVERS_LICENSE': 'Federal Road Safety Corps (FRSC)'
      },
      'KE': {
        'NATIONAL_ID': 'Department of National Registration',
        'PASSPORT': 'Department of Immigration Services',
        'DRIVERS_LICENSE': 'National Transport and Safety Authority (NTSA)'
      },
      'ZA': {
        'NATIONAL_ID': 'Department of Home Affairs',
        'PASSPORT': 'Department of International Relations',
        'DRIVERS_LICENSE': 'Road Traffic Management Corporation'
      }
    };

    return authorities[country]?.[idType] || 'Government Authority';
  }
}

export default new SmileIdentityService();
