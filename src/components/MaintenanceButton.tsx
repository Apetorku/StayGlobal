import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const MaintenanceButton = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { getToken } = useAuth();
  const { toast } = useToast();

  const updateApartmentPaymentAccounts = async () => {
    setIsUpdating(true);
    setResult(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      console.log('🔄 Calling maintenance API...');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/apartments/update-payment-accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Maintenance API response:', data);
      
      setResult(data);
      
      toast({
        title: "Update Completed",
        description: `Updated ${data.summary.updated} apartments, skipped ${data.summary.skipped}`,
        variant: "default"
      });

    } catch (error) {
      console.error('❌ Maintenance API error:', error);
      
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
      
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Apartment Payment Account Update
        </CardTitle>
        <CardDescription>
          Update existing apartments with their owner's payment account information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">What this does:</h4>
              <p className="text-sm text-yellow-700 mt-1">
                This will find apartments that don't have payment account data and update them 
                with their owner's payment account information. This is needed for apartments 
                created before payment accounts were required.
              </p>
            </div>
          </div>
        </div>

        <Button 
          onClick={updateApartmentPaymentAccounts}
          disabled={isUpdating}
          className="w-full"
          size="lg"
        >
          {isUpdating ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Update Apartment Payment Accounts
            </>
          )}
        </Button>

        {result && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Results:</h4>
            {result.error ? (
              <div className="text-red-600">
                <p>Error: {result.error}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p><strong>Total apartments processed:</strong> {result.summary?.total || 0}</p>
                <p><strong>Updated:</strong> {result.summary?.updated || 0}</p>
                <p><strong>Skipped:</strong> {result.summary?.skipped || 0}</p>
                
                {result.results && result.results.length > 0 && (
                  <details className="mt-4">
                    <summary className="cursor-pointer font-medium">View Details</summary>
                    <div className="mt-2 max-h-40 overflow-y-auto">
                      {result.results.map((item: any, index: number) => (
                        <div key={index} className="text-sm py-1 border-b">
                          <span className="font-medium">{item.title}</span>
                          <span className={`ml-2 px-2 py-1 rounded text-xs ${
                            item.status === 'updated' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.status}
                          </span>
                          {item.reason && (
                            <span className="ml-2 text-gray-600">- {item.reason}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MaintenanceButton;
