import { createServerSupabaseClient } from '@/lib/auth/supabase-client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createServerSupabaseClient();
    
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(`${requestUrl.origin}/sign-in?error=auth_error`);
    }
  }

  // Redirect to the dashboard after successful authentication
  return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
}