import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { ExplainScoreModal } from '../components/ExplainScoreModal.jsx';
import {
  Inbox, Check, X, Clock, HelpCircle, AlertCircle, Sparkles,
  Scale, ShieldAlert, FileText, ChevronRight
} from 'lucide-react';

export function OwnerDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(true);

  // Score breakdown modal
  const [breakdownModalData, setBreakdownModalData] = useState(null);

  // Override modal
  const [overrideModalBooking, setOverrideModalBooking] = useState(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadIncomingRequests();
  }, [user]);

  async function loadIncomingRequests() {
    setLoading(true);
    try {
      const data = await api.getIncomingRequests();
      setRequests(data || []);
    } catch (err) {
      console.error('Failed to load incoming requests:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleDecision = async (booking, action) => {
    // Check if this approval overrides recommendation
    if (action === 'approve' && booking.waitlist_position > 1) {
      setOverrideModalBooking(booking);
      setOverrideReason('');
      return;
    }

    executeDecision(booking.id, action);
  };

  const executeDecision = async (bookingId, action, overrideText = null) => {
    setActionLoading(true);
    try {
      await api.decideBooking(bookingId, action, overrideText);
      setOverrideModalBooking(null);
      await loadIncomingRequests();
    } catch (err) {
      alert(err.message || 'Decision failed');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRequests = requests.filter(r => {
    if (activeTab === 'pending') return r.status === 'pending';
    if (activeTab === 'approved') return r.status === 'approved' || r.status === 'checked_in';
    if (activeTab === 'rejected') return r.status === 'rejected';
    if (activeTab === 'waitlist') return r.status === 'waitlisted';
    return true;
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved' || r.status === 'checked_in').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;
  const waitlistCount = requests.filter(r => r.status === 'waitlisted').length;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Incoming Equipment Requests
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review applicant queues with explainable fair-share allocation recommendations
          </p>
        </div>

        {/* Lab Trust Banner */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
          <Scale className="w-4 h-4" /> Algorithmic Fair-Share Recommendations Active
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Pending</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
            activeTab === 'pending' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {pendingCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('approved')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'approved'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Approved</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
            activeTab === 'approved' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {approvedCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('waitlist')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'waitlist'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Waitlist</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
            activeTab === 'waitlist' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {waitlistCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('rejected')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'rejected'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Rejected</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
            activeTab === 'rejected' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {rejectedCount}
          </span>
        </button>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">Loading incoming requests...</div>
      ) : filteredRequests.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 text-slate-500 text-xs">
          No requests in this category.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => {
            const isRank1 = req.waitlist_position === 1;

            return (
              <div
                key={req.id}
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4 hover:border-indigo-300 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Applicant & Equipment */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-base text-slate-900">{req.user_name}</span>
                      <span className="text-xs text-slate-500">({req.user_category?.replace('_', ' ')})</span>
                      <StatusBadge status={req.status} size="xs" />
                    </div>

                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-3">
                      <span className="font-bold text-indigo-700">{req.resource_name}</span>
                      <span>•</span>
                      <span>{new Date(req.start_time).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>
                        {new Date(req.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(req.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 pt-1 italic">
                      "{req.purpose}"
                    </p>
                  </div>

                  {/* Right: Transparent Fair-Share Recommendation Badge */}
                  <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <div className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                        isRank1
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        <Sparkles className="w-3.5 h-3.5" />
                        {isRank1 ? 'Ranked #1 (Recommended)' : `Placed #${req.waitlist_position} in Queue`}
                        <span className="font-mono text-[11px] bg-white/70 px-1.5 py-0.5 rounded ml-1">
                          Score: {req.score}
                        </span>
                      </div>

                      {/* Why? Modal Trigger */}
                      {req.score_breakdown && (
                        <button
                          type="button"
                          onClick={() => setBreakdownModalData({ breakdown: req.score_breakdown, applicantName: req.user_name })}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-1 transition-colors"
                        >
                          <HelpCircle className="w-3.5 h-3.5" /> Why?
                        </button>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400 max-w-sm text-left md:text-right">
                      {req.decision_reason}
                    </div>
                  </div>
                </div>

                {/* Plain-Language Explanation Snippet */}
                {req.override_reason && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-0.5">
                    <span className="font-bold uppercase tracking-wider text-[10px] text-amber-700">
                      Owner Override Logged:
                    </span>
                    <div>"{req.override_reason}"</div>
                  </div>
                )}

                {/* Actions */}
                {req.status === 'pending' && (
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleDecision(req, 'reject')}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5" /> Reject Request
                    </button>

                    <button
                      onClick={() => handleDecision(req, 'approve')}
                      disabled={actionLoading}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve Applicant
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Explain Score Breakdown Modal */}
      {breakdownModalData && (
        <ExplainScoreModal
          isOpen={Boolean(breakdownModalData)}
          breakdown={breakdownModalData.breakdown}
          applicantName={breakdownModalData.applicantName}
          onClose={() => setBreakdownModalData(null)}
        />
      )}

      {/* Owner Override Reason Modal */}
      {overrideModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center gap-2.5 text-amber-600 font-bold">
              <ShieldAlert className="w-5 h-5" /> Mandatory Override Reason
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You are approving <strong className="text-slate-900">{overrideModalBooking.user_name}</strong> (Placed #{overrideModalBooking.waitlist_position}, Score {overrideModalBooking.score}), which overrides the top recommendation.
            </p>

            <p className="text-xs text-slate-500">
              Per campus fair-share governance, all overrides require a mandatory written justification permanently recorded on the SHA-256 tamper-evident audit ledger.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Written Justification (Mandatory)
              </label>
              <textarea
                required
                rows={3}
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="e.g. Approved due to urgent grant filing deadline tomorrow morning..."
                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOverrideModalBooking(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading || overrideReason.trim().length < 5}
                onClick={() => executeDecision(overrideModalBooking.id, 'approve', overrideReason.trim())}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                {actionLoading ? 'Recording Override...' : 'Confirm Override Approval'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

