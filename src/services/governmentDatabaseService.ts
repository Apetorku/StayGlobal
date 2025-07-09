/**
 * Government Database Service
 *
 * This service integrates with real identity verification services including:
 * - Smile Identity (Third-party real ID verification for Africa)
 * - Direct government APIs (Ghana NIA, Nigeria NIMC, Kenya Registration, etc.)
 */

import smileIdentityService from './smileIdentityService';

export interface CitizenRecord {
  idNumber: string;
  idType: string;
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  address: string;
  issuingAuthority: string;
  issueDate: string;
  expiryDate: string;
  photo: string;
  biometricHash: string;
  status: 'active' | 'expired' | 'suspended' | 'revoked';
  verificationLevel: 'basic' | 'enhanced' | 'premium';
  houseRegistrationNumber?: string;
}

export interface BiometricVerificationResult {
  matched: boolean;
  confidence: number;
  verificationTime: number;
  method: 'fingerprint' | 'facial' | 'iris';
}

export interface DatabaseQueryResult {
  success: boolean;
  record?: CitizenRecord;
  error?: string;
  responseTime: number;
  source: string;
}

class GovernmentDatabaseService {
  private readonly API_ENDPOINTS = {
    'Ghana': {
      baseUrl: 'https://api.nia.gov.gh/v1',
      endpoints: {
        verify: '/verify',
        citizen: '/citizen',
        biometric: '/biometric'
      },
      apiKey: import.meta.env.VITE_GHANA_NIA_API_KEY || '',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    },
    'Nigeria': {
      baseUrl: 'https://api.nimc.gov.ng/v2',
      endpoints: {
        verify: '/identity/verify',
        citizen: '/identity/details',
        biometric: '/biometric/verify'
      },
      apiKey: import.meta.env.VITE_NIGERIA_NIMC_API_KEY || '',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    },
    'Kenya': {
      baseUrl: 'https://api.registration.go.ke/v1',
      endpoints: {
        verify: '/citizen/verify',
        citizen: '/citizen/details',
        biometric: '/biometric/match'
      },
      apiKey: import.meta.env.VITE_KENYA_REG_API_KEY || '',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    },
    'South Africa': {
      baseUrl: 'https://api.dha.gov.za/v1',
      endpoints: {
        verify: '/identity/verify',
        citizen: '/identity/citizen',
        biometric: '/biometric/verify'
      },
      apiKey: import.meta.env.VITE_SA_DHA_API_KEY || '',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    },
    'United States': {
      baseUrl: 'https://api.ssa.gov/v1',
      endpoints: {
        verify: '/verify',
        citizen: '/citizen',
        biometric: '/biometric'
      },
      apiKey: import.meta.env.VITE_US_SSA_API_KEY || '',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    },
    'United Kingdom': {
      baseUrl: 'https://api.gov.uk/v1',
      endpoints: {
        verify: '/identity/verify',
        citizen: '/identity/details',
        biometric: '/biometric/check'
      },
      apiKey: import.meta.env.VITE_UK_GOV_API_KEY || '',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    },
    'Canada': {
      baseUrl: 'https://api.servicecanada.gc.ca/v1',
      endpoints: {
        verify: '/identity/verify',
        citizen: '/identity/citizen',
        biometric: '/biometric/verify'
      },
      apiKey: import.meta.env.VITE_CANADA_SC_API_KEY || '',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }
  };

  private readonly REQUEST_TIMEOUT = 30000; // 30 seconds
  private readonly MAX_RETRIES = 3;

