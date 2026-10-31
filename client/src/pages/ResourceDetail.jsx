import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { QuizModal } from '../components/QuizModal.jsx';
import {
  ArrowLeft, MapPin, User, Clock, ShieldCheck, CheckCircle2,
  XCircle, AlertCircle, FileText, Upload, Calendar, ArrowRight, Sparkles, Check
} from 'lucide-react';

export function ResourceDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [resource, setResource] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().substring(0, 10));
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal controls
  const [activeQuizReqId, setActiveQuizReqId] = useState(null);
  const [showCertUploadModal, setShowCertUploadModal] = useState(false);
  const [certReqId, setCertReqId] = useState(null);
  const [certFile, setCertFile] = useState(null);
  const [certNotes, setCertNotes] = useState('');
  const [uploadingCert, setUploadingCert] = useState(false);

  useEffect(() => {
    loadResourceDetail();
    loadSlots(selectedDate);
  }, [id, user]);

  async function loadResourceDetail() {
    try {
      const data = await api.getResource(id);
      setResource(data);
    } catch (err) {
      console.error('Failed to load resource:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadSlots(date) {
    try {
      const data = await api.getResourceSlots(id, date);
      setSlots(data?.slots || []);
    } catch (e) {
      console.error('Failed to load slots:', e);
    }
  }

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    setSelectedSlot(null);
    loadSlots(newDate);
  };

  const handleUploadCertSubmit = async (e) => {
    e.preventDefault();
    if (!certFile || !certReqId) return;

    setUploadingCert(true);
    try {
      const formData = new FormData();
      formData.append('certificate', certFile);
      formData.append('requirement_id', certReqId);
      formData.append('notes', certNotes);

      await api.uploadCertificate(formData);
      setShowCertUploadModal(false);
      setCertFile(null);
      setCertNotes('');
      await loadResourceDetail();
      alert('Certificate submitted successfully and queued for manager review.');
    } catch (err) {
      alert(err.message || 'Upload failed');
    } finally {
      setUploadingCert(false);
    }
  };

  const handleRequestSignoff = async (reqId) => {
    try {
      await api.requestSignoff(reqId, id, 'Student requested manager sign-off via resource page');
      await loadResourceDetail();
      alert('Sign-off endorsement requested from lab manager.');
    } catch (err) {
      alert(err.message || 'Request failed');
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400">Loading equipment details...</div>
    );
  }

  if (!resource) {
    return (
      <div className="p-8 text-center text-rose-600">Resource not found.</div>
    );
  }

  const isEligible = resource.eligibility ? resource.eligibility.isEligible : false;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Back link */}
      <Link
        to="/explore"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Resources
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Media, Description, Rules, Slots */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Photo Banner */}
          <div className="aspect-[16/9] rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 relative shadow-sm">
            <img
              src={resource.image_url}
              alt={resource.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4 flex gap-2">
              <StatusBadge status="available" />
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/90 backdrop-blur-md text-slate-800 shadow-sm">
                {resource.category}
              </span>
            </div>
            {resource.deposit > 0 && (
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold bg-slate-900/80 backdrop-blur-md text-white shadow-sm">
                Deposit: ${resource.deposit}
              </div>
            )}
          </div>

          {/* Title & Metadata */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {resource.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1.5 font-medium">
                  <MapPin className="w-4 h-4 text-indigo-600 shrink-0" /> {resource.location}
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <User className="w-4 h-4 text-indigo-600 shrink-0" /> Owner: {resource.owner_name}
                </span>
                {resource.manager_name && (
                  <span className="flex items-center gap-1.5 font-medium">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" /> Manager: {resource.manager_name}
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-2 border-t border-slate-100">
              {resource.description}
            </p>

            {/* Rules & Access Conditions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Usage Rules</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {resource.rules || 'Follow standard campus laboratory safety guidelines.'}
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Access Policy</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {resource.access_conditions || 'Max session 3 hours. Verified student status required.'}
                </p>
              </div>
            </div>
          </div>

          {/* Available Slots Calendar */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900">Available Session Slots</h3>
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {slots.map((slot, idx) => {
                const isSelected = selectedSlot?.start_time === slot.start_time;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/20'
                        : slot.status === 'booked'
                        ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                        : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900">{slot.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {slot.status === 'available' && 'Slot is open'}
                        {slot.status === 'contested' && `${slot.pendingCount} pending requests (fair-share ranked)`}
                        {slot.status === 'booked' && 'Reserved by another student'}
                      </div>
                    </div>
                    <StatusBadge status={slot.status} size="xs" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Live Eligibility Checklist & Booking CTA */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5 sticky top-20">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-base text-slate-900">Eligibility Checklist</h3>
                <p className="text-xs text-slate-500">Live passport verification</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                isEligible
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {isEligible ? 'All Requirements Met' : 'Missing Requirements'}
              </span>
            </div>

            {/* Checklist Items */}
            <div className="space-y-3">
              {resource.eligibility?.requirements && resource.eligibility.requirements.length > 0 ? (
                resource.eligibility.requirements.map((req) => {
                  const isMet = req.status === 'met';
                  const isPending = req.status === 'pending_verification';

                  return (
                    <div
                      key={req.id}
                      className={`p-3.5 rounded-2xl border text-xs space-y-2 transition-all ${
                        isMet
                          ? 'border-emerald-200 bg-emerald-50/40'
                          : isPending
                          ? 'border-amber-200 bg-amber-50/40'
                          : 'border-rose-200 bg-rose-50/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {isMet ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : isPending ? (
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          )}
                          <span className="font-bold text-slate-900">{req.title}</span>
                        </div>
                        <StatusBadge status={req.status} size="xs" />
                      </div>

                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {req.description}
                      </p>

                      {req.details && (
                        <div className="text-[11px] font-medium text-slate-700 bg-white/70 px-2 py-1 rounded-lg">
                          Status note: {req.details}
                        </div>
                      )}

                      {/* Interactive Fix Actions */}
                      {!isMet && (
                        <div className="pt-1 flex items-center gap-2">
                          {req.action === 'take_quiz' && (
                            <button
                              type="button"
                              onClick={() => setActiveQuizReqId(req.id)}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-indigo-600/20 transition-all flex items-center gap-1"
                            >
                              <Sparkles className="w-3.5 h-3.5" /> Take Safety Quiz
                            </button>
                          )}

                          {req.action === 'upload_certificate' && (
                            <button
                              type="button"
                              onClick={() => { setCertReqId(req.id); setShowCertUploadModal(true); }}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-indigo-600/20 transition-all flex items-center gap-1"
                            >
                              <Upload className="w-3.5 h-3.5" /> Upload Certificate
                            </button>
                          )}

                          {req.action === 'request_signoff' && (
                            <button
                              type="button"
                              onClick={() => handleRequestSignoff(req.id)}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" /> Request Sign-Off
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-4 bg-slate-50 rounded-2xl text-xs text-slate-500 text-center">
                  No special requirements for this equipment.
                </div>
              )}
            </div>

            {/* Booking CTA Button */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <button
                disabled={!isEligible}
                onClick={() => {
                  navigate(`/book/${resource.id}`, {
                    state: {
                      initialSlot: selectedSlot || slots[0],
                      initialDate: selectedDate
                    }
                  });
                }}
                className={`w-full py-3.5 rounded-2xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 ${
                  isEligible
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                {isEligible ? (
                  <>
                    Request Booking <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  'Complete Requirements Above to Unlock'
                )}
              </button>

              {!isEligible && (
                <p className="text-[11px] text-slate-400 text-center">
                  Server strictly enforces eligibility: owners never see unqualified requests.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Modal */}
      {activeQuizReqId && (
        <QuizModal
          isOpen={Boolean(activeQuizReqId)}
          requirementId={activeQuizReqId}
          onClose={() => setActiveQuizReqId(null)}
          onQuizPassed={async () => {
            await loadResourceDetail();
          }}
        />
      )}

      {/* Certificate Upload Modal */}
      {showCertUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <h3 className="font-bold text-base text-slate-900">Upload Qualification Document</h3>
            <p className="text-xs text-slate-500">
              Submit your training certificate or credentials. A lab manager will verify it against the audit chain.
            </p>

            <form onSubmit={handleUploadCertSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Document (PDF / PNG / JPG)</label>
                <input
                  type="file"
                  required
                  accept=".pdf,image/*"
                  onChange={(e) => setCertFile(e.target.files[0])}
                  className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes for Reviewer (Optional)</label>
                <textarea
                  rows={2}
                  value={certNotes}
                  onChange={(e) => setCertNotes(e.target.value)}
                  placeholder="e.g. Completed workshop on Oct 24th with Prof. Sarah"
                  className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCertUploadModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingCert}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-50"
                >
                  {uploadingCert ? 'Uploading...' : 'Submit for Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

