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
