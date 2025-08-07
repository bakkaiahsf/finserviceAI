'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/auth-helpers-nextjs'
import { createSupabaseClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export interface UserProfile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  role: 'admin' | 'compliance_officer' | 'analyst' | 'viewer'
  organization?: string
  created_at?: string
  updated_at?: string
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  isAuthenticated: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<UserProfile | null>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  
  const router = useRouter()
  const supabase = createSupabaseClient()

  // Initialize auth state
  useEffect(() => {
    if (initialized) return

    let isMounted = true

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          if (isMounted) {
            setLoading(false)
            setInitialized(true)
          }
          return
        }

        if (isMounted) {
          setSession(initialSession)
          setUser(initialSession?.user ?? null)

          if (initialSession?.user) {
            await fetchUserProfile(initialSession.user.id)
          } else {
            setProfile(null)
          }
          
          setLoading(false)
          setInitialized(true)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (isMounted) {
          setLoading(false)
          setInitialized(true)
        }
      }
    }

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isMounted) return

        console.log('Auth state changed:', event, !!newSession?.user)
        
        setSession(newSession)
        setUser(newSession?.user ?? null)

        if (newSession?.user) {
          await fetchUserProfile(newSession.user.id)
        } else {
          setProfile(null)
          // Only redirect on explicit sign out
          if (event === 'SIGNED_OUT') {
            router.push('/auth/login')
          }
        }

        if (!initialized) {
          setLoading(false)
          setInitialized(true)
        }
      }
    )

    initializeAuth()

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [initialized, supabase, router])

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user profile:', error)
        // Create fallback profile
        const fallbackProfile: UserProfile = {
          id: userId,
          email: user?.email || '',
          role: 'viewer'
        }
        setProfile(fallbackProfile)
      } else if (profile) {
        setProfile(profile)
      } else {
        // No profile exists, create a basic one
        const basicProfile: UserProfile = {
          id: userId,
          email: user?.email || '',
          role: 'viewer'
        }
        setProfile(basicProfile)
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error)
      // Fallback profile
      const fallbackProfile: UserProfile = {
        id: userId,
        email: user?.email || '',
        role: 'viewer'
      }
      setProfile(fallbackProfile)
    }
  }

  const signInWithGoogle = async () => {
    try {
      const redirectUrl = process.env.NEXT_PUBLIC_APP_URL 
        ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
        : `${window.location.origin}/auth/callback`

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        },
      })

      if (error) {
        console.error('Google sign in error:', error)
        throw error
      }
    } catch (error) {
      console.error('Error signing in with Google:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Sign out error:', error)
        throw error
      }
      
      // Clear local state
      setUser(null)
      setProfile(null)
      setSession(null)
      
      // Redirect will happen in auth state change handler
    } catch (error) {
      console.error('Error signing out:', error)
      setLoading(false)
      throw error
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>): Promise<UserProfile | null> => {
    if (!user || !profile) {
      throw new Error('No user logged in')
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Update profile error:', error)
        throw error
      }

      const updatedProfile = data as UserProfile
      setProfile(updatedProfile)
      return updatedProfile
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  }

  const refreshSession = async () => {
    try {
      const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession()
      if (error) {
        console.error('Error refreshing session:', error)
        throw error
      }
      setSession(refreshedSession)
    } catch (error) {
      console.error('Error refreshing session:', error)
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    isAuthenticated: !!user && !!session,
    signInWithGoogle,
    signOut,
    updateProfile,
    refreshSession,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}