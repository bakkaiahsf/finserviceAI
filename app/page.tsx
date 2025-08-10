'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Professional Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="font-bold text-xl text-gray-900">
                BRITS-AI
              </span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/solutions" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Solutions</Link>
              <Link href="/insights" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Insights</Link>
              <Link href="/pricing" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Pricing</Link>
              <Link href="/about" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">About</Link>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center space-x-4">
              <Link href="/signin" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                Sign In
              </Link>
              <Link href="/sign-up">
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-md shadow-sm hover:shadow-md transition-all duration-200">
                  Get Started
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-50 to-blue-50 py-20 lg:py-28">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-8 border border-blue-200">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Trusted by UK enterprises
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Intelligent Business Insights
              <br />
              <span className="text-blue-600">for the UK Market</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl lg:text-2xl text-gray-600 mb-10 leading-relaxed max-w-3xl mx-auto">
              Make informed decisions with real-time company intelligence, AI-powered analysis, 
              and comprehensive UK business data at your fingertips.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link href="/sign-up">
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 text-lg">
                  Start Free Trial
                </button>
              </Link>
              <Link href="/signin">
                <button className="border-2 border-gray-300 hover:border-blue-500 text-gray-700 hover:text-blue-600 font-semibold px-8 py-4 rounded-lg transition-all duration-300 text-lg">
                  Sign In
                </button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">15M+</div>
                <div className="text-sm text-gray-600">UK Companies</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">99.9%</div>
                <div className="text-sm text-gray-600">Uptime SLA</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">&lt;200ms</div>
                <div className="text-sm text-gray-600">Response Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">SOC 2</div>
                <div className="text-sm text-gray-600">Compliant</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            
            {/* Section Header */}
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Comprehensive Business Intelligence
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Everything you need to understand, analyze, and act on UK business data
              </p>
            </div>

            {/* Feature Grid */}
            <div className="grid lg:grid-cols-3 gap-8">
              
              {/* Companies House Integration */}
              <div className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Official UK Data
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Real-time access to Companies House data with comprehensive company profiles, 
                  financial records, and officer information.
                </p>
              </div>

              {/* AI-Powered Analysis */}
              <div className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  AI-Powered Insights
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Advanced machine learning algorithms provide risk scoring, trend analysis, 
                  and predictive insights to inform your decisions.
                </p>
              </div>

              {/* Professional Reporting */}
              <div className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Professional Reports
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Generate comprehensive PDF and CSV reports with audit trails, 
                  perfect for compliance and stakeholder communication.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Ready to Transform Your Business Intelligence?
            </h2>
            <p className="text-xl mb-10 opacity-90">
              Join leading UK businesses that rely on BRITS-AI for critical business decisions.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/sign-up">
                <button className="bg-white text-blue-600 hover:bg-gray-50 font-semibold px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 text-lg">
                  Start Your Free Trial
                </button>
              </Link>
              <Link href="/signin">
                <button className="border-2 border-white text-white hover:bg-white hover:text-blue-600 font-semibold px-8 py-4 rounded-lg transition-all duration-300 text-lg">
                  Sign In
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* Brand Section */}
            <div className="md:col-span-1">
              <Link href="/" className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">B</span>
                </div>
                <span className="font-bold text-xl text-white">
                  BRITS-AI
                </span>
              </Link>
              <p className="text-gray-400 mb-6">
                Enterprise-grade UK business intelligence platform powered by AI.
              </p>
            </div>

            {/* Solutions */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Solutions</h3>
              <ul className="space-y-3">
                <li><Link href="/due-diligence" className="text-gray-400 hover:text-white transition-colors">Due Diligence</Link></li>
                <li><Link href="/risk-assessment" className="text-gray-400 hover:text-white transition-colors">Risk Assessment</Link></li>
                <li><Link href="/market-research" className="text-gray-400 hover:text-white transition-colors">Market Research</Link></li>
                <li><Link href="/compliance" className="text-gray-400 hover:text-white transition-colors">Compliance</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Resources</h3>
              <ul className="space-y-3">
                <li><Link href="/docs" className="text-gray-400 hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="/api" className="text-gray-400 hover:text-white transition-colors">API Reference</Link></li>
                <li><Link href="/support" className="text-gray-400 hover:text-white transition-colors">Support</Link></li>
                <li><Link href="/status" className="text-gray-400 hover:text-white transition-colors">System Status</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Company</h3>
              <ul className="space-y-3">
                <li><Link href="/about" className="text-gray-400 hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} BRITS-AI Platform. All rights reserved. 
              Built for enterprise intelligence and compliance.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}