import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-700 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-xl backdrop-blur-sm">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold">AccessHub</h3>
            </div>
            <p className="text-teal-100 text-sm leading-relaxed">
              Enterprise Access Management System for secure and scalable multi-tenant solutions.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-teal-100 hover:text-white transition-colors text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-teal-100 hover:text-white transition-colors text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/features" className="text-teal-100 hover:text-white transition-colors text-sm">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-teal-100 hover:text-white transition-colors text-sm">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-bold mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/help" className="text-teal-100 hover:text-white transition-colors text-sm">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/docs" className="text-teal-100 hover:text-white transition-colors text-sm">
                  Documentation
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-teal-100 hover:text-white transition-colors text-sm">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-teal-100 hover:text-white transition-colors text-sm">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-bold mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-teal-100 text-sm">
                <Mail className="w-4 h-4" />
                <span>support@accesshub.com</span>
              </li>
              <li className="flex items-center gap-2 text-teal-100 text-sm">
                <Phone className="w-4 h-4" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center gap-2 text-teal-100 text-sm">
                <MapPin className="w-4 h-4" />
                <span>123 Business St, Suite 100</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-teal-500/30 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-teal-100 text-sm">
            © {new Date().getFullYear()} AccessHub. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link to="/terms" className="text-teal-100 hover:text-white transition-colors text-sm">
              Terms of Service
            </Link>
            <Link to="/privacy" className="text-teal-100 hover:text-white transition-colors text-sm">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
