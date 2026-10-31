import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  ArrowLeft, Calendar, Clock, CheckCircle2, ShieldCheck,
  AlertCircle, Sparkles, Scale, Info
} from 'lucide-react';

export function BookingRequest() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const initialSlot = location.state?.initialSlot;
  const initialDate = location.state?.initialDate || new Date().toISOString().substring(0, 10);

  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);

  const [bookingDate, setBookingDate] = useState(initialDate);
  const [timeSlot, setTimeSlot] = useState(initialSlot?.label || '02:00 PM - 04:00 PM');
  const [startTime, setStartTime] = useState(initialSlot?.start_time || `${initialDate}T14:00:00`);
  const [endTime, setEndTime] = useState(initialSlot?.end_time || `${initialDate}T16:00:00`);

  const [purpose, setPurpose] = useState('');
  const [projectCategory, setProjectCategory] = useState(user?.category || 'academic_project');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resultFeedback, setResultFeedback] = useState(null);
  const [error, setError] = useState(null);

  const standardSlots = [
    { label: '09:00 AM - 11:00 AM', start: '09:00', end: '11:00' },
    { label: '11:00 AM - 01:00 PM', start: '11:00', end: '13:00' },
    { label: '02:00 PM - 04:00 PM', start: '14:00', end: '16:00' },
    { label: '04:00 PM - 06:00 PM', start: '16:00', end: '18:00' },
    { label: '06:00 PM - 08:00 PM', start: '18:00', end: '20:00' }
  ];

  useEffect(() => {
    async function loadResource() {
      try {
        const data = await api.getResource(id);
        setResource(data);
        if (!data.eligibility?.isEligible) {
          setError('You are currently ineligible for this resource. Missing required prerequisites.');
        }
      } catch (err) {
        setError(err.message || 'Failed to load resource');
      } finally {
        setLoading(false);
      }
    }
    loadResource();
  }, [id, user]);

  const handleSlotSelect = (slot) => {
    setTimeSlot(slot.label);
    setStartTime(`${bookingDate}T${slot.start}:00`);
    setEndTime(`${bookingDate}T${slot.end}:00`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreedTerms) {
      alert('Please agree to follow all usage and return condition rules.');
      return;
    }
    if (!purpose.trim()) {
      alert('Please specify your project purpose.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await api.createBooking({
        resource_id: Number(id),
        start_time: startTime,
        end_time: endTime,
        purpose: purpose.trim(),
        project_category: projectCategory
      });

      setResultFeedback(res);
      // Auto navigate after showing transparent score breakdown
      setTimeout(() => {
        navigate('/my-bookings');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Booking submission failed');
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-slate-400">Loading booking form...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
      <Link
        to={`/resources/${id}`}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Equipment Details
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header Summary */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={resource?.image_url}
              alt={resource?.name}
              className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-sm"
            />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                {resource?.category}
              </div>
              <h2 className="text-xl font-bold text-slate-900">{resource?.name}</h2>
              <div className="text-xs text-slate-500 mt-0.5">{resource?.location}</div>
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Verified Eligible to Book
          </div>
        </div>

        {error && (
          <div className="m-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-700 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Booking Request Blocked</div>
              <div>{error}</div>
            </div>
          </div>
        )}

        {/* Result Feedback Banner (Fair Share Score Breakdown) */}
        {resultFeedback && (
          <div className="m-6 p-5 bg-gradient-to-r from-indigo-900 to-indigo-800 text-white rounded-2xl space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-indigo-300" /> Request Processed by Fair-Share Protocol!
              </div>
              <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full bg-white/20">
                Status: {resultFeedback.booking?.status?.toUpperCase()}
              </span>
            </div>

            {resultFeedback.fairShare && (
              <div className="p-3 bg-white/10 rounded-xl text-xs space-y-1">
                <div className="font-semibold text-indigo-200">
                  {resultFeedback.fairShare.explanation}
                </div>
                <div className="font-mono text-[11px] text-white/80">
                  {resultFeedback.fairShare.breakdown?.formula}
                </div>
              </div>
            )}

            <p className="text-xs text-indigo-200">
              Redirecting you to your bookings dashboard in 3 seconds...
            </p>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Reservation Date</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  required
                  value={bookingDate}
                  onChange={(e) => {
                    setBookingDate(e.target.value);
                    setStartTime(`${e.target.value}T14:00:00`);
                    setEndTime(`${e.target.value}T16:00:00`);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Project Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Project Priority Category</label>
              <select
                value={projectCategory}
                onChange={(e) => setProjectCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
              >
                <option value="academic_project">Final-Year / Senior Academic Project (+30 pts bonus)</option>
                <option value="research">Graduate Thesis / Lab Research (+20 pts bonus)</option>
                <option value="startup_creator">Approved Student Startup / Creator (+10 pts bonus)</option>
                <option value="casual">General Exploration / Casual (+0 pts)</option>
              </select>
            </div>
          </div>

          {/* Time Slot Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Select 2-Hour Time Window</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {standardSlots.map((slot, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSlotSelect(slot)}
                  className={`p-3 rounded-xl border text-xs font-semibold transition-all text-left flex items-center justify-between ${
                    timeSlot === slot.label
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-600/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300'
                  }`}
                >
                  <span>{slot.label}</span>
                  {timeSlot === slot.label && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                </button>
              ))}
            </div>
          </div>

          {/* Project Purpose */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Project Description & Scope</label>
            <textarea
              required
              rows={3}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Describe what you will fabricate or test during this reservation..."
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 placeholder:text-slate-400"
            />
          </div>

          {/* Rules and Condition Agreement Checkbox */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                required
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 shrink-0"
              />
              <span className="text-xs text-slate-700 leading-relaxed font-medium">
                I agree to follow all safety protocol rules, complete the photo check-in at pickup, and return the equipment in good condition with a return condition log.
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(`/resources/${id}`)}
              className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || resultFeedback}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {submitting ? 'Allocating slot...' : 'Submit Booking Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

