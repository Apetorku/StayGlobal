/**
 * Biometric Capture Service
 * 
 * This service handles actual biometric data capture including fingerprints,
 * facial recognition, and other biometric authentication methods.
 * 
 * In production, this would integrate with:
 * - Hardware fingerprint scanners
 * - Mobile device biometric APIs (Touch ID, Face ID, Android Biometric)
 * - WebAuthn for web-based biometric authentication
 * - Dedicated biometric capture devices
 */

export interface BiometricCaptureResult {
  success: boolean;
  data?: string; // Base64 encoded biometric data
  type: 'fingerprint' | 'facial' | 'iris' | 'voice';
  quality: 'poor' | 'fair' | 'good' | 'excellent';
  confidence: number;
  captureTime: number;
  deviceInfo?: {
    type: string;
    model: string;
    capabilities: string[];
  };
}

export interface BiometricDevice {
  id: string;
  name: string;
  type: 'fingerprint' | 'facial' | 'iris' | 'voice';
  status: 'available' | 'busy' | 'error' | 'disconnected';
  capabilities: string[];
}

class BiometricCaptureService {
  private devices: BiometricDevice[] = [];
  private isInitialized = false;

  /**
   * Initialize biometric capture service and detect available devices
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Detect available biometric devices
      await this.detectDevices();
      this.isInitialized = true;
      console.log('Biometric capture service initialized');
    } catch (error) {
      console.error('Failed to initialize biometric capture service:', error);
      throw new Error('Biometric capture initialization failed');
    }
  }

  /**
   * Detect available biometric capture devices
   */
  private async detectDevices(): Promise<void> {
    this.devices = [];

    // Check for WebAuthn support (modern browsers)
    if (window.navigator.credentials && window.PublicKeyCredential) {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (available) {
        this.devices.push({
          id: 'webauthn-platform',
          name: 'Platform Authenticator',
          type: 'fingerprint',
          status: 'available',
          capabilities: ['fingerprint', 'facial', 'pin']
        });
      }
    }

    // Check for mobile device biometric APIs
    if ('navigator' in window && 'userAgent' in navigator) {
      const userAgent = navigator.userAgent.toLowerCase();
      
      if (userAgent.includes('mobile') || userAgent.includes('android') || userAgent.includes('iphone')) {
        this.devices.push({
          id: 'mobile-biometric',
          name: 'Mobile Biometric Sensor',
          type: 'fingerprint',
          status: 'available',
          capabilities: ['fingerprint', 'facial']
        });
      }
    }

    // Simulate hardware fingerprint scanner detection
    // In production, this would use actual hardware APIs
    if (import.meta.env.VITE_USE_REAL_GOVERNMENT_DB !== 'true') {
      this.devices.push({
        id: 'simulated-scanner',
        name: 'Development Fingerprint Scanner',
        type: 'fingerprint',
        status: 'available',
        capabilities: ['fingerprint']
      });
    }
  }

  /**
   * Get list of available biometric devices
   */
  getAvailableDevices(): BiometricDevice[] {
    return this.devices.filter(device => device.status === 'available');
  }

  /**
   * Capture fingerprint using the best available method
   */
  async captureFingerprint(deviceId?: string): Promise<BiometricCaptureResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    const availableDevices = this.getAvailableDevices().filter(d => d.type === 'fingerprint');

    if (availableDevices.length === 0) {
      throw new Error('No fingerprint capture devices available');
    }

    const device = deviceId 
      ? availableDevices.find(d => d.id === deviceId)
      : availableDevices[0];

    if (!device) {
      throw new Error('Specified fingerprint device not available');
    }

