import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import {
  Search, Filter, MapPin, Calendar, CheckCircle2, AlertCircle,
  Sparkles, Layers, SlidersHorizontal, ArrowRight, ShieldCheck, Clock
} from 'lucide-react';

export function ExploreResources() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const queryQ = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || 'All';
  const [searchInput, setSearchInput] = useState(queryQ);
  const [category, setCategory] = useState(categoryParam);
  const [location, setLocation] = useState('All');
  const [eligibleOnly, setEligibleOnly] = useState(false);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  const categories = ['All', 'Equipment', 'Labs', 'Rooms', 'Tools', 'Others'];

  useEffect(() => {
    setSearchInput(queryQ);
  }, [queryQ]);

  useEffect(() => {
    if (searchParams.get('category')) {
      setCategory(searchParams.get('category'));
    }
  }, [searchParams]);

  useEffect(() => {
    loadResources();
  }, [category, location, queryQ, eligibleOnly]);

  async function loadResources() {
    setLoading(true);
    try {
      const params = {};
      if (category !== 'All') params.category = category;
      if (location !== 'All') params.location = location;
      if (queryQ.trim()) params.q = queryQ.trim();
      if (eligibleOnly) params.eligibleOnly = 'true';

      const data = await api.getResources(params);
      setResources(data || []);
    } catch (err) {
      console.error('Failed to load resources:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchParams({ q: searchInput.trim() });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn transition-colors duration-300">
      
      {/* Top Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        
        {/* Title & Quick Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white">
              Equipment & Labs Directory
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Find high-precision lab tools, camera rigs, and prototype spaces with transparent fair-share availability.
            </p>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Showing <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{resources.length}</strong> resources
          </div>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search equipment or natural language: 'I need to cut acrylic sheets' or '4K camera'..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950/70 hover:bg-slate-100/60 dark:hover:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 text-xs font-medium text-slate-900 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" /> Search
          </button>
        </form>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1">
            Categories:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setSearchParams(cat === 'All' ? {} : { category: cat }); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                category === cat
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Secondary Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Campus Location:</span>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Locations</option>
                <option value="Innovation">Innovation Lab</option>
                <option value="Block A">Media Lab (Block A)</option>
                <option value="Block B">Electronics Lab (Block B)</option>
                <option value="Main Building">Main Building</option>
              </select>
            </div>

            {user && (
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={eligibleOnly}
                  onChange={(e) => setEligibleOnly(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Only show resources I'm eligible for
                </span>
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Resource Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="h-80 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : resources.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
          <Layers className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">No matching campus resources found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Try adjusting your search terms or filters. If looking for specific fabrication equipment, try searching "cut acrylic" or "laser".
          </p>
          <button
            onClick={() => { setCategory('All'); setLocation('All'); setSearchParams({}); setEligibleOnly(false); }}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {resources.map((res) => {
            const isEligible = res.eligibility?.isEligible;
            return (
              <div
                key={res.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-xl hover:border-indigo-400 dark:hover:border-indigo-500 transition-all duration-300 group modern-card"
              >
                <div>
                  {/* Photo with status badge overlay */}
                  <div className="aspect-[16/10] bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                    <img
                      src={res.image_url}
                      alt={res.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      <StatusBadge status="available" size="xs" />
                    </div>
                    {user && res.eligibility && (
                      <div className="absolute top-3 right-3">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-md shadow-sm ${
                          isEligible
                            ? 'bg-emerald-600/90 text-white'
                            : 'bg-amber-600/90 text-white'
                        }`}>
                          {isEligible ? '✓ Eligible' : '1+ Missing Req'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        {res.category}
                      </span>
                      {res.deposit > 0 ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          ${res.deposit} deposit
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          Free Access
                        </span>
                      )}
                    </div>

                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {res.name}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {res.description}
                    </p>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 pt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{res.location}</span>
                    </div>

                    {/* Requirements summary tags */}
                    {res.requirements && res.requirements.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1">
                        {res.requirements.map(req => (
                          <span
                            key={req.id}
                            className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 truncate max-w-[140px]"
                            title={req.title}
                          >
                            ✓ {req.title}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Button */}
                <div className="p-5 pt-0">
                  <Link
                    to={`/resources/${res.id}`}
                    className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 dark:hover:bg-indigo-600 hover:text-white text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all group/btn"
                  >
                    <span>View & Book Slot</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
