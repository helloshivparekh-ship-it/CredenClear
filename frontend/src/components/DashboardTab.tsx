import React, { useState, useRef } from 'react';
import type { AuditRecord } from '../types';
import { FileText, CheckCircle2, AlertTriangle, XCircle, Upload, Sliders, Table, Search, Trash2, Eye, Wand2, X, FileUp } from 'lucide-react';

interface DashboardTabProps {
  auditedRecords: AuditRecord[];
  onAuditFile: (file: File) => void;
  onClearTable: () => void;
  onInspectRecord: (record: AuditRecord) => void;
  rules: {
    glLimit: string;
    addlInsr: boolean;
    subrWvd: boolean;
    workersComp: boolean;
  };
  setRules: React.Dispatch<React.SetStateAction<{
    glLimit: string;
    addlInsr: boolean;
    subrWvd: boolean;
    workersComp: boolean;
  }>>;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  auditedRecords,
  onAuditFile,
  onClearTable,
  onInspectRecord,
  rules,
  setRules,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const total = auditedRecords.length;
  const compliant = auditedRecords.filter(r => r.compliance_status === 'COMPLIANT').length;
  const review = auditedRecords.filter(r => r.compliance_status === 'FLAGGED_FOR_REVIEW').length;
  const nonCompliant = auditedRecords.filter(r => r.compliance_status === 'NON_COMPLIANT').length;

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith('.pdf')) {
        setSelectedFile(file);
      } else {
        alert('Please upload a valid Certificate of Insurance PDF (.pdf).');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.name.toLowerCase().endsWith('.pdf')) {
        setSelectedFile(file);
      } else {
        alert('Please upload a valid Certificate of Insurance PDF (.pdf).');
      }
    }
  };

  const filteredRecords = auditedRecords.filter(r => {
    const insured = (r.insured_name || '').toLowerCase();
    const producer = (r.producer_name || '').toLowerCase();
    const filename = (r.filename || '').toLowerCase();
    const q = searchQuery.toLowerCase();
    return insured.includes(q) || producer.includes(q) || filename.includes(q);
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLIANT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Compliant
          </span>
        );
      case 'FLAGGED_FOR_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3" /> Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3" /> Non-Compliant
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-bold text-white tracking-tight">{total}</span>
            <small className="block text-xs text-slate-400 font-medium">Total Audited</small>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-bold text-white tracking-tight">{compliant}</span>
            <small className="block text-xs text-slate-400 font-medium">Compliant</small>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-bold text-white tracking-tight">{review}</span>
            <small className="block text-xs text-slate-400 font-medium">Review Needed</small>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-bold text-white tracking-tight">{nonCompliant}</span>
            <small className="block text-xs text-slate-400 font-medium">Non-Compliant</small>
          </div>
        </div>
      </div>

      {/* Upload & Rules Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Card */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-400" /> Upload COI PDF
            </h3>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center flex flex-col items-center justify-center transition-all ${
              isDragging ? 'border-blue-500 bg-blue-500/5' : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
            }`}
          >
            {!selectedFile ? (
              <>
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3 border border-blue-500/20">
                  <FileUp className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Drag & Drop your ACORD 25 PDF here</h4>
                <p className="text-xs text-slate-400 mb-4">or browse your local files (Max 25MB)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
                >
                  Browse Files
                </button>
              </>
            ) : (
              <div className="flex items-center justify-between w-full bg-slate-900 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-blue-400" />
                  <div className="text-left">
                    <strong className="text-sm text-white block">{selectedFile.name}</strong>
                    <span className="text-xs text-slate-400">Ready for compliance audit</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <button
            disabled={!selectedFile}
            onClick={() => {
              if (selectedFile) {
                onAuditFile(selectedFile);
                setSelectedFile(null);
              }
            }}
            className="mt-4 w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            <Wand2 className="w-4 h-4" /> Run AI Compliance Audit
          </button>
        </div>

        {/* Rules Panel */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-400" /> Policy Thresholds
            </h3>
            <button
              onClick={() => setRules({ glLimit: '1000000', addlInsr: true, subrWvd: false, workersComp: false })}
              className="text-xs text-blue-400 hover:underline font-medium"
            >
              Reset Default
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Min. General Liability Limit ($)</label>
              <select
                value={rules.glLimit}
                onChange={(e) => setRules({ ...rules, glLimit: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="500000">$500,000</option>
                <option value="1000000">$1,000,000 (Standard)</option>
                <option value="2000000">$2,000,000</option>
                <option value="5000000">$5,000,000</option>
              </select>
            </div>

            <div className="space-y-2.5 pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.addlInsr}
                  onChange={(e) => setRules({ ...rules, addlInsr: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-0 w-4 h-4"
                />
                <span className="text-xs font-medium text-slate-300">Require Additional Insured (ADDL INSR)</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.subrWvd}
                  onChange={(e) => setRules({ ...rules, subrWvd: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-0 w-4 h-4"
                />
                <span className="text-xs font-medium text-slate-300">Require Subrogation Waived (SUBR WVD)</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.workersComp}
                  onChange={(e) => setRules({ ...rules, workersComp: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-0 w-4 h-4"
                />
                <span className="text-xs font-medium text-slate-300">Require Workers' Compensation</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Results Ledger Section */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Table className="w-4 h-4 text-blue-400" /> Audit Ledger
          </h3>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search insured or producer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              onClick={onClearTable}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear All
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Insured / Contractor</th>
                <th className="py-3 px-4">Producer / Agency</th>
                <th className="py-3 px-4">GL Limit</th>
                <th className="py-3 px-4">Expiration</th>
                <th className="py-3 px-4">Addl Insr</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FileText className="w-8 h-8 opacity-40" />
                      <p>
                        {auditedRecords.length === 0
                          ? "No certificates audited yet. Upload a PDF or run a sample batch above."
                          : "No matching records found."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record, index) => {
                  return (
      <tr key={index} className="hover:bg-slate-800/30 transition-colors">
        <td className="py-3.5 px-4">{getStatusBadge(record.compliance_status)}</td>
        <td className="py-3.5 px-4 font-semibold text-white">{record.insured_name || record.file_name || 'Unknown'}</td>
        <td className="py-3.5 px-4 text-slate-400">{record.producer_name || 'N/A'}</td>
        <td className="py-3.5 px-4 font-mono text-slate-300">
          {record.gl_limit ? `$${record.gl_limit.toLocaleString()}` : <span className="text-slate-500">N/A</span>}
        </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">{record.gl_expiration_date || <span className="text-slate-600">Missing</span>}</td>
                      <td className="py-3.5 px-4">
                        {record.has_additional_insured ? (
                          <span className="text-emerald-400 flex items-center gap-1 font-medium"><CheckCircle2 className="w-3.5 h-3.5" /> Yes</span>
                        ) : (
                          <span className="text-rose-400 flex items-center gap-1 font-medium"><XCircle className="w-3.5 h-3.5" /> No</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">{((record.confidence_score || 0) * 100).toFixed(0)}%</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onInspectRecord(record)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs flex items-center gap-1.5 ml-auto transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
