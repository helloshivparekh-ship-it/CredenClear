import React from 'react';
import type { SampleFile } from '../types';
import { FolderOpen, FileText, Wand2 } from 'lucide-react';

interface SamplesTabProps {
  samples: SampleFile[];
  onAuditSample: (filename: string) => void;
}

export const SamplesTab: React.FC<SamplesTabProps> = ({ samples, onAuditSample }) => {
  return (
    <div className="space-y-6">
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
            <FolderOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Pre-loaded Sample Certificates</h2>
            <p className="text-xs text-slate-400">Click any sample document to instantly audit it against your current policy rules.</p>
          </div>
        </div>

        {samples.length === 0 ? (
          <p className="text-slate-500 text-xs">No sample files found in test_data/</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {samples.map((sample, idx) => (
              <div
                key={idx}
                className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white truncate max-w-[200px]" title={sample.filename}>
                      {sample.filename}
                    </h4>
                    <span className="text-xs text-slate-400">Size: {sample.size_kb} KB</span>
                  </div>
                </div>

                <button
                  onClick={() => onAuditSample(sample.filename)}
                  className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Wand2 className="w-3.5 h-3.5" /> Audit Sample
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
