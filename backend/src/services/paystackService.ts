import axios from 'axios';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

if (!PAYSTACK_SECRET_KEY) {
  console.warn('⚠️ PAYSTACK_SECRET_KEY not found in environment variables');
}

interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: any;
    log: any;
    fees: number;
    fees_split: any;
    authorization: any;
    customer: any;
    plan: any;
    split: any;
    order_id: any;
    paidAt: string;
    createdAt: string;
    requested_amount: number;
    pos_transaction_data: any;
    source: any;
    fees_breakdown: any;
    transaction_date: string;
    plan_object: any;
    subaccount: any;
  };
}

interface PaystackSubaccountData {
  business_name: string;
  settlement_bank: string;
  account_number: string;
  percentage_charge: number;
  description?: string;
  primary_contact_email?: string;
  primary_contact_name?: string;
  primary_contact_phone?: string;
  metadata?: any;
}

interface PaystackSubaccountResponse {
  status: boolean;
  message: string;
  data: {
    subaccount_code: string;
    business_name: string;
    description: string;
    primary_contact_name: string;
    primary_contact_email: string;
    primary_contact_phone: string;
    metadata: any;
    percentage_charge: number;
    settlement_bank: string;
    account_number: string;
    settlement_schedule: string;
    active: boolean;
    migrate: boolean;
    id: number;
    createdAt: string;
    updatedAt: string;
  };
}

class PaystackService {
  private headers = {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  };

  async initializeTransaction(data: {
    email: string;
    amount: number; // in kobo (smallest currency unit)
    reference: string;
    callback_url?: string;
    metadata?: any;
    subaccount?: string;
    transaction_charge?: number;
    bearer?: 'account' | 'subaccount';
  }): Promise<PaystackInitializeResponse> {
    try {
      const response = await axios.post(
        `${PAYSTACK_BASE_URL}/transaction/initialize`,
        data,
        { headers: this.headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('Paystack initialize error:', error.response?.data || error.message);
      throw new Error(`Failed to initialize payment: ${error.response?.data?.message || error.message}`);
    }
  }

  async verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
    try {
      const response = await axios.get(
        `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
        { headers: this.headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('Paystack verify error:', error.response?.data || error.message);
      throw new Error(`Failed to verify payment: ${error.response?.data?.message || error.message}`);
    }
  }

  async createSubaccount(data: PaystackSubaccountData): Promise<PaystackSubaccountResponse> {
    try {
      const response = await axios.post(
        `${PAYSTACK_BASE_URL}/subaccount`,
        data,
        { headers: this.headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('Paystack subaccount creation error:', error.response?.data || error.message);
      throw new Error(`Failed to create subaccount: ${error.response?.data?.message || error.message}`);
    }
  }

  async listBanks(): Promise<any> {
    try {
      const response = await axios.get(
        `${PAYSTACK_BASE_URL}/bank`,
        { headers: this.headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('Paystack list banks error:', error.response?.data || error.message);
      throw new Error(`Failed to list banks: ${error.response?.data?.message || error.message}`);
    }
  }

  async resolveAccountNumber(accountNumber: string, bankCode: string): Promise<any> {
    try {
      const response = await axios.get(
        `${PAYSTACK_BASE_URL}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
        { headers: this.headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('Paystack resolve account error:', error.response?.data || error.message);
      throw new Error(`Failed to resolve account: ${error.response?.data?.message || error.message}`);
    }
  }

  // Convert amount from GHS to kobo (Paystack uses kobo)
  convertToKobo(amount: number): number {
    return Math.round(amount * 100);
  }

  // Convert amount from kobo to GHS
  convertFromKobo(amount: number): number {
    return amount / 100;
  }

  // Generate unique reference
  generateReference(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `apt_${timestamp}_${random}`;
  }

  // Calculate platform fee (e.g., 5% of total amount)
  calculatePlatformFee(amount: number, feePercentage: number = 5): number {
    return Math.round((amount * feePercentage) / 100);
  }

  // Calculate owner amount after platform fee
  calculateOwnerAmount(totalAmount: number, platformFee: number): number {
    return totalAmount - platformFee;
  }
}

export default new PaystackService();
