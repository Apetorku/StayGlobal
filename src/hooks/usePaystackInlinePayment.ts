import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useToast } from '@/hooks/use-toast';

interface PaymentData {
  email: string;
  amount: number; // in GHS
  subaccountCode: string | null; // null for platform-only payments
  apartmentId: string;
  bookingId?: string;
  metadata?: any;
}

interface PaymentResponse {
  reference: string;
  status: string;
  trans: string;
  transaction: string;
  trxref: string;
  redirecturl: string;
}

interface PaystackInlineConfig {
  key: string;
  email: string;
  amount: number; // in kobo
  currency: string;
  ref: string;
  subaccount?: string; // optional for platform-only payments
  transaction_charge?: number; // optional for platform-only payments
  bearer?: string; // optional for platform-only payments
  metadata: any;
  callback: (response: PaymentResponse) => void;
  onClose: () => void;
}

declare global {
  interface Window {
    PaystackPop: {
      setup: (config: PaystackInlineConfig) => {
        openIframe: () => void;
      };
    };
  }
}

export const usePaystackInlinePayment = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();
  const { toast } = useToast();

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://web-production-8ffb7.up.railway.app/api';
  const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

  // Convert GHS to kobo (1 GHS = 100 kobo)
  const convertToKobo = (amount: number): number => {
    return Math.round(amount * 100);
  };

  // Generate payment reference
  const generateReference = (): string => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `SG_${timestamp}_${random}`;
  };

  // Verify payment on backend
  const verifyPayment = async (reference: string, bookingId?: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/payments/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          reference,
          bookingId 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment verification failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Payment verification error:', error);
      throw error;
    }
  };

  // Initialize Paystack Inline payment
  const initializePayment = async (paymentData: PaymentData): Promise<boolean> => {
    if (!PAYSTACK_PUBLIC_KEY) {
      setError('Paystack public key not configured');
      toast({
        title: "Configuration Error",
        description: "Payment system not properly configured",
        variant: "destructive"
      });
      return false;
    }

    if (!window.PaystackPop) {
      setError('Paystack library not loaded');
      toast({
        title: "Payment Error",
        description: "Payment system not available. Please refresh and try again.",
        variant: "destructive"
      });
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const reference = generateReference();
      const amountInKobo = convertToKobo(paymentData.amount);
      const platformFeeInKobo = Math.round(amountInKobo * 0.10); // 10% platform fee

      // Configure payment based on whether we have a subaccount
      const isSubaccountPayment = !!paymentData.subaccountCode;

      console.log('💳 Initializing Paystack payment:', {
        amount: paymentData.amount,
        amountInKobo,
        platformFeeInKobo,
        subaccount: paymentData.subaccountCode,
        isSubaccountPayment,
        reference
      });

      return new Promise((resolve) => {
        console.log('🔧 Testing callback function...');

        // Simple payment success callback (working version)
        const testCallback = function(response: any) {
          console.log('✅ Payment successful:', response);
          setIsLoading(false);
          resolve(true);
        };

        const testOnClose = function() {
          console.log('❌ Payment cancelled or closed');
          setIsLoading(false);
          resolve(false);
        };

        console.log('🔧 Callback is function:', typeof testCallback === 'function');
        console.log('🔧 OnClose is function:', typeof testOnClose === 'function');

        // Build the payment configuration with minimal setup
        const paymentConfig = {
          key: PAYSTACK_PUBLIC_KEY,
          email: paymentData.email,
          amount: amountInKobo,
          currency: 'GHS',
          ref: reference,
          callback: testCallback,
          onClose: testOnClose
        };

        // Add subaccount configuration for split payments
        if (isSubaccountPayment && paymentData.subaccountCode) {
          paymentConfig.subaccount = paymentData.subaccountCode;
          paymentConfig.transaction_charge = platformFeeInKobo;
          paymentConfig.bearer = 'subaccount'; // Owner pays transaction fees
          console.log('💰 Split payment configured:', {
            subaccount: paymentData.subaccountCode,
            transaction_charge: platformFeeInKobo,
            bearer: 'subaccount'
          });
        }

        console.log('🔧 Final payment config:', paymentConfig);
        console.log('🔧 PaystackPop available:', !!window.PaystackPop);

        const handler = window.PaystackPop.setup(paymentConfig);

        // Open the payment modal
        handler.openIframe();
      });

    } catch (error) {
      console.error('❌ Payment initialization error:', error);
      setError(error instanceof Error ? error.message : 'Payment initialization failed');
      toast({
        title: "Payment Error",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
      return false;
    }
  };

  return {
    initializePayment,
    isLoading,
    error,
    clearError: () => setError(null)
  };
};

export default usePaystackInlinePayment;
