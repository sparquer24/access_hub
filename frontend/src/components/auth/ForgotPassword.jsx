import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, AlertCircle } from 'lucide-react';
import { AIIcon } from '../icons/Icons';
import { useToast } from '../../contexts/ToastContext';
import logoImage from '../../images/Group.png';

/**
 * UI-only "forgot password" flow. There is no backend endpoint for this yet,
 * so submitting shows a generic confirmation and directs the user to their
 * administrator rather than silently failing or pretending an email was sent.
 */
const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();
  const { info } = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    info('Password resets are handled by your organization administrator.');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-600 relative overflow-hidden p-4">
      <div className="absolute top-20 left-10 w-72 h-72 bg-teal-400/30 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-cyan-400/30 rounded-full blur-3xl animate-pulse delay-700"></div>

      <div className="relative z-10 w-full max-w-sm bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 animate-fadeInUp">
        <div className="flex items-center gap-2 mb-6">
          <img src={logoImage} alt="AccessHub Logo" className="w-10 h-10" />
          <span className="text-sm font-black tracking-wide text-teal-700 uppercase flex items-center gap-1">
            AccessHub <AIIcon className="w-4 h-4" />
          </span>
        </div>

        {submitted ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-7 h-7 text-teal-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Check with your admin</h2>
            <p className="text-sm text-gray-600 mb-6">
              AccessHub accounts are managed by your organization administrator. Reach out to them
              to reset your password for <span className="font-semibold text-gray-800">{email}</span>.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-2 text-sm font-semibold text-teal-600 hover:text-teal-700"
            >
              <ArrowLeft className="w-4 h-4" /> Back to login
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Forgot password?</h2>
            <p className="text-sm text-gray-600 mb-6">
              Enter your email and we'll point you to the right place to regain access.
            </p>

            <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 mb-6 flex items-start gap-2 text-teal-800 text-xs">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              Self-service reset isn't available yet — this confirms who to contact.
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col">
                <label htmlFor="email" className="text-sm font-bold text-gray-800 mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base bg-teal-50 transition-all duration-300 focus:outline-none focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <button
                type="submit"
                className="py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl text-base font-bold transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/50 hover:-translate-y-0.5"
              >
                Continue
              </button>
            </form>

            <button
              onClick={() => navigate('/login')}
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-teal-600"
            >
              <ArrowLeft className="w-4 h-4" /> Back to login
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
