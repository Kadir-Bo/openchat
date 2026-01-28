// Firebase Auth Error Codes to User-Friendly Messages
export const authErrorMessages = {
  // Email/Password Errors
  "auth/email-already-exists":
    "This email is already taken. Try signing in instead.",
  "auth/email-already-in-use":
    "This email is already taken. Try signing in instead.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/user-not-found":
    "We couldn't find an account with this email. Want to create one?",
  "auth/wrong-password":
    "Wrong password. Try again or click 'Forgot password' to reset it.",
  "auth/weak-password": "Your password needs at least 6 characters.",
  "auth/invalid-password": "Your password needs at least 6 characters.",

  // Account Status Errors
  "auth/user-disabled": "Your account has been disabled. Contact us for help.",
  "auth/account-exists-with-different-credential":
    "You already have an account with this email. Try a different sign-in method.",

  // Token & Session Errors
  "auth/id-token-expired": "Your session expired. Please sign in again.",
  "auth/id-token-revoked": "You've been signed out. Please sign in again.",
  "auth/invalid-id-token": "Something went wrong. Please sign in again.",
  "auth/session-cookie-expired": "Your session expired. Please sign in again.",
  "auth/session-cookie-revoked":
    "You've been signed out. Please sign in again.",
  "auth/requires-recent-login":
    "For your security, please sign in again to continue.",

  // Password Reset Errors
  "auth/invalid-action-code":
    "This reset link doesn't work anymore. Request a new one.",
  "auth/expired-action-code": "This reset link expired. Request a new one.",

  // Network & Rate Limiting Errors
  "auth/network-request-failed":
    "Can't connect. Check your internet and try again.",
  "auth/too-many-requests":
    "Too many tries. Wait a bit and try again, or reset your password.",

  // Configuration Errors
  "auth/api-key-not-valid.-please-pass-a-valid-api-key.":
    "Something's wrong on our end. Please contact support.",
  "auth/invalid-api-key":
    "Something's wrong on our end. Please contact support.",
  "auth/operation-not-allowed":
    "This sign-in method isn't available right now. Contact support.",
  "auth/unauthorized-continue-uri":
    "Something's wrong with this link. Contact support.",
  "auth/invalid-continue-uri":
    "Something's wrong with this link. Contact support.",
  "auth/invalid-dynamic-link-domain":
    "Something's wrong on our end. Contact support.",

  // Permission & Server Errors
  "auth/insufficient-permission":
    "You don't have permission to do this. Contact support.",
  "auth/internal-error": "Something went wrong. Please try again.",
  "auth/project-not-found": "Something's wrong on our end. Contact support.",

  // Phone Number Errors
  "auth/invalid-phone-number": "Please enter a valid phone number.",
  "auth/phone-number-already-exists": "This phone number is already in use.",

  // User Data Validation Errors
  "auth/invalid-display-name": "Please enter your name.",
  "auth/invalid-email-verified": "Email verification failed.",
  "auth/invalid-photo-url": "Please use a valid photo URL.",
  "auth/invalid-uid": "Something went wrong. Please try again.",
  "auth/uid-already-exists": "This account already exists.",

  // Popup & Redirect Errors
  "auth/popup-blocked":
    "Your browser blocked the popup. Please allow popups and try again.",
  "auth/popup-closed-by-user": "Sign-in cancelled. Try again when ready.",
  "auth/redirect-cancelled-by-user": "Sign-in cancelled. Try again when ready.",
  "auth/redirect-operation-pending":
    "Already signing in. Please wait a moment.",

  // Claims & Custom Attributes
  "auth/claims-too-large": "Too much data. Contact support.",
  "auth/invalid-claims": "Invalid data. Contact support.",
  "auth/reserved-claims": "Invalid data. Contact support.",

  // Import & Batch Operations
  "auth/invalid-user-import": "Import failed. Contact support.",
  "auth/maximum-user-count-exceeded": "Too many users. Contact support.",

  // Missing Required Fields
  "auth/missing-android-pkg-name": "Missing app information.",
  "auth/missing-continue-uri": "Missing required information.",
  "auth/missing-ios-bundle-id": "Missing app information.",
  "auth/missing-uid": "Missing user information.",

  // Hash & Password Import Errors
  "auth/invalid-hash-algorithm": "Password setup error. Contact support.",
  "auth/invalid-hash-block-size": "Password setup error. Contact support.",
  "auth/invalid-hash-derived-key-length":
    "Password setup error. Contact support.",
  "auth/invalid-hash-key": "Password setup error. Contact support.",
  "auth/invalid-hash-memory-cost": "Password setup error. Contact support.",
  "auth/invalid-hash-parallelization": "Password setup error. Contact support.",
  "auth/invalid-hash-rounds": "Password setup error. Contact support.",
  "auth/invalid-hash-salt-separator": "Password setup error. Contact support.",
  "auth/invalid-password-hash": "Password setup error. Contact support.",
  "auth/invalid-password-salt": "Password setup error. Contact support.",
  "auth/missing-hash-algorithm": "Password setup error. Contact support.",

  // OAuth & Provider Errors
  "auth/invalid-oauth-responsetype": "Sign-in error. Contact support.",
  "auth/missing-oauth-client-secret": "Sign-in error. Contact support.",
  "auth/invalid-provider-id": "Invalid sign-in method.",
  "auth/invalid-provider-data": "Invalid sign-in data.",

  // Credential Errors
  "auth/invalid-credential": "Wrong email or password. Please try again.",
  "auth/invalid-verification-code": "Wrong code. Please try again.",
  "auth/invalid-verification-id": "Verification failed. Try again.",
  "auth/missing-verification-code": "Please enter the code we sent you.",
  "auth/missing-verification-id": "Verification missing. Try again.",

  // Time & Date Errors
  "auth/invalid-creation-time": "Invalid date.",
  "auth/invalid-last-sign-in-time": "Invalid date.",

  // Session Cookie Errors
  "auth/invalid-session-cookie-duration": "Session error.",

  // Argument & Page Token Errors
  "auth/invalid-argument": "Something went wrong. Please try again.",
  "auth/invalid-page-token": "Please refresh the page and try again.",

  // Default
  default: "Something went wrong. Please try again.",
};

/**
 * Get user-friendly error message from Firebase error
 * @param {Error} error - Firebase error object
 * @returns {string} User-friendly error message
 */
export function getAuthErrorMessage(error) {
  if (!error) return authErrorMessages.default;
  console.log(error);

  // Extract error code from Firebase error
  const errorCode = error.code || error.message || "";

  // Return custom message or default
  return authErrorMessages[errorCode] || authErrorMessages.default;
}
