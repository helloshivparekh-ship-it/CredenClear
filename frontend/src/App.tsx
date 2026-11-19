import { useState } from 'react';
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  Code2, 
  ShieldCheck, 
  ArrowRight, 
  Copy, 
  Check, 
  Terminal,
  Cpu,
  Layers,
  Sparkles
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'python' | 'node' | 'curl'>('python');
  const [copied, setCopied] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [extractedData, setExtractedData] = useState<Record<string, any> | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const sampleJson = {
    "status": "success",
    "latency_ms": 385,
    "confidence_score": 0.979,
    "document_type": "ACORD_25_WITH_CARGO",
    "extracted_data": {
      "producer_name": "Apex Insurance Brokers LLC",
      "insured_name": "Swift Transport & Logistics Inc",
      "policies": {
        "general_liability": {
          "policy_number": "GL-9982341-26",
          "limits": {
            "each_occurrence": "$1,000,000"
          }
        },
        "motor_truck_cargo": {
          "policy_number": "MTC-8832104-26",
          "cargo_limit": "$100,000",
          "deductible": "$1,000",
          "reefer_exclusion": false,
          "status": "ACTIVE"
        }
      },
      "certificate_holder": "Global Freight Logistics Inc. 500 Market St, Chicago IL"
    }
  };

  const handleSimulateExtraction = (fileName: string) => {
    setIsProcessing(true);
    setSelectedFile(fileName);
    setExtractedData(null);
    setTimeout(() => {
      setIsProcessing(false);
      setExtractedData(sampleJson);
    }, 1800);
  };

  const handleCopyCode = (codeText: string) => {
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const codeSnippets: Record<'python' | 'node' | 'curl', string> = {
    python: "import requests\n\nurl = \"https://api.credenclear.com/v1/extract\"\nheaders = {\"Authorization\": \"Bearer cc_live_99831a...\"}\nfiles = {\"file\": open(\"certificate_of_insurance.pdf\", \"rb\")}\n\nresponse = requests.post(url, headers=headers, files=files)\nprint(response.json())",

    node: "const axios = require('axios');\nconst FormData = require('form-data');\nconst fs = require('fs');\n\nasync function extractCOI() {\n  const form = new FormData();\n  form.append('file', fs.createReadStream('coi.pdf'));\n  const response = await axios.post('https://api.credenclear.com/v1/extract', form, {\n    headers: { ...form.getHeaders(), 'Authorization': 'Bearer cc_live_...' }\n  });\n  console.log(response.data);\n}\nextractCOI();",

    curl: "curl -X POST https://api.credenclear.com/v1/extract \\\n  -H \"Authorization: Bearer cc_live_...\" \\\n  -F \"file=@/path/to/acord25.pdf\""
  };
      const cargoInfo = extractedData?.extracted_data?.policies?.motor_truck_cargo;
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white font-sans">
      
      {/* HEADER / NAVBAR */}
      <header className="border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              CredenClear
            </span>
          </div>
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#sandbox" className="hover:text-white transition-colors">API Sandbox</a>
            <a href="#docs" className="hover:text-white transition-colors">Documentation</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center space-x-4">
            <a href="#sandbox" className="text-sm font-medium text-slate-300 hover:text-white px-3 py-2">Sign In</a>
            <a href="#sandbox" className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all shadow-md shadow-indigo-600/20">
              Get API Key
            </a>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-20 pb-24 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Document AI Powered Engine v2.4</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Automate ACORD 25 Extraction with <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">Sub-Second Precision</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto font-normal">
            Turn messy certificate of insurance PDFs into structured JSON instantly. Built for freight brokers, TMS platforms, and compliance teams.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
            <a href="#sandbox" className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2">
              <span>Try Live Sandbox</span>
              <ArrowRight className="h-4 w-4" />
            </a>
            <a href="#docs" className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-semibold transition-all flex items-center justify-center space-x-2">
              <Code2 className="h-4 w-4 text-slate-400" />
              <span>View API Docs</span>
            </a>
          </div>
        </div>
      </section>

      {/* INTERACTIVE SANDBOX SECTION */}
      <section id="sandbox" className="py-16 bg-slate-900/40 border-y border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Experience the Extraction Engine</h2>
            <p className="text-slate-400 mt-2 text-sm sm:text-base">Drop a sample COI below or test with pre-loaded mock files to see live JSON output.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT PANE: UPLOAD */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center space-x-2">
                <Upload className="h-4 w-4 text-indigo-400" />
                <span>Input Document</span>
              </h3>
              
              {/* Hidden native file input for Mac selector */}
              <input 
                id="real-file-input"
                type="file" 
                accept=".pdf" 
                className="hidden" 
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleSimulateExtraction(e.target.files[0].name);
                  }
                }}
              />

              <div 
                onClick={() => document.getElementById('real-file-input')?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-xl p-8 text-center cursor-pointer bg-slate-950/50 hover:bg-slate-800/30 transition-all group"
              >
                <div className="h-12 w-12 rounded-full bg-indigo-600/10 text-indigo-400 mx-auto flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileText className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-slate-200">Click to upload ACORD 25 PDF</p>
                <p className="text-xs text-slate-500 mt-1">Select any PDF from your Mac</p>
              </div>

              <div className="mt-6">
                <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Or test with preset samples:</p>
                <div className="space-y-2">
                  {[
                    "Swift_Logistics_COI_2026.pdf",
                    "Apex_Freight_Insurance_Form.pdf",
                    "Midwest_Transport_Liability.pdf"
                  ].map((fileName, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSimulateExtraction(fileName)}
                      className="w-full text-left px-3.5 py-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800/80 text-xs text-slate-300 flex items-center justify-between transition-colors group"
                    >
                      <span className="truncate">{fileName}</span>
                      <span className="text-indigo-400 group-hover:translate-x-0.5 transition-transform font-mono text-[10px]">Test ➔</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT PANE: OUTPUT */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col min-h-[520px]">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <Terminal className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-semibold text-slate-300">API Response Preview</span>
                </div>
                {selectedFile && (
                  <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md font-mono">
                    {selectedFile}
                  </span>
                )}
              </div>
              {extractedData && cargoInfo && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl bg-slate-950 border border-indigo-500/30 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">Cargo Limit</p>
                    <p className="text-base font-bold text-indigo-400 mt-0.5">
                      {cargoInfo.cargo_limit ?? 'N/A'}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-950 border border-amber-500/30 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">Cargo Deductible</p>
                    <p className="text-base font-bold text-amber-400 mt-0.5">
                      {cargoInfo.deductible ?? 'N/A'}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-950 border border-emerald-500/30 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">Policy & Status</p>
                    <p className="text-xs font-mono font-semibold text-emerald-400 mt-1 truncate">
                      {cargoInfo.policy_number ?? '—'} · {cargoInfo.status ?? '—'}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-auto mt-4 rounded-xl bg-slate-950 p-4 border border-slate-800/80 font-mono text-xs relative"></div>

              <div className="flex-1 overflow-auto mt-4 rounded-xl bg-slate-950 p-4 border border-slate-800/80 font-mono text-xs relative">
                {isProcessing ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 space-y-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
                    <p className="text-slate-400 text-xs animate-pulse">Running Document AI extraction model...</p>
                  </div>
                ) : extractedData ? (
                  <pre className="text-emerald-400 leading-relaxed">
                    {JSON.stringify(extractedData, null, 2)}
                  </pre>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center">
                    <Cpu className="h-8 w-8 mb-2 opacity-40" />
                    <p>Select a sample document on the left to trigger the extraction endpoint.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* DEVELOPER CODE SNIPPETS */}
      <section id="docs" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <Layers className="h-4 w-4" />
              <span>Developer First</span>
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Integrates into your TMS in minutes.</h2>
            <p className="mt-4 text-slate-400 text-base leading-relaxed">
              Clean, predictable JSON responses. Every extraction includes bounding box coordinates, confidence percentages, and boolean checkbox flags for Additional Insured and Waiver of Subrogation.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-slate-300">
              <li className="flex items-center space-x-3">
                <CheckCircle2 className="h-5 w-5 text-indigo-400 flex-shrink-0" />
                <span>99.2% extraction accuracy on ACORD 25 forms</span>
              </li>
              <li className="flex items-center space-x-3">
                <CheckCircle2 className="h-5 w-5 text-indigo-400 flex-shrink-0" />
                <span>Automatic limit calculation ($1M/$2M general liability)</span>
              </li>
              <li className="flex items-center space-x-3">
                <CheckCircle2 className="h-5 w-5 text-indigo-400 flex-shrink-0" />
                <span>Webhook notifications for asynchronous batch processing</span>
              </li>
            </ul>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex space-x-2">
                {(['python', 'node', 'curl'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setActiveTab(lang)}
                    className={`px-3 py-1 rounded-md text-xs font-medium uppercase transition-all ${
                      activeTab === lang 
                        ? 'bg-indigo-600 text-white shadow-sm' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
              <button
                onClick={() => handleCopyCode(codeSnippets[activeTab])}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors flex items-center space-x-1 text-xs"
                title="Copy code"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <div className="p-4 bg-slate-950 font-mono text-xs text-indigo-200 overflow-x-auto">
              <pre>{codeSnippets[activeTab]}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-2 mb-4 sm:mb-0">
            <ShieldCheck className="h-4 w-4 text-indigo-500" />
            <span className="font-semibold text-slate-400">CredenClear API</span>
            <span>— Automated Insurance Verification</span>
          </div>
          <p>© 2026 CredenClear Inc. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}