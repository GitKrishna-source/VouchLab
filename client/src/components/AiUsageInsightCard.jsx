import React, { useState } from 'react';
import { api } from '../services/api.js';
import {
  Sparkles, AlertTriangle, ShieldAlert, CheckCircle2,
  Clock, X, Send, PauseCircle, ChevronDown, ChevronUp, Check
} from 'lucide-react';

export function AiUsageInsightCard({ flag, onReviewed }) {
  const [expanded, setExpanded] = useState(false);
  const [modalAction, setModalAction] = useState(null); // 'dismiss' | 'warning' | 'cooldown'
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isResolved = flag.status !== 'pending_review';

  async function handleConfirmAction() {
    if (!modalAction) return;
    try {
      setSubmitting(true);
      await api.reviewAiFlag(flag.id, modalAction, reviewNotes);
      setModalAction(null);
      setReviewNotes('');
      if (onReviewed) onReviewed();
    } catch (err) {
      alert(err.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  }

  const severityColor = {
    high: 'bg-rose-50 text-rose-700 border-rose-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    low: 'bg-blue-50 text-blue-700 border-blue-200'
  }[flag.severity] || 'bg-slate-50 text-slate-700 border-slate-200';

  return (
    <div className={`p-5 rounded-3xl border transition-all ${
      isResolved
        ? 'bg-slate-50/70 border-slate-200 opacity-80'
        : 'bg-white border-indigo-100 shadow-sm hover:border-indigo-200'
    }`}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                AI Suggestion (Human-in-the-Loop)
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${severityColor}`}>
                {flag.severity?.toUpperCase()} SEVERITY
              </span>
              {isResolved && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {flag.status.replace('_', ' ').toUpperCase()}
                </span>
              )}
            </div>
            <h4 className="text-sm font-black text-slate-900 mt-1">
              {flag.pattern_type} • <span className="font-semibold text-slate-600">{flag.user_name}</span>
            </h4>
          </div>
        </div>

        {/* User Info & Toggle */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <span className="text-xs text-slate-500 hidden sm:inline">{flag.user_email}</span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 text-xs font-semibold inline-flex items-center gap-1"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Summary Narrative */}
      <p className="text-xs text-slate-600 mt-3 leading-relaxed">
        {flag.summary}
      </p>

      {/* Metrics Breakdown Pills */}
      {flag.metrics && Object.keys(flag.metrics).length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100 text-[11px]">
          {flag.metrics.cancellations_30d !== undefined && (
            <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700 font-medium">
              ❌ Cancellations (30d): <strong>{flag.metrics.cancellations_30d}</strong>
            </span>
          )}
          {flag.metrics.prime_cancellations !== undefined && (
            <span className="bg-amber-50 text-amber-800 border border-amber-200/60 px-2.5 py-1 rounded-lg font-medium">
              ⏰ Prime-Hours (10am-4pm): <strong>{flag.metrics.prime_cancellations}</strong>
            </span>
          )}
          {flag.metrics.churn_rate && (
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded-lg font-medium">
              📊 Churn Rate: <strong>{flag.metrics.churn_rate}</strong>
            </span>
          )}
        </div>
      )}

      {/* Expanded Details & Human Decision Controls */}
      {(!isResolved || expanded) && (
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70 text-xs">
            <span className="text-slate-500 font-bold block mb-0.5">Recommended Human Action:</span>
            <span className="text-slate-800 font-medium">{flag.suggested_action}</span>
          </div>

          {!isResolved ? (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <span className="text-[11px] text-slate-400 italic">
                * An authorized human must confirm before any notice or cooldown is applied.
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setModalAction('dismiss');
                    setReviewNotes('Normal project schedule adjustment; verified with applicant.');
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => {
                    setModalAction('warning');
                    setReviewNotes('Please refrain from cancelling peak-hour reservations on short notice to allow peers fair access.');
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-sm inline-flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Send Advisory Notice
                </button>
                <button
                  onClick={() => {
                    setModalAction('cooldown');
                    setReviewNotes('Account placed on 7-day cooldown due to repeated slot hoarding.');
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm inline-flex items-center gap-1.5"
                >
                  <PauseCircle className="w-3.5 h-3.5" /> Enforce 7-Day Cooldown
                </button>
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>Reviewed by <strong>{flag.reviewer_name || 'Staff'}</strong> on {new Date(flag.reviewed_at).toLocaleDateString()}</span>
              {flag.review_notes && <span className="italic">Note: "{flag.review_notes}"</span>}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal for Human Review */}
      {modalAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                Confirm Human Action: {modalAction.toUpperCase()}
              </h3>
              <button
                onClick={() => setModalAction(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Target Applicant: <strong className="text-slate-900">{flag.user_name}</strong> ({flag.user_email})
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Official Action / Notice Note:</label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={3}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Enter explanation for the student and audit ledger..."
              />
            </div>

            <div className="bg-indigo-50/70 border border-indigo-100 p-3 rounded-xl text-[11px] text-indigo-900 leading-relaxed">
              🛡️ <strong>Tamper-Evident Audit Guarantee:</strong> Your action, timestamp, and explanation will be cryptographically hashed (SHA-256) into the immutable audit chain.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModalAction(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={submitting}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition shadow-sm ${
                  modalAction === 'cooldown'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : (modalAction === 'warning' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-800 hover:bg-slate-900')
                }`}
              >
                {submitting ? 'Signing Audit Entry...' : 'Confirm & Log Decision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

