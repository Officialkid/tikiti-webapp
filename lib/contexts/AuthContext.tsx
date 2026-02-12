"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import type { User, AuthContextType, RegisterData, UserRole } from "@/types/user";
import { toast } from "sonner";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await setSessionCookie();
        await loadUserData(firebaseUser.uid);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadUserData = async (uid: string) => {
    if (!db) return;

    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUser({
          uid,
          ...userData,
          createdAt: userData.createdAt?.toDate?.() ?? new Date(),
          updatedAt: userData.updatedAt?.toDate?.() ?? new Date(),
        } as User);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      toast.error("Failed to load user data");
    }
  };

  const setSessionCookie = async () => {
    if (!auth?.currentUser) return;
    const token = await auth.currentUser.getIdToken(true);
    await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
  };

  const clearSessionCookie = async () => {
    await fetch("/api/auth/session", { method: "DELETE" });
  };

  const register = async (data: RegisterData) => {
    if (!auth || !db) throw new Error("Firebase not initialized");

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: data.email,
        displayName: data.displayName,
        phone: data.phone,
        role: data.role,
        friends: [],
        trustScore: 50,
        privacySettings: {
          showAttendance: true,
          allowSquadInvites: true,
          shareLocation: false,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await setSessionCookie();
      toast.success("Account created successfully!");
      await loadUserData(userCredential.user.uid);
    } catch (error: unknown) {
      const err = error as { code?: string };
      if (err.code === "auth/email-already-in-use") {
        toast.error("Email already in use");
      } else {
        toast.error("Failed to create account. Please try again.");
      }
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase not initialized");

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      await setSessionCookie();
      toast.success("Welcome back!");
      await loadUserData(userCredential.user.uid);
    } catch (error: unknown) {
      const err = error as { code?: string };
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        toast.error("Invalid email or password");
      } else {
        toast.error("Failed to login. Please try again.");
      }
      throw error;
    }
  };

  const logout = async () => {
    if (!auth) return;

    try {
      await signOut(auth);
      await clearSessionCookie();
      setUser(null);
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout");
      throw error;
    }
  };

  const updateUserRole = async (role: UserRole) => {
    if (!user || !db) return;

    try {
      await setDoc(
        doc(db, "users", user.uid),
        { role, updatedAt: new Date() },
        { merge: true }
      );
      setUser({ ...user, role });
      toast.success(`Switched to ${role} mode`);
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to switch role");
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateUserRole,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
