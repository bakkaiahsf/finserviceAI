import { Metadata } from 'next'
import RealTimeTest from '@/components/realtime/RealTimeTest'

export const metadata: Metadata = {
  title: 'Real-Time Test',
  description: 'Test real-time database subscriptions and live data synchronization.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function RealTimeTestPage() {
  return <RealTimeTest />
}