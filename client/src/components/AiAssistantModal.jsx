import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, Bot, X, Send, ArrowRight, HelpCircle, ShieldCheck,
  Scale, Camera, Cpu, CheckCircle2, AlertCircle
} from 'lucide-react';

export function AiAssistantModal({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Hello! I'm VouchLab's AI Campus Assistant. I can help you find equipment with natural language (e.g., 'cut acrylic' or 'film 4K'), check safety passport requirements, or explain our fair-share queue algorithm. What are you building today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);

  const presetQuestions = [
    "I need to cut acrylic sheets for my prototype",
    "What gear do I need for 4K cinema filming?",
    "How does the fair-share priority score work?",
    "Why is Student 1 ranked higher than Student 2?"
  ];

  const handleSend = (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg = { sender: 'user', text: query };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setThinking(true);

    setTimeout(() => {
      const q = query.toLowerCase();
      let reply = "";
      let recommendations = null;

      if (q.includes('acrylic') || q.includes('cut') || q.includes('laser') || q.includes('wood')) {
        reply = "For cutting acrylic, wood, and architectural materials, the **Universal PLS6.150D Laser Cutter** (Innovation Lab, Room 104) is the best match. It has 4 slots open today.";
        recommendations = {
          title: "Laser Cutter (Universal PLS6.150D)",
          id: 1,
          location: "Innovation Lab, Room 104",
          passportReq: "Requires Laser Safety Quiz (Pass mark: 80%)",
          deposit: "$25 refundable",
          link: "/resources/1"
        };
      } else if (q.includes('camera') || q.includes('film') || q.includes('video') || q.includes('photo') || q.includes('4k') || q.includes('8k')) {
        reply = "For high-resolution media production, I recommend the **Canon EOS R5 DSLR + 24-70mm f/2.8L Cinema Rig** in Media Lab Block A. It captures 45MP stills and 8K/4K RAW video.";
        recommendations = {
          title: "DSLR Camera (Canon EOS R5)",
          id: 3,
          location: "Media Lab, Block A",
          passportReq: "Requires Optics Care Sign-Off",
          deposit: "$50 refundable",
          link: "/resources/3"
        };
      } else if (q.includes('fair-share') || q.includes('formula') || q.includes('priority') || q.includes('hoard') || q.includes('score')) {
        reply = "The Fair-Share Priority formula prevents power users from hoarding slots:\n\n**Score = (Wait Days × 10) - (Past 30-Day Usage × 2) + Tier Bonus**\n\n- Academic projects receive +30 bonus points\n- Research gets +20, Startups +10\n- High past usage deducts points, giving peers who waited longer top priority.";
      } else if (q.includes('student 1') || q.includes('student 2') || q.includes('alex') || q.includes('sam')) {
        reply = "In our demo conflict scenario, both Keerat (Student 1) and Rohan (Student 2) requested the Laser Cutter for Friday 2:00 PM. **Keerat is ranked #1** because Rohan already logged 18 hours this month, whereas Keerat only logged 2 hours.";
      } else if (q.includes('3d') || q.includes('print') || q.includes('pla') || q.includes('filament')) {
        reply = "For rapid additive manufacturing, the **Ultimaker S5 Dual Extruder 3D Printer** (Innovation Lab Block B) is ready with water-soluble PVA support.";
        recommendations = {
          title: "3D Printer (Ultimaker S5 Dual)",
          id: 2,
          location: "Innovation Lab, Block B",
          passportReq: "Requires 3D Printing & Filament Handling Quiz",
          deposit: "$10 refundable",
          link: "/resources/2"
        };
      } else {
        reply = "I understand you're looking for campus resources. You can search our directory of 8+ verified labs and equipment, complete safety quizzes on your Eligibility Passport, or inspect the cryptographic SHA-256 audit ledger.";
      }

      setMessages((prev) => [...prev, { sender: 'ai', text: reply, recommendations }]);
      setThinking(false);
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-xl w-full flex flex-col h-[580px] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 bg-indigo-600 dark:bg-indigo-950 text-white flex items-center justify-between border-b border-indigo-700 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-sm flex items-center gap-1.5">
                <span>VouchLab AI Assistant</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-400 text-slate-950 uppercase">Active</span>
              </div>
              <div className="text-[10px] text-indigo-200 dark:text-slate-400">Gemini Powered • Natural Language Equipment Finder & Policy Explainer</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset Prompt Chips */}
        <div className="p-2.5 bg-slate-50 dark:bg-slate-950/70 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <span className="text-slate-400 font-bold px-1 shrink-0">Try:</span>
          {presetQuestions.map((pq, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(pq)}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 whitespace-nowrap transition-colors"
            >
              {pq}
            </button>
          ))}
        </div>

        {/* Messages Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 space-y-2 ${
                  m.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200/80 dark:border-slate-700/80'
                }`}
              >
                <div className="leading-relaxed whitespace-pre-wrap">{m.text}</div>

                {/* AI Resource Card Recommendation */}
                {m.recommendations && (
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5 mt-2 shadow-sm">
                    <div className="font-extrabold text-indigo-600 dark:text-indigo-400 text-xs">
                      {m.recommendations.title}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      📍 {m.recommendations.location} • {m.recommendations.deposit}
                    </div>
                    <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> {m.recommendations.passportReq}
                    </div>
                    <Link
                      to={m.recommendations.link}
                      onClick={onClose}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:underline pt-1"
                    >
                      <span>View details & book</span> <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}

          {thinking && (
            <div className="flex justify-start">
              <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-3 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                <span>AI analyzing equipment registry & passport requirements...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI: e.g. 'I want to laser cut acrylic' or 'check passport'..."
            className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1"
          >
            <span>Ask</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

      </div>
    </div>
  );
}
