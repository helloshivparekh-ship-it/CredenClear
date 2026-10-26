import React from 'react';
import { Sliders, Shield, Cpu, Clock, CheckCircle2 } from 'lucide-react';

export const RulesTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Compliance Policy Configuration</h2>
            <p className="text-xs text-slate-400">Configure default validation rules applied across all incoming Certificates of Insurance.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="p-5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
              <Clock className="w-4 h-4" /> Expiration Window
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Certificates expiring within 30 days generate an active warning notification in the audit ledger and block auto-approval.
            </p>
          </div>

          <div className="p-5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
              <Cpu className="w-4 h-4" /> OCR Vision Precision
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Powered by Gemini 3.8 Flash with 0.0 temperature for deterministic JSON extraction of tiny legal checkboxes and limits.
            </p>
          </div>

          <div className="p-5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
              <Shield className="w-4 h-4" /> Mandatory Endorsements
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ensures ADDL INSR (Additional Insured) and SUBR WVD (Subrogation Waived) checkboxes are legally verified by AI vision.
            </p>
          </div>

          <div className="p-5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
              <CheckCircle2 className="w-4 h-4" /> Automated Compliance
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Instant rule evaluation engine flags non-compliant limit amounts against contract requirements automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
