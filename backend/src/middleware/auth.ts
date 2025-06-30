import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import User from '../models/User';

// Extend Express Request type to include user
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('🔑 Auth middleware - checking authentication...');
    const { userId } = getAuth(req);
    console.log('🆔 Clerk User ID:', userId);

    if (!userId) {
      console.log('❌ No userId from Clerk');
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
      return;
    }

    // Find or create user in our database
    const user = await User.findOne({ clerkId: userId });
    console.log('👤 Database user found:', user ? { id: user._id, email: user.email, role: user.role } : 'Not found');

    if (!user) {
      // If user doesn't exist in our DB, we might need to create them
      // This would typically happen on first login
      console.log('❌ User not found in database');
      res.status(401).json({
        error: 'User not found',
        message: 'Please complete your profile setup'
      });
      return;
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    req.user = user;
    console.log('✅ Authentication successful');
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    res.status(500).json({
      error: 'Authentication error',
      message: 'Failed to authenticate user'
    });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    console.log('🔐 Role check - Required roles:', roles);
    console.log('👤 User:', req.user ? { id: req.user._id, email: req.user.email, role: req.user.role } : 'No user');

    if (!req.user) {
      console.log('❌ No user found in request');
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      console.log(`❌ Role check failed - User role: ${req.user.role}, Required: ${roles.join(', ')}`);
      res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions'
      });
      return;
    }

    console.log('✅ Role check passed');
    next();
  };
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = getAuth(req);

    if (userId) {
      const user = await User.findOne({ clerkId: userId });
      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    // Don't fail the request, just continue without user
    next();
  }
};