  /**
   * Query government database for citizen record
   */
  async queryCitizenRecord(
    idNumber: string,
    country: string,
    idType: string
  ): Promise<DatabaseQueryResult> {
    const startTime = Date.now();

    try {
      // Check if Smile Identity should be used
      const useSmileIdentity = import.meta.env.VITE_USE_SMILE_IDENTITY === 'true';

      if (useSmileIdentity && smileIdentityService.isConfigured()) {
        // Use Smile Identity for real ID verification
        console.log(`Using Smile Identity for ${country} ID verification`);

        const smileResponse = await smileIdentityService.verifyIdNumber(idNumber, country, idType);

        if (!smileResponse.success) {
          throw new Error(`ID verification failed: ${smileResponse.result_text}`);
        }

        // Transform Smile Identity response to our standard format
        const citizenRecord = smileIdentityService.transformToStandardFormat(smileResponse);

        return {
          success: true,
          record: citizenRecord,
          responseTime: Date.now() - startTime,
          source: `Smile Identity (${country} Government Database)`
        };
      }

      // Fallback to direct government API
      const apiConfig = this.API_ENDPOINTS[country as keyof typeof this.API_ENDPOINTS];

      if (!apiConfig) {
        throw new Error(`Government database API not available for ${country}. Please configure Smile Identity or direct government API access.`);
      }

      // Check if we're in development mode and allow missing API keys
      const useRealDB = import.meta.env.VITE_USE_REAL_GOVERNMENT_DB === 'true';

      if (!apiConfig.apiKey && useRealDB) {
        throw new Error(`API key not configured for ${country}. Please contact system administrator or use Smile Identity.`);
      }

      // If no API key and not using real DB, use mock data instead of throwing error
      if (!apiConfig.apiKey && !useRealDB) {
        console.log(`🔄 Using mock data for ${country} government database query`);
        return this.generateMockCitizenRecord(idNumber, idType, country);
      }

      // Prepare request payload for direct government API
      const requestPayload = {
        idNumber,
        idType,
        requestId: this.generateRequestId(),
        timestamp: new Date().toISOString(),
        source: 'apartment_rental_platform'
      };

      // Make API call to government database
      const response = await this.makeApiRequest(
        `${apiConfig.baseUrl}${apiConfig.endpoints.citizen}`,
        {
          method: 'POST',
          headers: {
            ...apiConfig.headers,
            'Authorization': `Bearer ${apiConfig.apiKey}`,
            'X-Request-ID': requestPayload.requestId
          },
          body: JSON.stringify(requestPayload)
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Government database returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Transform API response to our standard format
      const citizenRecord = this.transformApiResponse(data, country, idType);

      return {
        success: true,
        record: citizenRecord,
        responseTime: Date.now() - startTime,
        source: `${country} Government Database`
      };

    } catch (error) {
      console.error('Government database query failed:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect to government database',
        responseTime: Date.now() - startTime,
        source: `${country} Government Database`
      };
    }
  }

  /**
   * Verify biometric data against government records
   */
  async verifyBiometric(
    idNumber: string,
    biometricData: string,
    method: 'fingerprint' | 'facial' | 'iris' = 'fingerprint',
    country: string,
    idType: string = 'national_id'
  ): Promise<BiometricVerificationResult> {
    const startTime = Date.now();

    try {
      // Check if Smile Identity should be used
      const useSmileIdentity = import.meta.env.VITE_USE_SMILE_IDENTITY === 'true';

      if (useSmileIdentity && smileIdentityService.isConfigured()) {
        // Use Smile Identity for real biometric verification
        console.log(`Using Smile Identity for ${country} biometric verification`);

        const smileResponse = await smileIdentityService.verifyBiometric(
          idNumber,
          country,
          idType,
          biometricData
        );

        if (!smileResponse.success) {
          return {
            matched: false,
            confidence: 0,
            verificationTime: Date.now() - startTime,
            method
          };
        }

        return {
          matched: smileResponse.result.result_code === '1012', // Smile Identity success code
          confidence: smileResponse.result.confidence_value || 0,
          verificationTime: Date.now() - startTime,
          method
        };
      }

      // Fallback to direct government API
      const apiConfig = this.API_ENDPOINTS[country as keyof typeof this.API_ENDPOINTS];

      if (!apiConfig) {
        throw new Error(`Biometric verification API not available for ${country}. Please configure Smile Identity or direct government API access.`);
      }

      // Check if we're in development mode and allow missing API keys
      const useRealDB = import.meta.env.VITE_USE_REAL_GOVERNMENT_DB === 'true';

      if (!apiConfig.apiKey && useRealDB) {
        throw new Error(`API key not configured for ${country}. Please contact system administrator or use Smile Identity.`);
      }

      // If no API key and not using real DB, require real database setup
      if (!apiConfig.apiKey && !useRealDB) {
        throw new Error(`Real government database connection required for biometric verification. Please configure Smile Identity or direct government API keys.`);
      }

      // Prepare biometric verification payload for direct government API
      const requestPayload = {
        idNumber,
        biometricData,
        biometricType: method,
        requestId: this.generateRequestId(),
        timestamp: new Date().toISOString(),
        source: 'apartment_rental_platform'
      };

      // Make API call to government biometric service
      const response = await this.makeApiRequest(
        `${apiConfig.baseUrl}${apiConfig.endpoints.biometric}`,
        {
          method: 'POST',
          headers: {
            ...apiConfig.headers,
            'Authorization': `Bearer ${apiConfig.apiKey}`,
            'X-Request-ID': requestPayload.requestId
          },
          body: JSON.stringify(requestPayload)
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Biometric verification failed: ${response.status}`);
      }

      const data = await response.json();

      return {
        matched: data.matched || data.verified || false,
        confidence: data.confidence || data.score || 0,
        verificationTime: Date.now() - startTime,
        method
      };

    } catch (error) {
      console.error('Biometric verification failed:', error);

      // Return failed verification result
      return {
        matched: false,
        confidence: 0,
        verificationTime: Date.now() - startTime,
        method
      };
    }
  }

  /**
   * Check if ID number format is valid for the country
   */
  validateIdFormat(idNumber: string, country: string, idType: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    // Country-specific validation rules
    const validationRules = {
      'Ghana': {
        'national_id': /^GHA-\d{9}-\d$/,  // Format: GHA-123456789-1
        'passport': /^[A-Z]\d{7}$/,
        'drivers_license': /^DL\d{8}$/,
        'voters_id': /^VID\d{8}$/
      },
      'Nigeria': {
        'national_id': /^NIN\d{11}$/,
        'passport': /^[A-Z]\d{8}$/,
        'drivers_license': /^[A-Z]{3}\d{9}$/,
        'voters_id': /^VIN\d{10}$/
      },
      'Kenya': {
        'national_id': /^KEN\d{8}$/,
        'passport': /^[A-Z]\d{7}$/,
        'drivers_license': /^DL\d{7}$/,
        'voters_id': /^VR\d{8}$/
      },
      'South Africa': {
        'national_id': /^ZA\d{13}$/,
        'passport': /^[A-Z]\d{8}$/,
        'drivers_license': /^DL\d{8}$/,
        'voters_id': /^VID\d{9}$/
      }
    };

    const countryRules = validationRules[country as keyof typeof validationRules];
    
    if (!countryRules) {
      // For countries without specific rules, use generic validation
      if (idNumber.length < 8) {
        errors.push('ID number must be at least 8 characters');
      }
    } else {
      const pattern = countryRules[idType as keyof typeof countryRules];
      if (pattern && !pattern.test(idNumber)) {
        errors.push(`Invalid ${idType} format for ${country}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Make HTTP request with timeout and retry logic
   */
  private async makeApiRequest(url: string, options: RequestInit): Promise<Response> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        return response;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        if (attempt < this.MAX_RETRIES) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw lastError!;
  }

  /**
   * Generate mock house registration number
   */
  private generateMockHouseRegistration(country: string): string {
    const prefixes = {
      'Ghana': 'GH-HR-',
      'Nigeria': 'NG-HR-',
      'Kenya': 'KE-HR-',
      'South Africa': 'ZA-HR-'
    };

    const prefix = prefixes[country as keyof typeof prefixes] || 'XX-HR-';
    const number = Math.floor(Math.random() * 900000) + 100000;
    return `${prefix}${number}`;
  }

  /**
   * Generate mock citizen record for development/testing
   */
  private generateMockCitizenRecord(idNumber: string, idType: string, country: string): DatabaseQueryResult {
    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'James', 'Lisa', 'Robert', 'Maria', 'Kwame', 'Ama', 'Kofi', 'Akosua'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Asante', 'Osei', 'Mensah', 'Boateng'];

    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

    // Generate a date of birth (age between 18-65)
    const currentYear = new Date().getFullYear();
    const birthYear = currentYear - (Math.floor(Math.random() * 47) + 18);
    const birthMonth = Math.floor(Math.random() * 12) + 1;
    const birthDay = Math.floor(Math.random() * 28) + 1;

    // Generate expiry date (5-10 years from now)
    const expiryYear = currentYear + Math.floor(Math.random() * 5) + 5;

    const addresses = [
      'Accra Central, Greater Accra',
      'Kumasi Metropolitan, Ashanti',
      'Tamale Central, Northern',
      'Cape Coast, Central',
      'Takoradi, Western'
    ];

    const issueYear = birthYear + 18; // Assume ID was issued when person turned 18

    const citizenRecord: CitizenRecord = {
      idNumber,
      idType,
      fullName: `${firstName} ${lastName}`,
      dateOfBirth: `${birthYear}-${birthMonth.toString().padStart(2, '0')}-${birthDay.toString().padStart(2, '0')}`,
      nationality: country,
      address: addresses[Math.floor(Math.random() * addresses.length)],
      issuingAuthority: country === 'Ghana' ? 'National Identification Authority' : `${country} National ID Authority`,
      issueDate: `${issueYear}-${birthMonth.toString().padStart(2, '0')}-${birthDay.toString().padStart(2, '0')}`,
      expiryDate: `${expiryYear}-${birthMonth.toString().padStart(2, '0')}-${birthDay.toString().padStart(2, '0')}`,
      photo: '', // Empty for mock data
      biometricHash: `mock_hash_${Math.random().toString(36).substring(7)}`,
      status: 'active',
      verificationLevel: 'enhanced',
      houseRegistrationNumber: this.generateMockHouseRegistration(country)
    };

    return {
      success: true,
      record: citizenRecord,
      responseTime: Math.floor(Math.random() * 500) + 100, // Mock response time 100-600ms
      source: 'mock_government_database'
    };
  }

  /**
   * Transform API response to standard CitizenRecord format
   */
  private transformApiResponse(apiData: any, country: string, idType: string): CitizenRecord {
    // Different countries may have different response formats
    // This method standardizes them to our CitizenRecord interface

    const baseRecord: CitizenRecord = {
      idNumber: apiData.idNumber || apiData.id_number || apiData.nationalId,
      idType,
      fullName: apiData.fullName || apiData.full_name || `${apiData.firstName || apiData.first_name || ''} ${apiData.lastName || apiData.last_name || ''}`.trim(),
      dateOfBirth: apiData.dateOfBirth || apiData.date_of_birth || apiData.dob,
      nationality: country,
      address: apiData.composary || apiData.address || apiData.residential_address || apiData.homeAddress || '',
      issuingAuthority: apiData.issuingAuthority || apiData.issuing_authority || this.getDefaultIssuingAuthority(country, idType),
      issueDate: apiData.issueDate || apiData.issue_date || apiData.dateIssued,
      expiryDate: apiData.expiryDate || apiData.expiry_date || apiData.dateExpiry,
      photo: apiData.photo || apiData.photograph || apiData.image || '',
      biometricHash: apiData.biometricHash || apiData.biometric_hash || '',
      status: apiData.status || 'active',
      verificationLevel: apiData.verificationLevel || apiData.verification_level || 'enhanced',
      houseRegistrationNumber: apiData.houseRegistrationNumber || apiData.house_registration_number || this.generateMockHouseRegistration(country)
    };

    return baseRecord;
  }

  /**
   * Generate unique request ID for API calls
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Get default issuing authority for country and ID type
   */
  private getDefaultIssuingAuthority(country: string, idType: string): string {
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
      },
      'South Africa': {
        'national_id': 'Department of Home Affairs',
        'passport': 'Department of International Relations and Cooperation',
        'drivers_license': 'Road Traffic Management Corporation',
        'voters_id': 'Electoral Commission of South Africa'
      }
    };

    return authorities[country as keyof typeof authorities]?.[idType as keyof any] || 'Government Authority';
  }


}

export default new GovernmentDatabaseService();
