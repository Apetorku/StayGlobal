const fetch = require('node-fetch');

async function createChatsForExistingBookings() {
  try {
    console.log('🔄 Creating chats for existing bookings...');
    
    const response = await fetch('http://localhost:5000/api/chats/create-for-existing-bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Using a mock authorization - this endpoint should be accessible for testing
        'Authorization': 'Bearer mock-admin-token'
      }
    });

    if (!response.ok) {
      console.error('❌ Request failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return;
    }

    const result = await response.json();
    console.log('✅ Success:', result);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createChatsForExistingBookings();
