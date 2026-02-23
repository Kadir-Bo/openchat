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
