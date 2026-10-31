import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import {
  Award, ShieldCheck, FileCheck, CheckCircle2, Clock,
  Upload, Sparkles, ExternalLink, UserCheck
} from 'lucide-react';

export function PassportPage() {
  const { user } = useAuth();
  const [passport, setPassport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPassport() {
      try {
        const data = await api.getMyPassport();
        setPassport(data);
      } catch (err) {
        console.error('Failed to load passport:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPassport();
  }, [user]);

  if (loading) {
    return <div className="py-20 text-center text-slate-400">Loading your Eligibility Passport...</div>;
  }

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 text-white p-8 rounded-3xl shadow-xl border border-indigo-700/50 space-y-4 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
              <Award className="w-8 h-8 text-amber-300" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-indigo-200 text-xs font-bold mb-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Campus Passport
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{user?.name}</h1>
              <p className="text-xs text-indigo-200 mt-0.5">
                {user?.department || 'Engineering & Design'} • Role: {user?.role?.toUpperCase()} • Category: {user?.category?.replace('_', ' ')}
              </p>
            </div>
          </div>

          <div className="text-right text-xs bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 self-start sm:self-auto">
            <div className="text-indigo-200">Active Badges</div>
            <div className="text-2xl font-black text-white">{passport?.badges?.length || 0}</div>
          </div>
        </div>
      </div>

      {/* Earned Badges Grid */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900">Earned Qualification Badges</h2>
        </div>

        {passport?.badges?.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-slate-300 text-xs text-slate-400">
            No badges earned yet. Take equipment safety quizzes to qualify.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {passport?.badges?.map((b) => (
              <div
                key={b.id}
                className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm flex items-start gap-3 hover:border-indigo-300 transition-all"
              >
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl shrink-0 mt-0.5 border border-amber-200">
                  <Award className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-slate-900">{b.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{b.description}</p>
                  <div className="text-[10px] text-slate-400 pt-1">
                    Issued: {new Date(b.issued_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Uploaded Certificates & Verification Status */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900">Training Certificates & Verification</h2>
        </div>

        {passport?.certificates?.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-slate-300 text-xs text-slate-400">
            No certificates submitted yet.
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
            {passport?.certificates?.map((c) => (
              <div key={c.id} className="p-4 sm:p-5 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{c.requirement_title}</span>
                    <StatusBadge status={c.status} size="xs" />
                  </div>
                  <div className="text-xs text-slate-500">
                    Resource: <strong className="text-slate-700">{c.resource_name}</strong> • File: {c.original_name}
                  </div>
                  {c.notes && (
                    <div className="text-xs text-slate-600 italic">"{c.notes}"</div>
                  )}
                </div>

                <a
                  href={c.file_path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> View File
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sign-Offs Endorsements */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900">Lab Manager & Faculty Sign-Offs</h2>
        </div>

        {passport?.signoffs?.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-slate-300 text-xs text-slate-400">
            No supervisor sign-offs requested yet.
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
            {passport?.signoffs?.map((s) => (
              <div key={s.id} className="p-4 sm:p-5 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{s.requirement_title}</span>
                    <StatusBadge status={s.status} size="xs" />
                  </div>
                  <div className="text-xs text-slate-500">
                    For: <strong className="text-slate-700">{s.resource_name}</strong>
                    {s.approver_name && ` • Endorsed by: ${s.approver_name}`}
                  </div>
                </div>
                <div className="text-xs text-slate-400">
                  {new Date(s.requested_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

