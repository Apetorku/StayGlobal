import { useAuth, useUser } from '@clerk/clerk-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import identityVerificationService from '@/services/identityVerificationService';

export interface VerificationStatus {
  isVerified: boolean;
  hasVerification: boolean;
  verificationStatus: string;
  verificationLevel: string;
  verifiedAt: string | null;
  hasPaymentAccount: boolean;
  isPaymentVerified: boolean;
  canListApartments: boolean;
  verificationDetails: any;
  userVerificationInfo: {
    isVerified: boolean;
    verificationLevel: string;
    verifiedAt: string | null;
  };
}

export interface PaymentStatus {
  hasAccount: boolean;
  isVerified: boolean;
}

/**
 * Hook to get user verification status with proper caching and persistence
 */
// Local storage keys
const VERIFICATION_STORAGE_KEY = 'verification_status';
const PAYMENT_STORAGE_KEY = 'payment_status';

// Helper functions for localStorage
const getStoredVerificationStatus = (userId: string): VerificationStatus | null => {
  try {
    const stored = localStorage.getItem(`${VERIFICATION_STORAGE_KEY}_${userId}`);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const setStoredVerificationStatus = (userId: string, status: VerificationStatus) => {
  try {
    localStorage.setItem(`${VERIFICATION_STORAGE_KEY}_${userId}`, JSON.stringify(status));
  } catch {
    // Ignore storage errors
  }
};

const getStoredPaymentStatus = (userId: string): PaymentStatus | null => {
  try {
    const stored = localStorage.getItem(`${PAYMENT_STORAGE_KEY}_${userId}`);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const setStoredPaymentStatus = (userId: string, status: PaymentStatus) => {
  try {
    localStorage.setItem(`${PAYMENT_STORAGE_KEY}_${userId}`, JSON.stringify(status));
  } catch {
    // Ignore storage errors
  }
};

export const useVerificationStatus = () => {
  const { getToken } = useAuth();
  const { user, isSignedIn } = useUser();
  const queryClient = useQueryClient();

  const userId = user?.id;

  // Get stored verification status first
  const storedVerificationStatus = userId ? getStoredVerificationStatus(userId) : null;
  const storedPaymentStatus = userId ? getStoredPaymentStatus(userId) : null;

  // Get verification status - ALWAYS fetch fresh data from database
  const verificationQuery = useQuery({
    queryKey: ['verification-status', user?.id],
    queryFn: async (): Promise<VerificationStatus> => {
      console.log('🔍 Fetching verification status from API (ignoring cache)...');
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      try {
        console.log('🌐 Making verification API call to:', `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/identity-verification/status`);
        const result = await identityVerificationService.getVerificationStatus(token);
        console.log('✅ Verification status received from API:', result);

        // Only store the result if user is actually verified in database
        if (result.isVerified && result.verificationLevel === 'fully_verified' && userId) {
          setStoredVerificationStatus(userId, result);
        } else {
          // Clear any stored status if user is not verified
          console.log('🧹 Clearing stored verification status (user not verified)');
          localStorage.removeItem(`verification_status_${userId}`);
        }

        return result;
      } catch (error) {
        console.error('❌ Verification API failed:', error);
        console.error('❌ Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });

        // Don't use stored status as fallback - always require fresh data
        // This ensures we don't show stale verification status
        throw error;
      }
    },
    enabled: !!isSignedIn && !!userId,
    staleTime: 0, // Always fetch fresh data
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes only
    refetchOnWindowFocus: true,
    refetchOnMount: true, // Always refetch on mount
    retry: 1
  });



  // Get payment status
  const paymentQuery = useQuery({
    queryKey: ['payment-account-status', userId],
    queryFn: async (): Promise<PaymentStatus> => {
      console.log('🔍 Fetching payment status from API (ignoring cache)...');
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      try {
        const apiUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/user-payments/account`;
        console.log('🌐 Making payment API call to:', apiUrl);

        const response = await fetch(apiUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log('📡 Payment API response status:', response.status);

        if (!response.ok) {
          console.log('❌ Payment API returned error status:', response.status);
          const errorText = await response.text();
          console.log('❌ Payment API error response:', errorText);
          return { hasAccount: false, isVerified: false };
        }

        const result = await response.json();
        console.log('✅ Payment status received from API:', result);

        // Only store the result if account is actually verified
        if (result.paymentAccount?.isVerified && userId) {
          setStoredPaymentStatus(userId, result);
        } else {
          // Clear any stored status if account is not verified
          console.log('🧹 Clearing stored payment status (account not verified)');
          localStorage.removeItem(`payment_status_${userId}`);
        }

        return {
          hasAccount: !!result.paymentAccount,
          isVerified: result.paymentAccount?.isVerified || false,
          paymentAccount: result.paymentAccount
        };
      } catch (error) {
        console.error('❌ Payment API failed:', error);

        // Don't use stored status as fallback - always require fresh data
        return { hasAccount: false, isVerified: false };
      }
    },
    enabled: !!isSignedIn && !!userId,
    staleTime: 0, // Always fetch fresh data
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes only
    refetchOnWindowFocus: true,
    refetchOnMount: true, // Always refetch on mount
    retry: 1
  });

  // Store verification completion (call after verification completion)
  const markVerificationComplete = (verificationData?: VerificationStatus, paymentData?: PaymentStatus) => {
    if (userId) {
      // Store verification status if provided
      if (verificationData?.isVerified) {
        setStoredVerificationStatus(userId, verificationData);
      }

      // Store payment status if provided
      if (paymentData?.paymentAccount?.isVerified) {
        setStoredPaymentStatus(userId, paymentData);
      }

      // Also store a simple completion flag
      const completionData: VerificationStatus = {
        isVerified: true,
        hasVerification: true,
        verificationStatus: 'verified',
        verificationLevel: 'full',
        verifiedAt: new Date().toISOString(),
        hasPaymentAccount: true,
        isPaymentVerified: true,
        canListApartments: true,
        verificationDetails: {
          status: 'verified',
          submittedAt: new Date().toISOString(),
          verifiedAt: new Date().toISOString(),
          method: 'manual'
        }
      };

      setStoredVerificationStatus(userId, completionData);

      // Invalidate queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['verification-status'] });
      queryClient.invalidateQueries({ queryKey: ['payment-account-status'] });
    }
  };

  // Invalidate verification status (call after verification completion)
  const invalidateVerificationStatus = () => {
    queryClient.invalidateQueries({ queryKey: ['verification-status'] });
    queryClient.invalidateQueries({ queryKey: ['payment-account-status'] });
  };

  // Computed verification state
  const verificationStatus = verificationQuery.data;
  const paymentStatus = paymentQuery.data;

  console.log('🔍 useVerificationStatus Debug:', {
    verificationQueryData: verificationStatus,
    paymentQueryData: paymentStatus,
    verificationQueryError: verificationQuery.error,
    paymentQueryError: paymentQuery.error,
    verificationQueryStatus: verificationQuery.status,
    paymentQueryStatus: paymentQuery.status
  });

  const isIdentityVerified = verificationStatus?.isVerified || false;
  const hasPaymentAccount = verificationStatus?.hasPaymentAccount || !!paymentStatus?.paymentAccount || false;
  const isPaymentVerified = verificationStatus?.isPaymentVerified || paymentStatus?.paymentAccount?.isVerified || false;
  const canListApartments = isIdentityVerified && hasPaymentAccount && isPaymentVerified;

  console.log('🔍 Computed verification values:', {
    isIdentityVerified,
    hasPaymentAccount,
    isPaymentVerified,
    canListApartments
  });

  return {
    // Raw data
    verificationStatus,
    paymentStatus,
    
    // Computed states
    isIdentityVerified,
    hasPaymentAccount,
    isPaymentVerified,
    canListApartments,
    
    // Loading states
    isLoading: verificationQuery.isLoading || paymentQuery.isLoading,
    isError: verificationQuery.isError || paymentQuery.isError,
    error: verificationQuery.error || paymentQuery.error,
    
    // Actions
    refetch: () => {
      verificationQuery.refetch();
      paymentQuery.refetch();
    },
    invalidateVerificationStatus,
    markVerificationComplete,
    
    // For debugging
    debug: {
      verificationQuery: verificationQuery.data,
      paymentQuery: paymentQuery.data,
      isSignedIn,
      userId: user?.id,
    }
  };
};

/**
 * Hook specifically for checking if user can list apartments
 */
export const useCanListApartments = () => {
  const { canListApartments, isLoading } = useVerificationStatus();
  return { canListApartments, isLoading };
};

/**
 * Hook for verification requirements checking
 */
export const useVerificationRequirements = () => {
  const verification = useVerificationStatus();
  
  const requirements = {
    identity: {
      completed: verification.isIdentityVerified,
      required: true,
      label: 'Identity Verification',
      description: 'Verify your identity with government ID'
    },
    payment: {
      completed: verification.hasPaymentAccount && verification.isPaymentVerified,
      required: true,
      label: 'Payment Account',
      description: 'Set up your payment account to receive payments'
    }
  };

  const allRequirementsMet = Object.values(requirements).every(req => !req.required || req.completed);
  const completedCount = Object.values(requirements).filter(req => req.completed).length;
  const totalCount = Object.values(requirements).filter(req => req.required).length;

  return {
    requirements,
    allRequirementsMet,
    completedCount,
    totalCount,
    progress: totalCount > 0 ? (completedCount / totalCount) * 100 : 0,
    ...verification
  };
};
