import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { ConditionComparison } from '../components/ConditionComparison.jsx';
import {
  ArrowLeft, Calendar, Clock, MapPin, User, CheckCircle2,
  AlertTriangle, ShieldCheck, Sparkles, FileText, ChevronRight,
  XCircle, PlusCircle, AlertCircle, RefreshCw
} from 'lucide-react';

export function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelWarning, setCancelWarning] = useState(null);

  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendReason, setExtendReason] = useState('');
  const [extending, setExtending] = useState(false);
  const [extendError, setExtendError] = useState(null);
  const [extendSuccess, setExtendSuccess] = useState(null);

  async function loadBooking() {
    try {
      setLoading(true);
      const data = await api.getBookingDetail(id);
      setBooking(data);
    } catch (err) {
      setError(err.message || 'Failed to load booking');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBooking();
  }, [id]);

  // Handle Booking Cancellation
  async function handleConfirmCancel() {
    try {
      setCancelling(true);
      setCancelWarning(null);
      const res = await api.cancelBooking(booking.id, cancelReason);
      if (res.warning) {
        setCancelWarning(res.warning);
      }
      await loadBooking();
      setTimeout(() => {
        setShowCancelModal(false);
        setCancelReason('');
        setCancelWarning(null);
      }, res.warning ? 3500 : 800);
    } catch (err) {
      alert(err.message || 'Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  }

  // Handle 1-Hour Extension with automatic conflict detection
  async function handleRequestExtension() {
    try {
      setExtending(true);
      setExtendError(null);
      setExtendSuccess(null);
      const res = await api.extendBooking(booking.id, null, extendReason);
      setExtendSuccess(res.message || 'Extension granted! +1 hour added.');
      await loadBooking();
      setTimeout(() => {
        setShowExtendModal(false);
        setExtendSuccess(null);
        setExtendReason('');
      }, 2000);
    } catch (err) {
      setExtendError(err.message || 'Conflict detected. Could not extend booking.');
    } finally {
      setExtending(false);
    }
  }

  if (loading && !booking) {
    return <div className="py-20 text-center text-slate-400">Loading booking timeline...</div>;
  }

  if (error || !booking) {
    return <div className="p-8 text-center text-rose-600">{error || 'Booking not found'}</div>;
  }

  const checkinReport = booking.condition_reports?.find(r => r.type === 'checkin');
  const returnReport = booking.condition_reports?.find(r => r.type === 'return');
  const incident = booking.incidents?.[0];

  const isBorrower = user && user.id === booking.user_id;
  const canCancel = ['pending', 'approved', 'waitlisted'].includes(booking.status);
  const canExtend = ['approved', 'checked_in'].includes(booking.status);
  const canCheckIn = booking.status === 'approved';
  const canReturn = booking.status === 'checked_in' || booking.status === 'overdue';

  const proposedEndTime = booking.end_time 
    ? new Date(new Date(booking.end_time).getTime() + 60 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  // Timeline steps
  const steps = [
    { title: 'Request Submitted', date: booking.created_at, done: true },
    { title: 'Owner Decision', date: booking.status === 'cancelled' ? 'Cancelled' : (booking.decision_reason ? 'Approved' : null), done: booking.status !== 'pending' && booking.status !== 'waitlisted' },
    { title: 'Checked In (Pickup)', date: booking.checked_in_at, done: Boolean(booking.checked_in_at) },
    { title: 'Equipment Returned', date: booking.returned_at, done: Boolean(booking.returned_at) },
    { title: 'Session Completed', date: (booking.status === 'completed' || booking.status === 'returned') ? 'Finalized' : null, done: booking.status === 'completed' || booking.status === 'returned' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
      <Link
        to="/my-bookings"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to My Bookings
      </Link>

      {/* Header Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={booking.image_url}
            alt={booking.resource_name}
            className="w-16 h-16 rounded-2xl object-cover border border-slate-200 flex-shrink-0"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                {booking.resource_category}
              </span>
              <StatusBadge status={booking.status} size="xs" />
            </div>
            <h1 className="text-xl font-black text-slate-900">{booking.resource_name}</h1>
            <div className="text-xs text-slate-500 mt-0.5">
              {new Date(booking.start_time).toLocaleDateString()} ({booking.start_time?.substring(11, 16)} - {booking.end_time?.substring(11, 16)})
            </div>
          </div>
        </div>

        {/* Action Buttons for Student / Owner */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {canCheckIn && (
            <Link
              to={`/bookings/${booking.id}/checkin`}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition shadow-sm"
            >
              Start Check-In
            </Link>
          )}

          {canReturn && (
            <Link
              to={`/bookings/${booking.id}/return`}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition shadow-sm"
            >
              Complete Return
            </Link>
          )}

          {canExtend && isBorrower && (
            <button
              onClick={() => {
                setExtendError(null);
                setExtendSuccess(null);
                setShowExtendModal(true);
              }}
              className="px-3.5 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-100 transition inline-flex items-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" /> Extend (+1 Hr)
            </button>
          )}

          {canCancel && (
            <button
              onClick={() => {
                setCancelWarning(null);
                setShowCancelModal(true);
              }}
              className="px-3.5 py-2 border border-slate-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" /> Cancel Booking
            </button>
          )}
        </div>
      </div>

      {/* Timeline Stepper */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
          Booking Lifecycle Timeline
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          {steps.map((st, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  st.done
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}>
                  {st.done ? '✓' : i + 1}
                </span>
                <span className="h-0.5 flex-1 bg-slate-200 hidden sm:block"></span>
              </div>
              <div className="text-xs font-bold text-slate-900 pt-1">{st.title}</div>
              <div className="text-[10px] text-slate-400 truncate">
                {st.date ? (st.date.length > 10 ? new Date(st.date).toLocaleDateString() : st.date) : 'Pending'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Condition Reports Side-by-Side (Before & After) */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-slate-900">Evidence-Based Condition Records</h3>
        <ConditionComparison
          checkinReport={checkinReport}
          returnReport={returnReport}
          aiSuggestion={incident ? {
            summary: incident.ai_summary,
            suggested_severity: incident.ai_suggested_severity,
            recommended_action: incident.resolution_notes || 'Owner reviewed condition report.'
          } : null}
        />
      </div>

      {/* Audit Trail for this specific booking */}
      {booking.audit_trail && booking.audit_trail.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900">Cryptographic Audit Chain for this Transaction</h3>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {booking.audit_trail.map(log => (
              <div key={log.id} className="py-2.5 flex items-center justify-between gap-4">
                <div>
                  <span className="font-bold text-slate-900">{log.action}</span>
                  <span className="text-slate-500 ml-2">by {log.actor_name} ({log.actor_role})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-400">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600" title={log.hash}>
                    {log.hash?.substring(0, 12)}...
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: Request 1-Hour Extension with Conflict Detection
      ────────────────────────────────────────────────────────────── */}
      {showExtendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 text-indigo-600 font-bold">
                <Clock className="w-5 h-5" />
                <h3 className="text-lg font-black text-slate-900">Request 1-Hour Extension</h3>
              </div>
              <button
                onClick={() => setShowExtendModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Current End Time:</span>
                <span className="font-bold text-slate-800">
                  {new Date(booking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Requested Extension:</span>
                <span className="font-bold text-indigo-600">+1 Hour</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold">
                <span className="text-slate-700">New Scheduled Return:</span>
                <span className="text-emerald-700">{proposedEndTime}</span>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              ⚡ <strong>Automatic Conflict Check:</strong> The system verifies instant schedule availability. If another student has booked or requested this slot, extension will be blocked to preserve fair access.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Reason for extension (optional):</label>
              <textarea
                value={extendReason}
                onChange={(e) => setExtendReason(e.target.value)}
                rows={2}
                placeholder="e.g. Laser engraving detailed pass is still completing..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Conflict Error Message */}
            {extendError && (
              <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs text-rose-700 animate-shake">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
                <div>
                  <strong className="block font-bold">Scheduling Conflict Blocked Extension</strong>
                  {extendError}
                </div>
              </div>
            )}

            {/* Success Message */}
            {extendSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{extendSuccess}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowExtendModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleRequestExtension}
                disabled={extending}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm inline-flex items-center gap-2"
              >
                {extending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Checking Conflicts...
                  </>
                ) : (
                  'Confirm +1 Hour Extension'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: Cancel Booking with Fairness Cooldown Warnings
      ────────────────────────────────────────────────────────────── */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 text-rose-600 font-bold">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-lg font-black text-slate-900">Cancel Booking Request</h3>
              </div>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Cooldown Policy Info Banner */}
            <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-2xl space-y-2 text-xs text-amber-900">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5 text-amber-800">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  30-Day Cancellation Cooldown Status
                </span>
                <span className="bg-amber-100 px-2.5 py-0.5 rounded-full text-amber-800">
                  {booking.cancellations_last_30_days || 0} / {booking.cancellation_penalty_threshold || 3} Used
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800/90">
                To prevent slot hoarding, accounts with <strong>{booking.cancellation_penalty_threshold || 3} or more cancellations in 30 days</strong> enter a <strong>{booking.cancellation_block_days || 7}-day cooldown</strong> pausing new booking requests.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Reason for cancellation (required):</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                placeholder="e.g. Project scope changed or lab session rescheduled..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            {cancelWarning && (
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl text-xs text-rose-800 font-semibold">
                {cancelWarning}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={cancelling}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 transition shadow-sm"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
