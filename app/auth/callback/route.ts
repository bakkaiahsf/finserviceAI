import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  console.log('Auth callback - code:', code ? 'present' : 'missing');
  console.log('Auth callback - next:', next);

  if (code) {
    try {
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value;
            },
            set(name: string, value: string, options: CookieOptions) {
              try {
                cookieStore.set({ name, value, ...options });
              } catch (error) {
                console.log('Cookie set error (can be ignored):', error);
              }
            },
            remove(name: string, options: CookieOptions) {
              try {
                cookieStore.set({ name, value: '', ...options });
              } catch (error) {
                console.log('Cookie remove error (can be ignored):', error);
              }
            },
          },
        }
      );

      console.log('Auth callback - exchanging code for session');
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error && data.session) {
        console.log('Auth callback - success, redirecting to:', next);
        const forwardedHost = request.headers.get('x-forwarded-host');
        const isLocalEnv = process.env.NODE_ENV === 'development';
        
        const redirectUrl = isLocalEnv ? `${origin}${next}` : 
                          forwardedHost ? `https://${forwardedHost}${next}` : 
                          `${origin}${next}`;

        console.log('Auth callback - redirect URL:', redirectUrl);
        return NextResponse.redirect(redirectUrl);
      }

      console.error('Auth callback - error exchanging code:', error);
      return NextResponse.redirect(`${origin}/signin?error=authentication_failed&message=${encodeURIComponent(error?.message || 'Failed to authenticate')}`);
    } catch (err) {
      console.error('Auth callback - unexpected error:', err);
      return NextResponse.redirect(`${origin}/signin?error=unexpected_error&message=${encodeURIComponent('An unexpected error occurred')}`);
    }
  }

  console.log('Auth callback - no code provided');
  return NextResponse.redirect(`${origin}/signin?error=no_code&message=${encodeURIComponent('No authentication code provided')}`);
}