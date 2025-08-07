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
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await fetchUserProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
      } else {
        setProfile(profile)
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error)
    } finally {
      setLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
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