import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Smartphone, Shield, CheckCircle, AlertCircle } from "lucide-react";

interface PaymentMethod {
  type: 'card' | 'momo';
  details?: {
    // For mobile money
    momoNumber?: string;
    momoProvider?: 'mtn' | 'vodafone' | 'airteltigo';
    // For card (we'll use Paystack inline for this)
    useCard?: boolean;
  };
}

interface RenterPaymentMethodSetupProps {
  onPaymentMethodSelected: (paymentMethod: PaymentMethod) => void;
  onCancel: () => void;
  amount: number;
  currency?: string;
}

const RenterPaymentMethodSetup = ({ 
  onPaymentMethodSelected, 
  onCancel, 
  amount, 
  currency = 'GHS' 
}: RenterPaymentMethodSetupProps) => {
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'momo'>('momo');
  const [momoNumber, setMomoNumber] = useState('');
  const [momoProvider, setMomoProvider] = useState<'mtn' | 'vodafone' | 'airteltigo'>('mtn');
  const [isValidating, setIsValidating] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  const validateMomoNumber = (number: string, provider: string) => {
    // Basic validation for Ghana mobile numbers
    const cleanNumber = number.replace(/\s+/g, '');
    
    switch (provider) {
      case 'mtn':
        return /^(0?24|0?54|0?55|0?59)\d{7}$/.test(cleanNumber);
      case 'vodafone':
        return /^(0?20|0?50)\d{7}$/.test(cleanNumber);
      case 'airteltigo':
        return /^(0?26|0?27|0?56|0?57)\d{7}$/.test(cleanNumber);
      default:
        return false;
    }
  };

  const handleMomoSubmit = () => {
    if (!momoNumber || !momoProvider) {
      alert('Please enter your mobile money number and select a provider');
      return;
    }

    if (!validateMomoNumber(momoNumber, momoProvider)) {
      alert(`Please enter a valid ${momoProvider.toUpperCase()} mobile money number`);
      return;
    }

    // Confirm the payment account with the user
    const cleanNumber = momoNumber.replace(/\s+/g, '');
    const confirmed = confirm(
      `Confirm Payment Account:\n\n` +
      `Provider: ${momoProvider.toUpperCase()}\n` +
      `Number: ${cleanNumber}\n\n` +
      `Payment will be deducted from this mobile money account. Continue?`
    );

    if (!confirmed) {
      return;
    }

    const paymentMethod: PaymentMethod = {
      type: 'momo',
      details: {
        momoNumber: cleanNumber,
        momoProvider
      }
    };

    onPaymentMethodSelected(paymentMethod);
  };

  const handleCardSubmit = () => {
    // Confirm card payment with the user
    const confirmed = confirm(
      `Confirm Payment Method:\n\n` +
      `Payment Type: Bank Card\n` +
      `You will be prompted to enter your card details and PIN securely.\n\n` +
      `Continue with card payment?`
    );

    if (!confirmed) {
      return;
    }

    const paymentMethod: PaymentMethod = {
      type: 'card',
      details: {
        useCard: true
      }
    };

    onPaymentMethodSelected(paymentMethod);
  };

  const getProviderLogo = (provider: string) => {
    switch (provider) {
      case 'mtn':
        return '🟡'; // MTN yellow
      case 'vodafone':
        return '🔴'; // Vodafone red
      case 'airteltigo':
        return '🔵'; // AirtelTigo blue
      default:
        return '📱';
    }
  };

  const isValidMomo = momoNumber && momoProvider && validateMomoNumber(momoNumber, momoProvider);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-500" />
          Select Payment Method
        </CardTitle>
        <CardDescription>
          Choose how you want to pay {formatCurrency(amount)} for your booking
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Amount Summary */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-blue-800 font-medium">Total Amount:</span>
            <span className="text-blue-900 font-bold text-lg">{formatCurrency(amount)}</span>
          </div>
          <p className="text-xs text-blue-700 mt-1">
            Payment will be sent directly to the property owner
          </p>
        </div>

        {/* Payment Method Selection */}
        <Tabs value={selectedMethod} onValueChange={(value) => setSelectedMethod(value as 'card' | 'momo')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="momo" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Mobile Money
            </TabsTrigger>
            <TabsTrigger value="card" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Bank Card
            </TabsTrigger>
          </TabsList>

          {/* Mobile Money Tab */}
          <TabsContent value="momo" className="space-y-4">
            <div className="p-4 border rounded-lg space-y-4">
              <div className="flex items-center gap-3 mb-3">
                <Smartphone className="h-6 w-6 text-green-500" />
                <div>
                  <h5 className="font-medium">Mobile Money Payment</h5>
                  <p className="text-sm text-muted-foreground">
                    Pay with your mobile money account
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="momoProvider">Mobile Money Provider</Label>
                  <Select value={momoProvider} onValueChange={(value) => setMomoProvider(value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mtn">
                        <div className="flex items-center gap-2">
                          <span>{getProviderLogo('mtn')}</span>
                          <span>MTN Mobile Money</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="vodafone">
                        <div className="flex items-center gap-2">
                          <span>{getProviderLogo('vodafone')}</span>
                          <span>Vodafone Cash</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="airteltigo">
                        <div className="flex items-center gap-2">
                          <span>{getProviderLogo('airteltigo')}</span>
                          <span>AirtelTigo Money</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="momoNumber">Mobile Money Number</Label>
                  <Input
                    id="momoNumber"
                    type="tel"
                    placeholder="e.g., 0244123456"
                    value={momoNumber}
                    onChange={(e) => setMomoNumber(e.target.value)}
                    className={isValidMomo ? "border-green-500" : ""}
                  />
                  {momoNumber && !validateMomoNumber(momoNumber, momoProvider) && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Please enter a valid {momoProvider.toUpperCase()} number
                    </p>
                  )}
                  {isValidMomo && (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Valid {momoProvider.toUpperCase()} number
                    </p>
                  )}
                </div>

                {isValidMomo && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Payment Account Confirmed</span>
                    </div>
                    <p className="text-sm text-green-700">
                      <strong>Provider:</strong> {momoProvider.toUpperCase()}<br/>
                      <strong>Number:</strong> {momoNumber}<br/>
                      <strong>Amount to be deducted:</strong> {formatCurrency(amount)}
                    </p>
                  </div>
                )}

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Smartphone className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">How Mobile Money Payment Works:</p>
                      <ol className="list-decimal list-inside space-y-1 text-xs">
                        <li>Click "Pay with Mobile Money" below</li>
                        <li>You'll receive a USSD prompt on your phone ({momoNumber})</li>
                        <li>Enter your {momoProvider.toUpperCase()} Mobile Money PIN on your phone</li>
                        <li>Confirm the payment amount ({formatCurrency(amount)})</li>
                        <li>Your booking will be confirmed automatically</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Bank Card Tab */}
          <TabsContent value="card" className="space-y-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <CreditCard className="h-6 w-6 text-blue-500" />
                <div>
                  <h5 className="font-medium">Bank Card Payment</h5>
                  <p className="text-sm text-muted-foreground">
                    Pay securely with your debit or credit card
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-700">Secure & Encrypted</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-700">Instant Payment</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-700">Supports Visa, Mastercard & Verve</span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  You'll be prompted to enter your card details and PIN in a secure payment window.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={selectedMethod === 'momo' ? handleMomoSubmit : handleCardSubmit}
            disabled={selectedMethod === 'momo' && !isValidMomo}
            className="flex-1"
          >
            {selectedMethod === 'momo' ? (
              <>
                <Smartphone className="mr-2 h-4 w-4" />
                Pay with Mobile Money
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Pay with Card
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RenterPaymentMethodSetup;
