/**
 * Baut das messages-Array für die API mit Conversation History
 */
export function buildContextMessages(
  recentMessages = [],
  currentUserMessage,
  maxMessages = 10,
  systemPrompt = null,
) {
  const system = {
    role: "system",
    content: systemPrompt || "Du bist ein hilfreicher KI-Assistent.",
  };

  const contextMessages = recentMessages.slice(-maxMessages).map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

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
  if (messages.length === 0) return [];

  const systemMessage = messages[0];
  const userMessage = messages[messages.length - 1];
  const history = messages.slice(1, -1);

  const fixedTokens =
    estimateTokens(systemMessage.content) + estimateTokens(userMessage.content);

  let remainingTokens = maxTokens - fixedTokens;
  const trimmedHistory = [];

  for (let i = history.length - 1; i >= 0; i--) {
    const msgTokens = estimateTokens(history[i].content);
    if (remainingTokens - msgTokens < 0) break;
    trimmedHistory.unshift(history[i]);
    remainingTokens -= msgTokens;
  }

  return [systemMessage, ...trimmedHistory, userMessage];
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function fileTypeLabel(type) {
  const map = {
    js: "JS",
    jsx: "JSX",
    ts: "TS",
    tsx: "TSX",
    py: "PY",
    java: "Java",
    cpp: "C++",
    c: "C",
    cs: "C#",
    rb: "Ruby",
    go: "Go",
    rs: "Rust",
    php: "PHP",
    html: "HTML",
    css: "CSS",
    scss: "SCSS",
    json: "JSON",
    xml: "XML",
    yaml: "YAML",
    yml: "YAML",
    csv: "CSV",
    md: "MD",
    txt: "TXT",
    pdf: "PDF",
  };
  return map[type?.toLowerCase()] ?? type?.toUpperCase() ?? "File";
}
