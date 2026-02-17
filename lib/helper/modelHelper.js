/**
 * Baut den Projekt-Kontext-Block für den System Prompt.
 * Enthält Projekt-Instructions, hochgeladene Dokumente und Zusammenfassungen
 * der anderen Chats im selben Projekt.
 *
 * @param {Object|null} project - Projekt-Objekt aus Firestore
 * @returns {string} - Formatierter Kontext-Block oder leerer String
 */
export function buildProjectContext(project) {
  if (!project) return "";

  const parts = [];

  if (project.instructions?.trim()) {
    parts.push(`## Projekt-Anweisungen\n${project.instructions.trim()}`);
  }

  if (project.documents?.length > 0) {
    const docBlocks = project.documents
      .map((doc) => {
        const header = `### ${doc.title || "Dokument"} (${doc.type || "text"})`;
        return `${header}\n${doc.content}`;
      })
      .join("\n\n");

    parts.push(`## Projekt-Dateien\n${docBlocks}`);
  }

  if (project.memories?.length > 0) {
    const memoriesList = project.memories.map((m) => `- ${m.text}`).join("\n");
    parts.push(`## Project Memory\n${memoriesList}`);
  }

  // Inject summaries from sibling chats in the same project.
  // These are fetched in ChatContext.sendMessage and attached as
  // project.conversationSummaries (excluding the current chat).
  if (project.conversationSummaries?.length > 0) {
    const summaryBlocks = project.conversationSummaries
      .map((s) => `### ${s.title || "Untitled Chat"}\n${s.summary}`)
      .join("\n\n");

    parts.push(
      `## Knowledge from other chats in this project\nThe following are summaries of other conversations in this project. Use them to answer questions or maintain continuity across chats.\n\n${summaryBlocks}`,
    );
  }

  if (parts.length === 0) return "";

  return `\n\n---\n# Projekt-Kontext: "${project.title}"\n\n${parts.join("\n\n")}`;
}

// ==================== SYSTEM PROMPT ====================

export const buildSystemPromptWithMemories = (
  memories = [],
  basePreferences = "",
  project = null,
) => {
  let systemPrompt = "You are a helpful AI assistant.";

  if (basePreferences) {
    systemPrompt += `\n\nUser preferences: ${basePreferences}`;
  }

  if (memories?.length > 0) {
    const memoriesList = memories.map((m) => `- ${m.text}`).join("\n");
    systemPrompt += `\n\nWhat you remember about this user:\n${memoriesList}`;
  }

  const projectContext = buildProjectContext(project);
  if (projectContext) {
    systemPrompt += projectContext;
  }

  return systemPrompt;
};

// ==================== ERINNERUNGS-EXTRAKTION ====================

export const buildMemoryExtractionPrompt = (existingMemories = []) => {
  const existingList =
    existingMemories.length > 0
      ? existingMemories
          .map((m, i) => `${i + 1}. [id:${m.id}] ${m.text}`)
          .join("\n")
      : "Keine bisherigen Erinnerungen.";

  return `You are a memory extraction assistant. Analyze the conversation and determine if there is any important personal information worth remembering about the user.

Existing memories about this user:
${existingList}

Your task:
- If the conversation contains NEW information not covered by existing memories → return action "add"
- If the conversation UPDATES or CONTRADICTS an existing memory → return action "update" with the id of the memory to replace
- If nothing new or relevant is found → return action "none"

Examples of memory-worthy information:
- Personal preferences ("I prefer dark mode", "I like concise answers")
- Professional context ("I'm a React developer", "I work at a startup")
- Personal facts ("I'm learning German", "I have 2 kids")
- Recurring needs ("I always need TypeScript", "I use Next.js")

Respond ONLY with valid JSON, one of these three shapes:
{"action": "none"}
{"action": "add", "memory": "Short, factual memory text"}
{"action": "update", "id": "<existing memory id>", "memory": "Updated memory text"}`;
};

// ==================== PROJECT MEMORY EXTRAKTION ====================

export const buildProjectMemoryExtractionPrompt = (existingMemories = []) => {
  const existingList =
    existingMemories.length > 0
      ? existingMemories
          .map((m, i) => `${i + 1}. [id:${m.id}] ${m.text}`)
          .join("\n")
      : "No existing project memories.";

  return `You are a project knowledge extraction assistant. Analyze the conversation and determine if it contains important project-specific information worth remembering.

Existing project memories:
${existingList}

Extract information relevant to the PROJECT, not the person. This includes:
- Technical decisions ("We use Tailwind for styling", "Auth is handled via Firebase")
- Architecture choices ("Components live in /components", "API routes use edge runtime")
- Design decisions ("Primary color is neutral-900", "Buttons use rounded-full")
- Conventions ("Always use TypeScript", "Prefix hooks with use")
- Constraints or requirements ("Must support mobile", "No external UI libraries")
- Resolved problems ("Fixed CORS by adding header", "Pagination uses cursor-based approach")

Do NOT extract personal preferences, user habits, or anything that belongs to the person rather than the project.

Respond ONLY with valid JSON:
{"action": "none"}
{"action": "add", "memory": "Short, factual project memory"}
{"action": "update", "id": "<existing memory id>", "memory": "Updated memory text"}`;
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

// ==================== CHAT SUMMARY ====================

/**
 * Builds the prompt used to generate a conversation summary.
 * The summary is stored on the conversation doc and injected into
 * sibling chats within the same project.
 */
export const buildSummaryPrompt = () =>
  `You are a concise summarization assistant. Summarize the key decisions, facts, and outcomes from this conversation in 3-8 bullet points. Focus on information that would be useful context for someone working on a related task in the same project. Be specific and factual. Do not include pleasantries or meta-commentary. Respond with plain bullet points only, no headers.`;
