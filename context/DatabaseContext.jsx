"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { getFirebaseDB } from "@/lib/firebase/config";
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

export const DatabaseContext = createContext(null);

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error("useDatabase must be used within a DatabaseProvider");
  }
  return context;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

// Sorts documents by updatedAt descending.
// Firestore serverTimestamp() resolves to null on the client until the server
// confirms it (pending write). Treating null as Infinity pins those docs to
// the top so a newly created item never jumps around when the timestamp lands.
const sortByUpdatedAt = (arr) =>
  [...arr].sort((a, b) => {
    const toMs = (v) => {
      if (v == null) return Infinity; // pending serverTimestamp → sort first
      if (typeof v.toDate === "function") return v.toDate().getTime();
      const ms = new Date(v).getTime();
      return isNaN(ms) ? Infinity : ms;
    };
    return toMs(b.updatedAt) - toMs(a.updatedAt);
  });

// FIX: replaced a single shared `loading` state with a per-call local setter.
// The old global setLoading(true/false) pattern caused the entire context
// (and every consumer, including Sidebar) to re-render on every DB operation,
// producing a cascade of unnecessary ChatListItem re-renders.
//
// Callers that need to track loading can do so with their own useState.
// The context still exposes a lightweight `withLoading` helper for any future
// operations that genuinely need a shared flag, but it is opt-in.

