import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import {
  AlertTriangle, Sparkles, CheckCircle2, ShieldAlert, FileText,
  Clock, MapPin, User, Check
} from 'lucide-react';

export function IncidentsPage() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Resolution modal
  const [activeIncident, setActiveIncident] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadIncidents();
  }, [user]);

  async function loadIncidents() {
    setLoading(true);
    try {
      const data = await api.getIncidents();
      setIncidents(data || []);
    } catch (err) {
      console.error('Failed to load incidents:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!activeIncident || !resolutionNotes.trim()) return;

    setActionLoading(true);
    try {
      await api.resolveIncident(activeIncident.id, resolutionNotes.trim(), 'inspected_and_logged');
      setActiveIncident(null);
      setResolutionNotes('');
      await loadIncidents();
    } catch (err) {
      alert(err.message || 'Resolution failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Damage & Condition Incident Reports
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Human-in-the-loop review of automated condition discrepancies and return diffs
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
          <Sparkles className="w-4 h-4 text-amber-600" /> AI Diagnostic Suggestions Active
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">Loading incident records...</div>
      ) : incidents.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 text-xs text-slate-400">
          No open incident or damage reports on file.
        </div>
      ) : (
        <div className="space-y-4">
          {incidents.map((inc) => (
            <div
              key={inc.id}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 hover:border-amber-300 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base text-slate-900">{inc.title}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      inc.severity === 'critical' ? 'bg-rose-100 text-rose-800' :
                      inc.severity === 'high' ? 'bg-orange-100 text-orange-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {inc.severity} Severity
                    </span>
                    <StatusBadge status={inc.status} size="xs" />
                  </div>

                  <div className="text-xs text-slate-500 flex items-center gap-3">
                    <span>Resource: <strong className="text-slate-800">{inc.resource_name}</strong></span>
                    <span>•</span>
                    <span>Reported by: {inc.reporter_name}</span>
                    <span>•</span>
                    <span>{new Date(inc.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {inc.status === 'open' && (user?.role === 'owner' || user?.role === 'manager' || user?.role === 'admin') && (
                  <button
                    onClick={() => { setActiveIncident(inc); setResolutionNotes(''); }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-indigo-600/20 transition-all self-start sm:self-auto flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" /> Resolve Incident
                  </button>
                )}
              </div>

              {/* AI Diagnostic Suggestion Banner */}
              {inc.ai_summary && (
                <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900 uppercase tracking-wider text-[10px]">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" /> AI Diagnostic Summary (Suggestion Only)
                  </div>
                  <p className="text-slate-800 font-medium leading-relaxed">
                    {inc.ai_summary}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    AI suggestions never apply automatic penalties. All resolutions require explicit human sign-off.
                  </p>
                </div>
              )}

              {/* Photos if any */}
              {inc.photos && inc.photos.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pt-1">
                  {inc.photos.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`Damage photo ${i}`}
                      className="w-24 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                  ))}
                </div>
              )}

              {/* Resolution Notes if Resolved */}
              {inc.resolution_notes && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-950 space-y-0.5">
                  <div className="font-bold uppercase tracking-wider text-[10px] text-emerald-800">
                    Official Resolution Logged:
                  </div>
                  <p>"{inc.resolution_notes}"</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Resolve Incident Modal */}
      {activeIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <h3 className="font-bold text-base text-slate-900">Resolve Damage Incident</h3>
            <p className="text-xs text-slate-500">
              Provide your official owner/manager resolution note for {activeIncident.resource_name}. This decision will be permanently appended to the SHA-256 audit ledger.
            </p>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Resolution Decision & Notes
                </label>
                <textarea
                  rows={3}
                  required
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g. Surface scratch inspected, optical elements clean. Standard cosmetic wear logged without student penalty."
                  className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveIncident(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  {actionLoading ? 'Recording...' : 'Finalize Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

