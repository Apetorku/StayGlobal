# Inline Paystack Payment Flow

## Overview
This document describes the inline Paystack payment integration for the apartment booking system, where payments go directly from renters to house owners' accounts.

## Flow Description

### 1. User Interaction
- User clicks "Book Now" button on apartment card
- `InlinePaymentBookingModal` opens with booking form
- User fills in check-in/check-out dates and number of guests
- User clicks "Pay $X Now" button to initiate payment

### 2. Payment Process
The payment process follows these steps:

#### Step 1: Create Booking
- Frontend calls `POST /api/bookings` with booking details
- Backend creates a booking record with status "pending"
- Returns booking ID for payment processing

#### Step 2: Initialize Payment
- Frontend calls `POST /api/payments/initialize` with booking ID
- Backend:
  - Retrieves booking and apartment details
  - Gets house owner's payment account (subaccount)
  - Calculates platform fee
  - Calls Paystack API to initialize transaction
  - Returns payment data including subaccount details

#### Step 3: Paystack Inline Payment
- Frontend uses Paystack JavaScript SDK (`window.PaystackPop`)
- Opens Paystack inline payment modal
- User enters card details and PIN
- Payment is processed directly to owner's subaccount
- Platform fee is automatically deducted

#### Step 4: Payment Verification
- After successful payment, frontend calls `GET /api/payments/verify/{reference}`
- Backend verifies payment with Paystack
- Updates booking status to "confirmed"
- Updates payment status to "success"

## Key Features

### Direct Payment to Owners
- Payments go directly to house owners' bank accounts
- Uses Paystack subaccounts for automatic fund splitting
- Platform fee is automatically deducted

### Inline Payment Experience
- No redirect to external payment page
- Users enter PIN directly in the modal
- Seamless user experience

### Security
- All payment processing handled by Paystack
- Secure card data handling
- Payment verification on backend

## Environment Variables Required

```env
# Frontend
VITE_PAYSTACK_PUBLIC_KEY=pk_live_your_public_key

# Backend
PAYSTACK_SECRET_KEY=sk_live_your_secret_key
```

## Error Handling

The system handles various error scenarios:
- Network failures
- Payment cancellation by user
- Insufficient funds
- Invalid card details
- Backend verification failures

## Testing

To test the payment flow:
1. Ensure both frontend and backend servers are running
2. Navigate to the search page
3. Click "Book Now" on any apartment
4. Fill in booking details
5. Click "Pay $X Now"
6. Use Paystack test card details for testing

## Test Card Details (Paystack Test Mode)
- Card Number: 4084084084084081
- Expiry: Any future date
- CVV: Any 3 digits
- PIN: 0000 or 1234

## Production Considerations

1. **Environment Variables**: Ensure production Paystack keys are properly configured
2. **SSL Certificate**: HTTPS is required for production payments
3. **Webhook Setup**: Configure Paystack webhooks for payment notifications
4. **Error Monitoring**: Implement proper error logging and monitoring
5. **Rate Limiting**: Implement rate limiting for payment endpoints
