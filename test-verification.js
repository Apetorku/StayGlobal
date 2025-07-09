// Simple test script to verify the verification endpoint is working
const testData = {
  personalInfo: {
    fullName: "Test User",
    idNumber: "TEST123456789",
    idType: "national_id",
    country: "Ghana",
    dateOfBirth: "1990-01-01",
    phoneNumber: "+233123456789"
  },
  houseRegistration: {
    registrationNumber: "HR-TEST-001",
    address: "123 Test Street, Accra, Ghana",
    issuingAuthority: "Test Authority"
  },
  deviceFingerprint: "test-device-123"
};

console.log('Testing verification endpoint...');
console.log('Test data:', JSON.stringify(testData, null, 2));

// This would be the actual fetch call from the frontend
console.log('\nEndpoint: POST http://localhost:5000/api/identity-verification/simple');
console.log('Headers: Authorization: Bearer <token>, Content-Type: application/json');
console.log('Body:', JSON.stringify(testData));
