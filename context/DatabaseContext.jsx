"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { getFirebaseDB } from "@/lib/firebase/config";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

export const DatabaseContext = createContext(null);

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context)
    throw new Error("useDatabase must be used within a DatabaseProvider");
  return context;
};

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_MODEL = "openai/gpt-oss-120b";
const BATCH_SIZE = 499;

// ─────────────────────────────────────────────────────────────────────────────
// Pure helpers
// ─────────────────────────────────────────────────────────────────────────────

// Sorts by updatedAt descending. Pending serverTimestamp() resolves to null
// on the client until confirmed — treating null as Infinity keeps newly
// created items at the top instead of jumping around.
const sortByUpdatedAt = (arr) =>
  [...arr].sort((a, b) => {
    const toMs = (v) => {
      if (v == null) return Infinity;
      if (typeof v.toDate === "function") return v.toDate().getTime();
      const ms = new Date(v).getTime();
      return isNaN(ms) ? Infinity : ms;
    };
    return toMs(b.updatedAt) - toMs(a.updatedAt);
  });

const batchDelete = async (db, refs) => {
  for (let i = 0; i < refs.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    refs.slice(i, i + BATCH_SIZE).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export default function DatabaseProvider({ children }) {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [error, setError] = useState(null);
  const db = getFirebaseDB();

  const handleError = useCallback((err, message) => {
    console.error(message, err);
    setError(err.message || message);
    return null;
  }, []);

  const resetError = useCallback(() => setError(null), []);

  // ─────────────────────────────────────────────────────────────────────────
  // User
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user || !db) return;

    const init = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          const profile = {
            email: user.email,
            displayName: user.displayName || null,
            photoURL: user.photoURL || null,
            preferences: {
              theme: "dark",
              defaultModel: DEFAULT_MODEL,
              language: "en",
              modelPreferences: "",
            },
            memories: [],
            usage: {
              totalMessages: 0,
              lastReset: serverTimestamp(),
            },
            createdAt: serverTimestamp(),
            lastActive: serverTimestamp(),
          };
          await setDoc(userRef, profile);
          setUserProfile({ id: user.uid, ...profile });
        } else {
          await updateDoc(userRef, { lastActive: serverTimestamp() });
          setUserProfile({ id: userDoc.id, ...userDoc.data() });
        }
      } catch (err) {
        console.error("Failed to initialize user profile:", err);
      }
    };

    init();
  }, [user, db]);

  const updateUserProfile = useCallback(
    async (userData) => {
      if (!user || !db) return null;
      resetError();
      try {
        const updates = {
          ...(userData.displayName !== undefined && {
            displayName: userData.displayName,
          }),
          ...(userData.photoURL !== undefined && {
            photoURL: userData.photoURL,
          }),
          ...(userData.preferences !== undefined && {
            preferences: userData.preferences,
          }),
          ...(userData.memories !== undefined && {
            memories: userData.memories,
          }),
          lastActive: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await updateDoc(doc(db, "users", user.uid), updates);
        setUserProfile((prev) => ({ ...prev, ...updates }));
        return { id: user.uid, ...updates };
      } catch (err) {
        return handleError(err, "Failed to update user profile");
      }
    },
    [user, db, handleError, resetError],
  );

  const getUserProfile = useCallback(async () => {
    if (!user || !db) return null;
    resetError();
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : null;
    } catch (err) {
      return handleError(err, "Failed to load user profile");
    }
  }, [user, db, handleError, resetError]);

  const updateUserPreferences = useCallback(
    async (preferences) => {
      if (!user || !db) return null;
      resetError();
      try {
        await updateDoc(doc(db, "users", user.uid), {
          preferences,
          lastActive: serverTimestamp(),
        });
        return true;
      } catch (err) {
        return handleError(err, "Failed to update preferences");
      }
    },
    [user, db, handleError, resetError],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Projects
  // ─────────────────────────────────────────────────────────────────────────

  const createProject = useCallback(
    async (projectData) => {
      if (!user || !db) return null;
      resetError();
      try {
        const project = {
          userId: user.uid,
          title: projectData.title || "New Project",
          description: projectData.description || "",
          isArchived: false,
          conversationIds: [],
          documents: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        const ref = await addDoc(collection(db, "projects"), project);
        return { id: ref.id, ...project };
      } catch (err) {
        return handleError(err, "Failed to create project");
      }
    },
    [user, db, handleError, resetError],
  );

  const getProjects = useCallback(
    async (includeArchived = false) => {
      if (!user || !db) return [];
      resetError();
      try {
        const snapshot = await getDocs(
          query(collection(db, "projects"), where("userId", "==", user.uid)),
        );
        const projects = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        const filtered = includeArchived
          ? projects
          : projects.filter((p) => !p.isArchived);
        return sortByUpdatedAt(filtered);
      } catch (err) {
        return handleError(err, "Failed to load projects");
      }
    },
    [user, db, handleError, resetError],
  );

  const getProject = useCallback(
    async (projectId) => {
      if (!user || !db) return null;
      resetError();
      try {
        const projectDoc = await getDoc(doc(db, "projects", projectId));
        if (!projectDoc.exists()) return null;
        const data = projectDoc.data();
        if (data.userId !== user.uid) throw new Error("Access denied");
        return { id: projectDoc.id, ...data };
      } catch (err) {
        return handleError(err, "Failed to load project");
      }
    },
    [user, db, handleError, resetError],
  );

  const updateProject = useCallback(
    async (projectId, updates) => {
      if (!user || !db) return null;
      resetError();
      try {
        await updateDoc(doc(db, "projects", projectId), {
          ...updates,
          updatedAt: serverTimestamp(),
        });
        return true;
      } catch (err) {
        return handleError(err, "Failed to update project");
      }
    },
    [user, db, handleError, resetError],
  );

  const toggleArchiveProject = useCallback(
    async (projectId, isArchived) => {
      if (!user || !db) return null;
      resetError();
      try {
        await updateDoc(doc(db, "projects", projectId), {
          isArchived: Boolean(isArchived),
          updatedAt: serverTimestamp(),
        });
        return true;
      } catch (err) {
        return handleError(err, "Failed to archive project");
      }
    },
    [user, db, handleError, resetError],
  );

  const deleteProject = useCallback(
    async (projectId) => {
      if (!user || !db) return null;
      resetError();
      try {
        const projectRef = doc(db, "projects", projectId);
        const projectDoc = await getDoc(projectRef);
        if (!projectDoc.exists()) throw new Error("Project not found");

        const conversationIds = projectDoc.data().conversationIds || [];

        // Delete all messages first (while parent conversations still exist
        // so Firestore security rules can verify ownership).
        for (const convId of conversationIds) {
          const msgSnap = await getDocs(
            collection(db, `conversations/${convId}/messages`),
          );
          if (!msgSnap.empty)
            await batchDelete(
              db,
              msgSnap.docs.map((d) => d.ref),
            );
        }

        // Then delete conversations + project.
        await batchDelete(db, [
          ...conversationIds.map((id) => doc(db, "conversations", id)),
          projectRef,
        ]);

        return true;
      } catch (err) {
        return handleError(err, "Failed to delete project");
      }
    },
    [user, db, handleError, resetError],
  );

  const addConversationToProject = useCallback(
    async (projectId, conversationId) => {
      if (!user || !db) return null;
      resetError();
      try {
        const projectRef = doc(db, "projects", projectId);
        const projectDoc = await getDoc(projectRef);
        if (!projectDoc.exists()) return null;

        const currentIds = projectDoc.data().conversationIds || [];
        if (!currentIds.includes(conversationId)) {
          await updateDoc(projectRef, {
            conversationIds: [...currentIds, conversationId],
            updatedAt: serverTimestamp(),
          });
        }
        await updateDoc(doc(db, "conversations", conversationId), {
          projectId,
          updatedAt: serverTimestamp(),
        });
        return true;
      } catch (err) {
        return handleError(err, "Failed to add conversation to project");
      }
    },
    [user, db, handleError, resetError],
  );

  const removeConversationFromProject = useCallback(
    async (projectId, conversationId) => {
      if (!user || !db) return null;
      resetError();
      try {
        const projectRef = doc(db, "projects", projectId);
        const projectDoc = await getDoc(projectRef);
        if (!projectDoc.exists()) return null;

        await updateDoc(projectRef, {
          conversationIds: (projectDoc.data().conversationIds || []).filter(
            (id) => id !== conversationId,
          ),
          updatedAt: serverTimestamp(),
        });
        await updateDoc(doc(db, "conversations", conversationId), {
          projectId: null,
          updatedAt: serverTimestamp(),
        });
        return true;
      } catch (err) {
        return handleError(err, "Failed to remove conversation from project");
      }
    },
    [user, db, handleError, resetError],
  );

  const addDocumentToProject = useCallback(
    async (projectId, document) => {
      if (!user || !db) return null;
      resetError();
      try {
        const projectRef = doc(db, "projects", projectId);
        const projectDoc = await getDoc(projectRef);
        if (!projectDoc.exists()) return null;

        const newDoc = {
          id: doc(collection(db, "temp")).id,
          title: document.title,
          type: document.type,
          content: document.content,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };
        await updateDoc(projectRef, {
          documents: [...(projectDoc.data().documents || []), newDoc],
          updatedAt: serverTimestamp(),
        });
        return newDoc;
      } catch (err) {
        return handleError(err, "Failed to add document to project");
      }
    },
    [user, db, handleError, resetError],
  );

  const updateDocumentInProject = useCallback(
    async (projectId, documentId, updates) => {
      if (!user || !db) return null;
      resetError();
      try {
        const projectRef = doc(db, "projects", projectId);
        const projectDoc = await getDoc(projectRef);
        if (!projectDoc.exists()) return null;

        await updateDoc(projectRef, {
          documents: (projectDoc.data().documents || []).map((d) =>
            d.id === documentId
              ? { ...d, ...updates, updatedAt: Timestamp.now() }
              : d,
          ),
          updatedAt: serverTimestamp(),
        });
        return true;
      } catch (err) {
        return handleError(err, "Failed to update document");
      }
    },
    [user, db, handleError, resetError],
  );

  const removeDocumentFromProject = useCallback(
    async (projectId, documentId) => {
      if (!user || !db) return null;
      resetError();
      try {
        const projectRef = doc(db, "projects", projectId);
        const projectDoc = await getDoc(projectRef);
        if (!projectDoc.exists()) return null;

        await updateDoc(projectRef, {
          documents: (projectDoc.data().documents || []).filter(
            (d) => d.id !== documentId,
          ),
          updatedAt: serverTimestamp(),
        });
        return true;
      } catch (err) {
        return handleError(err, "Failed to remove document");
      }
    },
    [user, db, handleError, resetError],
  );

  const getProjectConversations = useCallback(
    async (projectId) => {
      if (!user || !db) return [];
      resetError();
      try {
        const projectDoc = await getDoc(doc(db, "projects", projectId));
        if (!projectDoc.exists()) return [];

        const ids = projectDoc.data().conversationIds || [];
        if (ids.length === 0) return [];

        const results = await Promise.all(
          ids.map(async (id) => {
            const d = await getDoc(doc(db, "conversations", id));
            return d.exists() ? { id: d.id, ...d.data() } : null;
          }),
        );
        return results.filter(Boolean);
      } catch (err) {
        return handleError(err, "Failed to load project conversations");
      }
    },
    [user, db, handleError, resetError],
  );

  const updateProjectMemory = useCallback(
    async (projectId, memories) => {
      if (!user || !db) return null;
      try {
        await updateDoc(doc(db, "projects", projectId), {
          memories,
          updatedAt: serverTimestamp(),
        });
        return true;
      } catch (err) {
        return handleError(err, "Failed to update project memories");
      }
    },
    [user, db, handleError],
  );

  const searchProjects = useCallback(
    async (searchTerm) => {
      if (!user || !db || !searchTerm) return [];
      resetError();
      try {
        const snapshot = await getDocs(
          query(collection(db, "projects"), where("userId", "==", user.uid)),
        );
        const term = searchTerm.toLowerCase();
        return snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter(
            (p) =>
              p.title?.toLowerCase().includes(term) ||
              p.description?.toLowerCase().includes(term),
          );
      } catch (err) {
        return handleError(err, "Failed to search projects");
      }
    },
    [user, db, handleError, resetError],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Conversations
  // ─────────────────────────────────────────────────────────────────────────

  const createConversation = useCallback(
    async (title = "New Chat", model = DEFAULT_MODEL) => {
      if (!user || !db) return null;
      resetError();
      try {
        const data = {
          userId: user.uid,
          title,
          model,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          messageCount: 0,
          isArchived: false,
        };
        const ref = await addDoc(collection(db, "conversations"), data);
        return { id: ref.id, ...data };
      } catch (err) {
        return handleError(err, "Failed to create conversation");
      }
    },
    [user, db, handleError, resetError],
  );

  const getConversations = useCallback(
    async (includeArchived = false, limitCount = 20) => {
      if (!user || !db) return [];
      resetError();
      try {
        const snapshot = await getDocs(
          query(
            collection(db, "conversations"),
            where("userId", "==", user.uid),
          ),
        );
        const all = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        const filtered = includeArchived
          ? all
          : all.filter((c) => !c.isArchived);
        return sortByUpdatedAt(filtered).slice(0, limitCount);
      } catch (err) {
        return handleError(err, "Failed to load conversations");
      }
    },
    [user, db, handleError, resetError],
  );

  const getConversation = useCallback(
    async (conversationId) => {
      if (!user || !db) return null;
      resetError();
      try {
        const convDoc = await getDoc(doc(db, "conversations", conversationId));
        if (!convDoc.exists()) return null;
        const data = convDoc.data();
        if (data.userId !== user.uid) throw new Error("Access denied");
        return { id: convDoc.id, ...data };
      } catch (err) {
        return handleError(err, "Failed to load conversation");
      }
    },
    [user, db, handleError, resetError],
  );

  const updateConversation = useCallback(
    async (conversationId, updates) => {
      if (!user || !db) return null;
      resetError();
      try {
        await updateDoc(doc(db, "conversations", conversationId), {
          ...updates,
          updatedAt: serverTimestamp(),
        });
        return true;
      } catch (err) {
        return handleError(err, "Failed to update conversation");
      }
    },
    [user, db, handleError, resetError],
  );

  const deleteConversation = useCallback(
    async (conversationId) => {
      if (!user || !db) return null;
      resetError();
      try {
        const batch = writeBatch(db);
        const msgSnap = await getDocs(
          collection(db, `conversations/${conversationId}/messages`),
        );
        msgSnap.forEach((d) => batch.delete(d.ref));
        batch.delete(doc(db, "conversations", conversationId));
        await batch.commit();
        return true;
      } catch (err) {
        return handleError(err, "Failed to delete conversation");
      }
    },
    [user, db, handleError, resetError],
  );

  const toggleArchiveConversation = useCallback(
    async (conversationId, isArchived = null) => {
      if (!user || !db) return null;
      resetError();
      try {
        const convRef = doc(db, "conversations", conversationId);
        if (isArchived === null) {
          const convDoc = await getDoc(convRef);
          if (!convDoc.exists()) throw new Error("Conversation not found");
          isArchived = !convDoc.data().isArchived;
        }
        await updateDoc(convRef, { isArchived, updatedAt: serverTimestamp() });
        return true;
      } catch (err) {
        return handleError(err, "Failed to archive conversation");
      }
    },
    [user, db, handleError, resetError],
  );

  const searchConversations = useCallback(
    async (searchTerm) => {
      if (!user || !db || !searchTerm) return [];
      resetError();
      try {
        const snapshot = await getDocs(
          query(
            collection(db, "conversations"),
            where("userId", "==", user.uid),
          ),
        );
        const term = searchTerm.toLowerCase();
        return snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((c) => c.title?.toLowerCase().includes(term));
      } catch (err) {
        return handleError(err, "Failed to search conversations");
      }
    },
    [user, db, handleError, resetError],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Messages
  // ─────────────────────────────────────────────────────────────────────────

  const addMessage = useCallback(
    async (conversationId, messageData) => {
      if (!user || !db) return null;
      resetError();
      try {
        const batch = writeBatch(db);
        const messageRef = doc(
          collection(db, `conversations/${conversationId}/messages`),
        );
        const message = {
          role: messageData.role,
          content: messageData.content,
          model: messageData.model || DEFAULT_MODEL,
          timestamp: serverTimestamp(),
          metadata: messageData.metadata || {},
        };
        batch.set(messageRef, message);
        batch.update(doc(db, "conversations", conversationId), {
          updatedAt: serverTimestamp(),
          messageCount: (messageData.currentCount || 0) + 1,
        });
        await batch.commit();
        return { id: messageRef.id, ...message };
      } catch (err) {
        return handleError(err, "Failed to add message");
      }
    },
    [user, db, handleError, resetError],
  );

  const getMessages = useCallback(
    async (conversationId, limitCount = 50) => {
      if (!user || !db) return [];
      resetError();
      try {
        const snapshot = await getDocs(
          query(
            collection(db, `conversations/${conversationId}/messages`),
            orderBy("timestamp", "asc"),
            limit(limitCount),
          ),
        );
        return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      } catch (err) {
        return handleError(err, "Failed to load messages");
      }
    },
    [user, db, handleError, resetError],
  );

  const deleteMessage = useCallback(
    async (conversationId, messageId) => {
      if (!user || !db) return null;
      resetError();
      try {
        await deleteDoc(
          doc(db, `conversations/${conversationId}/messages`, messageId),
        );
        const convRef = doc(db, "conversations", conversationId);
        const convDoc = await getDoc(convRef);
        await updateDoc(convRef, {
          messageCount: Math.max(0, (convDoc.data()?.messageCount || 0) - 1),
          updatedAt: serverTimestamp(),
        });
        return true;
      } catch (err) {
        return handleError(err, "Failed to delete message");
      }
    },
    [user, db, handleError, resetError],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Realtime listeners
  // ─────────────────────────────────────────────────────────────────────────

  const subscribeToConversations = useCallback(
    (callback, includeArchived = false) => {
      if (!user || !db) return () => {};
      try {
        return onSnapshot(
          query(
            collection(db, "conversations"),
            where("userId", "==", user.uid),
          ),
          (snapshot) => {
            const all = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            const filtered = includeArchived
              ? all
              : all.filter((c) => !c.isArchived);
            callback(sortByUpdatedAt(filtered));
          },
          (err) => handleError(err, "Conversation listener error"),
        );
      } catch (err) {
        handleError(err, "Failed to create conversation listener");
        return () => {};
      }
    },
    [user, db, handleError],
  );

  const subscribeToArchivedConversations = useCallback(
    (callback) => {
      if (!user || !db) return () => {};
      try {
        return onSnapshot(
          query(
            collection(db, "conversations"),
            where("userId", "==", user.uid),
          ),
          (snapshot) => {
            const archived = snapshot.docs
              .map((d) => ({ id: d.id, ...d.data() }))
              .filter((c) => c.isArchived === true);
            callback(sortByUpdatedAt(archived));
          },
          (err) => handleError(err, "Archived conversation listener error"),
        );
      } catch (err) {
        handleError(err, "Failed to create archive listener");
        return () => {};
      }
    },
    [user, db, handleError],
  );

  const subscribeToConversation = useCallback(
    (conversationId, callback) => {
      if (!user || !db) return () => {};
      try {
        return onSnapshot(
          doc(db, "conversations", conversationId),
          (snapshot) => {
            if (!snapshot.exists()) return;
            const data = snapshot.data();
            if (data.userId !== user.uid) return;
            callback({ id: snapshot.id, ...data });
          },
          (err) => handleError(err, "Single conversation listener error"),
        );
      } catch (err) {
        handleError(err, "Failed to create conversation listener");
        return () => {};
      }
    },
    [user, db, handleError],
  );

  const subscribeToProjects = useCallback(
    (callback, includeArchived = false) => {
      if (!user || !db) return () => {};
      try {
        return onSnapshot(
          query(collection(db, "projects"), where("userId", "==", user.uid)),
          (snapshot) => {
            const all = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            const filtered = includeArchived
              ? all
              : all.filter((p) => !p.isArchived);
            callback(sortByUpdatedAt(filtered));
          },
          (err) => handleError(err, "Project listener error"),
        );
      } catch (err) {
        handleError(err, "Failed to create project listener");
        return () => {};
      }
    },
    [user, db, handleError],
  );

  const subscribeToMessages = useCallback(
    (conversationId, callback) => {
      if (!user || !db) return () => {};
      try {
        return onSnapshot(
          query(
            collection(db, `conversations/${conversationId}/messages`),
            orderBy("timestamp", "asc"),
          ),
          (snapshot) =>
            callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))),
          (err) => handleError(err, "Message listener error"),
        );
      } catch (err) {
        handleError(err, "Failed to create message listener");
        return () => {};
      }
    },
    [user, db, handleError],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Context value
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <DatabaseContext.Provider
      value={{
        // State
        error,
        resetError,
        userProfile,

        // User
        updateUserProfile,
        getUserProfile,
        updateUserPreferences,

        // Projects
        createProject,
        getProjects,
        getProject,
        updateProject,
        toggleArchiveProject,
        deleteProject,
        addConversationToProject,
        removeConversationFromProject,
        addDocumentToProject,
        updateDocumentInProject,
        removeDocumentFromProject,
        getProjectConversations,
        updateProjectMemory,
        searchProjects,

        // Conversations
        createConversation,
        getConversations,
        getConversation,
        updateConversation,
        deleteConversation,
        toggleArchiveConversation,
        searchConversations,

        // Messages
        addMessage,
        getMessages,
        deleteMessage,

        // Realtime listeners
        subscribeToMessages,
        subscribeToConversation,
        subscribeToConversations,
        subscribeToArchivedConversations,
        subscribeToProjects,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
}
