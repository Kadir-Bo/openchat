// ─── FIREBASE ─────────────────────────────────────────────────────────────────
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

// ─── ROUTING ──────────────────────────────────────────────────────────────────
export { default as PrivateRoute } from "./routing/PrivateRoute";

// ─── API ──────────────────────────────────────────────────────────────────────
export { streamResponse } from "./api/streamResponse";

// ─── CHAT ─────────────────────────────────────────────────────────────────────
export {
  buildContextMessages,
  trimMessagesToTokenLimit,
  estimateTokens,
} from "./chat/buildMessages";

export {
  detectAttachmentType,
  createAttachment,
  createPastedAttachment,
  ACCEPTED_FILE_TYPES,
} from "./chat/attachmentHelpers";

// ─── CHAT CONTEXT ─────────────────────────────────────────────────────────────
export {
  buildApiMessages,
  fetchSiblingConversationSummaries,
  generateAndSaveConversationSummary,
} from "./utils/chatContextUtils";

// ─── MEMORY ───────────────────────────────────────────────────────────────────
export {
  extractProjectMemoryFromConversation,
  extractAndSaveUserMemory,
  extractAndSaveProjectMemory,
} from "./memory/memoryUtils";

// ─── PROMPTS ──────────────────────────────────────────────────────────────────
export {
  buildMemoryExtractionPrompt,
  buildProjectMemoryExtractionPrompt,
} from "./prompts/memoryPrompts";

export {
  buildSummaryPrompt,
  generateTitleFromResponse,
} from "./prompts/summaryPrompt";

export {
  buildProjectContext,
  buildSystemPromptWithMemories,
} from "./prompts/systemprompt";

// ─── UI ───────────────────────────────────────────────────────────────────────
export {
  getContainerVariant,
  getTextAreaVariant,
} from "./ui/animationVariants";

export {
  getBubbleRadius,
  getCodeText,
  copyToClipboard,
} from "./ui/bubbleUtils";

// ─── UTILS ────────────────────────────────────────────────────────────────────
export { generateId } from "./utils/idUtils";

export { formatBytes, fileTypeLabel } from "./utils/formatHelpers";

export {
  truncateText,
  sanitizeTitle,
  generateFallbackTitle,
  formatDate,
  formatUsername,
  insertTextAtCursor,
} from "./utils/textUtils";

export {
  fuzzyMatch,
  sortItems,
  fuzzyFilterChats,
  filterProjects,
  groupConversationsByProject,
  buildChatTabItems,
  FILTER_OPTIONS,
} from "./utils/archiveUtils";

export { MODELS } from "./utils/models";
export { THEMES } from "./utils/themes";
