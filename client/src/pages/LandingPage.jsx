import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  ShieldCheck, Sparkles, Scale, Clock, ArrowRight, CheckCircle2,
  Cpu, Camera, Box, Microscope, Building, Users
} from 'lucide-react';

export function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Text */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" /> Next-Gen Campus Resource Protocol
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Share Resources <br />
              <span className="text-indigo-600 bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">
                Build More Possibilities
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
              Book and share labs, equipment, and makerspaces within your campus—safely, easily, and fairly. Enforces eligibility passports, transparent fair-share allocation, and tamper-evident audit logs.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to={user ? "/dashboard" : "/login"}
                className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all hover:scale-[1.02]"
              >
                {user ? "Open Dashboard" : "Login to Demo"} <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/explore"
                className="px-6 py-3.5 bg-white hover:bg-slate-100 text-slate-800 rounded-xl text-sm font-bold border border-slate-200 shadow-sm transition-all"
              >
                Explore Resources
              </Link>
            </div>

            {/* 4 Feature Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-200/80">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" /> Verified Users
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" /> Safe & Secure
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <Scale className="w-4 h-4 text-purple-600 shrink-0" /> Fair Access
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <Clock className="w-4 h-4 text-blue-600 shrink-0" /> Easy Booking
              </div>
            </div>
          </div>

          {/* Right Image Showcase Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200 aspect-[4/3] bg-slate-100 group">
                <img
                  src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80"
                  alt="Camera equipment"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200 aspect-[4/3] bg-slate-100 group">
                <img
                  src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80"
                  alt="Laser cutter"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
            <div className="space-y-4 pt-6">
              <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200 aspect-[4/3] bg-slate-100 group">
                <img
                  src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80"
                  alt="Meeting room"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200 aspect-[4/3] bg-slate-100 group">
                <img
                  src="https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?auto=format&fit=crop&w=600&q=80"
                  alt="Electronics lab"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        ShareSpace (VouchLab) • Campus Trust & Accountability Layer • Built for Hackathon
      </footer>
    </div>
  );
}