export default function DatabaseProvider({ children }) {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [error, setError] = useState(null);
  const db = getFirebaseDB();

  // ==================== HELPERS ====================

  const handleError = useCallback((error, customMessage) => {
    console.error(customMessage, error);
    setError(error.message || customMessage);
    return null;
  }, []);

  const resetError = useCallback(() => setError(null), []);

  // ==================== USER OPERATIONS ====================

  useEffect(() => {
    if (!user || !db) return;

    const initUserProfile = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          const newProfile = {
            email: user.email,
            displayName: user.displayName || null,
            photoURL: user.photoURL || null,
            preferences: {
              theme: "dark",
              defaultModel: "openai/gpt-oss-120b",
              language: "de",
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
          await setDoc(userRef, newProfile);
          setUserProfile({ id: user.uid, ...newProfile });
        } else {
          await updateDoc(userRef, { lastActive: serverTimestamp() });
          setUserProfile({ id: userDoc.id, ...userDoc.data() });
        }
      } catch (err) {
        console.error("Error initializing user profile:", err);
      }
    };

    initUserProfile();
  }, [user, db]);

  const updateUserProfile = useCallback(
    async (userData) => {
      if (!user || !db) return null;
      resetError();
      try {
        const userRef = doc(db, "users", user.uid);
        const updates = {
          ...(userData.displayName !== undefined && {
            displayName: userData.displayName,
          }),
          ...(userData.photoURL !== undefined && {
            photoURL: userData.photoURL,
          }),
          ...(userData.preferences && { preferences: userData.preferences }),
          ...(userData.memories !== undefined && {
            memories: userData.memories,
          }),
          lastActive: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await updateDoc(userRef, updates);
        setUserProfile((prev) => ({ ...prev, ...updates }));
        return { id: user.uid, ...updates };
      } catch (err) {
        return handleError(err, "Error updating user profile");
      }
    },
    [user, db, handleError, resetError],
  );

  const getUserProfile = useCallback(async () => {
    if (!user || !db) return null;
    resetError();
    try {
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : null;
    } catch (err) {
      return handleError(err, "Error loading user profile");
    }
  }, [user, db, handleError, resetError]);

  const updateUserPreferences = useCallback(
    async (preferences) => {
      if (!user || !db) return null;
      resetError();
      try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          preferences,
          lastActive: serverTimestamp(),
        });
        return true;
      } catch (err) {
        return handleError(err, "Error updating preferences");
      }
    },
    [user, db, handleError, resetError],
  );

  // ==================== PROJECT OPERATIONS ====================

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
        const projectRef = await addDoc(collection(db, "projects"), project);
        return { id: projectRef.id, ...project };
      } catch (err) {
        return handleError(err, "Error creating project");
      }
    },
    [user, db, handleError, resetError],
  );

  const getProjects = useCallback(
    async (includeArchived = false) => {
      if (!user || !db) return [];
      resetError();
      try {
        const q = query(
          collection(db, "projects"),
          where("userId", "==", user.uid),
        );
        const snapshot = await getDocs(q);
        const projects = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        const filtered = includeArchived
          ? projects
          : projects.filter((p) => !p.isArchived);
        return sortByUpdatedAt(filtered);
      } catch (err) {
        return handleError(err, "Error loading projects");
      }
    },
    [user, db, handleError, resetError],
  );

  const getProject = useCallback(
    async (projectId) => {
      if (!user || !db) return null;
      resetError();
      try {
        const projectRef = doc(db, "projects", projectId);
        const projectDoc = await getDoc(projectRef);
        if (projectDoc.exists()) {
          const data = projectDoc.data();
          if (data.userId !== user.uid) throw new Error("Access denied");
          return { id: projectDoc.id, ...data };
        }
        return null;
      } catch (err) {
        return handleError(err, "Error loading project");
      }
    },
    [user, db, handleError, resetError],
  );

  const updateProject = useCallback(
    async (projectId, updates) => {
      if (!user || !db) return null;
      resetError();
      try {
        const projectRef = doc(db, "projects", projectId);
        await updateDoc(projectRef, {
          ...updates,
          updatedAt: serverTimestamp(),
        });
        return true;
      } catch (err) {
        return handleError(err, "Error updating project");
      }
    },
    [user, db, handleError, resetError],
  );

  const toggleArchiveProject = useCallback(
    async (projectId, isArchived) => {
      if (!user || !db) return null;
      resetError();
      try {
        const projectRef = doc(db, "projects", projectId);
        await updateDoc(projectRef, {
          isArchived: Boolean(isArchived),
          updatedAt: serverTimestamp(),
        });
        return true;
      } catch (err) {
        return handleError(err, "Error archiving project");
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

        if (!projectDoc.exists()) {
          throw new Error("Project not found");
        }

        const conversationIds = projectDoc.data().conversationIds || [];

        // Step 1: delete all messages FIRST — while parent conversations still
        // exist so the Rule's get(conversation).userId check can succeed
        for (const convId of conversationIds) {
          const messagesSnapshot = await getDocs(
            collection(db, `conversations/${convId}/messages`),
          );
          if (!messagesSnapshot.empty) {
            const BATCH_SIZE = 499;
            const docs = messagesSnapshot.docs;
            for (let i = 0; i < docs.length; i += BATCH_SIZE) {
              const batch = writeBatch(db);
              docs.slice(i, i + BATCH_SIZE).forEach((d) => batch.delete(d.ref));
              await batch.commit();
            }
          }
        }

        // Step 2: delete conversations + project AFTER all messages are gone
        const refsToDelete = [
          ...conversationIds.map((id) => doc(db, "conversations", id)),
          projectRef,
        ];

        const BATCH_SIZE = 499;
        for (let i = 0; i < refsToDelete.length; i += BATCH_SIZE) {
          const batch = writeBatch(db);
          refsToDelete
            .slice(i, i + BATCH_SIZE)
            .forEach((ref) => batch.delete(ref));
          await batch.commit();
        }

        return true;
      } catch (err) {
        return handleError(err, "Error deleting project");
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
        if (projectDoc.exists()) {
          const currentIds = projectDoc.data().conversationIds || [];
          if (!currentIds.includes(conversationId)) {
            await updateDoc(projectRef, {
              conversationIds: [...currentIds, conversationId],
              updatedAt: serverTimestamp(),
            });
          }
          const conversationRef = doc(db, "conversations", conversationId);
          await updateDoc(conversationRef, {
            projectId,
            updatedAt: serverTimestamp(),
          });
          return true;
        }
        return null;
      } catch (err) {
        return handleError(err, "Error adding conversation to project");
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
        if (projectDoc.exists()) {
          const updatedIds = (projectDoc.data().conversationIds || []).filter(
            (id) => id !== conversationId,
          );
          await updateDoc(projectRef, {
            conversationIds: updatedIds,
            updatedAt: serverTimestamp(),
          });
          const conversationRef = doc(db, "conversations", conversationId);
          await updateDoc(conversationRef, {
            projectId: null,
            updatedAt: serverTimestamp(),
          });
          return true;
        }
        return null;
      } catch (err) {
        return handleError(err, "Error removing conversation from project");
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
        if (projectDoc.exists()) {
          const newDocument = {
            id: doc(collection(db, "temp")).id,
            title: document.title,
            type: document.type,
            content: document.content,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          };
          await updateDoc(projectRef, {
            documents: [...(projectDoc.data().documents || []), newDocument],
            updatedAt: serverTimestamp(),
          });
          return newDocument;
        }
        return null;
      } catch (err) {
        return handleError(err, "Error adding document to project");
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
        if (projectDoc.exists()) {
          const updatedDocuments = (projectDoc.data().documents || []).map(
            (d) =>
              d.id === documentId
                ? { ...d, ...updates, updatedAt: Timestamp.now() }
                : d,
          );
          await updateDoc(projectRef, {
            documents: updatedDocuments,
            updatedAt: serverTimestamp(),
          });
          return true;
        }
        return null;
      } catch (err) {
        return handleError(err, "Error updating document");
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
        if (projectDoc.exists()) {
          const updatedDocuments = (projectDoc.data().documents || []).filter(
            (d) => d.id !== documentId,
          );
          await updateDoc(projectRef, {
            documents: updatedDocuments,
            updatedAt: serverTimestamp(),
          });
          return true;
        }
        return null;
      } catch (err) {
        return handleError(err, "Error removing document");
      }
    },
    [user, db, handleError, resetError],
  );

  const getProjectConversations = useCallback(
    async (projectId) => {
      if (!user || !db) return [];
      resetError();
      try {
        const projectRef = doc(db, "projects", projectId);
        const projectDoc = await getDoc(projectRef);
        if (projectDoc.exists()) {
          const conversationIds = projectDoc.data().conversationIds || [];
          if (conversationIds.length === 0) return [];
          const conversations = await Promise.all(
            conversationIds.map(async (convId) => {
              const convDoc = await getDoc(doc(db, "conversations", convId));
              return convDoc.exists()
                ? { id: convDoc.id, ...convDoc.data() }
                : null;
            }),
          );
          return conversations.filter(Boolean);
        }
        return [];
      } catch (err) {
        return handleError(err, "Error loading project conversations");
      }
    },
    [user, db, handleError, resetError],
  );

  const updateProjectMemory = useCallback(
    async (projectId, memories) => {
      if (!user || !db) return null;
      try {
        const projectRef = doc(db, "projects", projectId);
        await updateDoc(projectRef, {
          memories,
          updatedAt: serverTimestamp(),
        });
        return true;
      } catch (err) {
        return handleError(err, "Error updating project memories");
      }
    },
    [user, db, handleError],
  );

  const searchProjects = useCallback(
    async (searchTerm) => {
      if (!user || !db || !searchTerm) return [];
      resetError();
      try {
        const q = query(
          collection(db, "projects"),
          where("userId", "==", user.uid),
        );
        const snapshot = await getDocs(q);
        return snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter(
            (p) =>
              p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              p.description?.toLowerCase().includes(searchTerm.toLowerCase()),
          );
      } catch (err) {
        return handleError(err, "Error searching projects");
      }
    },
    [user, db, handleError, resetError],
  );

  // ==================== CONVERSATION OPERATIONS ====================

  const createConversation = useCallback(
    async (title = "New Chat", model = "gpt-oss") => {
      if (!user || !db) return null;
      resetError();
      try {
        const conversationData = {
          userId: user.uid,
          title,
          model,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          messageCount: 0,
          isArchived: false,
        };
        const conversationRef = await addDoc(
          collection(db, "conversations"),
          conversationData,
        );
        return { id: conversationRef.id, ...conversationData };
      } catch (err) {
        return handleError(err, "Error creating conversation");
      }
    },
    [user, db, handleError, resetError],
  );

  const getConversations = useCallback(
    async (includeArchived = false, limitCount = 20) => {
      if (!user || !db) return [];
      resetError();
      try {
        const q = query(
          collection(db, "conversations"),
          where("userId", "==", user.uid),
        );
        const snapshot = await getDocs(q);
        const all = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        const filtered = includeArchived
          ? all
          : all.filter((c) => !c.isArchived);
        return sortByUpdatedAt(filtered).slice(0, limitCount);
      } catch (err) {
        return handleError(err, "Error loading conversations");
      }
    },
    [user, db, handleError, resetError],
  );

  const getConversation = useCallback(
    async (conversationId) => {
      if (!user || !db) return null;
      resetError();
      try {
        const conversationRef = doc(db, "conversations", conversationId);
        const conversationDoc = await getDoc(conversationRef);
        if (conversationDoc.exists()) {
          const data = conversationDoc.data();
          if (data.userId !== user.uid) throw new Error("Access denied");
          return { id: conversationDoc.id, ...data };
        }
        return null;
      } catch (err) {
        return handleError(err, "Error loading conversation");
      }
    },
    [user, db, handleError, resetError],
  );

  const updateConversation = useCallback(
    async (conversationId, updates) => {
      if (!user || !db) return null;
      resetError();
      try {
        const conversationRef = doc(db, "conversations", conversationId);
        await updateDoc(conversationRef, {
          ...updates,
          updatedAt: serverTimestamp(),
        });
        return true;
      } catch (err) {
        return handleError(err, "Error updating conversation");
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
        const messagesRef = collection(
          db,
          `conversations/${conversationId}/messages`,
        );
        const messagesSnapshot = await getDocs(messagesRef);
        messagesSnapshot.forEach((d) => batch.delete(d.ref));
        batch.delete(doc(db, "conversations", conversationId));
        await batch.commit();
        return true;
      } catch (err) {
        return handleError(err, "Error deleting conversation");
      }
    },
    [user, db, handleError, resetError],
  );

  const toggleArchiveConversation = useCallback(
    async (conversationId, isArchived = null) => {
      if (!user || !db) return null;
      resetError();
      try {
        const conversationRef = doc(db, "conversations", conversationId);
        if (isArchived === null) {
          const conversationDoc = await getDoc(conversationRef);
          if (!conversationDoc.exists())
            throw new Error("Conversation not found");
          isArchived = !conversationDoc.data().isArchived;
        }
        await updateDoc(conversationRef, {
          isArchived,
          updatedAt: serverTimestamp(),
        });
        return true;
      } catch (err) {
        return handleError(err, "Error archiving conversation");
      }
    },
    [user, db, handleError, resetError],
  );

  const searchConversations = useCallback(
    async (searchTerm) => {
      if (!user || !db || !searchTerm) return [];
      resetError();
      try {
        const q = query(
          collection(db, "conversations"),
          where("userId", "==", user.uid),
        );
        const snapshot = await getDocs(q);
        return snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((c) =>
            c.title?.toLowerCase().includes(searchTerm.toLowerCase()),
          );
      } catch (err) {
        return handleError(err, "Error searching conversations");
      }
    },
    [user, db, handleError, resetError],
  );

  // ==================== MESSAGE OPERATIONS ====================

  const addMessage = useCallback(
    async (conversationId, messageData) => {
      if (!user || !db) return null;
      resetError();
      try {
        const batch = writeBatch(db);
        const messagesRef = collection(
          db,
          `conversations/${conversationId}/messages`,
        );
        const messageRef = doc(messagesRef);
        const message = {
          role: messageData.role,
          content: messageData.content,
          model: messageData.model || "gpt-oss",
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
        return handleError(err, "Error adding message");
      }
    },
    [user, db, handleError, resetError],
  );

  const getMessages = useCallback(
    async (conversationId, limitCount = 50) => {
      if (!user || !db) return [];
      resetError();
      try {
        const messagesRef = collection(
          db,
          `conversations/${conversationId}/messages`,
        );
        const q = query(
          messagesRef,
          orderBy("timestamp", "asc"),
          limit(limitCount),
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      } catch (err) {
        return handleError(err, "Error loading messages");
      }
    },
    [user, db, handleError, resetError],
  );

  const deleteMessage = useCallback(
    async (conversationId, messageId) => {
      if (!user || !db) return null;
      resetError();
      try {
        const messageRef = doc(
          db,
          `conversations/${conversationId}/messages`,
          messageId,
        );
        await deleteDoc(messageRef);
        const conversationRef = doc(db, "conversations", conversationId);
        const conversationDoc = await getDoc(conversationRef);
        const currentCount = conversationDoc.data()?.messageCount || 0;
        await updateDoc(conversationRef, {
          messageCount: Math.max(0, currentCount - 1),
          updatedAt: serverTimestamp(),
        });
        return true;
      } catch (err) {
        return handleError(err, "Error deleting message");
      }
    },
    [user, db, handleError, resetError],
  );

  // ==================== REALTIME LISTENERS ====================

  // All user conversations — filtering and sorting client-side,
  // no composite Firestore index required.
  const subscribeToConversations = useCallback(
    (callback, includeArchived = false) => {
      if (!user || !db) return () => {};
      try {
        const q = query(
          collection(db, "conversations"),
          where("userId", "==", user.uid),
        );
        return onSnapshot(
          q,
          (snapshot) => {
            const all = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            const filtered = includeArchived
              ? all
              : all.filter((c) => !c.isArchived);
            callback(sortByUpdatedAt(filtered));
          },
          (err) => handleError(err, "Error in conversation realtime update"),
        );
      } catch (err) {
        handleError(err, "Error creating conversation listener");
        return () => {};
      }
    },
    [user, db, handleError],
  );

  const subscribeToArchivedConversations = useCallback(
    (callback) => {
      if (!user || !db) return () => {};
      try {
        const q = query(
          collection(db, "conversations"),
          where("userId", "==", user.uid),
        );
        return onSnapshot(
          q,
          (snapshot) => {
            const archived = snapshot.docs
              .map((d) => ({ id: d.id, ...d.data() }))
              .filter((c) => c.isArchived === true);
            callback(sortByUpdatedAt(archived));
          },
          (err) =>
            handleError(err, "Error in archived conversation realtime update"),
        );
      } catch (err) {
        handleError(err, "Error creating archive listener");
        return () => {};
      }
    },
    [user, db, handleError],
  );

  const subscribeToProjects = useCallback(
    (callback, includeArchived = false) => {
      if (!user || !db) return () => {};
      try {
        const q = query(
          collection(db, "projects"),
          where("userId", "==", user.uid),
        );
        return onSnapshot(
          q,
          (snapshot) => {
            const all = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            const filtered = includeArchived
              ? all
              : all.filter((p) => !p.isArchived);
            callback(sortByUpdatedAt(filtered));
          },
          (err) => handleError(err, "Error in project realtime update"),
        );
      } catch (err) {
        handleError(err, "Error creating project listener");
        return () => {};
      }
    },
    [user, db, handleError],
  );

  const subscribeToMessages = useCallback(
    (conversationId, callback) => {
      if (!user || !db) return () => {};
      try {
        const messagesRef = collection(
          db,
          `conversations/${conversationId}/messages`,
        );
        const q = query(messagesRef, orderBy("timestamp", "asc"));
        return onSnapshot(
          q,
          (snapshot) => {
            callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
          },
          (err) => handleError(err, "Error in message realtime update"),
        );
      } catch (err) {
        handleError(err, "Error creating message listener");
        return () => {};
      }
    },
    [user, db, handleError],
  );

  const values = {
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
    subscribeToConversations,
    subscribeToArchivedConversations,
    subscribeToProjects,
  };

  return (
    <DatabaseContext.Provider value={values}>
      {children}
    </DatabaseContext.Provider>
  );
}
