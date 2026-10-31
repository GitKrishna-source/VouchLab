import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import {
  Calendar, Clock, MapPin, CheckCircle2, RotateCcw, AlertTriangle,
  ArrowRight, X, Sparkles, User, FileText, ChevronRight
} from 'lucide-react';

export function MyBookings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const statusFilter = searchParams.get('status') || 'All';
  const [activeTab, setActiveTab] = useState(statusFilter);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cancellation modal state
  const [cancelModalBooking, setCancelModalBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    setActiveTab(statusFilter);
  }, [statusFilter]);

  useEffect(() => {
    loadBookings();
  }, [activeTab, user]);

  async function loadBookings() {
    setLoading(true);
    try {
      const data = await api.getMyBookings(activeTab !== 'All' ? activeTab : null);
      setBookings(data || []);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancelModalBooking) return;

    setCancelLoading(true);
    try {
      await api.cancelBooking(cancelModalBooking.id, cancelReason);
      setCancelModalBooking(null);
      setCancelReason('');
      await loadBookings();
    } catch (err) {
      alert(err.message || 'Cancellation failed');
    } finally {
      setCancelLoading(false);
    }
  };

  const tabs = [
    { key: 'All', label: 'All Reservations' },
    { key: 'upcoming', label: 'Upcoming / In Use' },
    { key: 'pending', label: 'Pending Review' },
    { key: 'completed', label: 'Completed & Returned' },
    { key: 'cancelled', label: 'Cancelled' }
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12 transition-colors duration-300">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
            <Calendar className="w-3.5 h-3.5" /> Schedule Management
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            My Reservations & Bookings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track equipment pickups, return condition logs, and queue positions
          </p>
        </div>

        <Link
          to="/explore"
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all self-start sm:self-auto flex items-center gap-1.5"
        >
          <span>Book Equipment</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setActiveTab(t.key); setSearchParams({ status: t.key }); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === t.key
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">Loading your reservations...</div>
      ) : bookings.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
          <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">No bookings in this category</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Ready to build or fabricate? Explore available campus equipment to reserve your first slot.
          </p>
          <Link
            to="/explore"
            className="inline-block px-4 py-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded-xl text-xs font-bold transition-colors"
          >
            Explore Resources
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const isApproved = booking.status === 'approved';
            const isCheckedIn = booking.status === 'checked_in';
            const isOverdue = booking.is_overdue || booking.status === 'overdue';

            return (
              <div
                key={booking.id}
                className={`bg-white dark:bg-slate-900 p-6 rounded-3xl border shadow-sm transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-5 modern-card ${
                  isOverdue
                    ? 'border-rose-400 ring-2 ring-rose-400/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500'
                }`}
              >
                {/* Left: Info */}
                <div className="flex items-start gap-4">
                  <img
                    src={booking.image_url}
                    alt={booking.resource_name}
                    className="w-20 h-20 rounded-2xl object-cover shrink-0 border border-slate-200 dark:border-slate-800 shadow-sm"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        {booking.resource_category}
                      </span>
                      <StatusBadge status={isOverdue ? 'overdue' : booking.status} size="xs" />
                    </div>

                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      {booking.resource_name}
                    </h3>

                    <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                        {new Date(booking.start_time).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        {booking.start_time?.substring(11, 16)} - {booking.end_time?.substring(11, 16)}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <MapPin className="w-3.5 h-3.5" /> {booking.location}
                      </span>
                    </div>

                    {booking.decision_reason && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-1">
                        "{booking.decision_reason}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                  {/* If Approved: Check In Button */}
                  {isApproved && (
                    <Link
                      to={`/bookings/${booking.id}/checkin`}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Check In & Pickup
                    </Link>
                  )}

                  {/* If Checked in: Return Button */}
                  {isCheckedIn && (
                    <Link
                      to={`/bookings/${booking.id}/return`}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-indigo-600/20 transition-all flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Return Equipment
                    </Link>
                  )}

                  {/* View Details */}
                  <Link
                    to={`/bookings/${booking.id}`}
                    className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors"
                  >
                    View Details
                  </Link>

                  {/* Cancel Button */}
                  {(booking.status === 'pending' || booking.status === 'approved' || booking.status === 'waitlisted') && (
                    <button
                      type="button"
                      onClick={() => setCancelModalBooking(booking)}
                      className="px-3 py-2 text-slate-400 hover:text-rose-600 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Modal */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Cancel Reservation</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Are you sure you want to cancel your reservation for <strong className="text-slate-900 dark:text-white">{cancelModalBooking.resource_name}</strong>? The slot will immediately be re-allocated to the next student in the fair-share waitlist.
            </p>

            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Reason for Cancellation</label>
                <textarea
                  rows={2}
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Schedule conflict with laboratory class..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalBooking(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800"
                >
                  Keep Reservation
                </button>
                <button
                  type="submit"
                  disabled={cancelLoading}
                  className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 disabled:opacity-50"
                >
                  {cancelLoading ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
