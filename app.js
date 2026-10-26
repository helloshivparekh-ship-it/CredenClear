/* ---------------------------------------------------------
   CredenClear Dashboard - App Logic (app.js)
   --------------------------------------------------------- */

const API_BASE = "";

// State Management
let auditedRecords = [];
let selectedFile = null;

// DOM Elements
const navItems = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('.tab-content');
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const selectedFileInfo = document.getElementById('selected-file-info');
const fileNameDisplay = document.getElementById('file-name-display');
const btnRemoveFile = document.getElementById('btn-remove-file');
const btnAudit = document.getElementById('btn-audit');
const btnResetRules = document.getElementById('btn-reset-rules');
const btnBatchDemo = document.getElementById('btn-batch-demo');
const btnExport = document.getElementById('btn-export');
const btnClearTable = document.getElementById('btn-clear-table');
const auditTbody = document.getElementById('audit-tbody');
const tableSearch = document.getElementById('table-search');
const loadingOverlay = document.getElementById('loading-overlay');
const loadingTitle = document.getElementById('loading-title');
const loadingSubtitle = document.getElementById('loading-subtitle');

// Rules inputs
const ruleGlLimit = document.getElementById('rule-gl-limit');
const ruleAddlInsr = document.getElementById('rule-addl-insr');
const ruleSubrWvd = document.getElementById('rule-subr-wvd');
const ruleWorkersComp = document.getElementById('rule-workers-comp');

// Metrics
const statTotal = document.getElementById('stat-total');
const statCompliant = document.getElementById('stat-compliant');
const statReview = document.getElementById('stat-review');
const statNonCompliant = document.getElementById('stat-noncompliant');

// Modal Elements
const inspectionModal = document.getElementById('inspection-modal');
const modalClose = document.getElementById('modal-close');
const modalBtnClose = document.getElementById('modal-btn-close');
const modalStatusBadge = document.getElementById('modal-status-badge');
const modalInsuredName = document.getElementById('modal-insured-name');
const modalPreviewImg = document.getElementById('modal-preview-img');
const modalViolationsList = document.getElementById('modal-violations-list');
const modalKvGrid = document.getElementById('modal-kv-grid');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    setupDropzone();
    setupEventListeners();
    fetchSamples();
    updateMetrics();
});

// Tab Navigation
function setupTabs() {
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = item.getAttribute('data-tab');

            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            tabContents.forEach(tc => {
                tc.classList.remove('active');
                if (tc.id === `tab-${targetTab}`) {
                    tc.classList.add('active');
                }
            });
        });
    });
}

// Drag & Drop / File Upload Setup
function setupDropzone() {
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelected(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFileSelected(e.target.files[0]);
        }
    });

    btnRemoveFile.addEventListener('click', (e) => {
        e.stopPropagation();
        resetFileUpload();
    });
}

function handleFileSelected(file) {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
        alert('Please upload a valid Certificate of Insurance PDF (.pdf).');
        return;
    }
    selectedFile = file;
    fileNameDisplay.textContent = file.name;
    dropzone.classList.add('hidden');
    selectedFileInfo.classList.remove('hidden');
    btnAudit.removeAttribute('disabled');
}

function resetFileUpload() {
    selectedFile = null;
    fileInput.value = '';
    dropzone.classList.remove('hidden');
    selectedFileInfo.classList.add('hidden');
    btnAudit.setAttribute('disabled', 'true');
}

