// textUtils.js

/**
 * Generiert einen Fallback-Titel aus den ersten 3 Wörtern
 * @param {string} message - Die Nachricht
 * @returns {string} - Titel aus den ersten 3 Wörtern
 */
export function generateFallbackTitle(message) {
  if (!message || typeof message !== "string") {
    return "New Chat";
  }

  // Entferne Markdown und normalisiere Whitespace
  const cleaned = message
    .replace(/[#*_~`]/g, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return "New Chat";

  // Nimm die ersten 3 Wörter
  const words = cleaned.split(" ").filter((word) => word.length > 0);
  const firstThreeWords = words.slice(0, 3).join(" ");

  // Falls weniger als 3 Wörter, nimm was da ist
  return firstThreeWords || "New Chat";
}

/**
 * Kürzt einen Text auf eine maximale Länge und fügt Ellipsis hinzu
 * @param {string} text - Der zu kürzende Text
 * @param {number} maxLength - Maximale Zeichenlänge (default: 50)
 * @param {boolean} smartTrim - Versucht bei Wortgrenzen zu kürzen (default: true)
 * @returns {string} - Gekürzter Text mit "..." wenn nötig
 */
export function truncateText(text, maxLength = 50, smartTrim = true) {
  if (!text) return "";

  const trimmed = text.trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  let truncated = trimmed.substring(0, maxLength);

  if (smartTrim) {
    const lastSpace = truncated.lastIndexOf(" ");

    if (lastSpace > maxLength * 0.6) {
      truncated = truncated.substring(0, lastSpace);
    }
  }

  return truncated + "...";
}

/**
 * Validiert und säubert einen Titel
 * @param {string} title - Der zu validierende Titel
 * @param {number} maxLength - Maximale Länge (default: 100)
 * @returns {string} - Validierter und gesäuberter Titel
 */
export function sanitizeTitle(title, maxLength = 100) {
  if (!title || typeof title !== "string") {
    return "New Chat";
  }

  const sanitized = title.replace(/[<>]/g, "").replace(/\s+/g, " ").trim();

  if (!sanitized) return "New Chat";

  return truncateText(sanitized, maxLength, true);
}

// Format the last activity date
export const formatDate = (timestamp) => {
  // Handle Firestore Timestamp
  let date;
  if (timestamp?.toDate) {
    // Firestore Timestamp object
    date = timestamp.toDate();
  } else if (timestamp?.seconds) {
    // Firestore Timestamp plain object with seconds
    date = new Date(timestamp.seconds * 1000);
  } else if (timestamp instanceof Date) {
    // Already a Date object
    date = timestamp;
  } else if (typeof timestamp === "string") {
    // ISO string
    date = new Date(timestamp);
  } else {
    // Invalid timestamp
    return "Unknown";
  }

  const now = new Date();
  const diffInMs = now - date;
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  if (diffInDays === 0) return "Today";
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 30) return `${diffInDays} days ago`;
  if (diffInMonths < 12)
    return `${diffInMonths} ${diffInMonths === 1 ? "month" : "months"} ago`;
  if (diffInYears === 1) return "1 year ago";
  return `${diffInYears} years ago`;
};

/**
 * Formats a username by removing email domain and replacing special characters
 * @param {string} username - The username or email to format
 * @returns {string} - Formatted username
 *
 * Examples:
 * "max.muster@mail.de" -> "max muster"
 * "max_muster@mail.de" -> "max muster"
 * "john-doe@example.com" -> "john doe"
 * "Max Muster" -> "Max Muster" (no change if no @)
 */
export function formatUsername(username) {
  if (!username || typeof username !== "string") {
    return "User";
  }

  // Remove everything after @ (including @)
  let formatted = username.split("@")[0];

  // Replace special characters (., _, -, etc.) with spaces
  formatted = formatted.replace(/[._\-+]/g, " ");

  // Capitalize first letter of each word
  formatted = formatted
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  return formatted.trim() || "User";
}

/**
 * Inserts text at cursor position in textarea
 */
export const insertTextAtCursor = (
  currentValue,
  textToInsert,
  textarea,
  callback,
) => {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;

  const newValue =
    currentValue.substring(0, start) +
    textToInsert +
    currentValue.substring(end);

  callback(newValue);

  setTimeout(() => {
    textarea.selectionStart = textarea.selectionEnd =
      start + textToInsert.length;
    textarea.focus();
  }, 0);
};
