// Firebase
export {
  getFirebaseApp,
  getFirebaseDB,
  getFirebaseStorage,
  getFirebaseAuth,
} from "./firebase/config";
export {
  authErrorMessages,
  getAuthErrorMessage,
} from "./firebase/error-messages";
// Routing
export { default as PrivateRoute } from "./routing/PrivateRoute";
// Helper
export {
  detectAttachmentType,
  createAttachment,
  createPastedAttachment,
  insertTextAtCursor,
  getContainerVariant,
  getTextAreaVariant,
  ACCEPTED_FILE_TYPES,
} from "./helper/chatInterfaceHelpers";
// Utils
export {
  generateTitleFromResponse,
  truncateText,
  formatDate,
  formatUsername,
} from "./utils/textUtils";
// API
export { streamResponse } from "./api/streamResponse";