// Event Listeners
function setupEventListeners() {
    btnAudit.addEventListener('click', () => {
        if (selectedFile) {
            uploadAndAuditFile(selectedFile);
        }
    });

    btnResetRules.addEventListener('click', () => {
        ruleGlLimit.value = "1000000";
        ruleAddlInsr.checked = true;
        ruleSubrWvd.checked = false;
        ruleWorkersComp.checked = false;
    });

    btnClearTable.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all audited records?')) {
            auditedRecords = [];
            renderTable();
            updateMetrics();
            btnExport.setAttribute('disabled', 'true');
        }
    });

    tableSearch.addEventListener('input', (e) => {
        renderTable(e.target.value);
    });

    btnBatchDemo.addEventListener('click', () => {
        runBatchDemo();
    });

    // Modal close
    modalClose.addEventListener('click', closeModal);
    modalBtnClose.addEventListener('click', closeModal);
    inspectionModal.addEventListener('click', (e) => {
        if (e.target === inspectionModal) closeModal();
    });

    // Export JSON
    btnExport.addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(auditedRecords, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `credenclear_audit_ledger_${new Date().toISOString().slice(0,10)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    });
}

// API Calls
async function uploadAndAuditFile(file) {
    showLoader("Analyzing Certificate with Gemini Flash...", "Extracting OCR fields and validating endorsement checkboxes");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("min_general_liability", ruleGlLimit.value);
    formData.append("require_additional_insured", ruleAddlInsr.checked);
    formData.append("require_subrogation_waived", ruleSubrWvd.checked);
    formData.append("require_workers_comp", ruleWorkersComp.checked);

    try {
        const res = await fetch(`${API_BASE}/api/upload`, {
            method: "POST",
            body: formData
        });

        if (!res.ok) {
            const errJson = await res.json();
            throw new Error(errJson.detail || "Failed to process COI file.");
        }

        const data = await res.json();
        addAuditRecord(data);
        resetFileUpload();
    } catch (err) {
        alert(`Audit Error: ${err.message}`);
    } finally {
        hideLoader();
    }
}

async function auditSampleFile(filename) {
    showLoader(`Auditing sample '${filename}'...`, "Gemini AI vision extracting compliance data");

    const params = new URLSearchParams({
        min_general_liability: ruleGlLimit.value,
        require_additional_insured: ruleAddlInsr.checked,
        require_subrogation_waived: ruleSubrWvd.checked,
        require_workers_comp: ruleWorkersComp.checked
    });

    try {
        const res = await fetch(`${API_BASE}/api/sample/${encodeURIComponent(filename)}?${params.toString()}`, {
            method: "POST"
        });

        if (!res.ok) {
            const errJson = await res.json();
            throw new Error(errJson.detail || "Failed to process sample file.");
        }

        const data = await res.json();
        addAuditRecord(data);
    } catch (err) {
        alert(`Sample Audit Error: ${err.message}`);
    } finally {
        hideLoader();
    }
}

async function fetchSamples() {
    try {
        const res = await fetch(`${API_BASE}/api/samples`);
        const data = await res.json();
        const grid = document.getElementById('samples-grid');
        grid.innerHTML = "";

        if (!data.samples || data.samples.length === 0) {
            grid.innerHTML = "<p>No sample files found in test_data/</p>";
            return;
        }

        data.samples.forEach(sample => {
            const card = document.createElement('div');
            card.className = 'sample-card';
            card.innerHTML = `
                <div class="metric-icon bg-blue"><i class="fa-solid fa-file-pdf"></i></div>
                <h4>${sample.filename}</h4>
                <p>Size: ${sample.size_kb} KB</p>
                <button class="btn btn-outline btn-sm btn-full">Audit Sample</button>
            `;
            card.querySelector('button').addEventListener('click', () => {
                // Switch back to dashboard tab
                document.querySelector('.nav-item[data-tab="dashboard"]').click();
                auditSampleFile(sample.filename);
            });
            grid.appendChild(card);
        });
    } catch (err) {
        console.error("Failed to load samples:", err);
    }
}

async function runBatchDemo() {
    showLoader("Running Sample Batch Audit...", "Processing all pre-loaded ACORD 25 certificates concurrently");
    try {
        const res = await fetch(`${API_BASE}/api/samples`);
        const data = await res.json();
        
        if (!data.samples || data.samples.length === 0) {
            alert("No sample files available.");
            return;
        }

        for (const sample of data.samples) {
            const params = new URLSearchParams({
                min_general_liability: ruleGlLimit.value,
                require_additional_insured: ruleAddlInsr.checked,
                require_subrogation_waived: ruleSubrWvd.checked,
                require_workers_comp: ruleWorkersComp.checked
            });
            const subRes = await fetch(`${API_BASE}/api/sample/${encodeURIComponent(sample.filename)}?${params.toString()}`, {
                method: "POST"
            });
            if (subRes.ok) {
                const subData = await subRes.json();
                addAuditRecord(subData, false); // Don't trigger multiple table redraws until end
            }
        }
        renderTable();
        updateMetrics();
        btnExport.removeAttribute('disabled');
        // Switch to dashboard
        document.querySelector('.nav-item[data-tab="dashboard"]').click();
    } catch (err) {
        alert(`Batch error: ${err.message}`);
    } finally {
        hideLoader();
    }
}

// Table & State Handlers
function addAuditRecord(record, redraw = true) {
    // Avoid exact duplicates by filename if re-uploaded
    auditedRecords = auditedRecords.filter(r => r.filename !== record.filename);
    auditedRecords.unshift(record); // Add to top
    if (redraw) {
        renderTable();
        updateMetrics();
        btnExport.removeAttribute('disabled');
    }
}

function renderTable(filter = "") {
    auditTbody.innerHTML = "";

    const filtered = auditedRecords.filter(r => {
        const insured = (r.extracted_data.insured_name || "").toLowerCase();
        const producer = (r.extracted_data.producer_name || "").toLowerCase();
        const filename = (r.filename || "").toLowerCase();
        const query = filter.toLowerCase();
        return insured.includes(query) || producer.includes(query) || filename.includes(query);
    });

    if (filtered.length === 0) {
        auditTbody.innerHTML = `
            <tr class="empty-row">
                <td colspan="8">
                    <div class="empty-state">
                        <i class="fa-solid fa-folder-open"></i>
                        <p>${auditedRecords.length === 0 ? "No certificates audited yet. Upload a PDF or run a sample batch above." : "No matching records found."}</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    filtered.forEach((record, idx) => {
        const ext = record.extracted_data;
        const val = record.validation_result;
        const statusClass = val.status.toLowerCase();
        const statusLabel = val.status.replace(/_/g, ' ');

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="badge ${statusClass}"><i class="fa-solid ${getStatusIcon(val.status)}"></i> ${statusLabel}</span></td>
            <td><strong>${escapeHtml(ext.insured_name || record.filename)}</strong></td>
            <td><small>${escapeHtml(ext.producer_name || 'N/A')}</small></td>
            <td>${ext.general_liability_limit ? '$' + ext.general_liability_limit.toLocaleString() : '<span class="text-muted">Not Found</span>'}</td>
            <td>${ext.gl_expiration_date || '<span class="text-muted">Missing</span>'}</td>
            <td>${ext.is_additional_insured_checked ? '<i class="fa-solid fa-check text-success"></i> Yes' : '<i class="fa-solid fa-xmark text-danger"></i> No'}</td>
            <td>${(ext.confidence_score * 100).toFixed(0)}%</td>
            <td>
                <button class="btn btn-outline btn-sm" onclick="openInspectionModal(${auditedRecords.indexOf(record)})">
                    <i class="fa-solid fa-eye"></i> Inspect
                </button>
            </td>
        `;
        auditTbody.appendChild(tr);
    });
}

function updateMetrics() {
    const total = auditedRecords.length;
    const compliant = auditedRecords.filter(r => r.validation_result.status === 'COMPLIANT').length;
    const review = auditedRecords.filter(r => r.validation_result.status === 'FLAGGED_FOR_REVIEW').length;
    const nonCompliant = auditedRecords.filter(r => r.validation_result.status === 'NON_COMPLIANT').length;

    statTotal.textContent = total;
    statCompliant.textContent = compliant;
    statReview.textContent = review;
    statNonCompliant.textContent = nonCompliant;
}

function getStatusIcon(status) {
    if (status === 'COMPLIANT') return 'fa-circle-check';
    if (status === 'FLAGGED_FOR_REVIEW') return 'fa-triangle-exclamation';
    return 'fa-circle-xmark';
}

// Modal Inspection
window.openInspectionModal = function(index) {
    const record = auditedRecords[index];
    if (!record) return;

    const ext = record.extracted_data;
    const val = record.validation_result;

    modalStatusBadge.className = `badge ${val.status.toLowerCase()}`;
    modalStatusBadge.textContent = val.status.replace(/_/g, ' ');
    modalInsuredName.textContent = ext.insured_name || record.filename;
    modalPreviewImg.src = record.preview_image;

    // Violations list
    modalViolationsList.innerHTML = "";
    const allIssues = [...(val.violations || []).map(v => ({ text: v, type: 'violation' })), ...(val.warnings || []).map(w => ({ text: w, type: 'warning' }))];
    
    if (allIssues.length === 0) {
        modalViolationsList.innerHTML = `<li class="no-issues"><i class="fa-solid fa-circle-check"></i> No compliance violations or warnings found.</li>`;
    } else {
        allIssues.forEach(issue => {
            const li = document.createElement('li');
            li.className = issue.type;
            const icon = issue.type === 'violation' ? 'fa-circle-xmark' : 'fa-triangle-exclamation';
            li.innerHTML = `<i class="fa-solid ${icon}"></i> ${escapeHtml(issue.text)}`;
            modalViolationsList.appendChild(li);
        });
    }

    // KV Grid
    modalKvGrid.innerHTML = `
        <div class="kv-item"><small>File Name</small><strong>${escapeHtml(record.filename)}</strong></div>
        <div class="kv-item"><small>Insured Business</small><strong>${escapeHtml(ext.insured_name || 'N/A')}</strong></div>
        <div class="kv-item"><small>Insurance Producer</small><strong>${escapeHtml(ext.producer_name || 'N/A')}</strong></div>
        <div class="kv-item"><small>GL Occurrence Limit</small><strong>${ext.general_liability_limit ? '$' + ext.general_liability_limit.toLocaleString() : 'N/A'}</strong></div>
        <div class="kv-item"><small>GL Expiration Date</small><strong>${escapeHtml(ext.gl_expiration_date || 'N/A')}</strong></div>
        <div class="kv-item"><small>Additional Insured</small><strong>${ext.is_additional_insured_checked ? 'Checked (Yes)' : 'Unchecked (No)'}</strong></div>
        <div class="kv-item"><small>Subrogation Waived</small><strong>${ext.is_subrogation_waived ? 'Checked (Yes)' : 'Unchecked (No)'}</strong></div>
        <div class="kv-item"><small>Workers Compensation</small><strong>${ext.has_workers_comp ? 'Present (Yes)' : 'Not Listed'}</strong></div>
        <div class="kv-item"><small>AI Confidence Score</small><strong>${(ext.confidence_score * 100).toFixed(1)}%</strong></div>
        <div class="kv-item"><small>AI Review Flag</small><strong>${ext.flagged_for_human_review ? 'Flagged for Review' : 'Normal'}</strong></div>
    `;

    inspectionModal.classList.add('open');
};

function closeModal() {
    inspectionModal.classList.remove('open');
}

// Loader
function showLoader(title = "Analyzing COI with Gemini AI...", subtitle = "Inspecting checkboxes and verifying policy limits...") {
    loadingTitle.textContent = title;
    loadingSubtitle.textContent = subtitle;
    loadingOverlay.classList.remove('hidden');
}

function hideLoader() {
    loadingOverlay.classList.add('hidden');
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
