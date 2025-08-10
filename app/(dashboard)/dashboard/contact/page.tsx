'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle,
  Building2,
  Users,
  Zap,
  BarChart3,
  Globe,
  Shield,
  Cpu,
  Database,
  Code,
  MessageSquare,
  Clock,
  Star
} from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    inquiryType: 'general',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitted(true);
    setIsSubmitting(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const businessSolutions = [
    {
      title: 'Enterprise AI Solutions',
      description: 'Custom AI models tailored for your specific business intelligence needs',
      features: ['Custom model training', 'Dedicated API endpoints', 'Advanced analytics', 'Real-time insights'],
      icon: Zap,
      color: 'bg-blue-600'
    },
    {
      title: 'Advanced Analytics Platform',
      description: 'Comprehensive business intelligence with advanced reporting and visualization',
      features: ['Interactive dashboards', 'Custom reports', 'Predictive analytics', 'Data integration'],
      icon: BarChart3,
      color: 'bg-emerald-600'
    },
    {
      title: 'API Integration Services',
      description: 'Seamless integration with your existing systems and workflows',
      features: ['REST & GraphQL APIs', 'Webhook support', 'Custom integrations', 'Technical support'],
      icon: Code,
      color: 'bg-purple-600'
    },
    {
      title: 'Compliance & Security',
      description: 'Enterprise-grade security and compliance for regulated industries',
      features: ['SOC 2 Type II', 'GDPR compliance', 'Data encryption', 'Audit trails'],
      icon: Shield,
      color: 'bg-orange-600'
    }
  ];

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email',
      content: 'business@nexusai.co.uk',
      description: 'Get in touch for business inquiries'
    },
    {
      icon: Phone,
      title: 'Phone',
      content: '+44 20 7946 0958',
      description: 'Mon-Fri 9:00-17:00 GMT'
    },
    {
      icon: MapPin,
      title: 'Address',
      content: 'London, United Kingdom',
      description: 'Serving clients across the UK and Europe'
    }
  ];

  const testimonials = [
    {
      quote: "Nexus AI transformed our due diligence process, reducing analysis time by 80% while improving accuracy.",
      author: "Sarah Chen",
      company: "Investment Partners Ltd",
      rating: 5
    },
    {
      quote: "The custom AI models provided insights we never thought possible. Exceptional service and support.",
      author: "Michael Thompson", 
      company: "Financial Solutions Group",
      rating: 5
    },
    {
      quote: "Outstanding platform for corporate intelligence. The API integration was seamless.",
      author: "Emma Williams",
      company: "Legal Services UK",
      rating: 5
    }
  ];

  if (isSubmitted) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Thank You!</h1>
          <p className="text-lg text-gray-600 mb-4">
            Your inquiry has been submitted successfully.
          </p>
          <p className="text-gray-600 mb-6">
            Our business solutions team will contact you within 24 hours.
          </p>
          <Button onClick={() => setIsSubmitted(false)} variant="outline">
            Submit Another Inquiry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Business & Enterprise Solutions
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Transform your business with custom AI solutions, advanced analytics, and enterprise-grade intelligence platforms
        </p>
        <div className="mt-6 flex items-center justify-center space-x-6 text-sm text-gray-500">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            24/7 Support
          </div>
          <div className="flex items-center">
            <Shield className="h-4 w-4 mr-2" />
            Enterprise Security
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Dedicated Team
          </div>
        </div>
      </div>

      {/* Business Solutions Grid */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Our Solutions</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {businessSolutions.map((solution, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-xl ${solution.color} shadow-lg`}>
                    <solution.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{solution.title}</CardTitle>
                    <CardDescription className="mt-2">{solution.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {solution.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Contact Form & Info */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Contact Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Get In Touch</span>
            </CardTitle>
            <CardDescription>
              Tell us about your requirements and we'll create a tailored solution for your business
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="John Smith"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="john@company.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Company Name *</Label>
                  <Input
                    id="company"
                    required
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    placeholder="Company Ltd"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+44 20 1234 5678"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="inquiryType">Inquiry Type</Label>
                <select
                  id="inquiryType"
                  value={formData.inquiryType}
                  onChange={(e) => handleInputChange('inquiryType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="general">General Inquiry</option>
                  <option value="enterprise">Enterprise Solutions</option>
                  <option value="api">API Integration</option>
                  <option value="custom">Custom AI Development</option>
                  <option value="compliance">Compliance & Security</option>
                  <option value="support">Technical Support</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <textarea
                  id="message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  placeholder="Tell us about your requirements, current challenges, and how we can help..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Inquiry
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Get in touch with our team</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {contactInfo.map((info, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <info.icon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">{info.title}</p>
                    <p className="text-blue-600">{info.content}</p>
                    <p className="text-sm text-gray-600">{info.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">Why Choose Nexus AI?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center text-blue-800">
                <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
                UK-based company with local expertise
              </div>
              <div className="flex items-center text-blue-800">
                <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
                Enterprise-grade security & compliance
              </div>
              <div className="flex items-center text-blue-800">
                <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
                Cutting-edge AI technology
              </div>
              <div className="flex items-center text-blue-800">
                <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
                24/7 dedicated support team
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Client Testimonials */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">What Our Clients Say</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="bg-gray-50">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.quote}"</p>
                <div>
                  <p className="font-medium text-gray-900">{testimonial.author}</p>
                  <p className="text-sm text-gray-600">{testimonial.company}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg p-8 text-white">
        <h2 className="text-2xl font-bold mb-4">Ready to Transform Your Business?</h2>
        <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
          Join hundreds of companies already using Nexus AI to gain competitive advantages through intelligent business analytics
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="secondary" size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
            Schedule a Demo
          </Button>
          <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-blue-600">
            Download Brochure
          </Button>
        </div>
      </div>
    </div>
  );
}