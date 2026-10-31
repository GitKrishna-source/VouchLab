import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { ConditionComparison } from '../components/ConditionComparison.jsx';
import {
  ArrowLeft, Calendar, Clock, MapPin, User, CheckCircle2,
  AlertTriangle, ShieldCheck, Sparkles, FileText, ChevronRight
} from 'lucide-react';

export function BookingDetail() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getBookingDetail(id);
        setBooking(data);
      } catch (err) {
        setError(err.message || 'Failed to load booking');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return <div className="py-20 text-center text-slate-400">Loading booking timeline...</div>;
  }

  if (error || !booking) {
    return <div className="p-8 text-center text-rose-600">{error || 'Booking not found'}</div>;
  }

  const checkinReport = booking.condition_reports?.find(r => r.type === 'checkin');
  const returnReport = booking.condition_reports?.find(r => r.type === 'return');
  const incident = booking.incidents?.[0];

  // Timeline steps
  const steps = [
    { title: 'Request Submitted', date: booking.created_at, done: true },
    { title: 'Owner Decision', date: booking.decision_reason ? 'Approved' : null, done: booking.status !== 'pending' && booking.status !== 'waitlisted' },
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
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={booking.image_url}
            alt={booking.resource_name}
            className="w-16 h-16 rounded-2xl object-cover border border-slate-200"
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

        <div className="text-right text-xs text-slate-500 self-start sm:self-auto">
          <div>Applicant: <strong className="text-slate-800">{booking.user_name}</strong></div>
          <div>Owner: <strong className="text-slate-800">{booking.owner_name}</strong></div>
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
    </div>
  );
}

