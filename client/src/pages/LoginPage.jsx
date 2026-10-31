import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  User, Shield, Briefcase, Lock, Mail, ArrowRight, Layers, Sparkles,
  CheckCircle2, Scale, ShieldCheck, ArrowLeft
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

  const handleDemo = async (demoEmail, redirectPath = '/dashboard') => {
    setError(null);
    setSubmitting(true);
    try {
      await demoLogin({ email: demoEmail });
      navigate(redirectPath);
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-w-4xl w-full grid grid-cols-1 md:grid-cols-2">
        
        {/* Left Form Section */}
        <div className="p-8 sm:p-10 flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            
            {/* Logo */}
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-1.5 group">
                <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono">\\</span>
                <span className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight">vouchlab</span>
              </Link>
              <Link to="/" className="text-xs font-semibold text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </Link>
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-950 dark:text-white tracking-tight">Portal Sign In</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Access verified campus fabrication labs and media suites</p>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300">
                {error}
              </div>
            )}

            {/* Email / Password Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Campus Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student1@demo.edu"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 text-xs text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="demo1234"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 text-xs text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
              >
                {submitting ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* Quick 1-Click Demo Accounts for Judges */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-center mb-2.5">
                Quick 1-Click Demo Personas
              </div>

              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => handleDemo('student1@demo.edu', '/dashboard')}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-indigo-500" /> Student 1 (Keerat)
                  </span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">Needs Quiz</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemo('student2@demo.edu', '/dashboard')}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50/40 dark:hover:bg-purple-950/30 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-purple-500" /> Student 2 (Rohan)
                  </span>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">High Usage</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemo('owner1@demo.edu', '/owner/requests')}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50/40 dark:hover:bg-amber-950/30 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-amber-500" /> Lab Owner (Dr. Vikram)
                  </span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">Queue Review</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemo('admin@demo.edu', '/admin')}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-emerald-500" /> Facilities Admin (Dean Rice)
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">SHA-256 Ledger</span>
                </button>
              </div>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400">
            Password: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-600 dark:text-slate-300">demo1234</code>
          </div>
        </div>

        {/* Right Hero Graphic */}
        <div className="hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>

          <div className="relative z-10 space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-indigo-200 text-xs font-bold border border-white/10">
              <Sparkles className="w-3.5 h-3.5" /> Trust & Fairness Engine
            </span>
            <h3 className="text-3xl font-black leading-tight tracking-tight">
              Empower. <br />
              Collaborate. <br />
              Verify.
            </h3>
            <p className="text-xs text-indigo-200/90 leading-relaxed max-w-xs">
              Every booking, safety quiz, and return condition report is cryptographically sealed onto a tamper-evident SHA-256 ledger.
            </p>
          </div>

          <div className="relative z-10 space-y-3 pt-6 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs text-indigo-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Zero Hoarding with Fair-Share</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-indigo-200">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Eligibility Safety Passports</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-indigo-200">
              <Scale className="w-4 h-4 text-purple-400" />
              <span>Evidence-Based Return Inspection</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
