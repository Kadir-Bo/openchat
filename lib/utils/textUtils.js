/**
 * Generiert einen Titel basierend auf User-Frage und AI-Antwort
 * @param {string} userMessage - Die Nachricht des Users
 * @param {string} aiResponse - Die Antwort der AI
 * @param {function} streamResponse - Die Stream-Funktion für AI-Anfragen
 * @returns {Promise<string>} - Generierter Titel
 */
export async function generateTitleFromResponse(
  userMessage,
  aiResponse,
  streamResponse = null,
) {
  if (!userMessage && !aiResponse) return "New Chat";

  // Fallback: Erste 3 Wörter der User-Nachricht
  const fallbackTitle = generateFallbackTitle(userMessage);

  // Wenn keine streamResponse-Funktion übergeben wurde, nutze Fallback
  if (!streamResponse || typeof streamResponse !== "function") {
    return fallbackTitle;
  }

  try {
    // Kürze die Inputs für den Prompt
    const truncatedUser = userMessage.substring(0, 150);
    const truncatedAI = aiResponse.substring(0, 300);

    // AI-generierter Titel basierend auf beiden Nachrichten
    const prompt = `Based on this conversation, generate a short, descriptive title (max 5 words). Only respond with the title in the same language as the message, nothing else:

User: "${truncatedUser}"
Assistant: "${truncatedAI}"`;

    // ====== FIX: Baue messages Array ======
    const messages = [
      {
        role: "system",
        content:
          "You are an assistant that creates short, concise titles. Respond only with the title, nothing else.",
      },
      {
        role: "user",
        content: prompt,
      },
    ];

    // ====== GEÄNDERT: Übergebe messages Array statt String ======
    const aiTitle = await streamResponse(
      messages,
      "openai/gpt-oss-120b",
      null, // onChunk
      false, // reasoning
      50, // updateInterval
      null, // signal
    );

    // Säubere und validiere AI-Antwort
    const cleaned = aiTitle
      .trim()
      .replace(/['"]/g, "") // Entferne Anführungszeichen
      .replace(/^(Title:|Titel:)/i, "") // Entferne "Title:" Prefix
      .trim();

    // Validierung: Nicht zu lang, nicht leer
    if (cleaned && cleaned.length > 0 && cleaned.length <= 60) {
      return truncateText(cleaned, 50, true);
    }

    // Falls AI-Titel ungültig, nutze Fallback
    return fallbackTitle;
  } catch (error) {
    console.warn(
      "Fehler bei AI-Titel-Generierung, nutze Fallback:",
      error.message,
    );
    return fallbackTitle;
  }
}

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
