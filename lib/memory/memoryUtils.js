import { streamResponse } from "../api/streamResponse";
import { generateId } from "../utils/idUtils";
import {
  buildMemoryExtractionPrompt,
  buildProjectMemoryExtractionPrompt,
} from "../prompts/memoryPrompts";

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

/**
 * Runs project memory extraction via the LLM.
 * Returns { action, memory?, id? } — same shape as user memory extraction.
 */
export const extractProjectMemoryFromConversation = async (
  userMessage,
  assistantResponse,
  existingMemories = [],
  streamResponseFn,
) => {
  try {
    const result = await streamResponseFn(
      [
        {
          role: "system",
          content: buildProjectMemoryExtractionPrompt(existingMemories),
        },
        {
          role: "user",
          content: `User said: "${userMessage}"\n\nAssistant responded: "${assistantResponse.substring(0, 500)}"`,
        },
      ],
      "openai/gpt-oss-120b",
      null,
      false,
      50,
      null,
    );
    const cleaned = result.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return { action: "none" };
  }
};
