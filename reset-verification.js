// Simple script to reset verification for testing
// This will call the backend API to reset verification

const USER_ID = 'user_2z0oYcxRj5w8i7kOqqH2JJ1smLC'; // Current test user
const API_URL = 'http://localhost:5000/api';

async function resetVerification() {
  try {
    console.log('🔄 Resetting verification via API...');
    console.log(`👤 User ID: ${USER_ID}`);

    // Note: This would normally require admin authentication
    // For testing, we'll use a direct MongoDB approach instead
    console.log('ℹ️ This script requires admin authentication.');
    console.log('💡 Alternative: Use MongoDB Compass or direct database access to delete the verification record.');
    console.log(`📋 Collection: identityverifications`);
    console.log(`🔍 Filter: { userId: "${USER_ID}" }`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

resetVerification();
