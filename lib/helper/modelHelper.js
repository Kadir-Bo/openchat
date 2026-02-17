/**
 * Baut den Projekt-Kontext-Block für den System Prompt.
 * Enthält Projekt-Instructions und alle hochgeladenen Dokumente.
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
