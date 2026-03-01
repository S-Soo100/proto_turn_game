import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile } from '@/types/database'
import { supabase } from '@/lib/supabase'

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  isLoading: boolean

  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (isLoading: boolean) => void
  signOut: () => void
  updateProfile: (updates: Partial<Pick<Profile, 'username'>>) => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  isLoading: true,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
  signOut: () => set({ user: null, session: null, profile: null }),

  updateProfile: async (updates) => {
    const profile = get().profile
    if (!profile) throw new Error('No profile')

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profile.id)

    if (error) throw error

    set({ profile: { ...profile, ...updates } })
  },
}))
