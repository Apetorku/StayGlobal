import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Fingerprint, CheckCircle, AlertCircle, RotateCcw } from 'lucide-react';
import identityVerificationService, { FingerprintData } from '@/services/identityVerificationService';

interface FingerprintCaptureProps {
  onComplete: (data: FingerprintData) => void;
  onBack: () => void;
  initialData?: FingerprintData;
}

const FingerprintCapture: React.FC<FingerprintCaptureProps> = ({ onComplete, onBack, initialData }) => {
  const [captureState, setCaptureState] = useState<'idle' | 'capturing' | 'captured' | 'error'>('idle');
  const [fingerprintData, setFingerprintData] = useState<FingerprintData | null>(initialData || null);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [error, setError] = useState<string>('');

  const startCapture = async () => {
    setCaptureState('capturing');
    setCaptureProgress(0);
    setError('');

    try {
      // Simulate capture progress
      const progressInterval = setInterval(() => {
        setCaptureProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      // Capture fingerprint (simulated)
      const capturedData = await identityVerificationService.captureFingerprint();
      
      clearInterval(progressInterval);
      setCaptureProgress(100);

      // Validate quality
      if (capturedData.quality < 60) {
        setCaptureState('error');
        setError('Fingerprint quality too low. Please try again with a clean finger.');
        return;
      }

      setFingerprintData(capturedData);
      setCaptureState('captured');

    } catch (error) {
      setCaptureState('error');
      setError('Failed to capture fingerprint. Please try again.');
      setCaptureProgress(0);
    }
  };

  const retryCapture = () => {
    setCaptureState('idle');
    setFingerprintData(null);
    setCaptureProgress(0);
    setError('');
  };

  const handleSubmit = () => {
    if (fingerprintData) {
      onComplete(fingerprintData);
    }
  };

  const getQualityColor = (quality: number) => {
    if (quality >= 80) return 'text-green-600';
    if (quality >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityLabel = (quality: number) => {
    if (quality >= 80) return 'Excellent';
    if (quality >= 60) return 'Good';
    return 'Poor';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Fingerprint Capture
          </CardTitle>
          <CardDescription>
            Place your finger on the scanner to capture your fingerprint for verification
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Instructions */}
      <Alert>
        <Fingerprint className="h-4 w-4" />
        <AlertDescription>
          <strong>Instructions:</strong>
          <ul className="mt-2 text-sm space-y-1">
            <li>• Clean your finger to ensure a clear scan</li>
            <li>• Place your finger firmly on the scanner</li>
            <li>• Keep your finger still during the scan</li>
            <li>• Use your index finger for best results</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Fingerprint Scanner Simulation */}
      <Card className="border-2 border-dashed border-gray-300">
        <CardContent className="p-8">
          <div className="flex flex-col items-center space-y-6">
            {/* Scanner Visual */}
            <div className={`relative w-32 h-32 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${
              captureState === 'capturing' 
                ? 'border-blue-500 bg-blue-50 animate-pulse' 
                : captureState === 'captured'
                ? 'border-green-500 bg-green-50'
                : captureState === 'error'
                ? 'border-red-500 bg-red-50'
                : 'border-gray-300 bg-gray-50'
            }`}>
              <Fingerprint className={`h-16 w-16 ${
                captureState === 'capturing' 
                  ? 'text-blue-500' 
                  : captureState === 'captured'
                  ? 'text-green-500'
                  : captureState === 'error'
                  ? 'text-red-500'
                  : 'text-gray-400'
              }`} />
              
              {captureState === 'captured' && (
                <CheckCircle className="absolute -top-2 -right-2 h-8 w-8 text-green-500 bg-white rounded-full" />
              )}
            </div>

            {/* Status Text */}
            <div className="text-center">
              {captureState === 'idle' && (
                <p className="text-gray-600">Ready to scan fingerprint</p>
              )}
              
              {captureState === 'capturing' && (
                <div className="space-y-2">
                  <p className="text-blue-600 font-medium">Scanning fingerprint...</p>
                  <Progress value={captureProgress} className="w-48" />
                  <p className="text-sm text-gray-500">{captureProgress}% complete</p>
                </div>
              )}
              
              {captureState === 'captured' && fingerprintData && (
                <div className="space-y-2">
                  <p className="text-green-600 font-medium">Fingerprint captured successfully!</p>
                  <div className="text-sm text-gray-600">
                    <p>Quality: <span className={getQualityColor(fingerprintData.quality)}>
                      {fingerprintData.quality}% ({getQualityLabel(fingerprintData.quality)})
                    </span></p>
                    <p>Device: {fingerprintData.captureDevice}</p>
                  </div>
                </div>
              )}
              
              {captureState === 'error' && (
                <div className="space-y-2">
                  <p className="text-red-600 font-medium">Capture failed</p>
                  <p className="text-sm text-gray-600">{error}</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {captureState === 'idle' && (
                <Button onClick={startCapture} className="px-8">
                  Start Scan
                </Button>
              )}
              
              {captureState === 'capturing' && (
                <Button disabled className="px-8">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Scanning...
                </Button>
              )}
              
              {(captureState === 'captured' || captureState === 'error') && (
                <Button 
                  variant="outline" 
                  onClick={retryCapture}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Scan Again
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {captureState === 'error' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Quality Requirements */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Quality Requirements:</strong> A minimum quality score of 60% is required. 
          If your scan quality is too low, please clean your finger and try again.
        </AlertDescription>
      </Alert>

      {/* Navigation Buttons */}
      <div className="flex gap-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={handleSubmit}
          className="flex-1"
          disabled={captureState !== 'captured' || !fingerprintData}
        >
          Continue to Review
        </Button>
      </div>
    </div>
  );
};

export default FingerprintCapture;
