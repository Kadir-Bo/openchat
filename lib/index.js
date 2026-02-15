// FIREBASE
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
// ROUTING
export { default as PrivateRoute } from "./routing/PrivateRoute";
// HELPER
export {
  detectAttachmentType,
  createAttachment,
  createPastedAttachment,
  insertTextAtCursor,
  getContainerVariant,
  getTextAreaVariant,
  ACCEPTED_FILE_TYPES,
} from "./helper/chatInterfaceHelpers";
export {
  buildContextMessages,
  trimMessagesToTokenLimit,
} from "./helper/chatHelpers";
// UTILS
export {
  generateTitleFromResponse,
  truncateText,
  formatDate,
  formatUsername,
} from "./utils/textUtils";
export { MODELS } from "./utils/models";
export { THEMES } from "./utils/themes";
// API
export { streamResponse } from "./api/streamResponse";
