import React from 'react';
import { useDemoGuide } from '../context/DemoGuideContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Compass, ChevronRight, ChevronLeft, RotateCcw, User, Shield, Briefcase,
  CheckCircle, ChevronDown, ChevronUp, Play
} from 'lucide-react';

export function GuidedDemoBar() {
  const { isOpen, setIsOpen, currentStep, steps, executeStep, nextStep, prevStep, resetAllDemoData } = useDemoGuide();
  const { user, demoLogin } = useAuth();

  const currentStepObj = steps.find(s => s.step === currentStep) || steps[0];

  return (
    <div className="fixed bottom-3 right-3 left-3 md:left-auto md:right-6 md:bottom-6 z-40 max-w-xl w-full">
      <div className="bg-slate-900/95 text-white backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700/80 overflow-hidden transition-all">
        {/* Top Mini Header */}
        <div className="px-4 py-2.5 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="font-bold tracking-wider text-emerald-400 uppercase text-[11px] flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" /> Hackathon Judge Demo Tour
            </span>
            <span className="text-slate-400">• Step {currentStep} of {steps.length}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={resetAllDemoData}
              title="Reset database to fresh demo state"
              className="px-2 py-1 bg-slate-700/80 hover:bg-slate-600 rounded-lg text-slate-200 text-[11px] font-medium flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3 text-amber-400" /> Reset Demo
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 text-slate-400 hover:text-white rounded transition-colors"
            >
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="p-4 space-y-3.5">
            {/* Step Title & Description */}
            <div>
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <Play className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" />
                  {currentStepObj.title}
                </h4>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Role: {currentStepObj.role.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {currentStepObj.description}
              </p>
            </div>

            {/* Quick-Switch Role Shortcuts */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
              <span className="text-[11px] text-slate-400 font-medium">Quick switch user:</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => demoLogin({ email: 'student1@demo.edu' })}
                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all ${
                    user?.email === 'student1@demo.edu'
                      ? 'bg-indigo-600 text-white ring-1 ring-white/30'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <User className="w-3 h-3" /> Keerat (Student)
                </button>
                <button
                  onClick={() => demoLogin({ email: 'owner1@demo.edu' })}
                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all ${
                    user?.email === 'owner1@demo.edu'
                      ? 'bg-indigo-600 text-white ring-1 ring-white/30'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Briefcase className="w-3 h-3" /> Dr. Vikram (Owner)
                </button>
                <button
                  onClick={() => demoLogin({ email: 'admin@demo.edu' })}
                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all ${
                    user?.email === 'admin@demo.edu'
                      ? 'bg-indigo-600 text-white ring-1 ring-white/30'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Shield className="w-3 h-3" /> Admin
                </button>
              </div>
            </div>

            {/* Step Navigation Controls */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>

              {/* Progress Dots */}
              <div className="flex items-center gap-1">
                {steps.map(s => (
                  <button
                    key={s.step}
                    onClick={() => executeStep(s.step)}
                    title={s.title}
                    className={`w-2 h-2 rounded-full transition-all ${
                      s.step === currentStep
                        ? 'w-5 bg-indigo-400'
                        : s.step < currentStep
                        ? 'bg-emerald-400'
                        : 'bg-slate-700 hover:bg-slate-500'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={nextStep}
                disabled={currentStep === steps.length}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
              >
                Next Step <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

