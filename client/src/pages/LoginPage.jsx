import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  User, Shield, Briefcase, Lock, Mail, ArrowRight, Layers, Sparkles
} from 'lucide-react';

export function LoginPage() {
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemo = async (demoEmail) => {
    setError(null);
    setSubmitting(true);
    try {
      await demoLogin({ email: demoEmail });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-50">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden max-w-4xl w-full grid grid-cols-1 md:grid-cols-2">
        {/* Left Form Section */}
        <div className="p-8 sm:p-10 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-indigo-600 font-extrabold text-xl">
              <Layers className="w-6 h-6" /> ShareSpace
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Welcome Back</h2>
              <p className="text-xs text-slate-500 mt-1">Sign in with your campus credentials to continue</p>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
                {error}
              </div>
            )}

            {/* Email / Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Campus Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student1@demo.edu"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-white focus:bg-white text-xs text-slate-900 rounded-xl border border-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="demo1234"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-white focus:bg-white text-xs text-slate-900 rounded-xl border border-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
              >
                {submitting ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* Quick Demo Accounts */}
            <div className="pt-4 border-t border-slate-100">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-3">
                or try demo accounts
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleDemo('student1@demo.edu')}
                  className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-slate-800 text-xs font-semibold flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-600" /> Continue as Student (Keerat)
                  </span>
                  <span className="text-[10px] text-slate-400">1 missing req</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemo('owner1@demo.edu')}
                  className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-slate-800 text-xs font-semibold flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-indigo-600" /> Continue as Owner (Dr. Vikram)
                  </span>
                  <span className="text-[10px] text-slate-400">Review Queue</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemo('admin@demo.edu')}
                  className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-slate-800 text-xs font-semibold flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-indigo-600" /> Continue as Admin (Facilities)
                  </span>
                  <span className="text-[10px] text-slate-400">Audit Ledger</span>
                </button>
              </div>
            </div>
          </div>

          <div className="text-center text-[11px] text-slate-400 pt-6">
            Hackathon prototype • All passwords defaulted to <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">demo1234</code>
          </div>
        </div>

        {/* Right Inspirational Hero Graphic */}
        <div className="hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-950 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>

          <div className="relative z-10 space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur text-indigo-200 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" /> Campus Equipment Network
            </span>
            <h3 className="text-3xl font-black leading-tight tracking-tight">
              Access. <br />
              Share. <br />
              Create. <br />
              Grow Together.
            </h3>
            <p className="text-xs text-indigo-200/90 leading-relaxed max-w-xs">
              Every equipment piece on campus has the power to unlock new research, student prototypes, and creative breakthroughs.
            </p>
          </div>

          <div className="relative z-10 pt-8 border-t border-white/10">
            <div className="text-xs text-indigo-200 font-medium">
              "TrustShare transformed how our robotics lab shares high-value laser and 3D equipment without friction."
            </div>
            <div className="text-xs font-bold text-white mt-1">
              — Fabrication Lab Directorate
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

