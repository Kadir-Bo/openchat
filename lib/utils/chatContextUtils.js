import {
  buildContextMessages,
  buildMemoryExtractionPrompt,
  buildSummaryPrompt,
  extractProjectMemoryFromConversation,
  streamResponse,
  trimMessagesToTokenLimit,
  generateId,
} from "@/lib";

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

/** Fire-and-forget: extract a memory entry from the latest exchange. */
export const extractAndSaveUserMemory = (
  userMessage,
  assistantResponse,
  existingMemories,
  updateUserProfile,
  DEFAULT_MODEL = "openai/gpt-oss-120b",
) => {
  const prompt = buildMemoryExtractionPrompt(existingMemories);

  streamResponse(
    [
      { role: "system", content: prompt },
      {
        role: "user",
        content: `User said: "${userMessage}"\n\nAssistant responded: "${assistantResponse.substring(0, 500)}"`,
      },
    ],
    DEFAULT_MODEL,
  )
    .then((raw) => {
      const result = JSON.parse(raw.replace(/```json|```/g, "").trim());

      if (result.action === "add" && result.memory) {
        return updateUserProfile({
          memories: [
            ...existingMemories,
            {
              id: generateId(),
              text: result.memory,
              createdAt: new Date().toISOString(),
              source: "auto",
            },
          ],
        });
      }

      if (result.action === "update" && result.id && result.memory) {
        return updateUserProfile({
          memories: existingMemories.map((m) =>
            m.id === result.id
              ? {
                  ...m,
                  text: result.memory,
                  updatedAt: new Date().toISOString(),
                }
              : m,
          ),
        });
      }
    })
    .catch((err) => console.warn("User memory extraction failed:", err));
};

/** Fire-and-forget: extract a memory entry for the project. */
export const extractAndSaveProjectMemory = (
  userMessage,
  assistantResponse,
  projectId,
  existingMemories,
  updateProjectMemory,
) => {
  extractProjectMemoryFromConversation(
    userMessage,
    assistantResponse,
    existingMemories,
    streamResponse,
  )
    .then((result) => {
      if (result.action === "add" && result.memory) {
        return updateProjectMemory(projectId, [
          ...existingMemories,
          {
            id: generateId(),
            text: result.memory,
            createdAt: new Date().toISOString(),
            source: "auto",
          },
        ]);
      }

      if (result.action === "update" && result.id && result.memory) {
        return updateProjectMemory(
          projectId,
          existingMemories.map((m) =>
            m.id === result.id
              ? {
                  ...m,
                  text: result.memory,
                  updatedAt: new Date().toISOString(),
                }
              : m,
          ),
        );
      }
    })
    .catch((err) => console.warn("Project memory extraction failed:", err));
};
