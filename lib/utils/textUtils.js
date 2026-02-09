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
 * Generiert einen Titel mit AI oder nutzt Fallback
 * @param {string} message - Die erste Nachricht des Users
 * @param {function} streamResponse - Die Stream-Funktion für AI-Anfragen
 * @returns {Promise<string>} - Generierter Titel
 */
export async function generateConversationTitle(
  message,
  streamResponse = null,
) {
  if (!message) return "New Chat";

  // Fallback: Erste 3 Wörter
  const fallbackTitle = generateFallbackTitle(message);

  // Wenn keine streamResponse-Funktion übergeben wurde, nutze Fallback
  if (!streamResponse || typeof streamResponse !== "function") {
    return fallbackTitle;
  }

  try {
    // AI-generierter Titel
    const prompt = `Generate a short, concise title (max 5 words) for this conversation. Only respond with the title, nothing else:

"${message.substring(0, 200)}"`;

    const aiTitle = await streamResponse(prompt, "openai/gpt-oss-120b");

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
export const formatDate = (dateString) => {
  const date = new Date(dateString);
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
