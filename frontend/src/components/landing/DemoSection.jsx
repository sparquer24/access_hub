/**
 * Demo Component for Landing Page
 * Shows interactive preview of VMS features
 */
import React, { useState } from 'react';
import { Users, TrendingUp, Check, ArrowRight } from '../icons/Icons';

const DemoSection = () => {
  const [activeDemo, setActiveDemo] = useState('dashboard');

  const demoScreens = {
    dashboard: {
      title: 'Real-time Dashboard',
      description: 'Monitor all your locations from a single, intuitive dashboard',
      image: '📊',
      stats: [
        { label: 'Active Employees', value: '156', color: 'text-green-600' },
        { label: 'Visitors Today', value: '43', color: 'text-blue-600' },
        { label: 'Camera Alerts', value: '2', color: 'text-orange-600' },
        { label: 'Locations', value: '3', color: 'text-teal-600' }
      ]
    },
    visitor: {
      title: 'Visitor Management',
      description: 'Streamline visitor check-in with automated badge printing and notifications',
      image: '👤',
      steps: [
        'Visitor arrives and scans QR code',
        'Host receives instant notification',
        'Badge auto-prints with photo',
        'Access granted to designated areas'
      ]
    },
    analytics: {
      title: 'Advanced Analytics',
      description: 'Get insights into traffic patterns, peak hours, and security trends',
      image: '📈',
      charts: [
        { label: 'Peak Hours', value: '9AM - 11AM' },
        { label: 'Avg Daily Visitors', value: '47' },
        { label: 'Security Score', value: '98%' },
        { label: 'Compliance Rate', value: '100%' }
      ]
    }
  };

  const currentDemo = demoScreens[activeDemo];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            See AccessHub VMS in Action
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Explore how our platform can transform your workplace security and visitor management
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Demo Navigation */}
          <div className="space-y-6">
            <div className="flex space-x-2 mb-8">
              {Object.entries(demoScreens).map(([key, demo]) => (
                <button
                  key={key}
                  onClick={() => setActiveDemo(key)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    activeDemo === key
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {demo.title}
                </button>
              ))}
            </div>

            <div className="bg-teal-50/95 rounded-2xl p-8 shadow-lg">
              <div className="text-6xl mb-6 text-center">{currentDemo.image}</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {currentDemo.title}
              </h3>
              <p className="text-gray-600 mb-6">
                {currentDemo.description}
              </p>

              {/* Demo Content */}
              {activeDemo === 'dashboard' && (
                <div className="grid grid-cols-2 gap-4">
                  {currentDemo.stats.map((stat, index) => (
                    <div key={index} className="bg-teal-50 rounded-lg p-4 text-center">
                      <div className={`text-2xl font-bold ${stat.color}`}>
                        {stat.value}
                      </div>
                      <div className="text-sm text-gray-600">{stat.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {activeDemo === 'visitor' && (
                <div className="space-y-3">
                  {currentDemo.steps.map((step, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <span className="text-gray-700">{step}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeDemo === 'analytics' && (
                <div className="space-y-4">
                  {currentDemo.charts.map((chart, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-700">{chart.label}</span>
                      <span className="font-semibold text-teal-600">{chart.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mock Interface */}
          <div className="bg-gradient-to-br from-teal-600 to-teal-600 rounded-2xl p-8 text-white">
            <div className="bg-white bg-opacity-10 backdrop-blur rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              </div>
              <div className="space-y-3">
                <div className="bg-white bg-opacity-20 rounded-lg h-4"></div>
                <div className="bg-white bg-opacity-15 rounded-lg h-4 w-3/4"></div>
                <div className="bg-white bg-opacity-10 rounded-lg h-4 w-1/2"></div>
              </div>
            </div>

            <div className="text-center">
              <h4 className="text-xl font-semibold mb-2">Ready to get started?</h4>
              <p className="text-teal-100 mb-6">
                Experience the full power of AccessHub VMS with our 14-day free trial
              </p>
              <button className="bg-white text-teal-600 hover:bg-teal-50 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 mx-auto">
                Start Free Trial <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DemoSection;
