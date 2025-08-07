import Link from 'next/link'

export default function HomePage() {
  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
      {/* Hero Section */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ 
          fontSize: '48px', 
          background: 'linear-gradient(to right, #2563eb, #1e40af)', 
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '20px' 
        }}>
          Nexus AI
        </h1>
        <h2 style={{ fontSize: '24px', color: '#6B7280', marginBottom: '20px' }}>
          AI-Powered Corporate Intelligence Platform
        </h2>
        <p style={{ fontSize: '18px', color: '#9CA3AF', maxWidth: '800px', margin: '0 auto' }}>
          Streamline beneficial ownership verification and corporate structure analysis
          with advanced AI processing and real-time insights.
        </p>
      </div>

      {/* CTA Buttons */}
      <div style={{ marginBottom: '60px' }}>
        <Link 
          href="/auth/login" 
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            backgroundColor: '#3B82F6',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            marginRight: '16px',
            fontWeight: 'bold'
          }}
        >
          Get Started
        </Link>
        <Link 
          href="/dashboard/test-realtime"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            border: '2px solid #3B82F6',
            color: '#3B82F6',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: 'bold'
          }}
        >
          Test Real-time
        </Link>
      </div>

      {/* Quick Navigation */}
      <div style={{ marginTop: '40px' }}>
        <h3 style={{ marginBottom: '20px', color: '#374151' }}>Quick Navigation</h3>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <Link href="/dashboard" style={{ 
            padding: '8px 16px', 
            backgroundColor: '#F3F4F6', 
            textDecoration: 'none', 
            borderRadius: '6px',
            color: '#374151'
          }}>
            Dashboard
          </Link>
          <Link href="/dashboard/search" style={{ 
            padding: '8px 16px', 
            backgroundColor: '#F3F4F6', 
            textDecoration: 'none', 
            borderRadius: '6px',
            color: '#374151'
          }}>
            Company Search
          </Link>
          <Link href="/dashboard/test-realtime" style={{ 
            padding: '8px 16px', 
            backgroundColor: '#F3F4F6', 
            textDecoration: 'none', 
            borderRadius: '6px',
            color: '#374151'
          }}>
            Real-time Test
          </Link>
          <Link href="/test" style={{ 
            padding: '8px 16px', 
            backgroundColor: '#F3F4F6', 
            textDecoration: 'none', 
            borderRadius: '6px',
            color: '#374151'
          }}>
            Simple Test
          </Link>
        </div>
      </div>

      {/* Status */}
      <div style={{ 
        marginTop: '60px', 
        padding: '20px', 
        backgroundColor: '#D1FAE5', 
        borderRadius: '8px',
        maxWidth: '600px',
        margin: '60px auto 0'
      }}>
        <h4 style={{ color: '#065F46', marginBottom: '10px' }}>✅ Server Status</h4>
        <p style={{ color: '#047857', margin: 0 }}>
          Nexus AI is running on localhost:3000<br/>
          All Sprint 1-2 features are ready for testing!
        </p>
      </div>
    </div>
  )
}