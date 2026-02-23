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

/**
 * System Prompt
 */

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
