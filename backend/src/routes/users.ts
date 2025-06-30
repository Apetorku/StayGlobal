import express from 'express';
import { requireAuth } from '../middleware/auth';
import { syncUserWithClerk, createUserFromClerk } from '../utils/userUtils';
import User from '../models/User';

const router = express.Router();

// Get current user profile
router.get('/profile', requireAuth, async (req, res): Promise<void> => {
  try {
    res.json(req.user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update user profile
router.patch('/profile', requireAuth, async (req, res): Promise<void> => {
  try {
    const { phone, preferences } = req.body;

    const user = req.user;

    if (phone) user.phone = phone;
    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Sync user with Clerk (useful for first-time login)
router.post('/sync', async (req, res): Promise<void> => {
  console.log('🔄 User sync endpoint hit');
  console.log('Request body:', req.body);
  console.log('Request headers:', req.headers);

  try {
    const { clerkUserId } = req.body;

    if (!clerkUserId) {
      console.log('❌ No clerkUserId provided');
      res.status(400).json({ error: 'Clerk user ID is required' });
      return;
    }

    console.log('🔍 Syncing user with Clerk ID:', clerkUserId);
    const user = await syncUserWithClerk(clerkUserId);
    console.log('✅ User synced successfully:', user._id);

    res.json({
      message: 'User synced successfully',
      user
    });
  } catch (error) {
    console.error('❌ Error syncing user:', error);
    res.status(500).json({ error: 'Failed to sync user' });
  }
});

// Create user from Clerk webhook (for new user registration)
router.post('/webhook/create', async (req, res): Promise<void> => {
  try {
    const { data } = req.body;

    if (!data || !data.id) {
      res.status(400).json({ error: 'Invalid webhook data' });
      return;
    }

    const user = await createUserFromClerk(data.id);

    res.json({
      message: 'User created successfully',
      user
    });
  } catch (error) {
    console.error('Error creating user from webhook:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

export default router;
