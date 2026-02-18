"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/config";
import type { User, AuthContextType, RegisterData, UserRole } from "@/types/user";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { toast } from "sonner";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserData(session.user);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await loadUserData(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (authUser: SupabaseUser) => {
    try {
      const { data: userData, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (error) throw error;

      if (userData) {
        setUser({
          uid: userData.id,
          email: userData.email,
          displayName: userData.full_name || "",
          phone: userData.phone_number || "",
          role: userData.role as UserRole,
          friends: [],
          trustScore: 50,
          privacySettings: {
            showAttendance: true,
            allowSquadInvites: true,
            shareLocation: false,
          },
          createdAt: new Date(userData.created_at),
          updatedAt: new Date(userData.updated_at),
        });
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      toast.error("Failed to load user data");
    }
  };

  const register = async (data: RegisterData) => {
    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.displayName,
            phone_number: data.phone,
            role: data.role,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // User profile is automatically created by database trigger
        toast.success("Account created successfully!");
        
        // Note: If email confirmation is required, user needs to verify email first
        if (authData.session) {
          await loadUserData(authData.user);
        } else {
          toast.info("Please check your email to verify your account");
        }
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      if (err.message?.includes("already registered")) {
        toast.error("Email already in use");
      } else {
        toast.error("Failed to create account. Please try again.");
      }
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        toast.success("Welcome back!");
        await loadUserData(data.user);
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      if (err.message?.includes("Invalid") || err.message?.includes("credentials")) {
        toast.error("Invalid email or password");
      } else {
        toast.error("Failed to login. Please try again.");
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout");
      throw error;
    }
  };

  const updateUserRole = async (role: UserRole) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("users")
        .update({ role, updated_at: new Date().toISOString() })
        .eq("id", user.uid);

      if (error) throw error;

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