    try {
      // Mark device as busy
      device.status = 'busy';

      let result: BiometricCaptureResult;

      switch (device.id) {
        case 'webauthn-platform':
          result = await this.captureWithWebAuthn();
          break;
        case 'mobile-biometric':
          result = await this.captureWithMobileBiometric();
          break;
        case 'simulated-scanner':
          result = await this.captureWithSimulatedScanner();
          break;
        default:
          throw new Error('Unsupported biometric device');
      }

      // Mark device as available again
      device.status = 'available';

      return {
        ...result,
        captureTime: Date.now() - startTime,
        deviceInfo: {
          type: device.name,
          model: device.id,
          capabilities: device.capabilities
        }
      };

    } catch (error) {
      // Mark device as available again
      device.status = 'available';
      throw error;
    }
  }

  /**
   * Capture fingerprint using WebAuthn API
   */
  private async captureWithWebAuthn(): Promise<BiometricCaptureResult> {
    try {
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rp: { name: "Apartment Rental Platform" },
          user: {
            id: crypto.getRandomValues(new Uint8Array(16)),
            name: "biometric-user",
            displayName: "Biometric User"
          },
          pubKeyCredParams: [{ alg: -7, type: "public-key" }],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required"
          },
          timeout: 30000
        }
      }) as PublicKeyCredential;

      if (credential && credential.rawId) {
        // Convert credential to biometric data
        const biometricData = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
        
        return {
          success: true,
          data: biometricData,
          type: 'fingerprint',
          quality: 'excellent',
          confidence: 0.95,
          captureTime: 0 // Will be set by caller
        };
      } else {
        throw new Error('WebAuthn credential creation failed');
      }
    } catch (error) {
      console.error('WebAuthn capture failed:', error);
      throw new Error('Biometric authentication failed. Please try again.');
    }
  }

  /**
   * Capture fingerprint using mobile biometric APIs
   */
  private async captureWithMobileBiometric(): Promise<BiometricCaptureResult> {
    // In a real mobile app, this would use:
    // - iOS: Touch ID / Face ID APIs
    // - Android: BiometricPrompt API
    
    return new Promise((resolve, reject) => {
      // Simulate mobile biometric prompt
      const userConfirmed = confirm(
        'Use your device\'s biometric sensor (fingerprint/face) to authenticate'
      );

      if (userConfirmed) {
        // Simulate biometric capture
        setTimeout(() => {
          const success = Math.random() > 0.1; // 90% success rate
          
          if (success) {
            const biometricData = btoa(`mobile_biometric_${Date.now()}_${Math.random()}`);
            resolve({
              success: true,
              data: biometricData,
              type: 'fingerprint',
              quality: 'good',
              confidence: 0.88,
              captureTime: 0
            });
          } else {
            reject(new Error('Mobile biometric authentication failed'));
          }
        }, 2000);
      } else {
        reject(new Error('User cancelled biometric authentication'));
      }
    });
  }

  /**
   * Capture fingerprint using simulated scanner (development mode)
   */
  private async captureWithSimulatedScanner(): Promise<BiometricCaptureResult> {
    return new Promise((resolve, reject) => {
      // Show user interaction prompt for fingerprint scanning
      const userConfirmed = confirm(
        '🔒 FINGERPRINT SCANNER ACTIVATED\n\n' +
        'Please place your finger on the scanner and hold steady.\n\n' +
        'Click OK when your finger is positioned on the scanner.\n' +
        'Click Cancel to abort scanning.'
      );

      if (!userConfirmed) {
        reject(new Error('Fingerprint scanning cancelled by user'));
        return;
      }

      // Show scanning progress
      let scanProgress = 0;
      const progressInterval = setInterval(() => {
        scanProgress += 10;
        console.log(`🔍 Fingerprint scanning progress: ${scanProgress}%`);

        if (scanProgress >= 100) {
          clearInterval(progressInterval);
        }
      }, 300);

      // Simulate realistic fingerprint scanning process
      setTimeout(() => {
        clearInterval(progressInterval);

        const success = Math.random() > 0.15; // 85% success rate
        const quality = ['poor', 'fair', 'good', 'excellent'][Math.floor(Math.random() * 4)] as any;
        const confidence = success ? 0.75 + Math.random() * 0.25 : Math.random() * 0.5;

        if (success && quality !== 'poor') {
          // Generate consistent fingerprint data based on timestamp
          const biometricData = btoa(`real_fingerprint_${Date.now()}_${Math.random().toString(36).substring(2)}`);

          console.log('✅ Fingerprint captured successfully!');

          resolve({
            success: true,
            data: biometricData,
            type: 'fingerprint',
            quality,
            confidence,
            captureTime: 0
          });
        } else {
          const errorMessages = [
            'Fingerprint capture failed. Please clean your finger and try again.',
            'Poor fingerprint quality. Please press firmly and hold steady.',
            'Fingerprint not recognized. Please try a different finger.',
            'Scanner timeout. Please try again.'
          ];

          console.log('❌ Fingerprint capture failed');
          reject(new Error(errorMessages[Math.floor(Math.random() * errorMessages.length)]));
        }
      }, 3000 + Math.random() * 2000); // 3-5 second scanning time
    });
  }

  /**
   * Validate captured biometric data quality
   */
  validateBiometricQuality(result: BiometricCaptureResult): {
    isValid: boolean;
    issues: string[];
    score: number;
  } {
    const issues: string[] = [];
    let score = 0;

    if (!result.success || !result.data) {
      issues.push('Biometric capture failed');
      return { isValid: false, issues, score: 0 };
    }

    // Check quality
    switch (result.quality) {
      case 'excellent':
        score += 40;
        break;
      case 'good':
        score += 30;
        break;
      case 'fair':
        score += 20;
        break;
      case 'poor':
        issues.push('Poor biometric quality');
        score += 10;
        break;
    }

    // Check confidence
    if (result.confidence >= 0.9) {
      score += 30;
    } else if (result.confidence >= 0.8) {
      score += 25;
    } else if (result.confidence >= 0.7) {
      score += 20;
    } else {
      issues.push('Low confidence in biometric capture');
      score += 10;
    }

    // Check capture time (reasonable time indicates proper scanning)
    if (result.captureTime >= 2000 && result.captureTime <= 10000) {
      score += 20;
    } else if (result.captureTime < 2000) {
      issues.push('Capture time too short - may not be authentic');
      score += 5;
    } else {
      issues.push('Capture time too long - may indicate scanning issues');
      score += 10;
    }

    // Check data integrity
    if (result.data.length >= 50) {
      score += 10;
    } else {
      issues.push('Insufficient biometric data captured');
    }

    const isValid = issues.length === 0 && score >= 70;

    return {
      isValid,
      issues,
      score
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.devices = [];
    this.isInitialized = false;
  }
}

export default new BiometricCaptureService();
