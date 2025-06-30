#!/usr/bin/env node

/**
 * Integration Test Script for Enhanced Security Verification Flow
 * 
 * This script tests the complete flow:
 * 1. Identity verification with biometric data
 * 2. Payment account setup
 * 3. Apartment listing with verification requirements
 * 4. Secure booking with fingerprint verification
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';
const TEST_TOKEN = 'test-jwt-token'; // In real scenario, this would be a valid Clerk JWT

// Test data
const testUser = {
  clerkId: 'test-user-integration',
  email: 'integration-test@example.com',
  firstName: 'Integration',
  lastName: 'Test',
  role: 'owner'
};

const verificationData = {
  nationalId: {
    idNumber: 'GHA-987654321',
    idType: 'national_id',
    country: 'Ghana',
    fullName: 'Integration Test',
    dateOfBirth: '1985-05-15'
  },
  documentImages: {
    frontImage: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
    selfieImage: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
  },
  fingerprintData: {
    template: 'integration-test-fingerprint-template-456',
    quality: 92,
    captureDevice: 'Integration Test Scanner'
  }
};

const paymentAccountData = {
  bankCode: '044',
  accountNumber: '1122334455',
  businessName: 'Integration Test Properties',
  description: 'Test payment account for integration testing'
};

const apartmentData = {
  title: 'Integration Test Apartment',
  description: 'A beautiful apartment for integration testing',
  location: {
    country: 'Ghana',
    region: 'Greater Accra',
    town: 'Accra',
    address: '456 Integration Test Street'
  },
  price: 150,
  totalRooms: 3,
  images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
  amenities: ['WiFi', 'Air Conditioning', 'Parking', 'Security']
};

// Helper function to make API requests
async function apiRequest(method, endpoint, data = null, token = TEST_TOKEN) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      ...(data && { data })
    };

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
}

// Test functions
async function testHealthCheck() {
  console.log('\n🔍 Testing API Health Check...');
  const result = await apiRequest('GET', '/health', null, null);
  
  if (result.success) {
    console.log('✅ API is healthy:', result.data.message);
    return true;
  } else {
    console.log('❌ API health check failed:', result.error);
    return false;
  }
}

async function testIdentityVerificationSubmission() {
  console.log('\n🆔 Testing Identity Verification Submission...');
  const result = await apiRequest('POST', '/identity-verification/submit', verificationData);
  
  if (result.success) {
    console.log('✅ Identity verification submitted successfully');
    console.log('   Verification ID:', result.data.verificationId);
    return result.data.verificationId;
  } else {
    console.log('❌ Identity verification submission failed:', result.error);
    return null;
  }
}

async function testVerificationStatus() {
  console.log('\n📊 Testing Verification Status Check...');
  const result = await apiRequest('GET', '/identity-verification/status');
  
  if (result.success) {
    console.log('✅ Verification status retrieved successfully');
    console.log('   Status:', result.data.verificationStatus);
    console.log('   Level:', result.data.verificationLevel);
    console.log('   Can List Apartments:', result.data.canListApartments);
    return result.data;
  } else {
    console.log('❌ Verification status check failed:', result.error);
    return null;
  }
}

async function testPaymentAccountSetup() {
  console.log('\n💳 Testing Payment Account Setup...');
  const result = await apiRequest('POST', '/user-payments/account/paystack', paymentAccountData);
  
  if (result.success) {
    console.log('✅ Payment account setup successful');
    console.log('   Subaccount Code:', result.data.subaccountCode);
    return result.data;
  } else {
    console.log('❌ Payment account setup failed:', result.error);
    return null;
  }
}

async function testApartmentListingWithoutVerification() {
  console.log('\n🏠 Testing Apartment Listing Without Verification (Should Fail)...');
  const result = await apiRequest('POST', '/apartments', apartmentData);
  
  if (!result.success && result.status === 403) {
    console.log('✅ Apartment listing correctly rejected without verification');
    console.log('   Error:', result.error.error);
    return true;
  } else {
    console.log('❌ Apartment listing should have been rejected but was not');
    return false;
  }
}

async function testApartmentListingWithVerification() {
  console.log('\n🏠 Testing Apartment Listing With Full Verification...');
  const result = await apiRequest('POST', '/apartments', apartmentData);
  
  if (result.success) {
    console.log('✅ Apartment listing successful with verification');
    console.log('   Apartment ID:', result.data.apartment._id);
    console.log('   Owner Payment Account:', result.data.apartment.ownerPaymentAccount?.provider);
    return result.data.apartment;
  } else {
    console.log('❌ Apartment listing failed:', result.error);
    return null;
  }
}

async function testSecureBooking(apartmentId) {
  console.log('\n🔒 Testing Secure Booking with Biometric Verification...');
  
  const bookingData = {
    apartmentId,
    checkIn: '2024-08-01',
    checkOut: '2024-08-05',
    guests: 2,
    paymentMethod: 'paystack',
    fingerprintData: {
      template: 'integration-test-fingerprint-template-456',
      quality: 92,
      captureDevice: 'Integration Test Scanner'
    }
  };

  const result = await apiRequest('POST', '/bookings/secure', bookingData);
  
  if (result.success) {
    console.log('✅ Secure booking successful');
    console.log('   Booking ID:', result.data.booking.id);
    console.log('   Biometric Verified:', result.data.booking.biometricVerified);
    console.log('   Direct Payment:', result.data.paymentInfo.directPayment);
    return result.data.booking;
  } else {
    console.log('❌ Secure booking failed:', result.error);
    return null;
  }
}

async function testFingerprintVerification() {
  console.log('\n👆 Testing Fingerprint Verification...');
  
  const fingerprintData = {
    fingerprintData: {
      template: 'integration-test-fingerprint-template-456',
      quality: 92,
      captureDevice: 'Integration Test Scanner'
    }
  };

  const result = await apiRequest('POST', '/identity-verification/verify-fingerprint', fingerprintData);
  
  if (result.success) {
    console.log('✅ Fingerprint verification successful');
    console.log('   Match:', result.data.isMatch);
    console.log('   Confidence:', result.data.confidence);
    return result.data;
  } else {
    console.log('❌ Fingerprint verification failed:', result.error);
    return null;
  }
}

// Main test execution
async function runIntegrationTests() {
  console.log('🚀 Starting Enhanced Security Verification Flow Integration Tests');
  console.log('=' .repeat(70));

  let allTestsPassed = true;
  let apartmentId = null;

  // Test 1: Health Check
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    console.log('\n❌ Cannot proceed - API is not healthy');
    process.exit(1);
  }

  // Test 2: Identity Verification Submission
  const verificationId = await testIdentityVerificationSubmission();
  if (!verificationId) allTestsPassed = false;

  // Test 3: Verification Status Check
  const verificationStatus = await testVerificationStatus();
  if (!verificationStatus) allTestsPassed = false;

  // Test 4: Payment Account Setup
  const paymentAccount = await testPaymentAccountSetup();
  if (!paymentAccount) allTestsPassed = false;

  // Test 5: Apartment Listing Without Verification (Should Fail)
  const rejectionTest = await testApartmentListingWithoutVerification();
  if (!rejectionTest) allTestsPassed = false;

  // Test 6: Apartment Listing With Verification
  const apartment = await testApartmentListingWithVerification();
  if (apartment) {
    apartmentId = apartment._id;
  } else {
    allTestsPassed = false;
  }

  // Test 7: Fingerprint Verification
  const fingerprintResult = await testFingerprintVerification();
  if (!fingerprintResult) allTestsPassed = false;

  // Test 8: Secure Booking
  if (apartmentId) {
    const booking = await testSecureBooking(apartmentId);
    if (!booking) allTestsPassed = false;
  } else {
    console.log('\n⚠️  Skipping secure booking test - no apartment ID available');
    allTestsPassed = false;
  }

  // Summary
  console.log('\n' + '=' .repeat(70));
  if (allTestsPassed) {
    console.log('🎉 All integration tests passed successfully!');
    console.log('✅ Enhanced security verification flow is working correctly');
  } else {
    console.log('❌ Some integration tests failed');
    console.log('⚠️  Please check the implementation and try again');
  }
  console.log('=' .repeat(70));

  return allTestsPassed;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runIntegrationTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Integration test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { runIntegrationTests };
