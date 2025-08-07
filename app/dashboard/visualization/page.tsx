import { Metadata } from 'next'
import CorporateVisualizationInterface from '@/components/visualization/CorporateVisualizationInterface'

export const metadata: Metadata = {
  title: 'Corporate Visualization',
  description: 'Interactive corporate structure visualization with AI-powered insights and network analysis.',
  keywords: 'corporate visualization, network analysis, beneficial ownership, React Flow',
}

export default function VisualizationPage() {
  return <CorporateVisualizationInterface />
}