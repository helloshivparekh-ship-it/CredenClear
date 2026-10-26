import React from 'react';
import type { AuditRecord } from '../types';
import { X, CheckCircle2, AlertTriangle, XCircle, FileText, Sparkles, AlertOctagon } from 'lucide-react';

interface InspectionModalProps {
  record: AuditRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InspectionModal: React.FC<InspectionModalProps> = ({ record, isOpen, onClose }) => {
  if (!isOpen || !record) return null;

const ext = record;
const val = { status: record.compliance_status };
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLIANT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> COMPLIANT
          </span>
        );
      case 'FLAGGED_FOR_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" /> REVIEW NEEDED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" /> NON-COMPLIANT
          </span>
        );
    }
  };

const allIssues = [
  ...(record.violations || []).map((v: any) => ({ text: v, type: 'violation' })),
  ...(record.warnings || []).map((w: any) => ({ text: w, type: 'warning' }))
];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-4">
            {getStatusBadge(val.status)}
            <div>
              <h3 className="text-lg font-bold text-white">
                {ext.insured_name || record.filename}
              </h3>
              <p className="text-xs text-slate-400">Audited against active underwriting policy</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto flex-1">
          {/* Document Preview Pane */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" /> Document Preview (ACORD 25)
            </h4>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-center overflow-hidden h-[500px]">
              <img
                src={record.preview_image}
                alt="COI Preview"
                className="max-h-full max-w-full object-contain rounded shadow-md"
              />
            </div>
          </div>

          {/* Details & Report Pane */}
          <div className="flex flex-col gap-6">
            {/* Violations & Warnings */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-amber-400" /> Violations & Warnings
              </h4>
              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 space-y-2.5 max-h-[220px] overflow-y-auto">
                {allIssues.length === 0 ? (
                  <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium py-2">
                    <CheckCircle2 className="w-4 h-4" /> No compliance violations or warnings found.
                  </div>
                ) : (
                  allIssues.map((issue, idx) => (
                    <div
                      key={idx}
                      className={`flex items-start gap-2.5 p-3 rounded-lg text-xs font-medium border ${
                        issue.type === 'violation'
                          ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                      }`}
                    >
                      {issue.type === 'violation' ? (
                        <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                      )}
                      <span>{issue.text}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Extracted Parameters KV Grid */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" /> Extracted Insurance Parameters
              </h4>
              <div className="grid grid-cols-2 gap-3 bg-slate-950/50 border border-slate-800 rounded-xl p-4">
                <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/80">
                  <span className="block text-[11px] text-slate-400 font-medium mb-1">File Name</span>
                  <strong className="text-xs text-white truncate block">{record.filename}</strong>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/80">
                  <span className="block text-[11px] text-slate-400 font-medium mb-1">Insured Business</span>
                  <strong className="text-xs text-white truncate block">{ext.insured_name || 'N/A'}</strong>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/80">
                  <span className="block text-[11px] text-slate-400 font-medium mb-1">Insurance Producer</span>
                  <strong className="text-xs text-white truncate block">{ext.producer_name || 'N/A'}</strong>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/80">
                  <span className="block text-[11px] text-slate-400 font-medium mb-1">GL Occurrence Limit</span>
                  <strong className="text-xs text-white font-mono">
                    {ext.gl_limit ? `$${ext.gl_limit.toLocaleString()}` : 'N/A'}
                  </strong>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/80">
                  <span className="block text-[11px] text-slate-400 font-medium mb-1">GL Expiration Date</span>
                  <strong className="text-xs text-white font-mono">{ext.gl_expiration_date || 'N/A'}</strong>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/80">
                  <span className="block text-[11px] text-slate-400 font-medium mb-1">Additional Insured (ADDL INSR)</span>
                  <strong className={`text-xs flex items-center gap-1 ${ext.has_additional_insured ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {ext.has_additional_insured ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {ext.has_additional_insured ? 'Checked (Yes)' : 'Unchecked (No)'}
                  </strong>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/80">
                  <span className="block text-[11px] text-slate-400 font-medium mb-1">Subrogation Waived (SUBR WVD)</span>
                  <strong className={`text-xs flex items-center gap-1 ${ext.has_subrogation_waived ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {ext.has_subrogation_waived ? <CheckCircle2 className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    {ext.has_subrogation_waived ? 'Checked (Yes)' : 'Unchecked (No)'}
                  </strong>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/80">
                  <span className="block text-[11px] text-slate-400 font-medium mb-1">Workers Compensation</span>
                  <strong className={`text-xs flex items-center gap-1 ${ext.has_workers_comp ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {ext.has_workers_comp ? <CheckCircle2 className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    {ext.has_workers_comp ? 'Present (Yes)' : 'Not Listed'}
                  </strong>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/80">
                  <span className="block text-[11px] text-slate-400 font-medium mb-1">AI Confidence Score</span>
                  <strong className="text-xs text-white font-mono">{((ext.confidence_score || 0)* 100).toFixed(1)}%</strong>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/80">
                  <span className="block text-[11px] text-slate-400 font-medium mb-1">AI Review Flag</span>
                  <strong className={`text-xs ${ext.flagged_for_human_review ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {ext.flagged_for_human_review ? 'Flagged for Review' : 'Normal'}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
