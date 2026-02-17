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

export default function DatabaseProvider({ children }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [error, setError] = useState(null);
  const db = getFirebaseDB();

  // ==================== HILFSFUNKTIONEN ====================

  const handleError = useCallback((error, customMessage) => {
    console.error(customMessage, error);
    setError(error.message || customMessage);
    return null;
  }, []);

  const resetError = useCallback(() => setError(null), []);

  // Sortiert Dokumente nach updatedAt absteigend
  const sortByUpdatedAt = (arr) =>
    [...arr].sort((a, b) => {
      const toMs = (v) => v?.toDate?.().getTime() ?? new Date(v).getTime();
      return toMs(b.updatedAt) - toMs(a.updatedAt);
    });

  // ==================== USER OPERATIONEN ====================

  // Erstellt das User-Profil beim ersten Login automatisch
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
        console.error("Fehler beim Initialisieren des User-Profils:", err);
      }
    };

    initUserProfile();
  }, [user, db]);

  const updateUserProfile = useCallback(
    async (userData) => {
      if (!user || !db) return null;
      setLoading(true);
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
        return handleError(err, "Fehler beim Aktualisieren des User-Profils");
      } finally {
        setLoading(false);
      }
    },
    [user, db, handleError, resetError],
  );

  const getUserProfile = useCallback(async () => {
    if (!user || !db) return null;
    setLoading(true);
    resetError();
    try {
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : null;
    } catch (err) {
      return handleError(err, "Fehler beim Laden des User-Profils");
    } finally {
      setLoading(false);
    }
  }, [user, db, handleError, resetError]);

  const updateUserPreferences = useCallback(
    async (preferences) => {
      if (!user || !db) return null;
      setLoading(true);
      resetError();
      try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          preferences,
          lastActive: serverTimestamp(),
        });
        return true;
      } catch (err) {
        return handleError(err, "Fehler beim Aktualisieren der Praeferenzen");
      } finally {
        setLoading(false);
      }
    },
    [user, db, handleError, resetError],
  );

  // ==================== PROJEKT OPERATIONEN ====================

  const createProject = useCallback(
    async (projectData) => {
      if (!user || !db) return null;
      setLoading(true);
      resetError();
      try {
        const project = {
          userId: user.uid,
          title: projectData.title || "Neues Projekt",
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
        return handleError(err, "Fehler beim Erstellen des Projekts");
      } finally {
        setLoading(false);
      }
    },
    [user, db, handleError, resetError],
  );

  const getProjects = useCallback(
    async (includeArchived = false) => {
      if (!user || !db) return [];
      setLoading(true);
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
        return handleError(err, "Fehler beim Laden der Projekte");
      } finally {
        setLoading(false);
      }
    },
    [user, db, handleError, resetError],
  );

  const getProject = useCallback(
    async (projectId) => {
      if (!user || !db) return null;
      setLoading(true);
      resetError();
      try {
        const projectRef = doc(db, "projects", projectId);
        const projectDoc = await getDoc(projectRef);
        if (projectDoc.exists()) {
          const data = projectDoc.data();
          if (data.userId !== user.uid) throw new Error("Kein Zugriff");
          return { id: projectDoc.id, ...data };
        }
        return null;
      } catch (err) {
        return handleError(err, "Fehler beim Laden des Projekts");
      } finally {
        setLoading(false);
      }
    },
    [user, db, handleError, resetError],
  );

  const updateProject = useCallback(
    async (projectId, updates) => {
      if (!user || !db) return null;
      setLoading(true);
      resetError();
      try {
        const projectRef = doc(db, "projects", projectId);
        await updateDoc(projectRef, {
          ...updates,
          updatedAt: serverTimestamp(),
        });
        return true;
      } catch (err) {
        return handleError(err, "Fehler beim Aktualisieren des Projekts");
      } finally {
        setLoading(false);
      }
    },
    [user, db, handleError, resetError],
  );

  // Archiviert oder dearchiviert ein Projekt
  const toggleArchiveProject = useCallback(
    async (projectId, isArchived) => {
      if (!user || !db) return null;
      setLoading(true);
      resetError();
      try {
        const projectRef = doc(db, "projects", projectId);
        await updateDoc(projectRef, {
          isArchived: Boolean(isArchived),
          updatedAt: serverTimestamp(),
        });
        return true;
      } catch (err) {
        return handleError(err, "Fehler beim Archivieren des Projekts");
      } finally {
        setLoading(false);
      }
    },
    [user, db, handleError, resetError],
  );

  // Loescht ein Projekt samt aller zugehoerigen Chats und deren Nachrichten
  const deleteProject = useCallback(
    async (projectId) => {
      if (!user || !db) return null;
      setLoading(true);
      resetError();
      try {
        const batch = writeBatch(db);
        const projectRef = doc(db, "projects", projectId);
        const projectDoc = await getDoc(projectRef);
        const conversationIds = projectDoc.exists()
          ? projectDoc.data().conversationIds || []
          : [];

        await Promise.all(
          conversationIds.map(async (convId) => {
            const messagesRef = collection(
              db,
              `conversations/${convId}/messages`,
            );
            const messagesSnapshot = await getDocs(messagesRef);
            messagesSnapshot.forEach((msgDoc) => batch.delete(msgDoc.ref));
            batch.delete(doc(db, "conversations", convId));
          }),
        );

        batch.delete(projectRef);
        await batch.commit();
        return true;
      } catch (err) {
        return handleError(err, "Fehler beim Loeschen des Projekts");
      } finally {
        setLoading(false);
      }
    },
    [user, db, handleError, resetError],
  );

  const addConversationToProject = useCallback(
    async (projectId, conversationId) => {
      if (!user || !db) return null;
      setLoading(true);
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
        return handleError(
          err,
          "Fehler beim Hinzufuegen der Conversation zum Projekt",
        );
      } finally {
        setLoading(false);
      }
    },
    [user, db, handleError, resetError],
  );

  const removeConversationFromProject = useCallback(
    async (projectId, conversationId) => {
      if (!user || !db) return null;
      setLoading(true);
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
        return handleError(
          err,
          "Fehler beim Entfernen der Conversation aus dem Projekt",
        );
      } finally {
        setLoading(false);
      }
    },
    [user, db, handleError, resetError],
  );

  const addDocumentToProject = useCallback(
    async (projectId, document) => {
      if (!user || !db) return null;
      setLoading(true);
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
        return handleError(
          err,
          "Fehler beim Hinzufuegen des Dokuments zum Projekt",
        );
      } finally {
        setLoading(false);
      }
    },
    [user, db, handleError, resetError],
  );

  const updateDocumentInProject = useCallback(
    async (projectId, documentId, updates) => {
      if (!user || !db) return null;
      setLoading(true);
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
        return handleError(err, "Fehler beim Aktualisieren des Dokuments");
      } finally {
        setLoading(false);
      }
    },
    [user, db, handleError, resetError],
  );

  const removeDocumentFromProject = useCallback(
    async (projectId, documentId) => {
      if (!user || !db) return null;
      setLoading(true);
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
        return handleError(err, "Fehler beim Entfernen des Dokuments");
      } finally {
        setLoading(false);
      }
    },
    [user, db, handleError, resetError],
  );

  const getProjectConversations = useCallback(
    async (projectId) => {
      if (!user || !db) return [];
      setLoading(true);
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
        return handleError(err, "Fehler beim Laden der Projekt-Conversations");
      } finally {
        setLoading(false);
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
        return handleError(
          err,
          "Fehler beim Aktualisieren der Projekt-Erinnerungen",
        );
      }
    },
    [user, db, handleError],
  );

  const searchProjects = useCallback(
    async (searchTerm) => {
      if (!user || !db || !searchTerm) return [];
      setLoading(true);
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
        return handleError(err, "Fehler beim Suchen der Projekte");
      } finally {
        setLoading(false);
      }
    },
    [user, db, handleError, resetError],
  );

  // ==================== CONVERSATION OPERATIONEN ====================

  const createConversation = useCallback(
    async (title = "New Chat", model = "gpt-oss") => {
      if (!user || !db) return null;
      setLoading(true);
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
        return handleError(err, "Fehler beim Erstellen der Conversation");
      } finally {
        setLoading(false);
      }
    },
    [user, db, handleError, resetError],
  );

  const getConversations = useCallback(
    async (includeArchived = false, limitCount = 20) => {
      if (!user || !db) return [];
      setLoading(true);
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
        return handleError(err, "Fehler beim Laden der Conversations");
      } finally {
        setLoading(false);
      }
    },
    [user, db, handleError, resetError],
  );

  const getConversation = useCallback(
    async (conversationId) => {
      if (!user || !db) return null;
      setLoading(true);
      resetError();
      try {
        const conversationRef = doc(db, "conversations", conversationId);
        const conversationDoc = await getDoc(conversationRef);
        if (conversationDoc.exists()) {
          const data = conversationDoc.data();
          if (data.userId !== user.uid) throw new Error("Kein Zugriff");
          return { id: conversationDoc.id, ...data };
        }
        return null;
      } catch (err) {
        return handleError(err, "Fehler beim Laden der Conversation");
      } finally {
        setLoading(false);
      }
    },
    [user, db, handleError, resetError],
  );

  const updateConversation = useCallback(
    async (conversationId, updates) => {
      if (!user || !db) return null;
      setLoading(true);
      resetError();
      try {
        const conversationRef = doc(db, "conversations", conversationId);
        await updateDoc(conversationRef, {
          ...updates,
          updatedAt: serverTimestamp(),
        });
        return true;
      } catch (err) {
        return handleError(err, "Fehler beim Aktualisieren der Conversation");
      } finally {
        setLoading(false);
      }
    },
    [user, db, handleError, resetError],
  );

  // Loescht eine Conversation samt aller Nachrichten
  const deleteConversation = useCallback(
    async (conversationId) => {
      if (!user || !db) return null;
      setLoading(true);
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
        return handleError(err, "Fehler beim Loeschen der Conversation");
      } finally {
        setLoading(false);
      }
    },
    [user, db, handleError, resetError],
  );

  // Archiviert oder dearchiviert eine Conversation
  const toggleArchiveConversation = useCallback(
    async (conversationId, isArchived = null) => {
      if (!user || !db) return null;
      setLoading(true);
      resetError();
      try {
        const conversationRef = doc(db, "conversations", conversationId);
        if (isArchived === null) {
          const conversationDoc = await getDoc(conversationRef);
          if (!conversationDoc.exists())
            throw new Error("Conversation nicht gefunden");
          isArchived = !conversationDoc.data().isArchived;
        }
        await updateDoc(conversationRef, {
          isArchived,
          updatedAt: serverTimestamp(),
        });
        return true;
      } catch (err) {
        return handleError(err, "Fehler beim Archivieren der Conversation");
      } finally {
        setLoading(false);
      }
    },
    [user, db, handleError, resetError],
  );

  const searchConversations = useCallback(
    async (searchTerm) => {
      if (!user || !db || !searchTerm) return [];
      setLoading(true);
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
        return handleError(err, "Fehler beim Suchen der Conversations");
      } finally {
        setLoading(false);
      }
    },
    [user, db, handleError, resetError],
  );

  // ==================== NACHRICHTEN OPERATIONEN ====================

  const addMessage = useCallback(
    async (conversationId, messageData) => {
      if (!user || !db) return null;
      setLoading(true);
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
        return handleError(err, "Fehler beim Hinzufuegen der Nachricht");
      } finally {
        setLoading(false);
      }
    },
    [user, db, handleError, resetError],
  );

  const getMessages = useCallback(
    async (conversationId, limitCount = 50) => {
      if (!user || !db) return [];
      setLoading(true);
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
        return handleError(err, "Fehler beim Laden der Nachrichten");
      } finally {
        setLoading(false);
      }
    },
    [user, db, handleError, resetError],
  );

  const deleteMessage = useCallback(
    async (conversationId, messageId) => {
      if (!user || !db) return null;
      setLoading(true);
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
        return handleError(err, "Fehler beim Loeschen der Nachricht");
      } finally {
        setLoading(false);
      }
    },
    [user, db, handleError, resetError],
  );

  // ==================== ECHTZEIT-LISTENER ====================

  // Alle Conversations des Users — Filterung und Sortierung client-seitig,
  // kein zusammengesetzter Firestore-Index erforderlich
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
          (err) =>
            handleError(err, "Fehler beim Echtzeit-Update der Conversations"),
        );
      } catch (err) {
        handleError(err, "Fehler beim Erstellen des Conversation-Listeners");
        return () => {};
      }
    },
    [user, db, handleError],
  );

  // Nur archivierte Conversations
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
            handleError(
              err,
              "Fehler beim Echtzeit-Update der archivierten Conversations",
            ),
        );
      } catch (err) {
        handleError(err, "Fehler beim Erstellen des Archiv-Listeners");
        return () => {};
      }
    },
    [user, db, handleError],
  );

  // Alle Projekte des Users — Filterung und Sortierung client-seitig
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
          (err) => handleError(err, "Fehler beim Echtzeit-Update der Projekte"),
        );
      } catch (err) {
        handleError(err, "Fehler beim Erstellen des Projekt-Listeners");
        return () => {};
      }
    },
    [user, db, handleError],
  );

  // Nachrichten einer Conversation in Echtzeit
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
          (err) =>
            handleError(err, "Fehler beim Echtzeit-Update der Nachrichten"),
        );
      } catch (err) {
        handleError(err, "Fehler beim Erstellen des Nachrichten-Listeners");
        return () => {};
      }
    },
    [user, db, handleError],
  );

  const values = {
    // State
    loading,
    error,
    resetError,
    userProfile,

    // User
    updateUserProfile,
    getUserProfile,
    updateUserPreferences,

    // Projekte
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

    // Chats
    createConversation,
    getConversations,
    getConversation,
    updateConversation,
    deleteConversation,
    toggleArchiveConversation,
    searchConversations,

    // Nachrichten
    addMessage,
    getMessages,
    deleteMessage,

    // Echtzeit-Listener
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
