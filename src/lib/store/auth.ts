import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient } from '@/lib/supabase/client';

export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateUsername: (username: string) => void;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ ok: boolean; error?: string }>;
  syncFromSupabase: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: (user) => set({ user, isAuthenticated: true }),

      logout: async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        set({ user: null, isAuthenticated: false });
      },

      updateUsername: async (username: string) => {
        const { user } = get();
        if (!user) return;

        const supabase = createClient();
        await supabase
          .from('profiles')
          .update({ username, updated_at: new Date().toISOString() })
          .eq('id', user.id);

        set({ user: { ...user, username } });
      },

      updatePassword: async (currentPassword: string, newPassword: string): Promise<{ ok: boolean; error?: string }> => {
        if (newPassword.length < 6) {
          return { ok: false, error: 'New password must be at least 6 characters.' };
        }
        const supabase = createClient();
        // Re-authenticate to verify current password
        const { data: { user: sbUser } } = await supabase.auth.getUser();
        if (!sbUser?.email) return { ok: false, error: 'Not logged in.' };

        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: sbUser.email,
          password: currentPassword,
        });
        if (signInErr) return { ok: false, error: 'Current password is incorrect.' };

        const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
        if (updateErr) return { ok: false, error: updateErr.message };

        return { ok: true };
      },

      syncFromSupabase: async () => {
        const supabase = createClient();
        const { data: { user: sbUser } } = await supabase.auth.getUser();
        if (!sbUser) {
          set({ user: null, isAuthenticated: false });
          return;
        }

        // Try to get profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, email')
          .eq('id', sbUser.id)
          .single();

        if (profile) {
          set({
            user: {
              id: sbUser.id,
              username: profile.username,
              email: profile.email,
              avatar_url: sbUser.user_metadata?.avatar_url,
            },
            isAuthenticated: true,
          });
        } else {
          // Profile doesn't exist yet — upsert it (happens on first Google login)
          const baseName =
            sbUser.user_metadata?.full_name?.replace(/\s+/g, '') ||
            sbUser.user_metadata?.name?.replace(/\s+/g, '') ||
            sbUser.email?.split('@')[0] ||
            'Player';
          const username = `${baseName}_${Math.random().toString(36).slice(2, 6)}`;

          await supabase.from('profiles').upsert({
            id: sbUser.id,
            username,
            email: sbUser.email!,
            updated_at: new Date().toISOString(),
          });

          set({
            user: {
              id: sbUser.id,
              username,
              email: sbUser.email!,
              avatar_url: sbUser.user_metadata?.avatar_url,
            },
            isAuthenticated: true,
          });
        }
      },
    }),
    {
      name: 'bingo-auth-storage',
      // Only persist user + isAuthenticated; syncFromSupabase is re-run on mount
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
