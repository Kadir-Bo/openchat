import { generateFallbackTitle, truncateText } from "../utils/textUtils";

/**
 * Builds the prompt used to generate a conversation summary.
 * The summary is stored on the conversation doc and injected into
 * sibling chats within the same project.
 */
export const buildSummaryPrompt = () =>
  `You are a concise summarization assistant. 
Summarize the key decisions, facts, and outcomes from this conversation in 3-8 bullet points. 
Focus on information that would be useful context for someone working on a related task in the same project. 
Be specific and factual. Do not include pleasantries or meta-commentary. 
Respond with plain bullet points only, no headers.`;

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
