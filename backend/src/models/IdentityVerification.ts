import mongoose, { Document, Schema } from 'mongoose';

export interface IIdentityVerification extends Document {
  userId: string; // Clerk user ID
  nationalId: {
    idNumber: string;
    idType: 'national_id' | 'passport' | 'drivers_license' | 'voters_id';
    country: string;
    fullName: string;
    dateOfBirth: Date;
  };
  biometricData: {
    fingerprintHash: string; // Hashed fingerprint template
    fingerprintTemplate: string; // Encrypted biometric template
    captureDevice?: string;
    captureQuality: number; // Quality score 0-100
    capturedAt: Date;
  };
  documentImages: {
    frontImage: string; // URL or base64 of ID front
    backImage?: string; // URL or base64 of ID back
    selfieImage: string; // URL or base64 of user selfie
  };
  verificationStatus: 'pending' | 'in_review' | 'verified' | 'rejected' | 'expired';
  verificationSteps: {
    documentSubmitted: boolean;
    documentVerified: boolean;
    biometricCaptured: boolean;
    biometricVerified: boolean;
    manualReviewRequired: boolean;
    manualReviewCompleted: boolean;
  };
  verificationResults: {
    documentAuthenticity: 'pending' | 'passed' | 'failed';
    biometricMatch: 'pending' | 'passed' | 'failed';
    faceMatch: 'pending' | 'passed' | 'failed';
    duplicateCheck: 'pending' | 'passed' | 'failed';
    overallScore: number; // 0-100
  };
  rejectionReason?: string;
  verifiedBy?: string; // Admin user ID who verified
  verifiedAt?: Date;
  expiresAt?: Date;
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    deviceFingerprint?: string;
    submissionSource: 'web' | 'mobile';
  };
  createdAt: Date;
  updatedAt: Date;
}

const IdentityVerificationSchema: Schema = new Schema({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    index: true,
    unique: true // One verification per user
  },
  nationalId: {
    idNumber: {
      type: String,
      required: [true, 'ID number is required'],
      trim: true,
      index: true
    },
    idType: {
      type: String,
      required: [true, 'ID type is required'],
      enum: ['national_id', 'passport', 'drivers_license', 'voters_id']
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required']
    }
  },
  biometricData: {
    fingerprintHash: {
      type: String,
      required: [true, 'Fingerprint hash is required']
    },
    fingerprintTemplate: {
      type: String,
      required: [true, 'Fingerprint template is required']
    },
    captureDevice: {
      type: String,
      trim: true
    },
    captureQuality: {
      type: Number,
      required: [true, 'Capture quality is required'],
      min: [0, 'Quality cannot be negative'],
      max: [100, 'Quality cannot exceed 100']
    },
    capturedAt: {
      type: Date,
      required: [true, 'Capture timestamp is required'],
      default: Date.now
    }
  },
  documentImages: {
    frontImage: {
      type: String,
      required: [true, 'Front image is required']
    },
    backImage: {
      type: String
    },
    selfieImage: {
      type: String,
      required: [true, 'Selfie image is required']
    }
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'in_review', 'verified', 'rejected', 'expired'],
    default: 'pending',
    index: true
  },
  verificationSteps: {
    documentSubmitted: {
      type: Boolean,
      default: false
    },
    documentVerified: {
      type: Boolean,
      default: false
    },
    biometricCaptured: {
      type: Boolean,
      default: false
    },
    biometricVerified: {
      type: Boolean,
      default: false
    },
    manualReviewRequired: {
      type: Boolean,
      default: false
    },
    manualReviewCompleted: {
      type: Boolean,
      default: false
    }
  },
  verificationResults: {
    documentAuthenticity: {
      type: String,
      enum: ['pending', 'passed', 'failed'],
      default: 'pending'
    },
    biometricMatch: {
      type: String,
      enum: ['pending', 'passed', 'failed'],
      default: 'pending'
    },
    faceMatch: {
      type: String,
      enum: ['pending', 'passed', 'failed'],
      default: 'pending'
    },
    duplicateCheck: {
      type: String,
      enum: ['pending', 'passed', 'failed'],
      default: 'pending'
    },
    overallScore: {
      type: Number,
      default: 0,
      min: [0, 'Score cannot be negative'],
      max: [100, 'Score cannot exceed 100']
    }
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  verifiedBy: {
    type: String,
    trim: true
  },
  verifiedAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
  },
  metadata: {
    ipAddress: {
      type: String,
      trim: true
    },
    userAgent: {
      type: String,
      trim: true
    },
    deviceFingerprint: {
      type: String,
      trim: true
    },
    submissionSource: {
      type: String,
      enum: ['web', 'mobile'],
      default: 'web'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
IdentityVerificationSchema.index({ userId: 1 });
IdentityVerificationSchema.index({ 'nationalId.idNumber': 1 });
IdentityVerificationSchema.index({ verificationStatus: 1 });
IdentityVerificationSchema.index({ createdAt: -1 });

// Virtual for checking if verification is expired
IdentityVerificationSchema.virtual('isExpired').get(function(this: IIdentityVerification) {
  return this.expiresAt && this.expiresAt < new Date();
});

// Virtual for checking if verification is complete
IdentityVerificationSchema.virtual('isComplete').get(function(this: IIdentityVerification) {
  return this.verificationStatus === 'verified' &&
         this.verificationSteps.documentVerified &&
         this.verificationSteps.biometricVerified;
});

// Method to check if biometric matches
IdentityVerificationSchema.methods.verifyFingerprint = function(this: IIdentityVerification, inputFingerprintHash: string): boolean {
  // In a real implementation, this would use proper biometric matching algorithms
  return this.biometricData.fingerprintHash === inputFingerprintHash;
};

// Method to update verification status
IdentityVerificationSchema.methods.updateVerificationStatus = function(this: IIdentityVerification) {
  const steps = this.verificationSteps;
  const results = this.verificationResults;
  
  if (results.documentAuthenticity === 'failed' || 
      results.biometricMatch === 'failed' || 
      results.faceMatch === 'failed' ||
      results.duplicateCheck === 'failed') {
    this.verificationStatus = 'rejected';
  } else if (steps.documentVerified && steps.biometricVerified && !steps.manualReviewRequired) {
    this.verificationStatus = 'verified';
    this.verifiedAt = new Date();
  } else if (steps.manualReviewRequired && !steps.manualReviewCompleted) {
    this.verificationStatus = 'in_review';
  } else {
    this.verificationStatus = 'pending';
  }
};

export default mongoose.model<IIdentityVerification>('IdentityVerification', IdentityVerificationSchema);
