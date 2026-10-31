import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import {
  ShieldCheck, Sparkles, Scale, Clock, ArrowRight, CheckCircle2,
  ChevronLeft, ChevronRight, Cpu, Camera, Box, Microscope, Building,
  Users, Flame, FileCheck, AlertTriangle, Layers, Lock, Check,
  RotateCcw, Sliders, ExternalLink, Zap, Eye
} from 'lucide-react';

export function LandingPage() {
  const { user, demoLogin } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  // Hero carousel state
  const [currentSlide, setCurrentSlide] = useState(0);

  // Equipment showcase filter state
  const [activeCategory, setActiveCategory] = useState('All');

  // Interactive Fair-Share Calculator state
  const [waitDays, setWaitDays] = useState(3);
  const [pastHours, setPastHours] = useState(4);
  const [projectTier, setProjectTier] = useState('academic'); // academic: +30, research: +20, startup: +10, casual: 0

  const heroSlides = [
    {
      title: "Laser Cutter (Universal PLS6.150D)",
      category: "Fabrication Lab • Room 104",
      tagline: "High-precision 60W CO2 laser for acrylic, wood, and architectural models.",
      image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80",
      accent: "from-blue-600 to-indigo-600",
      stats: { availability: "4 slots open today", deposit: "$25 refundable", cap: "15 hrs/mo" },
      passport: "Laser Safety Quiz required",
      fairScore: "Score: 94.2 (Priority Tier 1)"
    },
    {
      title: "DSLR Cinema Rig (Canon EOS R5)",
      category: "Media Arts Lab • Studio B",
      tagline: "45MP 8K RAW cinema camera with 24-70mm f/2.8L lens for thesis and media production.",
      image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80",
      accent: "from-purple-600 to-pink-600",
      stats: { availability: "Available tomorrow", deposit: "$50 refundable", cap: "25 hrs/mo" },
      passport: "Optics Care Certificate",
      fairScore: "Score: 88.5 (High Demand)"
    },
    {
      title: "3D Printer (Ultimaker S5 Dual Extruder)",
      category: "Innovation Lab • Block B",
      tagline: "Industrial dual-extrusion with water-soluble PVA support for rapid engineering prototypes.",
      image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80",
      accent: "from-emerald-600 to-teal-600",
      stats: { availability: "2 units active now", deposit: "$10 refundable", cap: "30 hrs/mo" },
      passport: "Filament Slicing Quiz",
      fairScore: "Score: 91.0 (Zero Conflict)"
    },
    {
      title: "VR Developer Kit (Meta Quest Pro)",
      category: "HCI & XR Lab • Room 302",
      tagline: "Full-color passthrough and eye-tracking mixed reality headset for spatial research.",
      image: "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&w=1200&q=80",
      accent: "from-amber-600 to-orange-600",
      stats: { availability: "Ready for checkout", deposit: "$30 refundable", cap: "20 hrs/mo" },
      passport: "XR Safety Sign-off",
      fairScore: "Score: 82.4 (Open Queue)"
    }
  ];

  // Auto-advance hero slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);

  // Calculate live fair-share demo score
  const tierBonus = projectTier === 'academic' ? 30 : projectTier === 'research' ? 20 : projectTier === 'startup' ? 10 : 0;
  const calculatedScore = Math.max(0, (waitDays * 10) - (pastHours * 2) + tierBonus).toFixed(1);

  // Equipment catalog preview
  const equipmentCatalog = [
    {
      id: 1,
      name: "Laser Cutter (Universal PLS6.150D)",
      category: "Equipment",
      location: "Innovation Lab, Room 104",
      image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
      deposit: 25,
      maxHours: 3,
      reqs: ["Laser Safety Quiz", "1 Supervised Session", "Director Sign-off"]
    },
    {
      id: 2,
      name: "3D Printer (Ultimaker S5 Dual)",
      category: "Equipment",
      location: "Innovation Lab, Block B",
      image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80",
      deposit: 10,
      maxHours: 6,
      reqs: ["Filament Handling Quiz"]
    },
    {
      id: 3,
      name: "DSLR Camera (Canon EOS R5)",
      category: "Equipment",
      location: "Media Lab, Block A",
      image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80",
      deposit: 50,
      maxHours: 8,
      reqs: ["Optics Care Sign-off"]
    },
    {
      id: 4,
      name: "Digital Oscilloscope (Tektronix 4-Ch)",
      category: "Tools",
      location: "Electronics Lab, Room 204",
      image: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=600&q=80",
      deposit: 0,
      maxHours: 4,
      reqs: ["High-Voltage Safety Briefing"]
    },
    {
      id: 5,
      name: "Electronics Prototyping Lab",
      category: "Labs",
      location: "Block B, 2nd Floor",
      image: "https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?auto=format&fit=crop&w=600&q=80",
      deposit: 0,
      maxHours: 5,
      reqs: ["ESD Wristband Clearance"]
    },
    {
      id: 6,
      name: "Collaborative Project Room 102",
      category: "Rooms",
      location: "Main Building, Ground Floor",
      image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80",
      deposit: 0,
      maxHours: 3,
      reqs: ["Clean Board Agreement"]
    },
    {
      id: 7,
      name: "VR Developer Kit (Meta Quest Pro)",
      category: "Equipment",
      location: "HCI & XR Lab, Room 302",
      image: "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&w=600&q=80",
      deposit: 30,
      maxHours: 4,
      reqs: ["XR Safety Sign-off"]
    },
    {
      id: 8,
      name: "Soldering Station (Weller Digital)",
      category: "Tools",
      location: "Electronics Lab, Bench 4",
      image: "https://images.unsplash.com/photo-1581092162384-8987c1d64718?auto=format&fit=crop&w=600&q=80",
      deposit: 0,
      maxHours: 3,
      reqs: ["Fume Extraction Protocol"]
    }
  ];

  const filteredCatalog = activeCategory === 'All'
    ? equipmentCatalog
    : equipmentCatalog.filter(item => item.category === activeCategory);

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-300">
      
      {/* ========================================================
          HERO SECTION (Wavenet Inspired Modern Split & Polygonal Frame)
         ======================================================== */}
      {/* ========================================================
          HERO SECTION: FULL-BLEED IMMERSIVE BACKGROUND SLIDER
         ======================================================== */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-28 lg:pt-20 lg:pb-32 border-b border-slate-200/80 dark:border-slate-800/80 min-h-[640px] flex items-center">
        
        {/* Full-bleed background equipment image slider */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {heroSlides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover object-center filter brightness-[0.7] dark:brightness-[0.4] scale-105 transition-transform duration-10000"
              />
            </div>
          ))}

          {/* High-contrast gradient overlay masks */}
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-main)] via-[var(--bg-main)]/90 via-55% to-[var(--bg-main)]/40 dark:to-[var(--bg-main)]/25"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-main)] via-transparent to-[var(--bg-main)]/70"></div>
          {/* Subtle colorful atmospheric glows */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-10 w-80 h-80 bg-purple-500/10 dark:bg-purple-500/15 rounded-full blur-3xl pointer-events-none"></div>
        </div>

        {/* Foreground Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
          <div className="max-w-2xl lg:max-w-3xl space-y-6 text-left">
            
            {/* Top micro badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="tracking-wide">Trust & Accountability Protocol</span>
            </div>

            {/* Punchy Headline matching approved design */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight hero-headline leading-[1.1]">
              <span className="text-slate-900 dark:text-white" style={{ color: 'var(--text-main)' }}>
                Let's make campus collaboration
              </span> <br />
              <span className="bg-gradient-to-r from-indigo-500 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                brilliant.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed font-normal max-w-xl">
              We're VouchLab, the decentralized campus resource network. We empower university makerspaces, fabrication labs, and cinema suites with cryptographic passports, transparent fair-share allocation, and tamper-evident condition logs.
            </p>

            {/* Action Buttons (Wavenet Style CTA with yellow accent badge) */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to={user ? "/dashboard" : "/login"}
                className="group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold text-sm shadow-xl shadow-indigo-600/25 transition-all duration-300 hover:scale-[1.02]"
              >
                <span className="flex items-center gap-3 px-5 py-3.5">
                  <span>{user ? "Open Dashboard" : "Access Lab Portal"}</span>
                  {/* Yellow angled accent tag */}
                  <span className="bg-yellow-400 text-slate-950 font-extrabold text-xs px-2 py-0.5 rounded shadow-sm group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Start <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </span>
              </Link>

              <Link
                to="/explore"
                className="px-5 py-3.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md hover:bg-white dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-800 shadow-sm transition-all flex items-center gap-2"
              >
                <Eye className="w-4 h-4 text-indigo-500" />
                <span>Explore 8+ Gear</span>
              </Link>
            </div>

            {/* 4 Feature Trust Indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-200/80 dark:border-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-300 max-w-xl">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Passports</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>Fair-Share</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-purple-500 shrink-0" />
                <span>Condition Diff</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-cyan-500 shrink-0" />
                <span>SHA-256 Chain</span>
              </div>
            </div>
          </div>
        </div>

        {/* Full-screen Previous Slide Arrow Button */}
        <button
          onClick={prevSlide}
          className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-slate-900/50 hover:bg-slate-900/80 dark:bg-white/10 dark:hover:bg-white/20 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-xl"
          aria-label="Previous Slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Full-screen Next Slide Arrow Button */}
        <button
          onClick={nextSlide}
          className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-slate-900/50 hover:bg-slate-900/80 dark:bg-white/10 dark:hover:bg-white/20 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-xl"
          aria-label="Next Slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Floating Slide Progress Dots (Bottom Center) */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {heroSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                currentSlide === idx
                  ? 'w-10 bg-indigo-500 shadow-lg shadow-indigo-500/50'
                  : 'w-2.5 bg-slate-400/50 hover:bg-slate-300'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Floating Glassmorphic Slide Info Pill (Bottom Right) */}
        <div className="absolute bottom-5 right-6 sm:right-12 z-20 hidden md:flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-950/75 dark:bg-black/75 backdrop-blur-md border border-white/15 text-white shadow-2xl max-w-md animate-fade-in">
          <div className="space-y-0.5">
            <div className="text-xs font-black text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{heroSlides[currentSlide].title}</span>
            </div>
            <div className="text-[11px] text-slate-300 flex items-center gap-2 font-medium">
              <span>{heroSlides[currentSlide].category}</span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">{heroSlides[currentSlide].stats.availability}</span>
            </div>
          </div>
          <Link
            to="/explore"
            className="ml-2 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/20 hover:bg-white/30 text-white transition-colors flex items-center gap-1 shrink-0"
          >
            <span>View</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </section>

      {/* ========================================================
          EQUIPMENT & LABS INTERACTIVE SHOWCASE
         ======================================================== */}
      <section className="py-16 sm:py-20 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Header & Category Chips */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                <Sparkles className="w-3.5 h-3.5" /> High-End Inventory
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
                Explore Available Equipment & Labs
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
                Browse laser cutters, 3D printers, full-frame cameras, and prototype rooms. All covered under transparent fair-share scheduling.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              {['All', 'Equipment', 'Labs', 'Rooms', 'Tools'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeCategory === cat
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredCatalog.map((item) => (
              <div
                key={item.id}
                className="group rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between modern-card"
              >
                <div>
                  {/* Photo with hover effect */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wide bg-slate-900/80 backdrop-blur-md text-white border border-white/20">
                        {item.category}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500 text-white shadow-sm">
                        {item.deposit > 0 ? `$${item.deposit} Deposit` : 'No Deposit'}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-2">
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {item.location}
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {item.name}
                    </h3>

                    {/* Requirements checklist pill */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Eligibility Checklist:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {item.reqs.map((req, rIdx) => (
                          <span
                            key={rIdx}
                            className="px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900"
                          >
                            ✓ {req}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action */}
                <div className="p-4 pt-0">
                  <Link
                    to={`/resources/${item.id}`}
                    className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 group/btn"
                  >
                    <span>View & Book Slot</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center pt-4">
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all border border-indigo-200 dark:border-indigo-800"
            >
              <span>Explore All Equipment & Natural Language Search</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      </section>

      {/* ========================================================
          INTERACTIVE FAIR-SHARE PRIORITY FORMULA CALCULATOR
         ======================================================== */}
      <section className="py-16 sm:py-20 bg-slate-100/60 dark:bg-slate-900/40 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left explanation */}
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                <Scale className="w-3.5 h-3.5" /> Anti-Hoarding Engine
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Transparent Fair-Share Scoring
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Traditional booking is first-come-first-serve, allowing power users to hoard lab slots. TrustShare uses a mathematical priority formula that rewards waiting time and penalizes heavy 30-day past usage.
              </p>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs text-indigo-600 dark:text-indigo-400 space-y-1">
                <div className="font-bold text-slate-900 dark:text-slate-100">Formula:</div>
                <div>Priority = (Wait Days × 10) - (Past 30-Day Hrs × 2) + Tier Bonus</div>
              </div>
            </div>

            {/* Right Interactive Simulator Widget */}
            <div className="lg:col-span-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-500" />
                  <span>Interactive Priority Simulator</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Calculated Score</span>
                  <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                    {calculatedScore} pts
                  </span>
                </div>
              </div>

              {/* Sliders */}
              <div className="space-y-5">
                {/* Wait Days */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>Days Waiting in Queue:</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-mono">{waitDays} days (+{waitDays * 10} pts)</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={waitDays}
                    onChange={(e) => setWaitDays(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                {/* Past Usage */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>Past 30-Day Hours Logged:</span>
                    <span className="text-rose-600 dark:text-rose-400 font-mono">{pastHours} hrs (-{pastHours * 2} pts)</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={pastHours}
                    onChange={(e) => setPastHours(Number(e.target.value))}
                    className="w-full accent-rose-600 cursor-pointer"
                  />
                </div>

                {/* Project Tier */}
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Project Category Tier:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'academic', label: 'Academic (+30)', color: 'border-indigo-500' },
                      { id: 'research', label: 'Research (+20)', color: 'border-purple-500' },
                      { id: 'startup', label: 'Startup (+10)', color: 'border-amber-500' },
                      { id: 'casual', label: 'Casual (0)', color: 'border-slate-500' }
                    ].map((tier) => (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => setProjectTier(tier.id)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                          projectTier === tier.id
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {tier.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Simulation Result Callout */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/60 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {calculatedScore > 60
                    ? "✨ Top Priority Status — High likelihood of immediate booking approval"
                    : "⏳ Standard Queue Status — May yield slot if higher-priority thesis projects request"}
                </span>
                <span className="font-extrabold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider text-[10px]">
                  Rank #{calculatedScore > 60 ? '1' : '3'}
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================
          1-CLICK GUIDED DEMO ROLES (FOR HACKATHON EVALUATORS)
         ======================================================== */}
      <section className="py-16 sm:py-20 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              Interactive Hackathon Scenarios
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Test All Perspectives in 1 Click
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Select any pre-seeded persona to test end-to-end booking, safety quiz passes, fair-share queue resolution, or cryptographic SHA-256 tamper detection.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Student 1 */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                    alt="Alex"
                    className="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-500/20"
                  />
                  <div>
                    <div className="font-extrabold text-sm text-slate-900 dark:text-white">Keerat (Alex)</div>
                    <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">Student 1 • Academic</div>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Missing Laser Safety Quiz. Test taking the quiz, watching the checklist turn green, and qualifying for the cutter.
                </p>
              </div>

              <button
                onClick={() => { demoLogin({ email: 'student1@demo.edu' }); navigate('/dashboard'); }}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <span>Launch Alex Demo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Student 2 */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
                    alt="Sam"
                    className="w-12 h-12 rounded-2xl object-cover ring-2 ring-purple-500/20"
                  />
                  <div>
                    <div className="font-extrabold text-sm text-slate-900 dark:text-white">Rohan (Sam)</div>
                    <div className="text-xs text-purple-600 dark:text-purple-400 font-semibold">Student 2 • Research</div>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Fully certified but high 30-day past usage. Demonstrates how fair-share ranks Student 1 ahead during overlap conflicts.
                </p>
              </div>

              <button
                onClick={() => { demoLogin({ email: 'student2@demo.edu' }); navigate('/dashboard'); }}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <span>Launch Sam Demo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Owner */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80"
                    alt="Dr. Vance"
                    className="w-12 h-12 rounded-2xl object-cover ring-2 ring-amber-500/20"
                  />
                  <div>
                    <div className="font-extrabold text-sm text-slate-900 dark:text-white">Dr. Vikram Rao</div>
                    <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold">Lab Director • Owner</div>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Fab Lab Owner. Reviews pending booking conflict queues, inspects fair-share scoring breakdown, and approves requests.
                </p>
              </div>

              <button
                onClick={() => { demoLogin({ email: 'owner1@demo.edu' }); navigate('/owner/requests'); }}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <span>Launch Owner Desk</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Admin */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=120&q=80"
                    alt="Admin"
                    className="w-12 h-12 rounded-2xl object-cover ring-2 ring-emerald-500/20"
                  />
                  <div>
                    <div className="font-extrabold text-sm text-slate-900 dark:text-white">Campus Facilities Admin</div>
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Dean Rice • Ledger</div>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Inspects the append-only SHA-256 audit ledger. Run the interactive "Simulate Row Tamper" tool to demo fraud detection.
                </p>
              </div>

              <button
                onClick={() => { demoLogin({ email: 'admin@demo.edu' }); navigate('/admin'); }}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <span>Launch Admin Chain</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================
          MODERN FOOTER
         ======================================================== */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-12 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">\\</span>
              <div>
                <span className="font-extrabold text-lg text-slate-900 dark:text-white">vouchlab</span>
                <div className="text-xs text-slate-500">Campus Trust & Accountability Layer</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs text-slate-600 dark:text-slate-400 font-semibold">
              <Link to="/explore" className="hover:text-indigo-600 transition-colors">Our Solutions</Link>
              <Link to="/explore?category=Equipment" className="hover:text-indigo-600 transition-colors">Equipment</Link>
              <Link to="/explore?category=Labs" className="hover:text-indigo-600 transition-colors">Labs</Link>
              <Link to="/login" className="hover:text-indigo-600 transition-colors">Ledger Audit</Link>
              <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                SHA-256 Chain Active
              </span>
            </div>

            <div className="text-xs text-slate-400">
              © 2026 VouchLab. Built for University Resource Collaboration.
            </div>

          </div>
        </div>
      </footer>

    </div>
  );
}
