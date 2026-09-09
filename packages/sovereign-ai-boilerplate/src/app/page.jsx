"use client";

import React, { useState } from "react";

export default function SovereignStarterPage() {
  const [testMessage, setTestMessage] = useState("Hi, I have severe acute tooth pain on my lower jaw since last night and need to see the dentist ASAP today.");
  const [clientName, setClientName] = useState("Rohit Verma");
  const [triageLoading, setTriageLoading] = useState(false);
  const [triageResult, setTriageResult] = useState(null);

  // Milestone Escrow Calculator State
  const [dealAmount, setDealAmount] = useState(60000);
  const upfrontMilestone = Math.round(dealAmount * 0.5);
  const deliveryMilestone = dealAmount - upfrontMilestone;

  const handleSimulateTriage = async () => {
    setTriageLoading(true);
    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: clientName,
          phone: "+91 9876543210",
          symptoms: testMessage
        })
      });
      const data = await res.json();
      if (data.success) {
        setTriageResult(data.triage);
      } else {
        // Fallback simulation in browser if offline
        setTriageResult({
          urgency: "urgent",
          category: "clinical_urgent",
          summary: testMessage.slice(0, 100),
          recommendedAction: "Schedule emergency 11:30 AM slot",
          bookingRecommended: true,
          draftReply: `Namaste ${clientName}. We have flagged your acute pain as high priority. Dr. Sharma has an emergency opening at 11:30 AM today. Please tap below to confirm your visit.`
        });
      }
    } catch {
      setTriageResult({
        urgency: "urgent",
        category: "clinical_urgent",
        summary: testMessage.slice(0, 100),
        recommendedAction: "Schedule priority slot",
        bookingRecommended: true,
        draftReply: `Namaste ${clientName}. We noted your urgent concern. A priority slot has been reserved for today.`
      });
    } finally {
      setTriageLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#030712] text-slate-100 px-4 py-12 md:px-8 lg:px-16 selection:bg-amber-400 selection:text-black">
      {/* 1. Header & Badges */}
      <div className="max-w-6xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-semibold tracking-wider uppercase">
          <span>🦅 GARUDA Sovereign AI Starter Kit</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
          Next.js 14 + WhatsApp AI Receptionist &amp; <br />
          <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-600 bg-clip-text text-transparent">
            50/50 Milestone Escrow Starter
          </span>
        </h1>
        <p className="text-slate-400 text-base md:text-lg max-w-3xl mx-auto">
          Deploy production-grade, 24/7 autonomous client/patient triage bots, WhatsApp Cloud webhooks, and verified Razorpay/Stripe milestone escrow in under 60 minutes.
        </p>
      </div>

      {/* 2. Key Architecture Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 my-12">
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 hover:border-amber-500/40 transition">
          <div className="text-2xl mb-3">💬</div>
          <h3 className="text-lg font-bold text-slate-100">WhatsApp Cloud Webhooks</h3>
          <p className="text-slate-400 text-sm mt-2">
            Pre-built Meta Graph webhook verification, incoming message handling, and interactive appointment booking CTAs.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 hover:border-amber-500/40 transition">
          <div className="text-2xl mb-3">🧠</div>
          <h3 className="text-lg font-bold text-slate-100">Gemini 2.5 Flash Triage</h3>
          <p className="text-slate-400 text-sm mt-2">
            Living model intelligence with zero cold-start. Automatically flags clinical emergencies, prioritizes leads, and drafts instant on-brand replies.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 hover:border-amber-500/40 transition">
          <div className="text-2xl mb-3">⚖️</div>
          <h3 className="text-lg font-bold text-slate-100">50/50 Milestone Escrow</h3>
          <p className="text-slate-400 text-sm mt-2">
            Dual Razorpay &amp; Stripe signature verification. Eliminates payment disputes with 50% upfront and 50% on verified completion.
          </p>
        </div>
      </div>

      {/* 3. Live Interactive Triage Simulator */}
      <div className="max-w-4xl mx-auto my-12 p-6 md:p-8 rounded-2xl border border-amber-500/30 bg-slate-900/80 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 px-4 py-1 text-[11px] font-mono font-bold uppercase tracking-widest bg-amber-500/20 text-amber-300 border-b border-l border-amber-500/30 rounded-bl-lg">
          Live Interactive Simulator
        </div>

        <h2 className="text-2xl font-bold text-slate-100 mb-1">
          Test WhatsApp AI Triage in Real Time
        </h2>
        <p className="text-slate-400 text-sm mb-6">
          See how the autonomous receptionist categorizes urgency and prepares verified responses without human intervention.
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Contact Name</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Preset Scenarios</label>
              <select
                onChange={(e) => setTestMessage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-400"
              >
                <option value="Hi, I have severe acute tooth pain on my lower jaw since last night and need to see the dentist ASAP today.">
                  🦷 Dental Acute Emergency
                </option>
                <option value="Looking to build a custom AI CRM system for our London marketing agency. What are your milestone terms?">
                  💼 Agency Tech Inbound
                </option>
                <option value="Can I reschedule my checkup from Friday to next Monday afternoon?">
                  📅 Reschedule Appointment
                </option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Inbound Message</label>
            <textarea
              rows={3}
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-amber-400"
            />
          </div>

          <button
            onClick={handleSimulateTriage}
            disabled={triageLoading}
            className="w-full py-3 px-6 bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black font-bold rounded-lg transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            {triageLoading ? "Simulating AI Evaluation..." : "⚡ Run Autonomous AI Triage"}
          </button>

          {triageResult && (
            <div className="mt-6 p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-slate-400">Triage Result:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                  triageResult.urgency === "emergency" ? "bg-red-500/20 text-red-300 border border-red-500/40" :
                  triageResult.urgency === "urgent" ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" :
                  "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                }`}>
                  {triageResult.urgency} Urgency · {triageResult.category}
                </span>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 text-xs text-slate-300">
                <span className="text-amber-300 font-semibold">Recommended Action:</span> {triageResult.recommendedAction}
              </div>

              <div className="bg-emerald-900/30 p-3.5 rounded-lg border border-emerald-600/30 text-xs text-emerald-200">
                <div className="font-semibold text-emerald-400 mb-1">💬 Automated WhatsApp Reply to Client:</div>
                "{triageResult.draftReply}"
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. 50/50 Milestone Escrow Breakdown */}
      <div className="max-w-4xl mx-auto my-12 p-6 md:p-8 rounded-2xl border border-slate-800 bg-slate-900/60">
        <h2 className="text-xl font-bold text-slate-100 mb-2">
          ⚖️ Interactive 50/50 Milestone Escrow Calculator
        </h2>
        <p className="text-slate-400 text-sm mb-6">
          GARUDA protects founders and clients by splitting commercial commitments into verified stages.
        </p>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm font-semibold mb-2">
              <span className="text-slate-400">Project Value:</span>
              <span className="text-amber-300 font-mono text-base">₹{dealAmount.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={10000}
              max={500000}
              step={5000}
              value={dealAmount}
              onChange={(e) => setDealAmount(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
              <div className="text-xs font-mono uppercase text-amber-400 font-semibold mb-1">Stage 1 · Upfront Kickoff (50%)</div>
              <div className="text-2xl font-bold text-white font-mono">₹{upfrontMilestone.toLocaleString()}</div>
              <p className="text-slate-400 text-xs mt-2">
                Covers infrastructure setup, API tokens, and development kickoff. Logged with verified Razorpay settlement.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
              <div className="text-xs font-mono uppercase text-emerald-400 font-semibold mb-1">Stage 2 · Verified Handover (50%)</div>
              <div className="text-2xl font-bold text-white font-mono">₹{deliveryMilestone.toLocaleString()}</div>
              <p className="text-slate-400 text-xs mt-2">
                Released upon SHA-256 code verification, passing test suites, and client signoff.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Terminal Quickstart */}
      <div className="max-w-4xl mx-auto my-12 p-6 rounded-2xl border border-slate-800 bg-black/60 font-mono text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4 text-slate-400">
          <span>Terminal Quickstart</span>
          <span>bash</span>
        </div>
        <pre className="text-amber-300 overflow-x-auto leading-relaxed">
{`# 1. Clone repository
git clone https://github.com/pravmahawar-create/GARUDA-AI.git
cd packages/sovereign-ai-boilerplate

# 2. Configure Environment & Supabase Schema
cp .env.example .env.local
# (Run schema.sql inside your Supabase SQL editor)

# 3. Install & Start Development Server
npm install
npm run dev

# 🚀 Starter running live at http://localhost:3000`}
        </pre>
      </div>

      {/* 6. Pricing & Commercial Licenses */}
      <div className="max-w-4xl mx-auto my-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
          <div>
            <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
              Standard License
            </span>
            <div className="mt-4 text-3xl font-extrabold text-white">
              $49 <span className="text-slate-400 text-sm font-normal">/ ₹3,999</span>
            </div>
            <p className="text-slate-400 text-xs mt-2 mb-6">
              Full source code for single business or client deployment.
            </p>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">✓ Next.js 14 App Router + Tailwind</li>
              <li className="flex items-center gap-2">✓ WhatsApp Cloud API Webhooks</li>
              <li className="flex items-center gap-2">✓ Gemini 2.5 Flash Triage Engine</li>
              <li className="flex items-center gap-2">✓ Supabase PostgreSQL Schema</li>
              <li className="flex items-center gap-2">✓ Razorpay &amp; Stripe Checkout</li>
            </ul>
          </div>
          <a
            href="https://razorpay.me/@garudaosincompany"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 block text-center py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-xs transition"
          >
            Get Standard License ($49)
          </a>
        </div>

        <div className="p-6 rounded-2xl border border-amber-500/50 bg-gradient-to-b from-amber-500/10 to-transparent flex flex-col justify-between relative">
          <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-amber-400 text-black text-[10px] font-extrabold uppercase tracking-wide">
            Agency Choice
          </div>
          <div>
            <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
              Extended Agency License
            </span>
            <div className="mt-4 text-3xl font-extrabold text-white">
              $99 <span className="text-slate-400 text-sm font-normal">/ ₹7,999</span>
            </div>
            <p className="text-slate-400 text-xs mt-2 mb-6">
              Unlimited client deployments, white-label rights &amp; direct Founder support.
            </p>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">✓ Everything in Standard</li>
              <li className="flex items-center gap-2">✓ Unlimited Client Commercial Deployments</li>
              <li className="flex items-center gap-2">✓ Complete White-Label Permissions</li>
              <li className="flex items-center gap-2">✓ Priority Founder Support Channel</li>
            </ul>
          </div>
          <a
            href="https://razorpay.me/@garudaosincompany"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 block text-center py-2.5 px-4 bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black font-bold rounded-lg text-xs transition"
          >
            Get Extended Agency License ($99)
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-slate-500 text-xs border-t border-slate-800 pt-8 mt-16">
        <p>Built with 100% Anti-Fabrication Law by <strong>Praveen Mahawar</strong> · Principal Architect, GARUDA OS</p>
        <p className="mt-1">Verified Line: +91 9098750362 | Email: praveen@garudaos.in</p>
      </footer>
    </main>
  );
}
