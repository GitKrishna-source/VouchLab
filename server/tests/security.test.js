import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALLOWED_CERTIFICATE_MIMES,
  ALLOWED_PHOTO_MIMES,
  certificateFileFilter,
  photoFileFilter,
  sanitizePassportForViewer
} from '../src/middleware/security.js';

test('Security - File Upload Filters Reject Executables and Dangerous Mimes', () => {
  // Test certificate filter with executable
  let certAllowed = false;
  let certError = null;
  certificateFileFilter({}, { mimetype: 'application/x-msdownload' }, (err, allowed) => {
    certError = err;
    certAllowed = allowed;
  });
  assert.equal(certAllowed, undefined);
  assert.match(certError.message, /Invalid file format/);

  // Test certificate filter with valid PDF
  let pdfAllowed = false;
  certificateFileFilter({}, { mimetype: 'application/pdf' }, (err, allowed) => {
    pdfAllowed = allowed;
  });
  assert.equal(pdfAllowed, true);

  // Test photo filter with script
  let photoAllowed = false;
  let photoError = null;
  photoFileFilter({}, { mimetype: 'application/javascript' }, (err, allowed) => {
    photoError = err;
    photoAllowed = allowed;
  });
  assert.equal(photoAllowed, undefined);
  assert.match(photoError.message, /Invalid file format/);

  // Test photo filter with valid JPG
  let jpgAllowed = false;
  photoFileFilter({}, { mimetype: 'image/jpeg' }, (err, allowed) => {
    jpgAllowed = allowed;
  });
  assert.equal(jpgAllowed, true);
});

test('Security - Privacy Sanitization Strips PII for Non-Admin Reviewers', () => {
  const sensitivePassport = {
    user: {
      id: 42,
      name: 'Alex Student',
      email: 'alex@demo.edu',
      phone: '+1-555-0199',
      category: 'student',
      department: 'Robotics',
      verified_status: 1,
      password_hash: 'secret_hash_not_to_leak'
    },
    badges: [{ badge_key: 'req_1', title: 'Laser Safety' }]
  };

  // When viewed by an owner/manager
  const sanitized = sanitizePassportForViewer(sensitivePassport, 'owner');
  assert.equal(sanitized.user.id, 42);
  assert.equal(sanitized.user.name, 'Alex Student');
  assert.equal(sanitized.user.department, 'Robotics');
  assert.equal(sanitized.user.phone, undefined, 'Phone number must be stripped');
  assert.equal(sanitized.user.password_hash, undefined, 'Sensitive hash must be stripped');

  // When viewed by an admin
  const adminView = sanitizePassportForViewer(sensitivePassport, 'admin');
  assert.equal(adminView.user.phone, '+1-555-0199', 'Admin has institutional oversight');
});

