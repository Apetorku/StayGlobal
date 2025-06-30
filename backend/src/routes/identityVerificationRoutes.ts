import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { rateLimitVerification } from '../middleware/verification';
import {
  submitIdentityVerification,
  getVerificationStatus,
  verifyFingerprint,
  uploadDocuments,
  getVerificationHistory,
  adminApproveVerification,
  adminRejectVerification,
  getVerificationsList
} from '../controllers/identityVerificationController';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// User routes - for property owners to submit verification
router.post('/submit', requireRole(['owner']), rateLimitVerification, submitIdentityVerification);
router.get('/status', getVerificationStatus);
router.post('/verify-fingerprint', verifyFingerprint);
router.post('/upload-documents', requireRole(['owner']), uploadDocuments);
router.get('/history', getVerificationHistory);

// Admin routes - for managing verifications
router.get('/admin/list', requireRole(['admin']), getVerificationsList);
router.post('/admin/:verificationId/approve', requireRole(['admin']), adminApproveVerification);
router.post('/admin/:verificationId/reject', requireRole(['admin']), adminRejectVerification);

export default router;
