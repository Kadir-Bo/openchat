/**
 * Baut das messages-Array für die API mit Conversation History
 */
export function buildContextMessages(
  recentMessages = [],
  currentUserMessage,
  maxMessages = 10,
  systemPrompt = null,
) {
  // System Prompt — custom oder default
  const system = {
    role: "system",
    content: systemPrompt || "Du bist ein hilfreicher KI-Assistent.",
  };

  // Letzte N Messages aus Firebase formatieren
  const contextMessages = recentMessages.slice(-maxMessages).map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  // Aktuelle User-Message hinzufügen
  const userMessage = {
    role: "user",
    content: currentUserMessage,
  };

  return [system, ...contextMessages, userMessage];
}

/**
 * Schätzt Token-Count (grob: ~4 Zeichen = 1 Token)
 */
export function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

/**
 * Trimmt Messages auf Token-Limit (128k für gpt-oss-120b)
 */
export function trimMessagesToTokenLimit(messages, maxTokens = 120000) {
  let totalTokens = 0;
  const trimmedMessages = [];

  // Von hinten nach vorne (neueste zuerst behalten)
  for (let i = messages.length - 1; i >= 0; i--) {
    const msgTokens = estimateTokens(messages[i].content);

    if (totalTokens + msgTokens > maxTokens) {
      break;
    }

    trimmedMessages.unshift(messages[i]);
    totalTokens += msgTokens;
  }

  return trimmedMessages;
}
