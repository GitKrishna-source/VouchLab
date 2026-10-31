import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  LayoutDashboard, Search, Calendar, Bell, UserCheck, Inbox,
  ShieldCheck, AlertTriangle, Sparkles, ArrowRight
} from 'lucide-react';

export function Sidebar() {
  const { user } = useAuth();
  if (!user) return null;

  const isOwnerOrManager = user.role === 'owner' || user.role === 'manager' || user.role === 'admin';
  const isAdmin = user.role === 'admin';

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
      isActive
        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
    }`;

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-[calc(100vh-4rem)] p-4 space-y-6 transition-colors duration-300 shrink-0">
      {/* Student / Core Links */}
      <div className="space-y-1">
        <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2">
          General Access
        </div>
        <NavLink to="/dashboard" className={linkClass}>
          <LayoutDashboard className="w-4 h-4" /> My Dashboard
        </NavLink>
        <NavLink to="/explore" className={linkClass}>
          <Search className="w-4 h-4" /> Explore Equipment
        </NavLink>
        <NavLink to="/my-bookings" className={linkClass}>
          <Calendar className="w-4 h-4" /> My Bookings
        </NavLink>
        <NavLink to="/passport" className={linkClass}>
          <UserCheck className="w-4 h-4" /> Safety Passport
        </NavLink>
      </div>

      {/* Owner / Manager Links */}
      {isOwnerOrManager && (
        <div className="space-y-1 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2">
            Lab Operations
          </div>
          <NavLink to="/owner/requests" className={linkClass}>
            <Inbox className="w-4 h-4" /> Request Queue & Conflict
          </NavLink>
          <NavLink to="/incidents" className={linkClass}>
            <AlertTriangle className="w-4 h-4" /> Damage & Incidents
          </NavLink>
        </div>
      )}

      {/* Admin Central Links */}
      {isAdmin && (
        <div className="space-y-1 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2">
            Governance & Audit
          </div>
          <NavLink to="/admin" className={linkClass}>
            <ShieldCheck className="w-4 h-4" /> Cryptographic Ledger
          </NavLink>
        </div>
      )}

      {/* Trust & Safety Mini Banner */}
      <div className="mt-auto p-4 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-extrabold text-indigo-950 dark:text-indigo-300">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Tamper-Proof Audit</span>
        </div>
        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
          Every booking, requirement signoff, and condition report is hashed on a SHA-256 append-only ledger.
        </p>
      </div>
    </aside>
  );
}
