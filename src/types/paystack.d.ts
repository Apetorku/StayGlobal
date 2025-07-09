// Paystack Inline JavaScript SDK Type Definitions

interface PaystackOptions {
  key: string;
  email: string;
  amount: number; // Amount in kobo (smallest currency unit)
  currency?: string;
  ref?: string;
  callback?: (response: PaystackResponse) => void;
  onClose?: () => void;
  metadata?: {
    [key: string]: any;
  };
  channels?: string[];
  plan?: string;
  quantity?: number;
  subaccount?: string;
  transaction_charge?: number;
  bearer?: 'account' | 'subaccount';
  split_code?: string;
  split?: {
    type: string;
    currency: string;
    subaccounts: Array<{
      subaccount: string;
      share: number;
    }>;
    bearer_type: string;
    bearer_subaccount: string;
  };
}

interface PaystackResponse {
  message: string;
  redirecturl: string;
  reference: string;
  status: string;
  trans: string;
  transaction: string;
  trxref: string;
}

interface PaystackHandler {
  openIframe(): void;
}

interface PaystackStatic {
  (options: PaystackOptions): PaystackHandler;
  newTransaction(options: PaystackOptions): PaystackHandler;
}

declare global {
  interface Window {
    PaystackPop: PaystackStatic;
  }
}

export {};
