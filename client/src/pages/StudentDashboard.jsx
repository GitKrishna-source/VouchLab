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
    <div className="space-y-8 animate-fadeIn">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Hi {user?.name?.split(' ')[0] || 'Student'}! 👋
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Find and book the campus lab resources and spaces you need.
          </p>
        </div>

        <Link
          to="/explore"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all self-start sm:self-auto"
        >
          Explore All Equipment <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/my-bookings?status=upcoming"
          className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all group"
        >
          <div className="flex items-center justify-between text-indigo-600 mb-2">
            <span className="p-2 bg-indigo-50 rounded-xl group-hover:bg-indigo-100 transition-colors">
              <Calendar className="w-5 h-5" />
            </span>
            <span className="text-2xl font-black text-slate-900">{stats.upcoming}</span>
          </div>
          <div className="text-xs font-bold text-slate-700">Upcoming Bookings</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Approved & In Use</div>
        </Link>

        <Link
          to="/my-bookings?status=pending"
          className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-amber-300 transition-all group"
        >
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="p-2 bg-amber-50 rounded-xl group-hover:bg-amber-100 transition-colors">
              <Clock className="w-5 h-5" />
            </span>
            <span className="text-2xl font-black text-slate-900">{stats.pending}</span>
          </div>
          <div className="text-xs font-bold text-slate-700">Pending Requests</div>
          <div className="text-[11px] text-slate-400 mt-0.5">In Fair-Share Queue</div>
        </Link>

        <Link
          to="/my-bookings?status=upcoming"
          className={`p-5 bg-white rounded-2xl border shadow-sm transition-all group ${
            stats.overdue > 0 ? 'border-rose-300 ring-2 ring-rose-400/20' : 'border-slate-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="p-2 bg-rose-50 rounded-xl group-hover:bg-rose-100 transition-colors">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <span className="text-2xl font-black text-slate-900">{stats.overdue}</span>
          </div>
          <div className="text-xs font-bold text-slate-700">Overdue Returns</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Needs immediate return</div>
        </Link>

        <Link
          to="/my-bookings?status=completed"
          className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-300 transition-all group"
        >
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="p-2 bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition-colors">
              <CheckCircle2 className="w-5 h-5" />
            </span>
            <span className="text-2xl font-black text-slate-900">{stats.completed}</span>
          </div>
          <div className="text-xs font-bold text-slate-700">Completed Sessions</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Verified condition returned</div>
        </Link>
      </div>

      {/* Recommended for You Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recommended for You</h2>
            <p className="text-xs text-slate-500">Popular makerspace equipment and labs matching your academic focus</p>
          </div>
          <Link to="/explore" className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
            See All <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommended.map(resource => (
              <div
                key={resource.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md hover:border-indigo-300 transition-all group"
              >
                <div>
                  <div className="aspect-[16/10] bg-slate-100 relative overflow-hidden">
                    <img
                      src={resource.image_url}
                      alt={resource.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2.5 left-2.5">
                      <StatusBadge status="available" size="xs" />
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                      {resource.category}
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {resource.name}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{resource.location}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <Link
                    to={`/resources/${resource.id}`}
                    className="w-full py-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
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
      <div className="p-5 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 border border-indigo-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-indigo-600 text-white rounded-xl shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900">Eligibility Passport Active</h4>
            <p className="text-xs text-slate-600">
              All campus bookings require verified prerequisites. Complete required safety quizzes or upload certifications to unlock instant booking privileges.
            </p>
          </div>
        </div>
        <Link
          to="/passport"
          className="px-4 py-2 bg-white hover:bg-slate-50 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200 shrink-0 shadow-sm transition-all"
        >
          Check My Passport →
        </Link>
      </div>
    </div>
  );
}

