import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import { StatusBadge } from '../components/StatusBadge.jsx';
import {
  Calendar, Clock, CheckCircle2, AlertTriangle, ArrowRight,
  Sparkles, MapPin, ShieldCheck, Layers, ChevronRight
} from 'lucide-react';

export function StudentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ upcoming: 0, pending: 0, overdue: 0, completed: 0 });
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [bookingsRes, resourcesRes] = await Promise.all([
          api.getMyBookings(),
          api.getResources()
        ]);

        const bookings = bookingsRes || [];
        const upcoming = bookings.filter(b => b.status === 'approved' || b.status === 'checked_in').length;
        const pending = bookings.filter(b => b.status === 'pending' || b.status === 'waitlisted').length;
        const overdue = bookings.filter(b => b.is_overdue || b.status === 'overdue').length;
        const completed = bookings.filter(b => b.status === 'completed' || b.status === 'returned').length;

        setStats({ upcoming, pending, overdue, completed });
        setRecommended((resourcesRes || []).slice(0, 4));
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [user]);

  return (
    <div className="space-y-8 animate-fadeIn transition-colors duration-300">
      
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Student Workspace
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Hi {user?.name?.split(' ')[0] || 'Student'}! 👋
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your equipment reservations, review eligibility passports, and request lab spaces.
          </p>
        </div>

        <Link
          to="/explore"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all self-start sm:self-auto"
        >
          <span>Explore Equipment</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/my-bookings?status=upcoming"
          className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-400 dark:hover:border-indigo-500 transition-all group modern-card"
        >
          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 mb-2">
            <span className="p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl group-hover:bg-indigo-100 transition-colors">
              <Calendar className="w-5 h-5" />
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{stats.upcoming}</span>
          </div>
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Upcoming Bookings</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Approved & In Use</div>
        </Link>

        <Link
          to="/my-bookings?status=pending"
          className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-amber-400 dark:hover:border-amber-500 transition-all group modern-card"
        >
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
            <span className="p-2 bg-amber-50 dark:bg-amber-950/60 rounded-xl group-hover:bg-amber-100 transition-colors">
              <Clock className="w-5 h-5" />
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{stats.pending}</span>
          </div>
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Pending Requests</div>
          <div className="text-[11px] text-slate-400 mt-0.5">In Fair-Share Queue</div>
        </Link>

        <Link
          to="/my-bookings?status=upcoming"
          className={`p-5 bg-white dark:bg-slate-900 rounded-3xl border shadow-sm transition-all group modern-card ${
            stats.overdue > 0
              ? 'border-rose-400 ring-2 ring-rose-400/20'
              : 'border-slate-200 dark:border-slate-800 hover:border-rose-400'
          }`}
        >
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-2">
            <span className="p-2 bg-rose-50 dark:bg-rose-950/60 rounded-xl group-hover:bg-rose-100 transition-colors">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{stats.overdue}</span>
          </div>
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Overdue Returns</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Needs immediate return</div>
        </Link>

        <Link
          to="/my-bookings?status=completed"
          className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-400 dark:hover:border-emerald-500 transition-all group modern-card"
        >
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
            <span className="p-2 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl group-hover:bg-emerald-100 transition-colors">
              <CheckCircle2 className="w-5 h-5" />
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{stats.completed}</span>
          </div>
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Completed Sessions</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Verified condition returned</div>
        </Link>
      </div>

      {/* Recommended for You Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Recommended for You</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Popular makerspace equipment and labs matching your academic focus</p>
          </div>
          <Link to="/explore" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
            See All <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {recommended.map(resource => (
              <div
                key={resource.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-xl hover:border-indigo-400 transition-all group modern-card"
              >
                <div>
                  <div className="aspect-[16/10] bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                    <img
                      src={resource.image_url}
                      alt={resource.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2.5 left-2.5">
                      <StatusBadge status="available" size="xs" />
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      {resource.category}
                    </div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {resource.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{resource.location}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <Link
                    to={`/resources/${resource.id}`}
                    className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trust & Safety Protocol Note */}
      <div className="p-6 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 border border-indigo-200/80 dark:border-indigo-800/80 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shrink-0 mt-0.5 shadow-md shadow-indigo-600/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Safety Passport Active</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              All campus bookings require verified prerequisites. Complete required safety quizzes or upload certifications to unlock instant booking privileges.
            </p>
          </div>
        </div>
        <Link
          to="/passport"
          className="px-4 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-indigo-700 dark:text-indigo-400 rounded-xl text-xs font-bold border border-indigo-200 dark:border-indigo-800 shrink-0 shadow-sm transition-all flex items-center gap-1"
        >
          <span>Check My Passport</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

    </div>
  );
}
