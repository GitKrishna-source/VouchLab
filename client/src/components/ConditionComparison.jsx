import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Sparkles, Camera } from 'lucide-react';

export function ConditionComparison({ checkinReport, returnReport, aiSuggestion }) {
  if (!checkinReport && !returnReport) {
    return (
      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500 text-sm">
        No condition records filed yet.
      </div>
    );
  }

  const workingChanged = checkinReport && returnReport && checkinReport.is_working !== returnReport.is_working;
  const scratchesAdded = checkinReport && returnReport && !checkinReport.has_scratches && returnReport.has_scratches;
  const partsMissing = checkinReport && returnReport && !checkinReport.missing_parts && returnReport.missing_parts;
  const cleanlinessDegraded = checkinReport && returnReport && (checkinReport.cleanliness - returnReport.cleanliness > 1);

  const hasDifferences = workingChanged || scratchesAdded || partsMissing || cleanlinessDegraded;

  return (
    <div className="space-y-6">
      {/* AI Suggestion Banner if differences exist */}
      {(aiSuggestion || hasDifferences) && (
        <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-500 text-white rounded-xl shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                  AI Suggestion (Human-in-the-Loop)
                </span>
                {aiSuggestion?.suggested_severity && (
                  <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${
                    aiSuggestion.suggested_severity === 'critical' ? 'bg-rose-100 text-rose-800' :
                    aiSuggestion.suggested_severity === 'high' ? 'bg-orange-100 text-orange-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    Suggested Severity: {aiSuggestion.suggested_severity}
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-slate-900">
                {aiSuggestion?.summary || 'Automated condition difference detected between initial collection and return.'}
              </p>
              <p className="text-xs text-slate-600">
                {aiSuggestion?.recommended_action || 'Inspect item surface and confirm whether damage is cosmetic or requires replacement.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Side-by-Side Condition Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Before / Check-in */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                Step 1: Before Use (Check-In)
              </span>
              <div className="text-xs text-slate-500 mt-1">
                {checkinReport?.created_at ? new Date(checkinReport.created_at).toLocaleString() : 'Not recorded'}
              </div>
            </div>
            <Camera className="w-5 h-5 text-slate-400" />
          </div>

          {/* Photo Gallery */}
          {checkinReport?.photos && checkinReport.photos.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {checkinReport.photos.map((url, i) => (
                <div key={i} className="aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                  <img src={url} alt={`Check-in ${i}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-400 text-center">No photos uploaded</div>
          )}

          {/* Checklist */}
          {checkinReport ? (
            <div className="space-y-2 text-xs font-medium">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <span className="text-slate-600">Operational & Working:</span>
                <span className={checkinReport.is_working ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                  {checkinReport.is_working ? 'Yes (Functional)' : 'Non-Functional'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <span className="text-slate-600">Visible Scratches / Scuffs:</span>
                <span className={checkinReport.has_scratches ? 'text-amber-700 font-bold' : 'text-emerald-700 font-bold'}>
                  {checkinReport.has_scratches ? 'Scratches Present' : 'None (Clean)'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <span className="text-slate-600">All Accessories & Parts:</span>
                <span className={checkinReport.missing_parts ? 'text-rose-700 font-bold' : 'text-emerald-700 font-bold'}>
                  {checkinReport.missing_parts ? 'Missing Parts' : 'Complete'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <span className="text-slate-600">Cleanliness:</span>
                <span className="text-slate-900 font-bold">{checkinReport.cleanliness} / 5 Stars</span>
              </div>
              {checkinReport.notes && (
                <div className="p-2.5 bg-slate-50 rounded-lg text-slate-700 text-xs italic">
                  "{checkinReport.notes}"
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic">Check-in condition pending</div>
          )}
        </div>

        {/* After / Return */}
        <div className={`p-5 bg-white rounded-2xl border shadow-sm space-y-4 ${
          hasDifferences ? 'border-amber-300 ring-2 ring-amber-400/20' : 'border-slate-200'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                hasDifferences ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-700'
              }`}>
                Step 2: After Use (Return)
              </span>
              <div className="text-xs text-slate-500 mt-1">
                {returnReport?.created_at ? new Date(returnReport.created_at).toLocaleString() : 'Not returned yet'}
              </div>
            </div>
            <Camera className="w-5 h-5 text-slate-400" />
          </div>

          {/* Return Photos */}
          {returnReport?.photos && returnReport.photos.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {returnReport.photos.map((url, i) => (
                <div key={i} className="aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                  <img src={url} alt={`Return ${i}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-400 text-center">No return photos recorded</div>
          )}

          {/* Return Checklist with Auto-Highlighted Diffs */}
          {returnReport ? (
            <div className="space-y-2 text-xs font-medium">
              <div className={`flex items-center justify-between p-2 rounded-lg ${
                workingChanged ? 'bg-rose-50 border border-rose-200 text-rose-800 font-bold' : 'bg-slate-50'
              }`}>
                <span className="text-slate-600">Operational & Working:</span>
                <span>
                  {returnReport.is_working ? 'Yes (Functional)' : 'Non-Functional (DIFF)'}
                </span>
              </div>

              <div className={`flex items-center justify-between p-2 rounded-lg ${
                scratchesAdded ? 'bg-amber-50 border border-amber-200 text-amber-800 font-bold' : 'bg-slate-50'
              }`}>
                <span className="text-slate-600">Visible Scratches / Scuffs:</span>
                <span>
                  {returnReport.has_scratches ? '⚠️ New Scratch Detected' : 'None'}
                </span>
              </div>

              <div className={`flex items-center justify-between p-2 rounded-lg ${
                partsMissing ? 'bg-rose-50 border border-rose-200 text-rose-800 font-bold' : 'bg-slate-50'
              }`}>
                <span className="text-slate-600">All Accessories & Parts:</span>
                <span>
                  {returnReport.missing_parts ? '⚠️ Missing Parts Flagged' : 'Complete'}
                </span>
              </div>

              <div className={`flex items-center justify-between p-2 rounded-lg ${
                cleanlinessDegraded ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50'
              }`}>
                <span className="text-slate-600">Cleanliness:</span>
                <span className="font-bold text-slate-900">{returnReport.cleanliness} / 5 Stars</span>
              </div>

              {returnReport.notes && (
                <div className="p-2.5 bg-slate-50 rounded-lg text-slate-700 text-xs italic">
                  "{returnReport.notes}"
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic">Equipment is currently in use</div>
          )}
        </div>
      </div>
    </div>
  );
}

