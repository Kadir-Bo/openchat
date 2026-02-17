"use client";

import { useDatabase } from "@/context";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ArrowLeft, Plus, Trash2 } from "react-feather";
import { PrimaryButton, ChatCard, Searchbar, Select } from "@/components";
import { useRouter } from "next/navigation";

const FILTER_OPTIONS = [
  { id: "recent", value: "activity", label: "Recent activity" },
  { id: "name", value: "name", label: "Name" },
  { id: "date", value: "date", label: "Date created" },
];

const fuzzyMatch = (str, pattern) => {
  if (!pattern) return { match: true, score: 0 };
  if (!str) return { match: false, score: 0 };

  const lowerStr = str.toLowerCase();
  const lowerPattern = pattern.toLowerCase();

  if (lowerStr.includes(lowerPattern)) return { match: true, score: 1000 };

  let patternIdx = 0;
  let strIdx = 0;
  let score = 0;
  let consecutiveMatches = 0;

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

export default function ArchivePage() {
  const { subscribeToArchivedConversations, deleteConversation } =
    useDatabase();
  const router = useRouter();

  const [conversations, setConversations] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [sortBy, setSortBy] = useState(FILTER_OPTIONS[0].value);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());

  const selectedIdsRef = useRef(selectedIds);
  const lastClickedIndexRef = useRef(null);
  const filteredListRef = useRef([]);

  useEffect(() => {
    selectedIdsRef.current = selectedIds;
  }, [selectedIds]);

  useEffect(() => {
    const unsubscribe = subscribeToArchivedConversations((data) => {
      setConversations(data);
      setIsInitialLoading(false);
    });
    return () => unsubscribe?.();
  }, [subscribeToArchivedConversations]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setSelectedIds(new Set());
        lastClickedIndexRef.current = null;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const filteredAndSortedConversations = useMemo(() => {
    if (searchQuery.trim()) {
      return conversations
        .map((c) => ({ c, ...fuzzyMatch(c.title || "", searchQuery) }))
        .filter(({ match }) => match)
        .sort((a, b) => b.score - a.score)
        .map(({ c }) => c);
    }

    return [...conversations].sort((a, b) => {
      if (sortBy === "name")
        return (a.title || "").localeCompare(b.title || "");
      const key = sortBy === "date" ? "createdAt" : "updatedAt";
      const toDate = (v) => v?.toDate?.() ?? new Date(v);
      return toDate(b[key]) - toDate(a[key]);
    });
  }, [conversations, searchQuery, sortBy]);

  // Ref nach dem Render synchron halten — muss nach dem useMemo stehen
  useEffect(() => {
    filteredListRef.current = filteredAndSortedConversations;
  }, [filteredAndSortedConversations]);

  const handleCardClick = useCallback(
    (e, id) => {
      const list = filteredListRef.current;
      const index = list.findIndex((c) => c.id === id);
      const selected = selectedIdsRef.current;

      if (
        e.shiftKey &&
        lastClickedIndexRef.current !== null &&
        selected.size > 0
      ) {
        const start = Math.min(lastClickedIndexRef.current, index);
        const end = Math.max(lastClickedIndexRef.current, index);
        const range = list.slice(start, end + 1).map((c) => c.id);
        setSelectedIds((prev) => new Set([...prev, ...range]));
        lastClickedIndexRef.current = index;
        return;
      }

      if (e.metaKey || e.ctrlKey || selected.size > 0) {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.has(id) ? next.delete(id) : next.add(id);
          return next;
        });
        lastClickedIndexRef.current = index;
        return;
      }

      router.push(`/chat/${id}`);
    },
    [router],
  );

  const handleDeleteSelected = useCallback(async () => {
    await Promise.all(
      [...selectedIdsRef.current].map((id) => deleteConversation(id)),
    );
    setSelectedIds(new Set());
    lastClickedIndexRef.current = null;
  }, [deleteConversation]);

  const handleDeleteAll = useCallback(async () => {
    await Promise.all(conversations.map((c) => deleteConversation(c.id)));
    setSelectedIds(new Set());
    lastClickedIndexRef.current = null;
  }, [conversations, deleteConversation]);

  const selectedCount = selectedIds.size;
  const activeSort = FILTER_OPTIONS.find((o) => o.value === sortBy);
  const hasConversations = conversations.length > 0;

  if (isInitialLoading) {
    return (
      <p className="text-center py-12 text-neutral-400">
        Loading archived chats...
      </p>
    );
  }

  return (
    <div className="flex-1 flex flex-col max-w-5xl mx-auto py-8 gap-6 w-full">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-light">Archive</h1>
        <PrimaryButton
          text="New Chat"
          icon={<Plus size={17} />}
          className="w-max justify-center text-sm min-w-32"
          href="/chat"
          filled
        />
      </header>

      <div className="flex justify-end items-center gap-3">
        <span className="text-neutral-400 text-sm">Sort by:</span>
        <Select
          id="archive-sort"
          name="sort"
          label=""
          value={activeSort?.label || "Sort by"}
          list={FILTER_OPTIONS}
          onChange={(e) => setSortBy(e.target.value)}
          containerClassName="w-auto min-w-40"
          labelClassName="hidden"
          buttonClassName="text-sm px-3 min-w-32"
        />
      </div>

      <Searchbar
        onSearch={(q) => setSearchQuery(q)}
        placeholder="Search Archive"
      />

      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-600">
          {selectedCount > 0
            ? `${selectedCount} ${selectedCount === 1 ? "chat" : "chats"} selected — Esc to cancel`
            : hasConversations
              ? "⌘ / Ctrl + click to select"
              : ""}
        </span>

        {selectedCount > 0 && (
          <PrimaryButton
            text={`Delete ${selectedCount} ${selectedCount === 1 ? "chat" : "chats"}`}
            icon={<Trash2 size={14} />}
            className="w-max text-sm px-4 text-red-400 border-red-400/30 hover:bg-red-400/10 hover:border-red-400/60"
            onClick={handleDeleteSelected}
          />
        )}

        {selectedCount === 0 && hasConversations && (
          <PrimaryButton
            text="Delete all chats"
            icon={<Trash2 size={14} />}
            className="w-max text-sm px-4 text-red-400 border-red-400/30 hover:bg-red-400/10 hover:border-red-400/60"
            onClick={handleDeleteAll}
          />
        )}
      </div>

      {filteredAndSortedConversations.length > 0 ? (
        <div className="flex flex-col gap-2">
          {filteredAndSortedConversations.map((conversation) => (
            <ChatCard
              key={conversation.id}
              conversation={conversation}
              isSelected={selectedIds.has(conversation.id)}
              onCardClick={handleCardClick}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-neutral-400">
          {searchQuery ? (
            <>No archived chats found matching &quot;{searchQuery}&quot;</>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <p>No archived chats</p>
              <PrimaryButton
                text="Go to Chats"
                className="w-max justify-center text-sm px-4"
                href="/chats"
                icon={<ArrowLeft size={15} />}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
