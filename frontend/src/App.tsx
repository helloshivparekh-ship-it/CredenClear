import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { DashboardTab } from './components/DashboardTab';
import { RulesTab } from './components/RulesTab';
import { SamplesTab } from './components/SamplesTab';
import { InspectionModal } from './components/InspectionModal';
import { LoadingOverlay } from './components/LoadingOverlay';
import type { AuditRecord, SampleFile } from './types';
import { Download, Zap } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [auditedRecords, setAuditedRecords] = useState<AuditRecord[]>([]);
  const [samples, setSamples] = useState<SampleFile[]>([]);
  const [rules, setRules] = useState({
    glLimit: '1000000',
    addlInsr: true,
    subrWvd: false,
    workersComp: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [loadingTitle, setLoadingTitle] = useState('Analyzing Certificate with Gemini AI...');
  const [loadingSubtitle, setLoadingSubtitle] = useState('Extracting OCR fields and validating endorsement checkboxes');

  const [inspectionRecord, setInspectionRecord] = useState<AuditRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchSamples();
  }, []);

  const fetchSamples = async () => {
    try {
      const res = await fetch('/api/samples');
      const data = await res.json();
      if (data.samples) {
        setSamples(data.samples);
      }
    } catch (err) {
      console.error('Failed to fetch samples:', err);
    }
  };

  const handleAuditFile = async (file: File) => {
    setIsLoading(true);
    setLoadingTitle('Analyzing Certificate with Gemini AI...');
    setLoadingSubtitle('Extracting OCR fields and validating endorsement checkboxes');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('min_general_liability', rules.glLimit);
    formData.append('require_additional_insured', String(rules.addlInsr));
    formData.append('require_subrogation_waived', String(rules.subrWvd));
    formData.append('require_workers_comp', String(rules.workersComp));

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.detail || 'Failed to process COI file.');
      }

      const data: AuditRecord = await res.json();
      addAuditRecord(data);
    } catch (err: any) {
      alert(`Audit Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuditSample = async (filename: string) => {
    setIsLoading(true);
    setLoadingTitle(`Auditing sample '${filename}'...`);
    setLoadingSubtitle('Gemini AI vision extracting compliance data');

    const params = new URLSearchParams({
      min_general_liability: rules.glLimit,
      require_additional_insured: String(rules.addlInsr),
      require_subrogation_waived: String(rules.subrWvd),
      require_workers_comp: String(rules.workersComp),
    });

    try {
      const res = await fetch(`/api/sample/${encodeURIComponent(filename)}?${params.toString()}`, {
        method: 'POST',
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.detail || 'Failed to process sample file.');
      }

      const data: AuditRecord = await res.json();
      addAuditRecord(data);
      setActiveTab('dashboard');
    } catch (err: any) {
      alert(`Sample Audit Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBatchDemo = async () => {
    if (samples.length === 0) {
      alert('No sample files available.');
      return;
    }

    setIsLoading(true);
    setLoadingTitle('Running Sample Batch Audit...');
    setLoadingSubtitle('Processing all pre-loaded ACORD 25 certificates concurrently');

    try {
      for (const sample of samples) {
        const params = new URLSearchParams({
          min_general_liability: rules.glLimit,
          require_additional_insured: String(rules.addlInsr),
          require_subrogation_waived: String(rules.subrWvd),
          require_workers_comp: String(rules.workersComp),
        });

        const subRes = await fetch(`/api/sample/${encodeURIComponent(sample.filename)}?${params.toString()}`, {
          method: 'POST',
        });

        if (subRes.ok) {
          const subData: AuditRecord = await subRes.json();
          addAuditRecord(subData);
        }
      }
      setAuditedRecords(prev => [...prev]);
      setActiveTab('dashboard');
    } catch (err: any) {
      alert(`Batch error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const addAuditRecord = (record: AuditRecord) => {
    setAuditedRecords(prev => {
      const filtered = prev.filter(r => r.filename !== record.filename);
      return [record, ...filtered];
    });
  };

  const handleClearTable = () => {
    if (confirm('Are you sure you want to clear all audited records?')) {
      setAuditedRecords([]);
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditedRecords, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `credenclear_audit_ledger_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const openInspectionModal = (record: AuditRecord) => {
    setInspectionRecord(record);
    setIsModalOpen(true);
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-['Plus_Jakarta_Sans',sans-serif] overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="p-6 border-b border-slate-800/80 bg-slate-900/40 backdrop-blur flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Certificate of Insurance (COI) Audit</h2>
            <p className="text-xs text-slate-400 mt-0.5">Automate ACORD 25 compliance review with enterprise AI vision & rules validation.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportJSON}
              disabled={auditedRecords.length === 0}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" /> Export JSON
            </button>
            <button
              onClick={handleBatchDemo}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4" /> Run Sample Batch
            </button>
          </div>
        </header>

        {/* Tab Views */}
        <div className="p-8 max-w-7xl w-full mx-auto flex-1">
          {activeTab === 'dashboard' && (
            <DashboardTab
              auditedRecords={auditedRecords}
              onAuditFile={handleAuditFile}
              onClearTable={handleClearTable}
              onInspectRecord={openInspectionModal}
              rules={rules}
              setRules={setRules}
            />
          )}

          {activeTab === 'rules' && <RulesTab />}

          {activeTab === 'samples' && (
            <SamplesTab samples={samples} onAuditSample={handleAuditSample} />
          )}
        </div>
      </main>

      <InspectionModal
        record={inspectionRecord}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <LoadingOverlay isLoading={isLoading} title={loadingTitle} subtitle={loadingSubtitle} />
    </div>
  );
}
