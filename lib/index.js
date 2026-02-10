// Firebase
export {
  default as getFirebaseApp,
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
// Utils
export {
  generateTitleFromResponse,
  truncateText,
  formatDate,
  formatUsername,
} from "./utils/textUtils";
// API
export { streamResponse } from "./api/streamResponse";
//
//
// EXAMPLE DATA
export { EXAMPLE_PROJECTS } from "./utils/EXAMPLE/EXAMPLE_PROJECTS";
