'use client';

import React, { createContext, useContext, useEffect, useState, useTransition } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { resolveUserIdentifier, VGU_STUDENT_DOMAIN } from '@/lib/authUtils';

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
  signInWithPassword: (usernameOrEmail: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, name: string, secretKey: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  isTeamLeader: boolean;
  errorMessage: string | null;
  clearError: () => void;
  canEditNote: (targetMemberId: string) => boolean;
  canEditTaskStatus: (targetMemberId: string) => boolean;
  canMoveTask: (task: { assigneeIds?: string[] }, portalMemberId?: string) => { allowed: boolean; reason?: string };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const VGU_EMAIL_DOMAIN = `@${VGU_STUDENT_DOMAIN}`;
export const TEAM_SECRET_KEY = '676767';

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
        } else {
          const fallbackName = (authUser.user_metadata?.full_name as string) || authUser.email.split('@')[0];
          const resolved = resolveUserIdentifier(authUser.email);
          const metadataStudentId = (authUser.user_metadata?.student_id as string) || resolved.studentId || '';

          const newProfile = {
            auth_user_id: authUser.id,
            name: fallbackName,
            email: authUser.email,
            student_id: metadataStudentId,
            initials: fallbackName.slice(0, 2).toUpperCase(),
            role: '',
            bio: '',
            skills: [],
            phone: null,
            is_team_leader: false,
          };
          const { data: inserted } = await supabase
            .from('profiles')
            .insert(newProfile)
            .select()
            .single();
          data = inserted || newProfile;
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
    }).catch((err) => {
      console.error('getSession error:', err);
      setUser(null);
      setProfile(null);
      setLoading(false);
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

  const signInWithPassword = async (usernameOrEmail: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase is not configured.') };
    }
    clearError();

    const identity = resolveUserIdentifier(usernameOrEmail);
    if (!identity.email) {
      return { error: new Error('Please enter your Student ID, VGU email, or Gmail address.') };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: identity.email,
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

  const signUpWithEmail = async (
    emailOrId: string,
    password: string,
    name: string,
    secretKey: string
  ) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase is not configured.') };
    }
    clearError();

    // Verify Secret Key
    if (secretKey.trim() !== TEAM_SECRET_KEY) {
      return {
        error: new Error('Invalid Secret Key. Please check with your team coordinator.'),
      };
    }

    const identity = resolveUserIdentifier(emailOrId);
    if (!identity.email) {
      return {
        error: new Error('Please enter a valid Student ID, VGU email, or Gmail address.'),
      };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: identity.email,
        password,
        options: {
          data: {
            full_name: name.trim(),
            student_id: identity.studentId || '',
          },
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

  // Permission helper: only the author or team leader can edit a note
  const canEditNote = (targetMemberId: string): boolean => {
    if (!user) return false;
    if (profile?.is_team_leader) return true;
    return (profile && profile.id === targetMemberId) || user.id === targetMemberId;
  };

  // Permission helper: only the assignee or team leader can change their own progress
  const canEditTaskStatus = (targetMemberId: string): boolean => {
    if (!user) return false;
    if (profile?.is_team_leader) return true;
    return (profile && profile.id === targetMemberId) || user.id === targetMemberId;
  };

  // Smart Task Access Permission helper:
  // - Unauthenticated users cannot move tasks
  // - Team Leader can move any task on any board
  // - On shared boards (no portalMemberId), any authenticated team member can drag tasks
  // - On personal portals (portalMemberId provided), only that member, task assignees, or Team Leader can move tasks
  const canMoveTask = (task: { assigneeIds?: string[] }, portalMemberId?: string): { allowed: boolean; reason?: string } => {
    if (!user) {
      return { allowed: false, reason: 'Authentication required: please sign in to move tasks.' };
    }
    if (profile?.is_team_leader) {
      return { allowed: true };
    }
    if (portalMemberId && portalMemberId !== 'all') {
      const isOwnPortal = (profile && profile.id === portalMemberId) || user.id === portalMemberId;
      const isAssignee = Array.isArray(task.assigneeIds) && (
        (profile && task.assigneeIds.includes(profile.id)) || task.assigneeIds.includes(user.id)
      );
      if (isOwnPortal || isAssignee) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: 'Personal portal: Only this member, task assignees, or Team Leader can modify deliverables here.'
      };
    }
    // Shared boards (/tasks, /lectures): All authenticated team members are trusted collaborators
    return { allowed: true };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isConfigured: isSupabaseConfigured,
        signInWithPassword,
        signUpWithEmail,
        signOut,
        updateProfile,
        isTeamLeader,
        errorMessage,
        clearError,
        canEditNote,
        canEditTaskStatus,
        canMoveTask,
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
