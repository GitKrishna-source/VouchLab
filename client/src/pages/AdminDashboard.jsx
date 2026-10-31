import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { AiUsageInsightCard } from '../components/AiUsageInsightCard.jsx';
import {
  ShieldCheck, ShieldAlert, RotateCcw, AlertTriangle, Users,
  Layers, CheckCircle2, Clock, Check, X, FileText, Sparkles, Scale, Terminal, RefreshCw
} from 'lucide-react';

export function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [hasBackup, setHasBackup] = useState(false);
  const [loading, setLoading] = useState(true);

  // Verification state
  const [verificationResult, setVerificationResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  // Tamper tool state
  const [tampering, setTampering] = useState(false);

  // AI Usage Flags State
  const [aiFlags, setAiFlags] = useState([]);
  const [scanningAi, setScanningAi] = useState(false);

  useEffect(() => {
    loadDashboard();
    loadAuditLogs();
    loadAiFlags();
  }, [user]);

  async function loadAiFlags() {
    try {
      const data = await api.getAiFlags();
      setAiFlags(data || []);
    } catch (e) {
      console.error('Failed to load AI flags:', e);
    }
  }

  async function handleTriggerScan() {
    try {
      setScanningAi(true);
      await api.triggerAiScan();
      await loadAiFlags();
    } catch (err) {
      alert(err.message || 'Scan failed');
    } finally {
      setScanningAi(false);
    }
  }

  async function loadDashboard() {
    try {
      const data = await api.getAdminStats();
      setStats(data?.stats);
      setRecentActivity(data?.recentActivity || []);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadAuditLogs() {
    try {
      const data = await api.getAuditLogs({ limit: 50 });
      setAuditLogs(data?.logs || []);
      setTotalLogs(data?.total || 0);
      setHasBackup(data?.hasTamperedRowBackup || false);
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    }
  }

  const handleVerifyChain = async () => {
    setVerifying(true);
    try {
      const result = await api.verifyAuditChain();
      setVerificationResult(result);
    } catch (err) {
      alert(err.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleTamperRow = async () => {
    setTampering(true);
    try {
      // Tamper with row #2 or #3
      const targetId = auditLogs.length > 2 ? auditLogs[auditLogs.length - 3].id : 2;
      await api.tamperAuditRow(targetId, JSON.stringify({
        tampered_by_attacker: true,
        note: 'Unauthorized database alteration demonstrated for hackathon judges!'
      }));
      setHasBackup(true);
      await loadAuditLogs();
      // Auto run verification to demonstrate detection
      const result = await api.verifyAuditChain();
      setVerificationResult(result);
    } catch (err) {
      alert(err.message || 'Tamper failed');
    } finally {
      setTampering(false);
    }
  };

  const handleRestoreRow = async () => {
    setTampering(true);
    try {
      await api.restoreAuditRow();
      setHasBackup(false);
      await loadAuditLogs();
      const result = await api.verifyAuditChain();
      setVerificationResult(result);
    } catch (err) {
      alert(err.message || 'Restore failed');
    } finally {
      setTampering(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Central Facilities & Audit Governance
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tamper-evident append-only cryptographic ledger and campus access integrity
          </p>
        </div>

        {/* Verification Trigger Button */}
        <button
          onClick={handleVerifyChain}
          disabled={verifying}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <ShieldCheck className="w-4 h-4" />
          {verifying ? 'Recomputing SHA-256 Hashes...' : 'Verify Chain Integrity'}
        </button>
      </div>

      {/* Verification Result Banner */}
      {verificationResult && (
        <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn ${
          verificationResult.valid
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-start gap-3">
            {verificationResult.valid ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className="font-bold text-sm">
                {verificationResult.valid
                  ? 'Cryptographic Hash Chain 100% Intact & Untampered'
                  : '⚠️ Cryptographic Hash Chain Broken / Tamper Detected!'}
              </h4>
              <p className="text-xs opacity-90 mt-0.5">
                {verificationResult.message || verificationResult.reason}
              </p>
            </div>
          </div>

          <div className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-white/70 self-start sm:self-auto">
            {verificationResult.valid
              ? `Verified ${verificationResult.totalEntries} entries`
              : `Tampered at row #${verificationResult.brokenId}`}
          </div>
        </div>
      )}

      {/* Judge Demo Tool Box */}
      <div className="p-5 bg-slate-900 text-white rounded-3xl shadow-lg border border-slate-700 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <Terminal className="w-4 h-4" />
            </span>
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-300">
                Hackathon Judge Demo Tool: Cryptographic Tamper Simulation
              </h4>
              <p className="text-xs text-slate-400">
                Test the tamper-evident engine: modify raw database payload without re-hashing to demonstrate tamper detection.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!hasBackup ? (
              <button
                onClick={handleTamperRow}
                disabled={tampering}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              >
                <AlertTriangle className="w-3.5 h-3.5" /> Tamper with a Row (Simulate Breach)
              </button>
            ) : (
              <button
                onClick={handleRestoreRow}
                disabled={tampering}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Restore Original Row (Passes Again)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Campus Users</div>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats?.totalUsers || 8}</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">
            {stats?.verifiedUsers || 8} verified active
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Verifications</div>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats?.pendingVerifications || 0}</div>
          <div className="text-[11px] text-amber-600 font-semibold mt-1">Awaiting owner sign-off</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Lab Resources</div>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats?.totalResources || 8}</div>
          <div className="text-[11px] text-indigo-600 font-semibold mt-1">Across 4 departments</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ledger Hash Entries</div>
          <div className="text-2xl font-black text-slate-900 mt-2">{totalLogs || 10}</div>
          <div className="text-[11px] text-indigo-600 font-semibold mt-1">SHA-256 chained</div>
        </div>
      </div>

      {/* AI Usage Anomaly & Slot-Hoarding Insights Section */}
      <div className="space-y-4 bg-gradient-to-r from-indigo-50/60 via-purple-50/30 to-slate-50 p-6 rounded-3xl border border-indigo-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-black text-slate-900">
                AI Pattern Scanner & Fair-Usage Governance
              </h3>
              <p className="text-xs text-slate-500">
                Human-in-the-loop oversight: Detects reservation churning and slot-hoarding before applying administrative holds
              </p>
            </div>
          </div>
          <button
            onClick={handleTriggerScan}
            disabled={scanningAi}
            className="px-4 py-2 bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-xl text-xs font-bold shadow-sm transition inline-flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${scanningAi ? 'animate-spin' : ''}`} />
            {scanningAi ? 'Analyzing Patterns...' : 'Run Campus AI Scan'}
          </button>
        </div>

        {aiFlags.length === 0 ? (
          <div className="p-6 bg-white/80 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
            No active usage anomalies flagged. All student booking patterns are within community etiquette guidelines.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {aiFlags.map(flag => (
              <AiUsageInsightCard
                key={flag.id}
                flag={flag}
                onReviewed={() => {
                  loadAiFlags();
                  loadAuditLogs();
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Audit Log Ledger Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
        <div className="p-6 pb-2 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900">Cryptographic SHA-256 Audit Ledger</h3>
            <p className="text-xs text-slate-500">Append-only log of every reservation, qualification, and condition report</p>
          </div>
          <span className="text-xs font-bold text-slate-400">
            Total Records: {totalLogs}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                <th className="py-3 px-4"># ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">SHA-256 Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">#{log.id}</td>
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{log.actor_name || 'System'}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 capitalize">
                      {log.actor_role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-[11px] font-bold text-indigo-700">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 capitalize">
                    {log.entity_type} #{log.entity_id}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                    <span className="bg-slate-100 px-2 py-1 rounded" title={log.hash}>
                      {log.hash?.substring(0, 16)}...
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

