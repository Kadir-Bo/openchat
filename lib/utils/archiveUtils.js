export const fuzzyMatch = (str, pattern) => {
  if (!pattern) return { match: true, score: 0 };
  if (!str) return { match: false, score: 0 };

  const lowerStr = str.toLowerCase();
  const lowerPattern = pattern.toLowerCase();

  if (lowerStr.includes(lowerPattern)) return { match: true, score: 1000 };

  let patternIdx = 0,
    strIdx = 0,
    score = 0,
    consecutiveMatches = 0;

  while (strIdx < lowerStr.length && patternIdx < lowerPattern.length) {
    if (lowerStr[strIdx] === lowerPattern[patternIdx]) {
      score += 1;
      consecutiveMatches++;
      if (consecutiveMatches > 1) score += consecutiveMatches * 2;
      if (strIdx === 0 || lowerStr[strIdx - 1] === " ") score += 5;
      patternIdx++;
    } else {
      consecutiveMatches = 0;
    }
    strIdx++;
  }

  const match = patternIdx === lowerPattern.length;
  if (match) score = score * (1 + score / lowerStr.length);
  return { match, score: match ? score : 0 };
};

export const toMs = (v) => v?.toDate?.().getTime() ?? new Date(v).getTime();

export const sortItems = (list, sortBy) =>
  [...list].sort((a, b) => {
    if (sortBy === "name") return (a.title || "").localeCompare(b.title || "");
    const key = sortBy === "date" ? "createdAt" : "updatedAt";
    return toMs(b[key]) - toMs(a[key]);
  });

export const fuzzyFilterChats = (chats, query) =>
  chats
    .map((c) => ({ c, ...fuzzyMatch(c.title || "", query) }))
    .filter(({ match }) => match)
    .sort((a, b) => b.score - a.score)
    .map(({ c }) => c);

export const filterProjects = (projects, query, sortBy) => {
  if (query.trim()) {
    return projects.filter((p) =>
      [p.title, p.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase()),
    );
  }
  return sortItems(projects, sortBy);
};

export const groupConversationsByProject = (
  conversations,
  projectsById = null,
) => {
  const map = {};
  for (const c of conversations) {
    if (!c.projectId) continue;
    if (projectsById && !projectsById[c.projectId]) continue;
    if (!map[c.projectId]) map[c.projectId] = [];
    map[c.projectId].push(c);
  }
  console.log("groupConversationsByProject result", map);
  return map;
};

export const buildChatTabItems = ({
  conversations,
  projectsById,
  conversationsByProject,
  searchQuery,
  sortBy,
}) => {
  const q = searchQuery.trim();
  const items = [];
  const seenProjects = new Set();

  for (const c of conversations) {
    const project = c.projectId ? projectsById[c.projectId] : null;

    if (project) {
      if (seenProjects.has(project.id)) continue;
      seenProjects.add(project.id);

      if (q) {
        const projectMatch = fuzzyMatch(project.title || "", q);
        const chatMatches = (conversationsByProject[project.id] ?? []).map(
          (conv) => fuzzyMatch(conv.title || "", q),
        );
        const bestChatScore = chatMatches.reduce(
          (best, s) => (s.score > best.score ? s : best),
          { match: false, score: 0 },
        );
        if (!projectMatch.match && !bestChatScore.match) continue;
        items.push({
          type: "project",
          item: project,
          score: Math.max(projectMatch.score, bestChatScore.score),
        });
      } else {
        items.push({ type: "project", item: project });
      }
    } else {
      if (q) {
        const { match, score } = fuzzyMatch(c.title || "", q);
        if (!match) continue;
        items.push({ type: "chat", item: c, score });
      } else {
        items.push({ type: "chat", item: c });
      }
    }
  }

  if (q) {
    items.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  } else if (sortBy === "name") {
    items.sort((a, b) =>
      (a.item.title || "").localeCompare(b.item.title || ""),
    );
  } else {
    const key = sortBy === "date" ? "createdAt" : "updatedAt";
    items.sort((a, b) => toMs(b.item[key]) - toMs(a.item[key]));
  }

  return items;
};

export const FILTER_OPTIONS = [
  { id: "recent", value: "activity", label: "Recent activity" },
  { id: "name", value: "name", label: "Name" },
  { id: "date", value: "date", label: "Date created" },
];
