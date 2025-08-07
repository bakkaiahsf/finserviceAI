'use client'

import { useEffect, useRef, useCallback } from 'react'
import { createClient, RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { useAuth } from '@/hooks/useAuth'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface RealTimeEvent {
  table: string
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new?: any
  old?: any
  timestamp: string
}

export interface UseRealTimeUpdatesOptions {
  tables?: string[]
  onEvent?: (event: RealTimeEvent) => void
  enabled?: boolean
}

export function useRealTimeUpdates(options: UseRealTimeUpdatesOptions = {}) {
  const { tables = [], onEvent, enabled = true } = options
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const channelsRef = useRef<Map<string, RealtimeChannel>>(new Map())
  const lastEventRef = useRef<string>('')

  const handleDatabaseChange = useCallback((
    payload: RealtimePostgresChangesPayload<any>,
    tableName: string
  ) => {
    const event: RealTimeEvent = {
      table: tableName,
      eventType: payload.eventType,
      new: payload.new,
      old: payload.old,
      timestamp: new Date().toISOString(),
    }

    // Deduplicate events (sometimes Supabase sends duplicate events)
    const eventHash = `${tableName}-${payload.eventType}-${JSON.stringify(payload.new || payload.old)}`
    if (lastEventRef.current === eventHash) {
      return
    }
    lastEventRef.current = eventHash

    // Call custom event handler
    onEvent?.(event)

    // Handle different table updates
    handleTableUpdate(event)
  }, [onEvent])

  const handleTableUpdate = useCallback((event: RealTimeEvent) => {
    const { table, eventType, new: newRecord, old: oldRecord } = event

    switch (table) {
      case 'companies':
        handleCompaniesUpdate(eventType, newRecord, oldRecord)
        break
      case 'persons':
        handlePersonsUpdate(eventType, newRecord, oldRecord)
        break
      case 'relationships':
        handleRelationshipsUpdate(eventType, newRecord, oldRecord)
        break
      case 'ai_processing_jobs':
        handleAIJobsUpdate(eventType, newRecord, oldRecord)
        break
      case 'user_activities':
        handleUserActivitiesUpdate(eventType, newRecord, oldRecord)
        break
      default:
        console.log(`Unhandled real-time update for table: ${table}`)
    }
  }, [queryClient])

  const handleCompaniesUpdate = useCallback((
    eventType: string,
    newRecord: any,
    oldRecord: any
  ) => {
    // Invalidate company search queries
    queryClient.invalidateQueries({ queryKey: ['companySearch'] })
    
    // Invalidate specific company queries
    if (newRecord?.company_number || oldRecord?.company_number) {
      const companyNumber = newRecord?.company_number || oldRecord?.company_number
      queryClient.invalidateQueries({ queryKey: ['company', companyNumber] })
      queryClient.invalidateQueries({ queryKey: ['companyOfficers', companyNumber] })
      queryClient.invalidateQueries({ queryKey: ['companyPSCs', companyNumber] })
    }

    // Show notification for important changes
    if (eventType === 'UPDATE' && newRecord?.company_status !== oldRecord?.company_status) {
      toast.success(`Company ${newRecord.company_name} status updated to ${newRecord.company_status}`, {
        duration: 5000,
      })
    }
  }, [queryClient])

  const handlePersonsUpdate = useCallback((
    eventType: string,
    newRecord: any,
    oldRecord: any
  ) => {
    // Invalidate person-related queries
    queryClient.invalidateQueries({ queryKey: ['persons'] })
    
    if (newRecord?.id || oldRecord?.id) {
      const personId = newRecord?.id || oldRecord?.id
      queryClient.invalidateQueries({ queryKey: ['person', personId] })
    }

    // Invalidate related company queries if person is linked to companies
    if (newRecord?.company_associations || oldRecord?.company_associations) {
      queryClient.invalidateQueries({ queryKey: ['companySearch'] })
    }
  }, [queryClient])

  const handleRelationshipsUpdate = useCallback((
    eventType: string,
    newRecord: any,
    oldRecord: any
  ) => {
    // Invalidate relationship queries
    queryClient.invalidateQueries({ queryKey: ['relationships'] })
    queryClient.invalidateQueries({ queryKey: ['networkGraph'] })
    
    // Invalidate affected entity queries
    if (newRecord || oldRecord) {
      const record = newRecord || oldRecord
      if (record.source_entity_id) {
        queryClient.invalidateQueries({ queryKey: ['entity', record.source_entity_id] })
      }
      if (record.target_entity_id) {
        queryClient.invalidateQueries({ queryKey: ['entity', record.target_entity_id] })
      }
    }

    // Show notification for new relationships
    if (eventType === 'INSERT' && newRecord) {
      toast(`New relationship detected: ${newRecord.relationship_type}`, {
        duration: 4000,
      })
    }
  }, [queryClient])

  const handleAIJobsUpdate = useCallback((
    eventType: string,
    newRecord: any,
    oldRecord: any
  ) => {
    // Invalidate AI job queries
    queryClient.invalidateQueries({ queryKey: ['aiJobs'] })
    
    if (newRecord?.id || oldRecord?.id) {
      const jobId = newRecord?.id || oldRecord?.id
      queryClient.invalidateQueries({ queryKey: ['aiJob', jobId] })
    }

    // Show notifications for job status changes
    if (eventType === 'UPDATE' && newRecord?.status !== oldRecord?.status) {
      const jobType = newRecord.job_type || 'Processing'
      
      switch (newRecord.status) {
        case 'completed':
          toast.success(`${jobType} completed successfully`, {
            duration: 5000,
          })
          break
        case 'failed':
          toast.error(`${jobType} failed: ${newRecord.error_message || 'Unknown error'}`, {
            duration: 8000,
          })
          break
        case 'processing':
          toast.loading(`${jobType} in progress...`, {
            id: `job-${newRecord.id}`,
            duration: 2000,
          })
          break
      }
    }
  }, [queryClient])

  const handleUserActivitiesUpdate = useCallback((
    eventType: string,
    newRecord: any,
    oldRecord: any
  ) => {
    // Invalidate user activity queries
    queryClient.invalidateQueries({ queryKey: ['userActivities'] })
    queryClient.invalidateQueries({ queryKey: ['dashboardStats'] })

    // Only show notifications for other users' activities (not your own)
    if (eventType === 'INSERT' && newRecord && newRecord.user_id !== profile?.id) {
      const activityType = newRecord.activity_type
      const userName = newRecord.user_name || 'A user'
      
      // Show selective notifications for important activities
      if (['company_analyzed', 'report_generated', 'bulk_analysis'].includes(activityType)) {
        toast(`${userName} ${activityType.replace('_', ' ')}`, {
          duration: 3000,
        })
      }
    }
  }, [queryClient, profile])

  const subscribeToTable = useCallback((tableName: string) => {
    if (!profile?.id || !enabled) {
      return
    }

    // Clean up existing subscription
    const existingChannel = channelsRef.current.get(tableName)
    if (existingChannel) {
      supabase.removeChannel(existingChannel)
    }

    // Create new subscription
    const channel = supabase
      .channel(`realtime-${tableName}-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
          // Add RLS filter for user-specific data
          filter: tableName === 'user_activities' ? `user_id=eq.${profile.id}` : undefined,
        },
        (payload) => handleDatabaseChange(payload, tableName)
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Subscribed to real-time updates for ${tableName}`)
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`❌ Failed to subscribe to ${tableName}:`, status)
          toast.error(`Failed to connect to real-time updates for ${tableName}`)
        }
      })

    channelsRef.current.set(tableName, channel)
  }, [profile?.id, enabled, handleDatabaseChange])

  const unsubscribeFromTable = useCallback((tableName: string) => {
    const channel = channelsRef.current.get(tableName)
    if (channel) {
      supabase.removeChannel(channel)
      channelsRef.current.delete(tableName)
      console.log(`🔌 Unsubscribed from ${tableName}`)
    }
  }, [])

  // Set up subscriptions
  useEffect(() => {
    if (!enabled || !profile?.id) {
      return
    }

    const tablesToSubscribe = tables.length > 0 ? tables : [
      'companies',
      'persons',
      'relationships',
      'ai_processing_jobs',
      'user_activities'
    ]

    tablesToSubscribe.forEach(subscribeToTable)

    return () => {
      tablesToSubscribe.forEach(unsubscribeFromTable)
    }
  }, [enabled, profile?.id, tables, subscribeToTable, unsubscribeFromTable])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      channelsRef.current.forEach((channel, tableName) => {
        supabase.removeChannel(channel)
      })
      channelsRef.current.clear()
    }
  }, [])

  const getSubscriptionStatus = useCallback(() => {
    const status: Record<string, string> = {}
    channelsRef.current.forEach((channel, tableName) => {
      status[tableName] = channel.state
    })
    return status
  }, [])

  const reconnectAll = useCallback(() => {
    const tablesToReconnect = Array.from(channelsRef.current.keys())
    tablesToReconnect.forEach(tableName => {
      unsubscribeFromTable(tableName)
      subscribeToTable(tableName)
    })
  }, [subscribeToTable, unsubscribeFromTable])

  return {
    subscriptionStatus: getSubscriptionStatus(),
    reconnectAll,
    isEnabled: enabled && !!profile?.id,
    connectedTables: Array.from(channelsRef.current.keys()),
  }
}

// Specialized hooks for specific use cases
export function useCompanyRealTimeUpdates(companyNumber?: string) {
  return useRealTimeUpdates({
    tables: ['companies', 'relationships'],
    enabled: !!companyNumber,
    onEvent: (event) => {
      if (companyNumber && event.table === 'companies') {
        const record = event.new || event.old
        if (record?.company_number === companyNumber) {
          console.log(`Company ${companyNumber} updated:`, event)
        }
      }
    },
  })
}

export function useAIJobRealTimeUpdates() {
  return useRealTimeUpdates({
    tables: ['ai_processing_jobs'],
    onEvent: (event) => {
      if (event.table === 'ai_processing_jobs' && event.eventType === 'UPDATE') {
        const job = event.new
        console.log(`AI job ${job?.id} status changed to:`, job?.status)
      }
    },
  })
}

export function useDashboardRealTimeUpdates() {
  return useRealTimeUpdates({
    tables: ['companies', 'ai_processing_jobs', 'user_activities'],
    onEvent: (event) => {
      console.log('Dashboard real-time event:', event)
    },
  })
}