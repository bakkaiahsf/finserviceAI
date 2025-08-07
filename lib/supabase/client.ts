import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Client-side Supabase client
export const createSupabaseClient = () => {
  return createClientComponentClient<Database>()
}

// Service role client for admin operations
export const createServiceClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Real-time subscriptions helper
export const subscribeToCompanyUpdates = (
  companyId: string,
  callback: (data: any) => void
) => {
  const supabase = createSupabaseClient()

  return supabase
    .channel('company-updates')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'companies',
        filter: `id=eq.${companyId}`,
      },
      callback
    )
    .subscribe()
}