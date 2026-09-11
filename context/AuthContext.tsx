'use client';

import React, { createContext, useContext, useEffect, useState, useTransition } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface UserProfile {
  id: string;
  auth_user_id?: string | null;
  name: string;
  student_id?: string;
  role: string;
  email: string;
  phone?: string;
  avatar_bg: string;
  initials: string;
  bio: string;
  skills: string[];
  is_team_leader: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isConfigured: boolean;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  isTeamLeader: boolean;
  errorMessage: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const VGU_EMAIL_DOMAIN = '@student.vgu.edu.vn';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const clearError = () => setErrorMessage(null);

  // Fetch profile for a given auth user
  const fetchProfile = async (authUser: User) => {
    if (!isSupabaseConfigured) return null;
    try {
      // Check domain
      if (authUser.email && !authUser.email.toLowerCase().endsWith(VGU_EMAIL_DOMAIN)) {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setErrorMessage(`Access restricted: Please sign in with your official VGU institutional account (${VGU_EMAIL_DOMAIN}).`);
        return null;
      }

      // First query by auth_user_id
      let { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .maybeSingle();

      // If not linked yet, query by email and link
      if (!data && authUser.email) {
        const { data: emailMatch } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', authUser.email)
          .maybeSingle();

        if (emailMatch) {
          await supabase
            .from('profiles')
            .update({ auth_user_id: authUser.id })
            .eq('id', emailMatch.id);
          data = { ...emailMatch, auth_user_id: authUser.id };
        }
      }

      if (data) {
        setProfile(data as UserProfile);
        return data as UserProfile;
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
    return null;
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      startTransition(() => {
        if (session?.user) {
          setUser(session.user);
          fetchProfile(session.user).finally(() => setLoading(false));
        } else {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      });
    });

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      startTransition(() => {
        if (session?.user) {
          setUser(session.user);
          fetchProfile(session.user);
        } else {
          setUser(null);
          setProfile(null);
        }
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase is not configured.') };
    }
    try {
      clearError();
      const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/` : undefined;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            hd: 'student.vgu.edu.vn',
            prompt: 'select_account',
          },
        },
      });
      return { error: error ? new Error(error.message) : null };
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  const signInWithPassword = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase is not configured.') };
    }
    clearError();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.endsWith(VGU_EMAIL_DOMAIN)) {
      return { error: new Error(`Access restricted: Please use your official VGU student email (${VGU_EMAIL_DOMAIN}).`) };
    }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (error) return { error: new Error(error.message) };
      if (data.user) {
        setUser(data.user);
        await fetchProfile(data.user);
      }
      return { error: null };
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase is not configured.') };
    }
    clearError();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.endsWith(VGU_EMAIL_DOMAIN)) {
      return { error: new Error(`Access restricted: Please use your official VGU student email (${VGU_EMAIL_DOMAIN}).`) };
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: { full_name: name.trim() },
        },
      });
      if (error) return { error: new Error(error.message) };
      if (data.user) {
        setUser(data.user);
        await fetchProfile(data.user);
      }
      return { error: null };
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  const signOut = async () => {
    if (!isSupabaseConfigured) {
      setUser(null);
      setProfile(null);
      return;
    }
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!profile) return { error: new Error('No active profile') };
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', profile.id);

        if (error) throw error;
      }
      setProfile((prev) => (prev ? { ...prev, ...updates } : null));
      return { error: null };
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  const isTeamLeader = Boolean(profile?.is_team_leader);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isConfigured: isSupabaseConfigured,
        signInWithGoogle,
        signInWithPassword,
        signUpWithEmail,
        signOut,
        updateProfile,
        isTeamLeader,
        errorMessage,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
