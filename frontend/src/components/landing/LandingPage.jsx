import React, { useState, useEffect, useRef } from 'react';

import { ArrowRight, Check, Sparkles, Users, Lock, Zap } from '../icons/Icons';
import { 
  Video, BarChart3, Building2, User,
  Camera, Phone, Mail,
  Heart, GraduationCap, Factory,
  UserCircle, Clock
} from 'lucide-react';
import DemoSection from './DemoSection';
import HeroIllustration from './HeroIllustration';
import HeroBackgroundSlides from './HeroBackgroundSlides';
import { statsAPI } from '../../services/api';

const LandingPage = () => {

  const [systemStats, setSystemStats] = useState(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Fetch real system stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await statsAPI.overview();
        setSystemStats(response.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        // Use fallback data if API fails
        setSystemStats({
          organizations: { total: 0, active: 0 },
          employees: { total: 0, active: 0 },
          visitors: { total: 0 }
        });
      }
    };
    fetchStats();
  }, []);

  // Animated counter hook — counts from 0 to `target` over `duration` ms
  const useCountUp = (target, duration = 1200) => {
    const [value, setValue] = useState(0);
    const raf = useRef(null);
    useEffect(() => {
      if (target === null || target === undefined) return;
      const start = performance.now();
      const tick = (now) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.floor(eased * target));
        if (progress < 1) raf.current = requestAnimationFrame(tick);
      };
      raf.current = requestAnimationFrame(tick);
      return () => raf.current && cancelAnimationFrame(raf.current);
    }, [target, duration]);
    return value;
  };

  const statValues = {
    users:   systemStats ? systemStats.employees?.total ?? 0 : null,
    orgs:    systemStats ? systemStats.organizations?.total ?? 0 : null,
    visitors:systemStats ? systemStats.visitors?.total ?? 0 : null,
  };

  const AnimatedStat = ({ value, label }) => {
    const animated = useCountUp(value);
    const isLoading = value === null;
    return (
      <div
        className="text-center p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 shadow-lg animate-fadeInUp"
      >
        {isLoading ? (
          <div className="h-7 w-16 mx-auto mb-1 rounded-md bg-white/20 loading-shimmer" />
        ) : (
          <div className="text-2xl font-bold text-teal-300 mb-1 tabular-nums">
            {animated.toLocaleString()}{value > 0 ? '+' : ''}
          </div>
        )}
        <div className="text-sm text-slate-300">{label}</div>
      </div>
    );
  };

  // Static stats array kept only for the "24/7" entry
  const stats = [
    { key: 'users',    label: 'Active Users' },
    { key: 'orgs',     label: 'Organizations' },
    { key: 'visitors', label: 'Visitors Tracked' },
    { key: 'uptime',   label: 'Support', fixed: '24/7' },
  ];

  const trustPoints = [
    { icon: <Check className="w-4 h-4" />, label: 'AI-verified entries' },
    { icon: <Camera className="w-4 h-4" />, label: 'Real-time LPR alerts' },
    { icon: <Lock className="w-4 h-4" />, label: 'Role-based access control' },
  ];

  const features = [
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Employee Management',
      description: 'Comprehensive employee tracking, attendance monitoring, and role-based access control.',
      color: 'from-blue-500 to-cyan-500',
      details: ['Digital ID cards', 'Biometric authentication', 'Shift management', 'Department organization']
    },
    {
      icon: <Video className="w-8 h-8" />,
      title: 'Camera Integration',
      description: 'Real-time video monitoring, facial recognition, and automated security alerts.',
      color: 'from-cyan-500 to-pink-500',
      details: ['AI-powered facial recognition', 'Motion detection', 'Live streaming', '24/7 recording']
    },
    {
      icon: <User className="w-8 h-8" />,
      title: 'Visitor Tracking',
      description: 'Streamlined visitor registration, badge printing, and entry/exit monitoring.',
      color: 'from-green-500 to-teal-500',
      details: ['QR code check-in', 'Host notifications', 'Badge printing', 'Pre-registration']
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: 'AI Insights',
      description: 'Harness the power of AI to predict attendance trends and identify security anomalies before they happen.',
      color: 'from-purple-500 to-indigo-500',
      details: ['Predictive attendance', 'Anomaly detection', 'Risk assessment', 'Smart scheduling']
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'Advanced Analytics',
      description: 'Detailed reports, AI-driven usage statistics, and predictive insights for better decision making.',
      color: 'from-orange-500 to-red-500',
      details: ['AI-powered dashboards', 'Custom reports', 'Traffic patterns', 'Security insights']
    },
    {
      icon: <Building2 className="w-8 h-8" />,
      title: 'Multi-Location Support',
      description: 'Manage multiple offices, floors, and departments from a single dashboard.',
      color: 'from-teal-500 to-teal-600',
      details: ['Centralized management', 'Location-specific rules', 'Cross-site reporting', 'Unified dashboard']
    },
    {
      icon: <Lock className="w-8 h-8" />,
      title: 'Enterprise Security',
      description: 'Military-grade encryption, compliance reporting, and audit trails.',
      color: 'from-gray-700 to-gray-900',
      details: ['End-to-end encryption', 'Compliance reports', 'Audit logs', 'Data privacy']
    },

    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Real-time Alerts',
      description: 'Instant notifications for security events, visitor arrivals, and system status.',
      color: 'from-yellow-500 to-orange-500',
      details: ['Email notifications', 'SMS alerts', 'Slack integration', 'Custom triggers']
    }
  ];

  const useCases = [
    {
      industry: 'Corporate Offices',
      icon: <Building2 className="w-12 h-12" />,
      description: 'Manage employee access and visitor registration for office buildings.',
      features: ['Digital visitor badges', 'Host notifications', 'Meeting room access', 'Contractor tracking'],
      stats: { users: '2,500+', locations: '45' }
    },
    {
      industry: 'Healthcare Facilities',
      icon: <Heart className="w-12 h-12" />,
      description: 'HIPAA-compliant visitor management for medical facilities.',
      features: ['Patient privacy protection', 'Staff credential verification', 'Emergency protocols', 'Audit trails'],
      stats: { users: '1,200+', locations: '18' }
    },
    {
      industry: 'Educational Institutions',
      icon: <GraduationCap className="w-12 h-12" />,
      description: 'Campus security and visitor control for schools and universities.',
      features: ['Parent check-in', 'Campus events management', 'Student safety', 'Visitor screening'],
      stats: { users: '3,100+', locations: '32' }
    },
    {
      industry: 'Manufacturing',
      icon: <Factory className="w-12 h-12" />,
      description: 'Industrial site access control with safety compliance.',
      features: ['Safety certification checks', 'Contractor management', 'Restricted area access', 'Compliance reporting'],
      stats: { users: '800+', locations: '12' }
    }
  ];

  const faqItems = [
    {
      question: 'How long does setup typically take?',
      answer: 'Most organizations complete setup within 1-2 weeks, including staff training and system configuration. We provide setup assistance and documentation.'
    },
    {
      question: 'What data privacy standards do you follow?',
      answer: 'We follow industry-standard security practices including data encryption and comply with GDPR and HIPAA requirements where applicable.'
    },
    {
      question: 'What support options are available?',
      answer: 'We provide email support during business hours, comprehensive documentation, and video tutorials.'
    }
  ];

  const testimonials = [
    {
      quote: "AccessHub simplified our visitor check-in process. The interface is intuitive and our reception staff picked it up quickly.",
      author: "Sarah Johnson",
      role: "Facilities Manager",
      company: "Riverside Office Park",
      avatar: <UserCircle className="w-12 h-12" />
    },
    {
      quote: "The reporting features help us track visitor patterns and improve our security protocols. Good value for the price.",
      author: "Michael Chen",
      role: "Security Coordinator",
      company: "Metro Manufacturing",
      avatar: <UserCircle className="w-12 h-12" />
    },
    {
      quote: "We needed a HIPAA-compliant solution for our medical center. AccessHub met our requirements and was easy to implement.",
      author: "Dr. Emily Rodriguez",
      role: "Administrator",
      company: "Westside Medical Center",
      avatar: <UserCircle className="w-12 h-12" />
    }
  ];





  const handleContactSubmit = async (e) => {
    e.preventDefault();
    // Here you would typically send the contact form to your backend
    console.log('Contact form submitted:', contactForm);
    setFormSubmitted(true);
    setTimeout(() => {
      setFormSubmitted(false);
      setContactForm({ name: '', email: '', company: '', message: '' });
    }, 3000);
  };

  const updateContactForm = (field, value) => {
    setContactForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-white h-screen overflow-y-auto">
      {/* Inline CSS for animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        
        @keyframes bounceSoft {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-10px) scale(1.05); }
        }
        
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(20, 184, 166, 0.3); }
          50% { box-shadow: 0 0 30px rgba(20, 184, 166, 0.6); }
        }
        
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-bounce-soft { animation: bounceSoft 2s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulseGlow 2s ease-in-out infinite; }
        .animate-gradient { background-size: 200% 200%; animation: gradientShift 3s ease-in-out infinite; }
        .animate-slide-up { animation: slideUp 0.6s ease-out forwards; }
        
        .glass-morphism {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .shadow-3d {
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1), 0 1px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.4);
        }
        
        .text-3d {
          text-shadow: 0 1px 0 rgba(255, 255, 255, 0.4), 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .perspective-card { perspective: 1000px; transform-style: preserve-3d; }
        .card-content { transform-origin: center center; transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
        .perspective-card:hover .card-content { transform: rotateX(5deg) rotateY(5deg) translateZ(20px); }
        
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: rgba(148, 163, 184, 0.1); border-radius: 4px; }
        ::-webkit-scrollbar-thumb { background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: linear-gradient(135deg, #0e7490 0%, #0891b2 100%); }
      `}</style>
      {/* Hero Section */}
      <section className="relative bg-slate-900 pt-16 overflow-hidden">
        <HeroBackgroundSlides />
        <div className="relative z-10 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="pt-20 pb-16 lg:pt-28 lg:pb-24 grid grid-cols-1 lg:grid-cols-2 items-center gap-12">
            <div className="text-center lg:text-left animate-fadeInUp z-10 relative">
              <div className="inline-flex items-center gap-2 rounded-full bg-teal-400/20 border border-teal-400/30 px-4 py-1.5 text-xs font-semibold text-teal-300 mb-6 backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5" />
                AI-Powered Access Control
              </div>
              <h1 className="font-display text-5xl font-medium tracking-tight text-white sm:text-6xl" style={{textShadow:'0 2px 16px rgba(0,0,0,0.5)'}}>
                Workplace Access,{' '}
                <span className="relative whitespace-nowrap text-teal-300">
                  <span className="relative">Secured by AI</span>
                </span>
              </h1>
              <p className="mt-6 max-w-xl mx-auto lg:mx-0 text-lg tracking-tight text-slate-200">
                Next-generation visitor management and security powered by advanced AI.
                Secure your premises with intelligent facial recognition and predictive analytics.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row justify-center lg:justify-start items-center gap-4">
                <button
                  onClick={() => window.location.href = '/login'}
                  className="group inline-flex items-center justify-center gap-2 rounded-full py-3 px-6 text-sm font-semibold focus:outline-none text-white bg-teal-600 hover:bg-teal-700 shadow-lg hover:shadow-teal-lg transition-all"
                >
                  Get started
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </button>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center rounded-full py-3 px-6 text-sm font-semibold text-teal-300 border border-teal-400/40 hover:border-teal-400/70 hover:bg-teal-400/10 transition-colors backdrop-blur-sm"
                >
                  See how it works
                </a>
              </div>

              {/* Trust row */}
              <div className="mt-8 flex flex-wrap justify-center lg:justify-start gap-4">
                {trustPoints.map((point, index) => (
                  <div key={index} className="inline-flex items-center gap-2 text-sm text-slate-200">
                    <span className="w-6 h-6 rounded-full bg-teal-400/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
                      {point.icon}
                    </span>
                    {point.label}
                  </div>
                ))}
              </div>
            </div>

            <HeroIllustration />
          </div>

          {/* Stats */}
          <div className="pb-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto relative z-10">
            {stats.map((stat, index) => (
              stat.fixed ? (
                <div
                  key={index}
                  className="text-center p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 shadow-lg"
                  style={{ animationDelay: `${index * 0.12}s` }}
                >
                  <div className="text-2xl font-bold text-teal-300 mb-1">{stat.fixed}</div>
                  <div className="text-sm text-slate-300">{stat.label}</div>
                </div>
              ) : (
                <AnimatedStat
                  key={index}
                  value={statValues[stat.key]}
                  label={stat.label}
                />
              )
            ))}
          </div>
        </div>

      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Core Features
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Essential tools for managing workplace access and security
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="rounded-2xl p-8 border border-white/20 group cursor-pointer relative bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow perspective-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="card-content">
                <div className="text-teal-600 text-4xl mb-6">
                  {feature.icon}
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {feature.title}
                </h3>
                
                <p className="text-slate-600 text-base mb-6 leading-relaxed">
                  {feature.description}
                </p>

                {feature.details && (
                  <ul className="space-y-2">
                    {feature.details.map((detail, detailIndex) => (
                      <li 
                        key={detailIndex} 
                        className="flex items-center text-sm text-slate-600"
                      >
                        <div className="w-4 h-4 rounded-full mr-3 flex items-center justify-center flex-shrink-0 bg-green-500">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                )}                </div>              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <DemoSection />

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What Our Customers Say
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Don't just take our word for it. Here's what industry leaders say about AccessHub VMS.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gradient-to-br from-teal-50 to-white rounded-2xl p-8 border border-teal-100">
                <div className="text-teal-600 mb-4">{testimonial.avatar}</div>
                <blockquote className="text-gray-700 mb-6 italic">
                  "{testimonial.quote}"
                </blockquote>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.author}</div>
                  <div className="text-sm text-gray-600">{testimonial.role}</div>
                  <div className="text-sm text-teal-600 font-medium">{testimonial.company}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-teal-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Got questions? We have answers. Can't find what you're looking for? Contact our support team.
            </p>
          </div>

          <div className="space-y-6">
            {faqItems.map((faq, index) => (
              <div key={index} className="bg-teal-50/95 rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">Still have questions?</p>
            <button className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
              Contact Support
            </button>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Trusted Across Industries
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From corporate offices to healthcare facilities, AccessHub VMS adapts to your industry's unique needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {useCases.map((useCase, index) => (
              <div 
                key={index} 
                className="rounded-2xl p-8 border border-white/20 group cursor-pointer bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center mb-6">
                  <div className="text-teal-600 mr-6">
                    {useCase.icon}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {useCase.industry}
                    </h3>
                    <div className="flex space-x-4 text-sm text-gray-600 mt-1">
                      <span className="px-3 py-1 rounded-full bg-teal-600 text-white text-xs">
                        {useCase.stats.users} users
                      </span>
                      <span className="px-3 py-1 rounded-full bg-teal-500 text-white text-xs">
                        {useCase.stats.locations} locations
                      </span>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-8 text-base leading-relaxed">
                  {useCase.description}
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                  {useCase.features.map((feature, featureIndex) => (
                    <div 
                      key={featureIndex} 
                      className="flex items-center text-sm"
                    >
                      <div className="w-5 h-5 rounded-full mr-3 flex items-center justify-center flex-shrink-0 bg-green-500">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-gray-700 font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-teal-600 to-teal-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Your Workplace?
          </h2>
          <p className="text-xl text-teal-100 mb-8">
            Join thousands of organizations already using AccessHub VMS to secure and streamline their operations.
          </p>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Get In Touch
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Ready to transform your visitor management? Contact us today for a personalized demo and consultation.
            </p>
          </div>

          <div className="bg-teal-50/95 rounded-2xl shadow-xl p-8">
            {formSubmitted ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h3>
                <p className="text-gray-600">We've received your message and will get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={contactForm.name}
                      onChange={(e) => updateContactForm('name', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={contactForm.email}
                      onChange={(e) => updateContactForm('email', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="your@company.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    id="company"
                    value={contactForm.company}
                    onChange={(e) => updateContactForm('company', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Your company name"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    rows={5}
                    required
                    value={contactForm.message}
                    onChange={(e) => updateContactForm('message', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Tell us about your requirements and how we can help..."
                  />
                </div>

                <div className="text-center">
                  <button
                    type="submit"
                    className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-lg font-semibold transition-colors inline-flex items-center gap-2"
                  >
                    Send Message
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
              <p className="text-gray-600">support@accesshub.com</p>
            </div>
            <div className="p-6">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Phone className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Phone</h3>
              <p className="text-gray-600">+1 (555) 123-4567</p>
            </div>
            <div className="p-6">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Response Time</h3>
              <p className="text-gray-600">Within 24 hours</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
