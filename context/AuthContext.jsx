"use client";

import { createContext, useContext, useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "firebase/auth";
import { getFirebaseAuth, getAuthErrorMessage } from "@/lib";

export const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const auth = getFirebaseAuth();

  // Listen to auth state changes
  useEffect(() => {
    if (!auth) return null;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) setUsername(user.displayName || user.email);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Sign up with email and password
  const signUp = async (email, password) => {
    try {
      setError(null);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      return userCredential.user;
    } catch (error) {
      const userFriendlyMessage = getAuthErrorMessage(error);
      setError(userFriendlyMessage);
    }
  };

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      setError(null);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      return userCredential.user;
    } catch (error) {
      const userFriendlyMessage = getAuthErrorMessage(error);
      setError(userFriendlyMessage);
      throw new Error(userFriendlyMessage);
    }
  };

  // Sign out
  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
    } catch (error) {
      const userFriendlyMessage = getAuthErrorMessage(error);
      setError(userFriendlyMessage);
      throw new Error(userFriendlyMessage);
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
      return {
        success: true,
        message: "Password reset email sent! Check your inbox.",
      };
    } catch (error) {
      const userFriendlyMessage = getAuthErrorMessage(error);
      setError(userFriendlyMessage);
      throw new Error(userFriendlyMessage);
    }
  };

  const values = {
    user,
    username,
    loading,
    error,
    signUp,
    signIn,
    logout,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={values}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
