import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  XCircle, 
  Shield, 
  FileText, 
  Fingerprint, 
  Eye,
  RefreshCw
} from 'lucide-react';
import { VerificationStatus as VerificationStatusType } from '@/services/identityVerificationService';

interface VerificationStatusProps {
  status: VerificationStatusType | null;
  onClose?: () => void;
  onRetry?: () => void;
}

const VerificationStatus: React.FC<VerificationStatusProps> = ({ status, onClose, onRetry }) => {
  if (!status) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-600">Loading verification status...</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (verificationStatus: string) => {
    switch (verificationStatus) {
      case 'verified':
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      case 'pending':
      case 'in_review':
        return <Clock className="h-8 w-8 text-yellow-600" />;
      case 'rejected':
        return <XCircle className="h-8 w-8 text-red-600" />;
      case 'expired':
        return <AlertCircle className="h-8 w-8 text-orange-600" />;
      default:
        return <Shield className="h-8 w-8 text-gray-600" />;
    }
  };

  const getStatusColor = (verificationStatus: string) => {
    switch (verificationStatus) {
      case 'verified':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_review':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'expired':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusMessage = (verificationStatus: string) => {
    switch (verificationStatus) {
      case 'verified':
        return {
          title: 'Verification Complete!',
          description: 'Your identity has been successfully verified. You can now list apartments on our platform.'
        };
      case 'pending':
        return {
          title: 'Verification Pending',
          description: 'Your verification is being processed. This usually takes 1-2 business days.'
        };
      case 'in_review':
        return {
          title: 'Manual Review Required',
          description: 'Your submission requires manual review by our team. We\'ll notify you once complete.'
        };
      case 'rejected':
        return {
          title: 'Verification Rejected',
          description: 'Your verification was rejected. Please review the feedback and try again.'
        };
      case 'expired':
        return {
          title: 'Verification Expired',
          description: 'Your verification has expired. Please submit a new verification request.'
        };
      default:
        return {
          title: 'No Verification',
          description: 'You haven\'t submitted a verification request yet.'
        };
    }
  };

  const statusMessage = getStatusMessage(status.verificationStatus);

  const StepStatus = ({ 
    icon: Icon, 
    title, 
    completed, 
    description 
  }: { 
    icon: any; 
    title: string; 
    completed: boolean; 
    description: string;
  }) => (
    <div className="flex items-start gap-3 p-3 rounded-lg border">
      <div className={`p-2 rounded-full ${completed ? 'bg-green-100' : 'bg-gray-100'}`}>
        <Icon className={`h-4 w-4 ${completed ? 'text-green-600' : 'text-gray-400'}`} />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-sm">{title}</h4>
          {completed && <CheckCircle className="h-4 w-4 text-green-600" />}
        </div>
        <p className="text-xs text-gray-600 mt-1">{description}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Main Status Card */}
      <Card className={`border-2 ${getStatusColor(status.verificationStatus)}`}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon(status.verificationStatus)}
          </div>
          <CardTitle>{statusMessage.title}</CardTitle>
          <CardDescription>{statusMessage.description}</CardDescription>
          
          <div className="flex justify-center mt-4">
            <Badge className={getStatusColor(status.verificationStatus)}>
              {status.verificationStatus.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Verification Steps Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Verification Progress</CardTitle>
          <CardDescription>Track the status of each verification step</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <StepStatus
            icon={FileText}
            title="Document Submission"
            completed={status.steps.documentSubmitted}
            description="National ID information and document images uploaded"
          />
          
          <StepStatus
            icon={Eye}
            title="Document Verification"
            completed={status.steps.documentVerified}
            description="Document authenticity and information verified"
          />
          
          <StepStatus
            icon={Fingerprint}
            title="Biometric Capture"
            completed={status.steps.biometricCaptured}
            description="Fingerprint successfully captured and stored"
          />
          
          <StepStatus
            icon={Shield}
            title="Biometric Verification"
            completed={status.steps.biometricVerified}
            description="Fingerprint verified against national database"
          />
          
          {status.steps.manualReviewRequired && (
            <StepStatus
              icon={Eye}
              title="Manual Review"
              completed={status.steps.manualReviewCompleted}
              description="Additional review by verification team"
            />
          )}
        </CardContent>
      </Card>

      {/* Verification Results */}
      {status.verificationStatus !== 'none' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Verification Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Document Authenticity</p>
                <Badge variant={status.results.documentAuthenticity === 'passed' ? 'default' : 'secondary'}>
                  {status.results.documentAuthenticity}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Biometric Match</p>
                <Badge variant={status.results.biometricMatch === 'passed' ? 'default' : 'secondary'}>
                  {status.results.biometricMatch}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Face Match</p>
                <Badge variant={status.results.faceMatch === 'passed' ? 'default' : 'secondary'}>
                  {status.results.faceMatch}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Duplicate Check</p>
                <Badge variant={status.results.duplicateCheck === 'passed' ? 'default' : 'secondary'}>
                  {status.results.duplicateCheck}
                </Badge>
              </div>
            </div>
            
            <div className="mt-4">
              <p className="text-sm font-medium">Overall Score</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${status.results.overallScore}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{status.results.overallScore}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        {status.verificationStatus === 'rejected' && onRetry && (
          <Button onClick={onRetry} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Start New Verification
          </Button>
        )}
        
        {status.verificationStatus === 'verified' && (
          <Alert className="flex-1">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Congratulations!</strong> You can now list apartments and receive direct payments from renters.
            </AlertDescription>
          </Alert>
        )}
        
        {onClose && (
          <Button variant="outline" onClick={onClose} className="ml-auto">
            Close
          </Button>
        )}
      </div>
    </div>
  );
};

export default VerificationStatus;
