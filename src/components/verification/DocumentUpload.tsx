import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, Upload, X, CheckCircle, AlertCircle, Video, RotateCcw, Scan, Eye } from 'lucide-react';
import identityVerificationService, { DocumentImages } from '@/services/identityVerificationService';
import faceDetectionService from '@/services/faceDetectionService';

interface DocumentUploadProps {
  onComplete: (data: DocumentImages) => void;
  onBack: () => void;
  initialData?: DocumentImages;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ onComplete, onBack, initialData }) => {
  const [documents, setDocuments] = useState<DocumentImages>({
    frontImage: initialData?.frontImage || '',
    backImage: initialData?.backImage || '',
    selfieImage: initialData?.selfieImage || ''
  });

  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [captureCountdown, setCaptureCountdown] = useState(0);
  const [faceScanning, setFaceScanning] = useState(false);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileSelect = async (type: keyof DocumentImages, file: File) => {
    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setErrors(prev => ({ ...prev, [type]: validationError }));
      return;
    }

    setUploading(prev => ({ ...prev, [type]: true }));
    setErrors(prev => ({ ...prev, [type]: '' }));

    try {
      // Convert to base64
      const base64 = await identityVerificationService.fileToBase64(file);
      
      setDocuments(prev => ({ ...prev, [type]: base64 }));
    } catch (error) {
      setErrors(prev => ({ ...prev, [type]: 'Failed to process image. Please try again.' }));
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return 'Please select an image file';
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return 'Image size must be less than 5MB';
    }

    // Check image dimensions (basic check)
    return null;
  };

  const removeDocument = (type: keyof DocumentImages) => {
    setDocuments(prev => ({ ...prev, [type]: '' }));
    setErrors(prev => ({ ...prev, [type]: '' }));
  };

  // Camera access and face detection functions
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user' // Front-facing camera
        },
        audio: false
      });

      setCameraStream(stream);
      setShowCameraModal(true);
      setFaceScanning(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();

        // Start face detection after video loads
        videoRef.current.onloadedmetadata = () => {
          startFaceDetection();
        };
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setErrors(prev => ({ ...prev, selfieImage: 'Unable to access camera. Please check permissions.' }));
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
    setFaceDetected(false);
    setCaptureCountdown(0);
    setFaceScanning(false);
  }, [cameraStream]);

  // Enhanced face detection using the face detection service
  const startFaceDetection = useCallback(async () => {
    if (!videoRef.current || !faceScanning) return;

    try {
      // Initialize face detection service
      await faceDetectionService.initialize();

      const detectFace = async () => {
        if (!videoRef.current || !faceScanning) return;

        try {
          // Use the enhanced face detection service
          const result = await faceDetectionService.detectFaceInVideo(videoRef.current);

          if (result.faceDetected) {
            // Validate face quality
            const qualityCheck = faceDetectionService.validateFaceQuality(result);

            if (qualityCheck.isValid) {
              setFaceDetected(true);
              startCaptureCountdown();
            } else {
              // Show quality issues to user
              const issueMessage = qualityCheck.issues.join(', ');
              setErrors(prev => ({ ...prev, selfieImage: `Face quality issues: ${issueMessage}` }));

              // Retry detection after a short delay
              setTimeout(() => {
                if (faceScanning) {
                  detectFace();
                }
              }, 2000);
            }
          } else {
            // Continue scanning if no face detected
            setTimeout(() => {
              if (faceScanning) {
                detectFace();
              }
            }, 1000);
          }
        } catch (error) {
          console.error('Face detection error:', error);
          // Fallback to simple detection
          setTimeout(() => {
            if (faceScanning) {
              setFaceDetected(true);
              startCaptureCountdown();
            }
          }, 3000);
        }
      };

      // Start detection
      detectFace();
    } catch (error) {
      console.error('Failed to initialize face detection:', error);
      // Fallback to simple detection
      setTimeout(() => {
        if (faceScanning) {
          setFaceDetected(true);
          startCaptureCountdown();
        }
      }, 3000);
    }
  }, [faceScanning]);

  const startCaptureCountdown = useCallback(() => {
    let countdown = 3;
    setCaptureCountdown(countdown);

    const countdownInterval = setInterval(() => {
      countdown -= 1;
      setCaptureCountdown(countdown);

      if (countdown === 0) {
        clearInterval(countdownInterval);
        capturePhoto();
      }
    }, 1000);
  }, []);

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob(async (blob) => {
      if (blob) {
        try {
          // Convert blob to base64
          const base64 = await identityVerificationService.fileToBase64(blob as File);
          setDocuments(prev => ({ ...prev, selfieImage: base64 }));

          // Stop camera and close modal
          stopCamera();
        } catch (error) {
          setErrors(prev => ({ ...prev, selfieImage: 'Failed to capture photo. Please try again.' }));
        }
      }
    }, 'image/jpeg', 0.8);
  }, [stopCamera]);

  const retryCameraCapture = useCallback(() => {
    setFaceDetected(false);
    setCaptureCountdown(0);
    setFaceScanning(true);
    startFaceDetection();
  }, [startFaceDetection]);

  // Cleanup camera stream on component unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};

    if (!documents.frontImage) {
      newErrors.frontImage = 'Front image of ID is required';
    }

    if (!documents.selfieImage) {
      newErrors.selfieImage = 'Selfie photo is required';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onComplete(documents);
    }
  };

  const DocumentUploadCard = ({ 
    type, 
    title, 
    description, 
    required = false,
    inputRef 
  }: {
    type: keyof DocumentImages;
    title: string;
    description: string;
    required?: boolean;
    inputRef: React.RefObject<HTMLInputElement>;
  }) => {
    const hasImage = !!documents[type];
    const isUploading = uploading[type];
    const error = errors[type];

    return (
      <Card className={`border-2 ${error ? 'border-red-300' : hasImage ? 'border-green-300' : 'border-dashed border-gray-300'}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            {hasImage ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
            {title} {required && <span className="text-red-500">*</span>}
          </CardTitle>
          <CardDescription className="text-xs">{description}</CardDescription>
        </CardHeader>
        
        <CardContent className="pt-0">
          {hasImage ? (
            <div className="space-y-3">
              <div className="relative">
                <img 
                  src={documents[type]} 
                  alt={title}
                  className="w-full h-32 object-cover rounded-md"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 h-6 w-6 p-0"
                  onClick={() => removeDocument(type)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => inputRef.current?.click()}
              >
                Replace Image
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Special handling for selfie - show camera option */}
              {type === 'selfieImage' ? (
                <div className="grid grid-cols-2 gap-3">
                  {/* Camera Capture Option */}
                  <div
                    className="border-2 border-dashed border-blue-300 rounded-md p-4 text-center cursor-pointer hover:border-blue-400 transition-colors bg-blue-50"
                    onClick={startCamera}
                  >
                    <div className="flex flex-col items-center">
                      <Video className="h-6 w-6 text-blue-600 mb-2" />
                      <p className="text-xs text-blue-600 font-medium">Use Camera</p>
                      <p className="text-xs text-blue-500">Live capture</p>
                    </div>
                  </div>

                  {/* File Upload Option */}
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center cursor-pointer hover:border-gray-400 transition-colors"
                    onClick={() => inputRef.current?.click()}
                  >
                    <div className="flex flex-col items-center">
                      <Upload className="h-6 w-6 text-gray-400 mb-2" />
                      <p className="text-xs text-gray-600 font-medium">Upload File</p>
                      <p className="text-xs text-gray-500">From gallery</p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Regular upload for other document types */
                <div
                  className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                  onClick={() => inputRef.current?.click()}
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                      <p className="text-sm text-gray-600">Uploading...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Click to upload</p>
                      <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {error && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}
          
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleFileSelect(type, file);
              }
            }}
          />
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Document Upload
          </CardTitle>
          <CardDescription>
            Upload clear photos of your ID document and a selfie for verification
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Upload Guidelines */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Photo Guidelines:</strong>
          <ul className="mt-2 text-sm space-y-1">
            <li>• Ensure all text is clearly visible and readable</li>
            <li>• Take photos in good lighting conditions</li>
            <li>• Avoid glare, shadows, or blurry images</li>
            <li>• Make sure the entire document is visible in the frame</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Document Upload Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <DocumentUploadCard
          type="frontImage"
          title="ID Front"
          description="Front side of your ID document"
          required
          inputRef={frontInputRef}
        />
        
        <DocumentUploadCard
          type="backImage"
          title="ID Back"
          description="Back side of your ID document (if applicable)"
          inputRef={backInputRef}
        />
        
        <DocumentUploadCard
          type="selfieImage"
          title="Selfie Photo"
          description="Clear photo of yourself holding your ID"
          required
          inputRef={selfieInputRef}
        />
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          className="flex-1"
          disabled={!documents.frontImage || !documents.selfieImage}
        >
          Continue to Fingerprint
        </Button>
      </div>

      {/* Camera Modal for Selfie Capture */}
      <Dialog open={showCameraModal} onOpenChange={setShowCameraModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scan className="h-6 w-6 text-blue-600" />
              Live Selfie Capture
            </DialogTitle>
            <DialogDescription>
              Position your face in the center of the frame. The system will automatically detect your face and capture the photo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Camera Feed */}
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-80 object-cover"
                autoPlay
                playsInline
                muted
              />

              {/* Face Detection Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Face Detection Frame */}
                <div className={`w-48 h-64 border-4 rounded-lg transition-colors ${
                  faceDetected ? 'border-green-400' : 'border-blue-400'
                } ${faceDetected ? 'animate-pulse' : ''}`}>
                  <div className="w-full h-full flex items-center justify-center">
                    {!faceDetected && faceScanning && (
                      <div className="text-white text-center">
                        <Scan className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                        <p className="text-sm">Scanning for face...</p>
                      </div>
                    )}

                    {faceDetected && captureCountdown > 0 && (
                      <div className="text-white text-center">
                        <div className="text-4xl font-bold mb-2">{captureCountdown}</div>
                        <p className="text-sm">Get ready!</p>
                      </div>
                    )}

                    {faceDetected && captureCountdown === 0 && (
                      <div className="text-green-400 text-center">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">Face detected!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="absolute top-4 left-4">
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  faceDetected
                    ? 'bg-green-500 text-white'
                    : 'bg-blue-500 text-white'
                }`}>
                  {faceDetected ? '✓ Face Detected' : '👤 Looking for face...'}
                </div>
              </div>
            </div>

            {/* Instructions */}
            <Alert>
              <Camera className="h-4 w-4" />
              <AlertDescription>
                <strong>Instructions:</strong>
                <ul className="mt-2 text-sm space-y-1">
                  <li>• Look directly at the camera</li>
                  <li>• Keep your face centered in the frame</li>
                  <li>• Ensure good lighting on your face</li>
                  <li>• Remove glasses or hats if possible</li>
                  <li>• Stay still when the countdown begins</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={stopCamera}>
                Cancel
              </Button>

              {faceDetected && (
                <Button onClick={retryCameraCapture} variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retry Detection
                </Button>
              )}

              <div className="flex-1" />

              {!faceDetected && (
                <Button onClick={retryCameraCapture} disabled={!faceScanning}>
                  <Scan className="h-4 w-4 mr-2" />
                  Start Scanning
                </Button>
              )}
            </div>
          </div>

          {/* Hidden canvas for photo capture */}
          <canvas ref={canvasRef} className="hidden" />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentUpload;
