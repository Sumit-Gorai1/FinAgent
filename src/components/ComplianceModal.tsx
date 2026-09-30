import React from 'react';
import { ShieldAlert, CheckCircle2, AlertTriangle, X, FileText } from 'lucide-react';

interface ComplianceModalProps {
  onClose: () => void;
}

export const ComplianceModal: React.FC<ComplianceModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white font-mono">
              REGULATORY NOTICE & SEBI COMPLIANCE FRAMEWORK
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs text-slate-300 leading-relaxed font-sans">
          <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/50 text-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block text-sm text-white">
                Educational & Autonomous Multi-Agent Research Assistance
              </strong>
              FINAGENT is an autonomous, algorithmic information synthesis engine designed solely for analytical, research, and technical education purposes.
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-white font-bold font-mono">1. Regulatory Boundary (SEBI / Indian Regulations):</h4>
            <p>
              In India, offering personalized investment advice or portfolio management to individual retail clients is a regulated financial activity requiring registration as a <strong>SEBI Research Analyst (RA)</strong> or <strong>SEBI Registered Investment Adviser (RIA)</strong> under the SEBI (Research Analysts) Regulations, 2014.
            </p>
            <p>
              FINAGENT does <em>not</em> provide personalized financial advisory or execution recommendations. All generated committee scores, indicators, and theses represent mathematical outputs and multi-agent synthesis based on publicly available audited data.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-white font-bold font-mono">2. Evidence Verification & Hallucination Guard:</h4>
            <p>
              All quantitative metrics are calculated using verified mathematical formulas (e.g., standard SMA, RSI, MACD, and CAGR definitions). Language models are strictly confined to synthesizing, debating, and interpreting verified data points, overseen by an independent Verifier Agent.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-white font-bold font-mono">3. Virtual Paper Trading:</h4>
            <p>
              The paper trading module operates entirely with simulated virtual currency. No real capital is ever deployed, transferred, or committed through this simulation.
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-mono font-bold rounded-lg shadow-md transition-all"
          >
            I Acknowledge & Understand
          </button>
        </div>
      </div>
    </div>
  );
};
