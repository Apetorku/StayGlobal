const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'apartment-booking';

async function checkVerificationStatus() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    
    // Check users collection
    const users = await db.collection('users').find({}).toArray();
    console.log('\n📋 Users in database:');
    users.forEach(user => {
      console.log(`- ID: ${user.clerkId}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Role: ${user.role}`);
      console.log('');
    });
    
    // Check identity verifications collection
    const verifications = await db.collection('identityverifications').find({}).toArray();
    console.log('🔍 Identity Verifications:');
    if (verifications.length === 0) {
      console.log('❌ No verifications found in database');
    } else {
      verifications.forEach(verification => {
        console.log(`- User ID: ${verification.userId}`);
        console.log(`  Status: ${verification.verificationStatus}`);
        console.log(`  Method: ${verification.verificationMethod}`);
        console.log(`  Risk Score: ${verification.riskScore}`);
        console.log(`  Created: ${verification.createdAt}`);
        console.log('');
      });
    }
    
    // Check apartments collection
    const apartments = await db.collection('apartments').find({}).toArray();
    console.log('🏠 Apartments in database:');
    if (apartments.length === 0) {
      console.log('❌ No apartments found in database');
    } else {
      apartments.forEach(apartment => {
        console.log(`- ID: ${apartment._id}`);
        console.log(`  Owner ID: ${apartment.ownerId}`);
        console.log(`  Title: ${apartment.title}`);
        console.log(`  Location: ${apartment.location}`);
        console.log('');
      });
    }

    // Check if there are any other verification collections
    const collections = await db.listCollections().toArray();
    console.log('📁 All collections in database:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

checkVerificationStatus();
