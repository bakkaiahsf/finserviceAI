import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/supabase'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  if (code) {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (sessionError) {
        console.error('Session exchange error:', sessionError)
        return NextResponse.redirect(new URL('/auth/error?message=session_error', request.url))
      }

      if (session?.user) {
        // Check if user profile exists
        const { data: existingProfile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('id', session.user.id)
          .single()

        // Create or update user profile with enhanced data
        if (!existingProfile) {
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              id: session.user.id,
              email: session.user.email!,
              full_name: session.user.user_metadata?.full_name || 
                        session.user.user_metadata?.name || 
                        session.user.email?.split('@')[0],
              avatar_url: session.user.user_metadata?.avatar_url || 
                         session.user.user_metadata?.picture,
              role: 'viewer', // Default role for new users
              organization: session.user.user_metadata?.hd || null, // Google Workspace domain
            })

          if (profileError) {
            console.error('Profile creation error:', profileError)
            // Don't block login for profile creation issues
          }
        }

        // Log successful authentication for audit trail
        try {
          await supabase
            .from('audit_logs')
            .insert({
              user_id: session.user.id,
              action: 'login',
              resource_type: 'auth',
              details: {
                method: 'google_oauth',
                ip_address: request.ip,
                user_agent: request.headers.get('user-agent'),
              }
            })
        } catch (err) {
          console.error('Audit log error:', err)
        }
      }

      // Successful authentication - redirect to intended destination
      const redirectUrl = new URL(next, request.url)
      return NextResponse.redirect(redirectUrl)

    } catch (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(new URL('/auth/error?message=callback_error', request.url))
    }
  }

  // No code provided - redirect to login
  return NextResponse.redirect(new URL('/auth/login', request.url))
}