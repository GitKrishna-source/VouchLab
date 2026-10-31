import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  LayoutDashboard, Search, Calendar, Bell, UserCheck, Inbox,
  ShieldCheck, AlertTriangle, Sparkles
} from 'lucide-react';

export function Sidebar() {
  const { user } = useAuth();
  if (!user) return null;

  const isOwnerOrManager = user.role === 'owner' || user.role === 'manager' || user.role === 'admin';
  const isAdmin = user.role === 'admin';

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
      isActive
        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  return (
    <aside className="hidden md:flex flex-col w-60 border-r border-slate-200 bg-white min-h-[calc(100vh-4rem)] p-4 space-y-6">
      {/* Student / Core Links */}
      <div className="space-y-1">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
          General
        </div>
        <NavLink to="/dashboard" className={linkClass}>
          <LayoutDashboard className="w-4 h-4" /> Dashboard
        </NavLink>
        <NavLink to="/explore" className={linkClass}>
          <Search className="w-4 h-4" /> Explore Resources
        </NavLink>
        <NavLink to="/my-bookings" className={linkClass}>
          <Calendar className="w-4 h-4" /> My Bookings
        </NavLink>
        <NavLink to="/passport" className={linkClass}>
          <UserCheck className="w-4 h-4" /> Profile & Eligibility
        </NavLink>
      </div>

      {/* Owner / Manager Links */}
      {isOwnerOrManager && (
        <div className="space-y-1 pt-4 border-t border-slate-100">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
            Lab Management
          </div>
          <NavLink to="/owner/requests" className={linkClass}>
            <Inbox className="w-4 h-4" /> Incoming Requests
          </NavLink>
          <NavLink to="/incidents" className={linkClass}>
            <AlertTriangle className="w-4 h-4" /> Damage & Incidents
          </NavLink>
        </div>
      )}

      {/* Admin Central Links */}
      {isAdmin && (
        <div className="space-y-1 pt-4 border-t border-slate-100">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
            Governance & Audit
          </div>
          <NavLink to="/admin" className={linkClass}>
            <ShieldCheck className="w-4 h-4" /> Cryptographic Audit
          </NavLink>
        </div>
      )}

      {/* Trust & Safety Mini Banner */}
      <div className="mt-auto p-3.5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Tamper-Proof Trust
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          Every booking, requirement signoff, and condition report is hashed on a SHA-256 append-only ledger.
        </p>
      </div>
    </aside>
  );
}

