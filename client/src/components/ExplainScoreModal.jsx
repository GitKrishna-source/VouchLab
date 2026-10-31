import React from 'react';
import { X, Scale, Calculator, Info, CheckCircle2 } from 'lucide-react';

export function ExplainScoreModal({ isOpen, onClose, breakdown, applicantName }) {
  if (!isOpen || !breakdown) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-900 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur">
              <Scale className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <h3 className="font-bold text-base">Explainable Fair-Share Allocation</h3>
              <p className="text-xs text-indigo-200">Algorithmic priority breakdown for {applicantName || 'Applicant'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Transparent Formula */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-indigo-600" /> Transparent Campus Formula
            </div>
            <div className="font-mono text-xs font-semibold text-indigo-950 bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
              score = (waiting_days × W_wait) - (hours_used_30d × W_usage) + category_bonus
            </div>
          </div>

          {/* Breakdown Items */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Applicant Specific Parameters</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                <div className="text-xs text-indigo-600 font-medium">Waiting Time</div>
                <div className="text-lg font-bold text-slate-900">{breakdown.waiting_days} days</div>
                <div className="text-xs text-slate-500 mt-0.5">+{breakdown.wait_contribution} pts (wt: {breakdown.w_wait})</div>
              </div>

              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                <div className="text-xs text-amber-700 font-medium">Past 30-Day Usage</div>
                <div className="text-lg font-bold text-slate-900">{breakdown.hours_used_last_30_days} hrs</div>
                <div className="text-xs text-slate-500 mt-0.5">-{breakdown.usage_penalty} pts (wt: {breakdown.w_usage})</div>
              </div>
            </div>

            <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center justify-between">
              <div>
                <div className="text-xs text-emerald-700 font-medium">Academic Category</div>
                <div className="text-sm font-semibold text-slate-900 capitalize">{breakdown.project_category?.replace('_', ' ')}</div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  +{breakdown.category_bonus} pts bonus
                </span>
              </div>
            </div>
          </div>

          {/* Final Score Computation */}
          <div className="p-4 bg-indigo-600 text-white rounded-xl flex items-center justify-between shadow-md shadow-indigo-600/20">
            <div>
              <div className="text-xs text-indigo-200 uppercase font-semibold tracking-wider">Calculated Fair-Share Score</div>
              <div className="text-2xl font-black">{breakdown.final_score}</div>
            </div>
            <div className="text-right text-xs text-indigo-100 max-w-[200px]">
              ({breakdown.wait_contribution}) - ({breakdown.usage_penalty}) + ({breakdown.category_bonus}) = <span className="font-bold underline">{breakdown.final_score}</span>
            </div>
          </div>

          {/* Plain English explanation */}
          <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 flex items-start gap-2 border border-slate-200">
            <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <p>
              Fair-share prevents lab hoarding by penalizing heavy past users while boosting urgent thesis/academic projects and rewarding students waiting in queue.
            </p>
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  );
}

