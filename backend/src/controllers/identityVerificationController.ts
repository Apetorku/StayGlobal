import { Request, Response } from 'express';
import biometricService from '../services/biometricService';
import IdentityVerification from '../models/IdentityVerification';
import BiometricLog from '../models/BiometricLog';
import User from '../models/User';

// Submit identity verification with documents and biometric data
export const submitIdentityVerification = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user.clerkId;
    const {
      nationalId,
      documentImages,
      fingerprintData,
      metadata
    } = req.body;

    // Validate required fields
    if (!nationalId || !nationalId.idNumber || !nationalId.fullName || !nationalId.dateOfBirth) {
      res.status(400).json({ error: 'National ID information is required' });
      return;
    }

    if (!documentImages || !documentImages.frontImage || !documentImages.selfieImage) {
      res.status(400).json({ error: 'Document images are required' });
      return;
    }

    if (!fingerprintData || !fingerprintData.template || fingerprintData.quality < 60) {
      res.status(400).json({ error: 'Valid fingerprint data is required' });
      return;
    }

    // Get client metadata
    const clientMetadata = {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      ...metadata
    };

    // Submit verification through biometric service
    const result = await biometricService.enrollFingerprint(
      userId,
      fingerprintData,
      nationalId,
      documentImages,
      clientMetadata
    );

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({
      message: 'Identity verification submitted successfully',
      verificationId: result.verificationId,
      status: 'pending'
    });

  } catch (error) {
    console.error('Submit identity verification error:', error);
    res.status(500).json({ error: 'Failed to submit identity verification' });
  }
};

// Get verification status for current user
export const getVerificationStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user.clerkId;
    const status = await biometricService.getVerificationStatus(userId);
    res.json(status);
  } catch (error) {
    console.error('Get verification status error:', error);
    res.status(500).json({ error: 'Failed to get verification status' });
  }
};

// Verify fingerprint for authentication
export const verifyFingerprint = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user.clerkId;
    const { fingerprintData } = req.body;

    if (!fingerprintData || !fingerprintData.template) {
      res.status(400).json({ error: 'Fingerprint data is required' });
      return;
    }

    const metadata = {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      sessionId: req.headers['x-session-id'] as string || 'unknown'
    };

    const result = await biometricService.verifyFingerprint({
      userId,
      fingerprintData,
      metadata
    });

    res.json({
      isMatch: result.isMatch,
      confidence: result.confidence,
      quality: result.quality,
      message: result.isMatch ? 'Fingerprint verified successfully' : 'Fingerprint verification failed'
    });

  } catch (error) {
    console.error('Verify fingerprint error:', error);
    res.status(400).json({ 
      error: error instanceof Error ? error.message : 'Fingerprint verification failed',
      isMatch: false,
      confidence: 0
    });
  }
};

// Upload additional documents
export const uploadDocuments = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user.clerkId;
    const { documentImages } = req.body;

    if (!documentImages) {
      res.status(400).json({ error: 'Document images are required' });
      return;
    }

    // Find existing verification
    const verification = await IdentityVerification.findOne({ userId });
    if (!verification) {
      res.status(404).json({ error: 'No verification found for user' });
      return;
    }

    // Update document images
    verification.documentImages = { ...verification.documentImages, ...documentImages };
    verification.verificationSteps.documentSubmitted = true;
    await verification.save();

    res.json({
      message: 'Documents uploaded successfully',
      verificationId: verification._id
    });

  } catch (error) {
    console.error('Upload documents error:', error);
    res.status(500).json({ error: 'Failed to upload documents' });
  }
};

// Get verification history for user
export const getVerificationHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user.clerkId;
    
    // Get verification record
    const verification = await IdentityVerification.findOne({ userId });
    
    // Get biometric logs
    const logs = await BiometricLog.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      verification,
      logs,
      summary: {
        totalAttempts: logs.length,
        successfulAttempts: logs.filter(log => log.attemptStatus === 'success').length,
        failedAttempts: logs.filter(log => log.attemptStatus === 'failed').length,
        lastAttempt: logs[0]?.createdAt
      }
    });

  } catch (error) {
    console.error('Get verification history error:', error);
    res.status(500).json({ error: 'Failed to get verification history' });
  }
};

// Admin: Get list of verifications for review
export const getVerificationsList = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const filter: any = {};
    if (status) {
      filter.verificationStatus = status;
    }

    const verifications = await IdentityVerification.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .populate('userId', 'email firstName lastName');

    const total = await IdentityVerification.countDocuments(filter);

    res.json({
      verifications,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    console.error('Get verifications list error:', error);
    res.status(500).json({ error: 'Failed to get verifications list' });
  }
};

// Admin: Approve verification
export const adminApproveVerification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { verificationId } = req.params;
    const adminUserId = req.user.clerkId;

    const verification = await IdentityVerification.findById(verificationId);
    if (!verification) {
      res.status(404).json({ error: 'Verification not found' });
      return;
    }

    // Update verification status
    verification.verificationStatus = 'verified';
    verification.verifiedBy = adminUserId;
    verification.verifiedAt = new Date();
    verification.verificationSteps.documentVerified = true;
    verification.verificationSteps.biometricVerified = true;
    verification.verificationSteps.manualReviewCompleted = true;
    verification.verificationResults.documentAuthenticity = 'passed';
    verification.verificationResults.biometricMatch = 'passed';
    verification.verificationResults.faceMatch = 'passed';
    verification.verificationResults.overallScore = 100;

    await verification.save();

    // Update user verification status
    await User.findOneAndUpdate(
      { clerkId: verification.userId },
      {
        'identityVerification.isVerified': true,
        'identityVerification.verifiedAt': new Date(),
        'identityVerification.verificationLevel': 'fully_verified'
      }
    );

    res.json({
      message: 'Verification approved successfully',
      verification
    });

  } catch (error) {
    console.error('Admin approve verification error:', error);
    res.status(500).json({ error: 'Failed to approve verification' });
  }
};

// Admin: Reject verification
export const adminRejectVerification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { verificationId } = req.params;
    const { reason } = req.body;
    const adminUserId = req.user.clerkId;

    if (!reason) {
      res.status(400).json({ error: 'Rejection reason is required' });
      return;
    }

    const verification = await IdentityVerification.findById(verificationId);
    if (!verification) {
      res.status(404).json({ error: 'Verification not found' });
      return;
    }

    // Update verification status
    verification.verificationStatus = 'rejected';
    verification.rejectionReason = reason;
    verification.verifiedBy = adminUserId;
    verification.verificationSteps.manualReviewCompleted = true;
    verification.verificationResults.overallScore = 0;

    await verification.save();

    // Update user verification status
    await User.findOneAndUpdate(
      { clerkId: verification.userId },
      {
        'identityVerification.isVerified': false,
        'identityVerification.verificationLevel': 'rejected'
      }
    );

    res.json({
      message: 'Verification rejected successfully',
      verification
    });

  } catch (error) {
    console.error('Admin reject verification error:', error);
    res.status(500).json({ error: 'Failed to reject verification' });
  }
};
