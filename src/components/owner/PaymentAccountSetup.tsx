import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@clerk/clerk-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CreditCard, Smartphone, CheckCircle, AlertCircle, Loader2, Trash2, RefreshCw } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://web-production-8ffb7.up.railway.app/api';

interface Bank {
  id: number;
  name: string;
  code: string;
  country: string;
  currency: string;
}

interface PaymentAccount {
  provider: 'paystack' | 'momo';
  accountDetails: {
    subaccountCode?: string;
    bankCode?: string;
    accountNumber?: string;
    accountName?: string;
    momoNumber?: string;
    momoProvider?: 'mtn' | 'vodafone' | 'airteltigo';
  };
  isVerified: boolean;
  createdAt: string;
}

interface PaymentAccountSetupProps {
  onSetupComplete?: () => void;
}

const PaymentAccountSetup: React.FC<PaymentAccountSetupProps> = ({ onSetupComplete }) => {
  const { getToken, isSignedIn, user } = useAuth();
  const queryClient = useQueryClient();

  // Form states
  const [paystackForm, setPaystackForm] = useState({
    bankCode: '',
    accountNumber: '',
    businessName: '',
    description: ''
  });

  const [momoForm, setMomoForm] = useState({
    momoNumber: '',
    momoProvider: ''
  });

  const [verifiedAccount, setVerifiedAccount] = useState<{
    accountName: string;
    accountNumber: string;
    bankCode: string;
  } | null>(null);

  const [refreshingBanks, setRefreshingBanks] = useState(false);

  // Fetch current payment account
  const { data: paymentAccount, isLoading: accountLoading } = useQuery({
    queryKey: ['payment-account'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }
      const response = await fetch(`${API_BASE_URL}/user-payments/account`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch payment account');
      const data = await response.json();
      return data.paymentAccount as PaymentAccount | null;
    },
    enabled: !!isSignedIn && !!user
  });

  // Fetch banks
  const { data: banksData, isLoading: banksLoading, error: banksError, refetch: refetchBanks } = useQuery({
    queryKey: ['banks'],
    queryFn: async () => {
      console.log('🏦 Starting banks fetch...');
      console.log('🏦 API URL:', `${API_BASE_URL}/user-payments/banks`);

      try {
        const response = await fetch(`${API_BASE_URL}/user-payments/banks`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log('🏦 Response received:', response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Response not OK:', errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('✅ JSON parsed successfully:', data);

        if (data.banks && Array.isArray(data.banks)) {
          console.log('✅ Banks array found with', data.banks.length, 'items');
          return data.banks as Bank[];
        } else {
          console.error('❌ Invalid response structure:', data);
          throw new Error('Invalid response format');
        }
      } catch (fetchError) {
        console.error('❌ Fetch error:', fetchError);
        throw fetchError;
      }
    },
    retry: 1,
    retryDelay: 1000,
    enabled: true,
    onError: (error) => {
      console.error('❌ Query error:', error);
    },
    onSuccess: (data) => {
      console.log('✅ Query success with', data?.length, 'banks');
    }
  });

  // Verify account number
  const verifyAccountMutation = useMutation({
    mutationFn: async ({ accountNumber, bankCode }: { accountNumber: string; bankCode: string }) => {
      console.log('🔍 Verifying account:', { accountNumber, bankCode });

      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/user-payments/verify-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ accountNumber, bankCode })
      });

      console.log('🔍 Verify response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Account verification error:', errorData);
        throw new Error(errorData.error || `Verification failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Account verified:', data);
      return data;
    },
    onSuccess: (data) => {
      setVerifiedAccount(data);
      toast.success(`Account verified: ${data.accountName}`);
    },
    onError: (error: Error) => {
      console.error('❌ Verification error:', error);

      // Check if it's a bank code error and provide helpful message
      if (error.message.includes('Unknown bank code') || error.message.includes('Invalid bank code')) {
        toast.error('Bank not supported. Please refresh the page and select a different bank, or contact support.');
      } else {
        toast.error(`Failed to verify account: ${error.message}`);
      }
      setVerifiedAccount(null);
    }
  });

  // Setup Paystack account (free)
  const setupPaystackMutation = useMutation({
    mutationFn: async (data: typeof paystackForm) => {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/user-payments/account/paystack`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to setup Paystack account');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Payment account setup successfully!');
      queryClient.invalidateQueries({ queryKey: ['payment-account'] });
      setPaystackForm({ bankCode: '', accountNumber: '', businessName: '', description: '' });
      setVerifiedAccount(null);

      // Call onSetupComplete callback if provided
      if (onSetupComplete) {
        setTimeout(() => {
          onSetupComplete();
        }, 1000);
      }
    },
    onError: (error: Error) => {
      console.error('❌ Paystack setup error:', error);
      toast.error(error.message || 'Failed to setup Paystack account. Please try again.');
    }
  });



  // Setup Mobile Money account
  const setupMomoMutation = useMutation({
    mutationFn: async (data: typeof momoForm) => {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/user-payments/account/momo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to setup Mobile Money account');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Mobile Money account setup successfully!');
      queryClient.invalidateQueries({ queryKey: ['payment-account'] });
      setMomoForm({ momoNumber: '', momoProvider: '' });

      // Call onSetupComplete callback if provided
      if (onSetupComplete) {
        setTimeout(() => {
          onSetupComplete();
        }, 1000);
      }
    },
    onError: (error: Error) => {
      console.error('❌ Mobile Money setup error:', error);
      toast.error(error.message || 'Failed to setup Mobile Money account. Please try again.');
    }
  });

  // Remove payment account
  const removeAccountMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/user-payments/account`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to remove payment account');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Payment account removed successfully');
      queryClient.invalidateQueries({ queryKey: ['payment-account'] });
    },
    onError: () => {
      toast.error('Failed to remove payment account');
    }
  });

  const handleVerifyAccount = () => {
    if (!paystackForm.accountNumber || !paystackForm.bankCode) {
      toast.error('Please select a bank and enter account number');
      return;
    }
    verifyAccountMutation.mutate({
      accountNumber: paystackForm.accountNumber,
      bankCode: paystackForm.bankCode
    });
  };

  const handleRefreshBanks = async () => {
    setRefreshingBanks(true);
    try {
      await refetchBanks();
      toast.success('Banks list refreshed');
    } catch (error) {
      toast.error('Failed to refresh banks list');
    } finally {
      setRefreshingBanks(false);
    }
  };

  const handlePaystackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifiedAccount) {
      toast.error('Please verify your account first');
      return;
    }
    if (!paystackForm.businessName) {
      toast.error('Please enter your business name');
      return;
    }
    setupPaystackMutation.mutate(paystackForm);
  };

  const handleMomoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!momoForm.momoNumber || !momoForm.momoProvider) {
      toast.error('Please fill in all Mobile Money details');
      return;
    }
    setupMomoMutation.mutate(momoForm);
  };

  if (accountLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading payment account...</span>
        </CardContent>
      </Card>
    );
  }

  // If account already exists, show current account info
  if (paymentAccount) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Payment Account Setup
          </CardTitle>
          <CardDescription>
            Your payment account is configured and ready to receive payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              {paymentAccount.provider === 'paystack' ? (
                <CreditCard className="h-8 w-8 text-blue-500" />
              ) : (
                <Smartphone className="h-8 w-8 text-green-500" />
              )}
              <div>
                <p className="font-medium">
                  {paymentAccount.provider === 'paystack' ? 'Bank Account (Paystack)' : 'Mobile Money'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {paymentAccount.provider === 'paystack' 
                    ? `${paymentAccount.accountDetails.accountName} - ${paymentAccount.accountDetails.accountNumber}`
                    : `${paymentAccount.accountDetails.momoProvider?.toUpperCase()} - ${paymentAccount.accountDetails.momoNumber}`
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={paymentAccount.isVerified ? "default" : "secondary"}>
                {paymentAccount.isVerified ? "Verified" : "Pending"}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeAccountMutation.mutate()}
                disabled={removeAccountMutation.isPending}
              >
                {removeAccountMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <p className="text-sm text-green-800">
                You're all set! Renters can now make payments directly to your account.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-orange-500" />
          Setup Payment Account
        </CardTitle>
        <CardDescription>
          Configure your payment account to receive payments from renters directly
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="paystack" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="paystack" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Bank Account
            </TabsTrigger>
            <TabsTrigger value="momo" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Mobile Money
            </TabsTrigger>
          </TabsList>

          <TabsContent value="paystack" className="space-y-4">
            {banksError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  ⚠️ Unable to load banks list. Please refresh the page or contact support if the issue persists.
                </p>
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Free Payment Account Setup</h4>
                    <p className="text-sm text-blue-800 mt-1">
                      Set up your bank account to receive payments directly from renters.
                      This is completely free and enables you to start earning from your listings.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handlePaystackSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="bank">Bank</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRefreshBanks}
                      disabled={refreshingBanks || banksLoading}
                      className="h-6 px-2 text-xs"
                    >
                      <RefreshCw className={`h-3 w-3 mr-1 ${refreshingBanks ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                  <Select
                    value={paystackForm.bankCode}
                    onValueChange={(value) => setPaystackForm(prev => ({ ...prev, bankCode: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {banksLoading ? (
                        <SelectItem value="loading" disabled>Loading banks...</SelectItem>
                      ) : banksError ? (
                        <SelectItem value="error" disabled>Error loading banks. Please refresh.</SelectItem>
                      ) : banksData && banksData.length > 0 ? (
                        banksData.map((bank) => (
                          <SelectItem key={bank.code} value={bank.code}>
                            {bank.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-banks" disabled>No banks available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accountNumber"
                      value={paystackForm.accountNumber}
                      onChange={(e) => setPaystackForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                      placeholder="Enter account number"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleVerifyAccount}
                      disabled={verifyAccountMutation.isPending || !paystackForm.accountNumber || !paystackForm.bankCode}
                    >
                      {verifyAccountMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Verify'
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {verifyAccountMutation.isPending && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <p className="text-sm text-blue-800">Verifying account details...</p>
                  </div>
                </div>
              )}

              {verifiedAccount && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✓ Account verified: <strong>{verifiedAccount.accountName}</strong>
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  value={paystackForm.businessName}
                  onChange={(e) => setPaystackForm(prev => ({ ...prev, businessName: e.target.value }))}
                  placeholder="Enter your business name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={paystackForm.description}
                  onChange={(e) => setPaystackForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of your business"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={setupPaystackMutation.isPending || !verifiedAccount || !paystackForm.businessName}
              >
                {setupPaystackMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up account...
                  </>
                ) : (
                  'Setup Bank Account (Free)'
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="momo" className="space-y-4">
            <form onSubmit={handleMomoSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="momoProvider">Mobile Money Provider</Label>
                <Select
                  value={momoForm.momoProvider}
                  onValueChange={(value) => setMomoForm(prev => ({ ...prev, momoProvider: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mtn">MTN Mobile Money</SelectItem>
                    <SelectItem value="vodafone">Vodafone Cash</SelectItem>
                    <SelectItem value="airteltigo">AirtelTigo Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="momoNumber">Mobile Money Number</Label>
                <Input
                  id="momoNumber"
                  value={momoForm.momoNumber}
                  onChange={(e) => setMomoForm(prev => ({ ...prev, momoNumber: e.target.value }))}
                  placeholder="Enter your mobile money number"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={setupMomoMutation.isPending}
              >
                {setupMomoMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up account...
                  </>
                ) : (
                  'Setup Mobile Money'
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Important Information:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Payments from renters will be sent directly to your account</li>
            <li>• A 10% platform fee will be deducted from each payment (you receive 90%)</li>
            <li>• You can change your payment method anytime</li>
            <li>• All transactions are secure and encrypted</li>
            <li>• Payment account setup is required before listing apartments</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentAccountSetup;
