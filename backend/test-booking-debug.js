const axios = require('axios');

// Test the booking endpoint directly
async function testBookingEndpoint() {
  console.log('🧪 Testing booking endpoint...');
  
  const bookingData = {
    apartmentId: "686d6c7fe66e2aa6392d2c6d", // Use the apartment ID from your error
    checkIn: "2025-07-09",
    checkOut: "2025-07-10",
    guests: 1,
    paymentMethod: "momo",
    paymentDetails: {
      momoNumber: "0540760548",
      momoProvider: "mtn"
    }
  };

  try {
    console.log('📤 Sending request to: http://localhost:5000/api/bookings');
    console.log('📦 Request data:', JSON.stringify(bookingData, null, 2));
    
    const response = await axios.post('http://localhost:5000/api/bookings', bookingData, {
      headers: {
        'Content-Type': 'application/json',
        // Note: This will fail without auth token, but we can see what error we get
      },
      timeout: 10000
    });
    
    console.log('✅ Success:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('❌ HTTP Error Status:', error.response.status);
      console.log('❌ Error Response:', error.response.data);
      console.log('❌ Error Headers:', error.response.headers);
    } else if (error.request) {
      console.log('❌ No response received:', error.request);
    } else {
      console.log('❌ Request setup error:', error.message);
    }
  }
}

// Test if the server is reachable
async function testServerHealth() {
  console.log('🏥 Testing server health...');
  
  try {
    const response = await axios.get('http://localhost:5000/api/health');
    console.log('✅ Server is healthy:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Server health check failed:', error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting booking debug tests...\n');
  
  const isHealthy = await testServerHealth();
  console.log('');
  
  if (isHealthy) {
    await testBookingEndpoint();
  } else {
    console.log('❌ Server is not healthy, skipping booking test');
  }
}

runTests();
