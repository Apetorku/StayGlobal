import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AuthLoadingStateProps {
  message?: string;
  description?: string;
}

export default function AuthLoadingState({ 
  message = "Setting up your account...", 
  description = "Please wait while we prepare your dashboard" 
}: AuthLoadingStateProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
          </div>
          <CardTitle className="text-2xl">{message}</CardTitle>
          <CardDescription className="text-base">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="space-y-2 text-sm text-gray-600">
            <p>✓ Authenticating your account</p>
            <p>✓ Syncing your profile</p>
            <p>⏳ Preparing your dashboard</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
