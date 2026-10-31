import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { ConditionComparison } from '../components/ConditionComparison.jsx';
import {
  ArrowLeft, Camera, CheckCircle2, AlertTriangle, Sparkles,
  Star, ShieldAlert
} from 'lucide-react';

export function ReturnPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [checkinReport, setCheckinReport] = useState(null);
  const [loading, setLoading] = useState(true);

  // Return condition form
  const [isWorking, setIsWorking] = useState(1);
  const [hasScratches, setHasScratches] = useState(0);
  const [missingParts, setMissingParts] = useState(0);
  const [cleanliness, setCleanliness] = useState(5);
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getBookingDetail(id);
        setBooking(data);
        const checkin = data.condition_reports?.find(r => r.type === 'checkin');
        setCheckinReport(checkin || null);
      } catch (err) {
        setError(err.message || 'Failed to load booking');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    setFiles(selected);
    const urls = selected.map(f => URL.createObjectURL(f));
    setPreviews(urls);
  };

  const handleReturnSubmit = async (isDamageReport = false) => {
    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('is_working', isWorking);
      formData.append('has_scratches', hasScratches);
      formData.append('missing_parts', missingParts);
      formData.append('cleanliness', cleanliness);
      formData.append('notes', notes || (isDamageReport ? 'Student flagged damage on return' : 'Returned in satisfactory condition'));

      for (const f of files) {
        formData.append('photos', f);
      }

      await api.returnBooking(id, formData);
      navigate(`/bookings/${id}`);
    } catch (err) {
      setError(err.message || 'Return submission failed');
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-slate-400">Loading return protocol...</div>;
  }

  // Live diff comparison with check-in
  const hasScratchDiff = checkinReport && !checkinReport.has_scratches && hasScratches === 1;
  const hasWorkingDiff = checkinReport && checkinReport.is_working && !isWorking;
  const hasPartsDiff = checkinReport && !checkinReport.missing_parts && missingParts === 1;
  const anyDegraded = hasScratchDiff || hasWorkingDiff || hasPartsDiff;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn pb-12">
      <Link
        to="/my-bookings"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to My Bookings
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">
              Session Wrap-up
            </span>
            <h1 className="text-xl font-black text-slate-900 mt-1">
              Return Equipment: {booking?.resource_name}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Pickup logged at {booking?.checked_in_at ? new Date(booking.checked_in_at).toLocaleTimeString() : 'N/A'}
            </p>
          </div>
        </div>

        {error && (
          <div className="m-6 p-4 bg-rose-50 text-rose-700 rounded-2xl text-xs font-semibold border border-rose-200">
            {error}
          </div>
        )}

        {/* Live Discrepancy Alert */}
        {anyDegraded && (
          <div className="m-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
            <div className="p-2 bg-amber-500 text-white rounded-xl shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-amber-900 uppercase tracking-wider">
                Condition Discrepancy Detected Against Check-in Record
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                {hasScratchDiff && '• New surface scratches flagged. '}
                {hasWorkingDiff && '• Equipment operational state changed to non-functional. '}
                {hasPartsDiff && '• Accessories or components flagged missing.'}
              </p>
              <p className="text-[11px] text-amber-700 mt-1">
                An AI condition summary will be suggested to the lab owner for fair human review.
              </p>
            </div>
          </div>
        )}

        <div className="p-6 sm:p-8 space-y-6">
          {/* Photo Uploader */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Final Condition Photos (After Use)
            </label>
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-indigo-400 transition-colors bg-slate-50">
              <Camera className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
              <div className="text-xs font-semibold text-slate-700">
                Upload clear photos of equipment condition upon return
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                PNG, JPG, or camera capture up to 10MB
              </p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="mt-3 text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
              />
            </div>

            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-3">
                {previews.map((url, i) => (
                  <div key={i} className="aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                    <img src={url} alt={`return ${i}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Return Checklist */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
              Final Condition Checklist
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Working */}
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                <span className="text-xs font-bold text-slate-700">Still Operational?</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsWorking(1)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isWorking === 1 ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-slate-600'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsWorking(0)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isWorking === 0 ? 'bg-rose-600 text-white shadow-sm' : 'bg-white text-slate-600'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              {/* Scratches */}
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                <span className="text-xs font-bold text-slate-700">Any New Scratches?</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setHasScratches(0)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      hasScratches === 0 ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-slate-600'
                    }`}
                  >
                    None
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasScratches(1)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      hasScratches === 1 ? 'bg-amber-600 text-white shadow-sm' : 'bg-white text-slate-600'
                    }`}
                  >
                    New Scratch
                  </button>
                </div>
              </div>

              {/* Missing Parts */}
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                <span className="text-xs font-bold text-slate-700">All Parts Returned?</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMissingParts(0)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      missingParts === 0 ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-slate-600'
                    }`}
                  >
                    Complete
                  </button>
                  <button
                    type="button"
                    onClick={() => setMissingParts(1)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      missingParts === 1 ? 'bg-rose-600 text-white shadow-sm' : 'bg-white text-slate-600'
                    }`}
                  >
                    Missing
                  </button>
                </div>
              </div>
            </div>

            {/* Cleanliness rating */}
            <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Return Cleanliness Rating:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setCleanliness(star)}
                    className={`p-1 rounded-lg ${
                      cleanliness >= star ? 'text-amber-500' : 'text-slate-300'
                    }`}
                  >
                    <Star className="w-5 h-5 fill-current" />
                  </button>
                ))}
              </div>
            </div>

            {/* Return Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Return Notes / Comments
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe condition upon return or explain any cosmetic blemishes..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => handleReturnSubmit(true)}
              disabled={submitting}
              className="w-full sm:w-auto px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <ShieldAlert className="w-4 h-4" /> File Damage Notice
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => navigate('/my-bookings')}
                className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleReturnSubmit(false)}
                disabled={submitting}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {submitting ? 'Verifying Return...' : 'Confirm Return'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

