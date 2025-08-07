'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/auth-helpers-nextjs'
import { createSupabaseClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export interface UserProfile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  role: 'admin' | 'compliance_officer' | 'analyst' | 'viewer'
  organization?: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createSupabaseClient()

  useEffect(() => {
    let mounted = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!mounted) return

        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchUserProfile(session.user.id)
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log('Auth state changed:', event, !!session?.user)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await fetchUserProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching user profile:', error)
        // Create a basic profile if one doesn't exist
        setProfile({
          id: userId,
          email: user?.email || '',
          role: 'viewer'
        })
      } else if (profile) {
        setProfile(profile)
      } else {
        // No profile exists, create a basic one
        setProfile({
          id: userId,
          email: user?.email || '',
          role: 'viewer'
        })
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error)
      // Fallback profile
      setProfile({
        id: userId,
        email: user?.email || '',
        role: 'viewer'
      })
    } finally {
      setLoading(false)
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
        },
      })

      if (error) {
        throw error
      }
    } catch (error) {
      console.error('Error signing in with Google:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw error
      }
      
      setUser(null)
      setProfile(null)
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
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
        throw error
      }

      setProfile(data)
      return data
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  }

  const hasRole = (requiredRole: UserProfile['role']): boolean => {
    if (!profile) return false

    const roleHierarchy = {
      viewer: 1,
      analyst: 2,
      compliance_officer: 3,
      admin: 4,
    }

    const userRoleLevel = roleHierarchy[profile.role]
    const requiredRoleLevel = roleHierarchy[requiredRole]

    return userRoleLevel >= requiredRoleLevel
  }

  const canAccess = (resource: string): boolean => {
    if (!profile) return false

    // Define access rules based on roles
    const accessRules: Record<string, UserProfile['role'][]> = {
      'companies.read': ['viewer', 'analyst', 'compliance_officer', 'admin'],
      'companies.write': ['analyst', 'compliance_officer', 'admin'],
      'companies.delete': ['compliance_officer', 'admin'],
      'users.manage': ['admin'],
      'system.admin': ['admin'],
      'reports.generate': ['analyst', 'compliance_officer', 'admin'],
      'ai.process': ['analyst', 'compliance_officer', 'admin'],
    }

    const allowedRoles = accessRules[resource]
    return allowedRoles ? allowedRoles.includes(profile.role) : false
  }

  return {
    user,
    profile,
    loading,
    signInWithGoogle,
    signOut,
    updateProfile,
    hasRole,
    canAccess,
    isAuthenticated: !!user,
    isAdmin: profile?.role === 'admin',
    isComplianceOfficer: profile?.role === 'compliance_officer',
    isAnalyst: profile?.role === 'analyst',
  }
}