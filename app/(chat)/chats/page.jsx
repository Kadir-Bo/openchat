"use client";

import { useDatabase } from "@/context";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Plus, Trash2 } from "react-feather";
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
  if (match) {
    const density = score / lowerStr.length;
    score = score * (1 + density);
  }

  return { match, score: match ? score : 0 };
};

export default function ChatsPage() {
  const { subscribeToConversations, deleteConversation } = useDatabase();
  const router = useRouter();
  const [conversations, setConversations] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [sortBy, setSortBy] = useState(FILTER_OPTIONS[0].value);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Refs damit handleCardClick immer aktuelle Werte sieht
  const selectedIdsRef = useRef(selectedIds);
  const lastClickedIndexRef = useRef(null);
  const filteredListRef = useRef([]);

  // selectedIdsRef synchron halten
  useEffect(() => {
    selectedIdsRef.current = selectedIds;
  }, [selectedIds]);

  useEffect(() => {
    const unsubscribe = subscribeToConversations((fetchedConversations) => {
      setConversations(fetchedConversations);
      setIsInitialLoading(false);
    }, false);

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [subscribeToConversations]);

  // Alle ausgewählten Chats löschen
  const handleDeleteSelected = useCallback(async () => {
    await Promise.all(
      [...selectedIdsRef.current].map((id) => deleteConversation(id)),
    );
    setSelectedIds(new Set());
    lastClickedIndexRef.current = null;
  }, [deleteConversation]);

  // Alle Chats löschen
  const handleDeleteAll = useCallback(async () => {
    await Promise.all(conversations.map((c) => deleteConversation(c.id)));
    setSelectedIds(new Set());
    lastClickedIndexRef.current = null;
  }, [conversations, deleteConversation]);

  const handleSortChange = (e) => setSortBy(e.target.value);
  const handleSearchChats = useCallback((query) => setSearchQuery(query), []);

  const filteredAndSortedConversations = useMemo(() => {
    let filtered = conversations;

    if (searchQuery.trim()) {
      filtered = conversations
        .map((conversation) => {
          const { match, score } = fuzzyMatch(
            conversation.title || "",
            searchQuery,
          );
          return { conversation, match, score };
        })
        .filter(({ match }) => match)
        .sort((a, b) => b.score - a.score)
        .map(({ conversation }) => conversation);
    }

    if (!searchQuery.trim()) {
      filtered = [...filtered].sort((a, b) => {
        switch (sortBy) {
          case "name":
            return (a.title || "").localeCompare(b.title || "");
          case "date": {
            const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
            const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
            return dateB - dateA;
          }
          case "activity":
          default: {
            const activityA = a.updatedAt?.toDate?.() || new Date(a.updatedAt);
            const activityB = b.updatedAt?.toDate?.() || new Date(b.updatedAt);
            return activityB - activityA;
          }
        }
      });
    }

    // Ref aktuell halten für den Klick-Handler
    filteredListRef.current = filtered;
    return filtered;
  }, [conversations, searchQuery, sortBy]);

  // Klick-Handler — liest aus Refs damit keine stale closures entstehen
  // Cmd/Ctrl+Klick → Auswahl-Modus starten oder toggle
  // Shift+Klick    → Bereich auswählen (nur wenn bereits im Auswahl-Modus)
  // Klick          → Navigieren (wenn kein Auswahl-Modus) oder toggle
  const handleCardClick = useCallback(
    (e, id) => {
      const list = filteredListRef.current;
      const currentIndex = list.findIndex((c) => c.id === id);
      const currentSelected = selectedIdsRef.current;
      const isMeta = e.metaKey || e.ctrlKey;

      // Shift+Klick → Bereich auswählen (nur wenn schon etwas ausgewählt)
      if (
        e.shiftKey &&
        lastClickedIndexRef.current !== null &&
        currentSelected.size > 0
      ) {
        const start = Math.min(lastClickedIndexRef.current, currentIndex);
        const end = Math.max(lastClickedIndexRef.current, currentIndex);
        const rangeIds = list.slice(start, end + 1).map((c) => c.id);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          rangeIds.forEach((rid) => next.add(rid));
          return next;
        });
        lastClickedIndexRef.current = currentIndex;
        return;
      }

      // Cmd/Ctrl+Klick → Auswahl-Modus starten / toggle
      if (isMeta) {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.has(id) ? next.delete(id) : next.add(id);
          return next;
        });
        lastClickedIndexRef.current = currentIndex;
        return;
      }

      // Auswahl-Modus aktiv → normaler Klick togglet auch
      if (currentSelected.size > 0) {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.has(id) ? next.delete(id) : next.add(id);
          return next;
        });
        lastClickedIndexRef.current = currentIndex;
        return;
      }

      // Kein Auswahl-Modus → navigieren
      router.push(`/chat/${id}`);
    },
    [router],
  );

  // Escape → Auswahl aufheben
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setSelectedIds(new Set());
        lastClickedIndexRef.current = null;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const activeSort = FILTER_OPTIONS.find((item) => item.value === sortBy);
  const selectedCount = selectedIds.size;

  return (
    <div className="flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto py-8 gap-6">
      <header className="flex items-center justify-between w-full">
        <h1 className="text-3xl font-light">Chats</h1>
        <PrimaryButton
          text="New Chat"
          icon={<Plus size={17} />}
          className="w-max justify-center text-sm min-w-32"
          href="/chat"
          filled
        />
      </header>

      <div className="w-full flex justify-end items-center gap-3 min-w-34">
        <span className="text-neutral-400 text-sm">Sort by:</span>
        <Select
          id="chat-sort"
          name="sort"
          label=""
          value={activeSort?.label || "Sort by"}
          list={FILTER_OPTIONS}
          onChange={handleSortChange}
          containerClassName="w-auto min-w-40"
          labelClassName="hidden"
          buttonClassName="text-sm px-3 min-w-32"
        />
      </div>

      <Searchbar onSearch={handleSearchChats} placeholder="Search Chats" />

      {isInitialLoading ? (
        <div className="col-span-2 text-center py-12 text-neutral-400">
          Loading chats...
        </div>
      ) : (
        <div className="flex flex-col gap-6 w-full">
          {/* Aktionsleiste */}
          <div className="flex items-center justify-between">
            <span className="text-neutral-500 text-xs">
              {selectedCount > 0 ? (
                `${selectedCount} ${selectedCount === 1 ? "chat" : "chats"} selected — Esc to cancel`
              ) : conversations.length > 0 ? (
                <span className="text-neutral-400">
                  ⌘ / Ctrl + click to select
                </span>
              ) : (
                ""
              )}
            </span>

            {selectedCount > 0 ? (
              // Ausgewählte löschen
              <PrimaryButton
                text={`Delete ${selectedCount} ${selectedCount === 1 ? "chat" : "chats"}`}
                icon={<Trash2 size={14} />}
                className="w-max text-sm px-4 text-red-400 border-red-400/30 hover:bg-red-400/10 hover:border-red-400/60"
                onClick={handleDeleteSelected}
              />
            ) : (
              // Alle löschen
              conversations.length > 0 && (
                <PrimaryButton
                  text="Delete all chats"
                  icon={<Trash2 size={14} />}
                  className="w-max text-sm px-4 text-red-400 border-red-400/30 hover:bg-red-400/10 hover:border-red-400/60"
                  onClick={handleDeleteAll}
                />
              )
            )}
          </div>

          {filteredAndSortedConversations.length > 0 ? (
            filteredAndSortedConversations.map((conversation) => (
              <ChatCard
                key={conversation.id}
                conversation={conversation}
                isSelected={selectedIds.has(conversation.id)}
                onCardClick={handleCardClick}
              />
            ))
          ) : (
            <div className="text-center py-12 text-neutral-400 col-span-3">
              {searchQuery ? (
                <>No chats found matching &quot;{searchQuery}&quot;</>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <p>No chats yet</p>
                  <PrimaryButton
                    text="Start your first chat"
                    icon={<Plus size={17} />}
                    className="w-max justify-center text-sm"
                    href="/chat"
                    filled
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
