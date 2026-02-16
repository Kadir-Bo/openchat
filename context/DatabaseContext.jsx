"use client";

import { createContext, useContext, useState, useCallback } from "react";
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
  startAfter,
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
  const [error, setError] = useState(null);
  const db = getFirebaseDB();

  // ==================== HELPER FUNCTIONS ====================

  const handleError = useCallback((error, customMessage) => {
    console.error(customMessage, error);
    setError(error.message || customMessage);
    return null;
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  // ==================== USER OPERATIONS ====================

  /* Erstellt oder aktualisiert ein User-Profil */
  const createOrUpdateUser = useCallback(
    async (userData) => {
      if (!user || !db) return null;
      setLoading(true);
      resetError();

      try {
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);

        const data = {
          email: user.email,
          displayName: user.displayName || userData.displayName || null,
          photoURL: user.photoURL || userData.photoURL || null,
          preferences: {
            theme: "dark",
            defaultModel: "gpt-oss",
            language: "de",
            ...userData.preferences,
          },
          usage: {
            totalMessages: 0,
            lastReset: serverTimestamp(),
          },
          lastActive: serverTimestamp(),
        };

        if (userDoc.exists()) {
          // Update existing user
          await updateDoc(userRef, {
            ...data,
            updatedAt: serverTimestamp(),
          });
        } else {
          // Create new user
          await setDoc(userRef, {
            ...data,
            createdAt: serverTimestamp(),
          });
        }

        return { id: user.uid, ...data };
      } catch (err) {
        return handleError(
          err,
          "Fehler beim Erstellen/Aktualisieren des Users",
        );
      } finally {
        setLoading(false);
      }
    },
    [user, db, handleError, resetError],
  );

  /* Lädt User-Profil */
  const getUserProfile = useCallback(async () => {
    if (!user || !db) return null;
    setLoading(true);
    resetError();

    try {
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() };
      }
      return null;
    } catch (err) {
      return handleError(err, "Fehler beim Laden des User-Profils");
    } finally {
      setLoading(false);
    }
  }, [user, db, handleError, resetError]);

  /* Aktualisiert User-Präferenzen */
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
        return handleError(err, "Fehler beim Aktualisieren der Präferenzen");
      } finally {
        setLoading(false);
      }
    },
    [user, db, handleError, resetError],
  );

  // ==================== PROJECT OPERATIONS ====================

  /* Erstellt ein neues Projekt */
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

        console.log(" Projekt erstellt mit ID:", projectRef.id);

        return { id: projectRef.id, ...project };
      } catch (err) {
        return handleError(err, "Fehler beim Erstellen des Projekts");
      } finally {
        setLoading(false);
      }
    },
    [user, db, handleError, resetError],
  );

  /* Lädt alle Projekte eines Users */
  const getProjects = useCallback(
    async (includeArchived = false) => {
      if (!user || !db) return [];
      setLoading(true);
      resetError();

      try {
        let q = query(
          collection(db, "projects"),
          where("userId", "==", user.uid),
          orderBy("updatedAt", "desc"),
        );

        if (!includeArchived) {
          q = query(
            collection(db, "projects"),
            where("userId", "==", user.uid),
            where("isArchived", "==", false),
            orderBy("updatedAt", "desc"),
          );
        }

        const snapshot = await getDocs(q);
        const projects = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        return projects;
      } catch (err) {
        return handleError(err, "Fehler beim Laden der Projekte");
      } finally {
        setLoading(false);
      }
    },
    [user, db, handleError, resetError],
  );

  /* Lädt ein einzelnes Projekt */
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
          // Security check
          if (data.userId !== user.uid) {
            throw new Error("Unauthorized access");
          }
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

  /* Aktualisiert ein Projekt */
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

  /* Archiviert/Dearchiviert ein Projekt */
  const toggleArchiveProject = useCallback(
    async (projectId, isArchived) => {
      if (!user || !db) return null;
      setLoading(true);
      resetError();

      try {
        const projectRef = doc(db, "projects", projectId);
        await updateDoc(projectRef, {
          isArchived,
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

  /* Löscht ein Projekt */
  const deleteProject = useCallback(
    async (projectId) => {
      if (!user || !db) return null;
      setLoading(true);
      resetError();

      try {
        const projectRef = doc(db, "projects", projectId);
        await deleteDoc(projectRef);
        return true;
      } catch (err) {
        return handleError(err, "Fehler beim Löschen des Projekts");
      } finally {
        setLoading(false);
      }
    },
    [user, db, handleError, resetError],
  );

  /* Fügt eine Conversation zu einem Projekt hinzu */
  const addConversationToProject = useCallback(
    async (projectId, conversationId) => {
      if (!user || !db) return null;
      setLoading(true);
      resetError();

      try {
        const projectRef = doc(db, "projects", projectId);
        const projectDoc = await getDoc(projectRef);

        if (projectDoc.exists()) {
          const currentConversations = projectDoc.data().conversationIds || [];

          // Prüfe ob Conversation bereits im Projekt ist
          if (!currentConversations.includes(conversationId)) {
            await updateDoc(projectRef, {
              conversationIds: [...currentConversations, conversationId],
              updatedAt: serverTimestamp(),
            });
          }

          // Update auch die Conversation mit der Projekt-Referenz
          const conversationRef = doc(db, "conversations", conversationId);
          await updateDoc(conversationRef, {
            projectId: projectId,
            updatedAt: serverTimestamp(),
          });

          return true;
        }
        return null;
      } catch (err) {
        return handleError(
          err,
          "Fehler beim Hinzufügen der Conversation zum Projekt",
        );
      } finally {
        setLoading(false);
      }
    },
    [user, db, handleError, resetError],
  );

  /* Entfernt eine Conversation aus einem Projekt */
  const removeConversationFromProject = useCallback(
    async (projectId, conversationId) => {
      if (!user || !db) return null;
      setLoading(true);
      resetError();

      try {
        const projectRef = doc(db, "projects", projectId);
        const projectDoc = await getDoc(projectRef);

        if (projectDoc.exists()) {
          const currentConversations = projectDoc.data().conversationIds || [];
          const updatedConversations = currentConversations.filter(
            (id) => id !== conversationId,
          );

          await updateDoc(projectRef, {
            conversationIds: updatedConversations,
            updatedAt: serverTimestamp(),
          });

          // Entferne auch die Projekt-Referenz von der Conversation
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

  /* Fügt ein Dokument zu einem Projekt hinzu */
  const addDocumentToProject = useCallback(
    async (projectId, document) => {
      if (!user || !db) return null;
      setLoading(true);
      resetError();

      try {
        const projectRef = doc(db, "projects", projectId);
        const projectDoc = await getDoc(projectRef);

        if (projectDoc.exists()) {
          const currentDocuments = projectDoc.data().documents || [];

          const newDocument = {
            id: doc(collection(db, "temp")).id, // Generiere eine ID
            title: document.title,
            type: document.type, // z.B. 'text', 'markdown', 'code'
            content: document.content,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          };

          await updateDoc(projectRef, {
            documents: [...currentDocuments, newDocument],
            updatedAt: serverTimestamp(),
          });

          return newDocument;
        }
        return null;
      } catch (err) {
        return handleError(
          err,
          "Fehler beim Hinzufügen des Dokuments zum Projekt",
        );
      } finally {
        setLoading(false);
      }
    },
    [user, db, handleError, resetError],
  );

  /* Aktualisiert ein Dokument in einem Projekt */
  const updateDocumentInProject = useCallback(
    async (projectId, documentId, updates) => {
      if (!user || !db) return null;
      setLoading(true);
      resetError();

      try {
        const projectRef = doc(db, "projects", projectId);
        const projectDoc = await getDoc(projectRef);

        if (projectDoc.exists()) {
          const currentDocuments = projectDoc.data().documents || [];
          const updatedDocuments = currentDocuments.map((doc) =>
            doc.id === documentId
              ? {
                  ...doc,
                  ...updates,
                  updatedAt: Timestamp.now(),
                }
              : doc,
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

  /* Entfernt ein Dokument aus einem Projekt */
  const removeDocumentFromProject = useCallback(
    async (projectId, documentId) => {
      if (!user || !db) return null;
      setLoading(true);
      resetError();

      try {
        const projectRef = doc(db, "projects", projectId);
        const projectDoc = await getDoc(projectRef);

        if (projectDoc.exists()) {
          const currentDocuments = projectDoc.data().documents || [];
          const updatedDocuments = currentDocuments.filter(
            (doc) => doc.id !== documentId,
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

  /* Lädt alle Conversations eines Projekts */
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

          // Lade alle Conversations
          const conversations = await Promise.all(
            conversationIds.map(async (convId) => {
              const convRef = doc(db, "conversations", convId);
              const convDoc = await getDoc(convRef);
              return convDoc.exists()
                ? { id: convDoc.id, ...convDoc.data() }
                : null;
            }),
          );

          return conversations.filter((conv) => conv !== null);
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

  /* Sucht Projekte nach Name */
  const searchProjects = useCallback(
    async (searchTerm) => {
      if (!user || !db || !searchTerm) return [];
      setLoading(true);
      resetError();

      try {
        const q = query(
          collection(db, "projects"),
          where("userId", "==", user.uid),
          orderBy("updatedAt", "desc"),
        );

        const snapshot = await getDocs(q);
        const projects = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter(
            (project) =>
              project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              project.description
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase()),
          );

        return projects;
      } catch (err) {
        return handleError(err, "Fehler beim Suchen der Projekte");
      } finally {
        setLoading(false);
      }
    },
    [user, db, handleError, resetError],
  );

  /* Real-time Listener für Projekte */
  const subscribeToProjects = useCallback(
    (callback, includeArchived = false) => {
      if (!user || !db) return () => {};

      try {
        let q = query(
          collection(db, "projects"),
          where("userId", "==", user.uid),
          orderBy("updatedAt", "desc"),
        );

        if (!includeArchived) {
          q = query(
            collection(db, "projects"),
            where("userId", "==", user.uid),
            where("isArchived", "==", false),
            orderBy("updatedAt", "desc"),
          );
        }

        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const projects = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            callback(projects);
          },
          (err) => {
            handleError(err, "Fehler beim Real-time Update der Projekte");
          },
        );

        return unsubscribe;
      } catch (err) {
        handleError(err, "Fehler beim Erstellen des Projekt-Listeners");
        return () => {};
      }
    },
    [user, db, handleError],
  );

  // ==================== CONVERSATION OPERATIONS ====================

  /* Erstellt eine neue Conversation */
  const createConversation = useCallback(
    async (title = "New Chat", model = "gpt-oss") => {
      if (!user || !db) {
        console.error("User oder DB nicht verfügbar:", {
          user: !!user,
          db: !!db,
        });
        return null;
      }

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

        console.log("Conversation erstellt mit ID:", conversationRef.id);

        return { id: conversationRef.id, ...conversationData };
      } catch (err) {
        console.error("Fehler beim Erstellen:", err);
        return handleError(err, "Fehler beim Erstellen der Conversation");
      } finally {
        setLoading(false);
      }
    },
    [user, db, handleError, resetError],
  );

  /* Lädt alle Conversations eines Users */
  const getConversations = useCallback(
    async (includeArchived = false, limitCount = 20, lastDoc = null) => {
      if (!user || !db) return [];
      setLoading(true);
      resetError();

      try {
        let q = query(
          collection(db, "conversations"),
          where("userId", "==", user.uid),
          orderBy("updatedAt", "desc"),
          limit(limitCount),
        );

        if (!includeArchived) {
          q = query(
            collection(db, "conversations"),
            where("userId", "==", user.uid),
            where("isArchived", "==", false),
            orderBy("updatedAt", "desc"),
            limit(limitCount),
          );
        }

        if (lastDoc) {
          q = query(q, startAfter(lastDoc));
        }

        const snapshot = await getDocs(q);
        const conversations = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        return conversations;
      } catch (err) {
        return handleError(err, "Fehler beim Laden der Conversations");
      } finally {
        setLoading(false);
      }
    },
    [user, db, handleError, resetError],
  );

  /* Lädt eine einzelne Conversation */
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
          // Security check
          if (data.userId !== user.uid) {
            throw new Error("Unauthorized access");
          }
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

  /* Aktualisiert eine Conversation */
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

  /* Löscht eine Conversation und alle zugehörigen Messages */
  const deleteConversation = useCallback(
    async (conversationId) => {
      if (!user || !db) return null;
      setLoading(true);
      resetError();

      try {
        const batch = writeBatch(db);

        // Lösche alle Messages
        const messagesRef = collection(
          db,
          `conversations/${conversationId}/messages`,
        );
        const messagesSnapshot = await getDocs(messagesRef);
        messagesSnapshot.forEach((doc) => {
          batch.delete(doc.ref);
        });

        // Lösche Conversation
        const conversationRef = doc(db, "conversations", conversationId);
        batch.delete(conversationRef);

        await batch.commit();
        return true;
      } catch (err) {
        return handleError(err, "Fehler beim Löschen der Conversation");
      } finally {
        setLoading(false);
      }
    },
    [user, db, handleError, resetError],
  );

  /* Archiviert/Dearchiviert eine Conversation */
  const toggleArchiveConversation = useCallback(
    async (conversationId, isArchived = null) => {
      if (!user || !db) return null;
      setLoading(true);
      resetError();

      try {
        const conversationRef = doc(db, "conversations", conversationId);

        // Wenn isArchived nicht übergeben wird, lade den aktuellen Status und toggle ihn
        if (isArchived === null) {
          const conversationDoc = await getDoc(conversationRef);
          if (conversationDoc.exists()) {
            const currentStatus = conversationDoc.data().isArchived || false;
            isArchived = !currentStatus;
          } else {
            throw new Error("Conversation nicht gefunden");
          }
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

  // ==================== MESSAGE OPERATIONS ====================

  /* Fügt eine Message zu einer Conversation hinzu */
  const addMessage = useCallback(
    async (conversationId, messageData) => {
      if (!user || !db) return null;
      setLoading(true);
      resetError();

      try {
        const batch = writeBatch(db);

        // Füge Message hinzu
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

        // Update Conversation
        const conversationRef = doc(db, "conversations", conversationId);
        batch.update(conversationRef, {
          updatedAt: serverTimestamp(),
          messageCount: (messageData.currentCount || 0) + 1,
        });

        await batch.commit();

        return { id: messageRef.id, ...message };
      } catch (err) {
        return handleError(err, "Fehler beim Hinzufügen der Message");
      } finally {
        setLoading(false);
      }
    },
    [user, db, handleError, resetError],
  );

  /* Lädt alle Messages einer Conversation */
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
        const messages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        return messages;
      } catch (err) {
        return handleError(err, "Fehler beim Laden der Messages");
      } finally {
        setLoading(false);
      }
    },
    [user, db, handleError, resetError],
  );

  /* Real-time Listener für Messages */
  const subscribeToMessages = useCallback(
    (conversationId, callback) => {
      if (!user || !db) return () => {};

      try {
        const messagesRef = collection(
          db,
          `conversations/${conversationId}/messages`,
        );
        const q = query(messagesRef, orderBy("timestamp", "asc"));

        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const messages = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            callback(messages);
          },
          (err) => {
            handleError(err, "Fehler beim Real-time Update der Messages");
          },
        );

        return unsubscribe;
      } catch (err) {
        handleError(err, "Fehler beim Erstellen des Message-Listeners");
        return () => {};
      }
    },
    [user, db, handleError],
  );

  /* Real-time Listener für Conversations */
  const subscribeToArchivedConversations = useCallback(
    (callback) => {
      if (!user || !db) return () => {};

      try {
        const q = query(
          collection(db, "conversations"),
          where("userId", "==", user.uid),
          where("isArchived", "==", true),
          orderBy("updatedAt", "desc"),
        );

        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const conversations = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            callback(conversations);
          },
          (err) => {
            handleError(
              err,
              "Fehler beim Real-time Update der archivierten Conversations",
            );
          },
        );

        return unsubscribe;
      } catch (err) {
        handleError(
          err,
          "Fehler beim Erstellen des Archived-Conversation-Listeners",
        );
        return () => {};
      }
    },
    [user, db, handleError],
  );
  const subscribeToConversations = useCallback(
    (callback, includeArchived = false) => {
      if (!user || !db) return () => {};

      try {
        let q = query(
          collection(db, "conversations"),
          where("userId", "==", user.uid),
          orderBy("updatedAt", "desc"),
        );

        if (!includeArchived) {
          q = query(
            collection(db, "conversations"),
            where("userId", "==", user.uid),
            where("isArchived", "==", false),
            orderBy("updatedAt", "desc"),
          );
        }

        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const conversations = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            callback(conversations);
          },
          (err) => {
            handleError(err, "Fehler beim Real-time Update der Conversations");
          },
        );

        return unsubscribe;
      } catch (err) {
        handleError(err, "Fehler beim Erstellen des Conversation-Listeners");
        return () => {};
      }
    },
    [user, db, handleError],
  );

  /* Löscht eine einzelne Message */
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

        // Update messageCount
        const conversationRef = doc(db, "conversations", conversationId);
        const conversationDoc = await getDoc(conversationRef);
        const currentCount = conversationDoc.data()?.messageCount || 0;

        await updateDoc(conversationRef, {
          messageCount: Math.max(0, currentCount - 1),
          updatedAt: serverTimestamp(),
        });

        return true;
      } catch (err) {
        return handleError(err, "Fehler beim Löschen der Message");
      } finally {
        setLoading(false);
      }
    },
    [user, db, handleError, resetError],
  );

  // ==================== SEARCH & FILTER ====================

  /* Sucht Conversations nach Titel */
  const searchConversations = useCallback(
    async (searchTerm) => {
      if (!user || !db || !searchTerm) return [];
      setLoading(true);
      resetError();

      try {
        const q = query(
          collection(db, "conversations"),
          where("userId", "==", user.uid),
          orderBy("updatedAt", "desc"),
        );

        const snapshot = await getDocs(q);
        const conversations = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((conv) =>
            conv.title.toLowerCase().includes(searchTerm.toLowerCase()),
          );

        return conversations;
      } catch (err) {
        return handleError(err, "Fehler beim Suchen der Conversations");
      } finally {
        setLoading(false);
      }
    },
    [user, db, handleError, resetError],
  );

  const values = {
    // State
    loading,
    error,
    resetError,

    // User Operations
    createOrUpdateUser,
    getUserProfile,
    updateUserPreferences,

    // Project Operations
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
    searchProjects,

    // Conversation Operations
    createConversation,
    getConversations,
    getConversation,
    updateConversation,
    deleteConversation,
    toggleArchiveConversation,
    searchConversations,

    // Message Operations
    addMessage,
    getMessages,
    deleteMessage,

    // Real-time Subscriptions
    subscribeToMessages,
    subscribeToConversations,
    subscribeToProjects,
    subscribeToArchivedConversations,
  };

  return (
    <DatabaseContext.Provider value={values}>
      {children}
    </DatabaseContext.Provider>
  );
}
