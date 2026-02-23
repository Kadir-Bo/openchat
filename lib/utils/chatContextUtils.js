import {
  buildContextMessages,
  trimMessagesToTokenLimit,
} from "../chat/buildMessages";
import { buildSummaryPrompt } from "../prompts/summaryPrompt";
import { streamResponse } from "../api/streamResponse";

/** Build a trimmed messages array ready for the API. */
export const buildApiMessages = (
  history,
  userMessage,
  systemPrompt,
  MAX_CONTEXT_MSGS = 10,
  MAX_TOKENS = 100000,
) =>
  trimMessagesToTokenLimit(
    buildContextMessages(history, userMessage, MAX_CONTEXT_MSGS, systemPrompt),
    MAX_TOKENS,
  );

/** Fetch summaries of sibling conversations in the same project. */
export const fetchSiblingConversationSummaries = async (
  projectId,
  currentChatId,
  getProjectConversations,
) => {
  try {
    const siblings = await getProjectConversations(projectId);
    return siblings
      .filter((c) => c.id !== currentChatId && c.summary?.trim())
      .map((c) => ({ title: c.title || "Untitled Chat", summary: c.summary }));
  } catch {
    return [];
  }
};

/** Fire-and-forget: generate + persist a conversation summary. */
export const generateAndSaveConversationSummary = (
  chatId,
  messages,
  userMessage,
  assistantResponse,
  updateConversation,
  DEFAULT_MODEL = "openai/gpt-oss-120b",
) => {
  const transcript = [
    ...messages.map(
      (m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`,
    ),
    `User: ${userMessage}`,
    `Assistant: ${assistantResponse}`,
  ]
    .join("\n\n")
    .substring(0, 8000);

  streamResponse(
    [
      { role: "system", content: buildSummaryPrompt() },
      { role: "user", content: transcript },
    ],
    DEFAULT_MODEL,
  )
    .then((summary) =>
      updateConversation(chatId, {
        summary: summary.trim(),
        summaryUpdatedAt: new Date().toISOString(),
      }),
    )
    .catch((err) => console.warn("Summary generation failed:", err));
};
