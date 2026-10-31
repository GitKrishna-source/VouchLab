import rateLimit from 'express-rate-limit';

/**
 * General API Rate Limiter
 * 300 requests per 15 minutes window
 */
export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP. Please try again after 15 minutes.'
  }
});

/**
 * Strict Auth Rate Limiter
 * 20 attempts per 15 minutes to block brute-force password cracking
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts. Please try again after 15 minutes.'
  }
});

/**
 * Quiz Submission Rate Limiter
 * 30 submissions per 15 minutes to prevent automated rapid guessing
 */
export const quizLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many quiz submissions. Please review safety material before retrying.'
  }
});

/**
 * Upload Rate Limiter
 * 30 uploads per 15 minutes
 */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Upload limit reached. Please wait a few minutes before uploading more evidence.'
  }
});

/**
 * Allowed MIME types for Multer file uploads
 */
export const ALLOWED_CERTIFICATE_MIMES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp'
];

export const ALLOWED_PHOTO_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp'
];

/**
 * Multer File Filter for Certificates
 */
export const certificateFileFilter = (req, file, cb) => {
  if (ALLOWED_CERTIFICATE_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only PDF, JPG, PNG, and WebP certificates are allowed.'));
  }
};

/**
 * Multer File Filter for Condition Photos
 */
export const photoFileFilter = (req, file, cb) => {
  if (ALLOWED_PHOTO_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only JPG, PNG, and WebP images are allowed.'));
  }
};

/**
 * Sanitizes user passport data for external/owner viewing
 * Strips sensitive PII (phone number, full email, password hashes, unrelated attempts)
 */
export const sanitizePassportForViewer = (passportData, viewerRole) => {
  if (viewerRole === 'admin') {
    return passportData; // Full visibility for institutional admins
  }

  const sanitizedUser = passportData.user ? {
    id: passportData.user.id,
    name: passportData.user.name,
    category: passportData.user.category,
    department: passportData.user.department,
    verified_status: passportData.user.verified_status
  } : null;

  return {
    ...passportData,
    user: sanitizedUser
  };
};

