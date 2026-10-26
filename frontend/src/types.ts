export interface COIExtraction {
  producer_name?: string | null;
  insured_name?: string | null;
  has_general_liability: boolean;
  general_liability_limit?: number | null;
  gl_expiration_date?: string | null;
  is_additional_insured_checked: boolean;
  is_subrogation_waived: boolean;
  has_workers_comp: boolean;
  confidence_score: number;
  flagged_for_human_review: boolean;
}

export interface ValidationResult {
  status: 'COMPLIANT' | 'FLAGGED_FOR_REVIEW' | 'NON_COMPLIANT';
  violations: string[];
  warnings: string[];
  validated_at: string;
  rules_applied: {
    min_general_liability: number;
    require_additional_insured: boolean;
    require_subrogation_waived: boolean;
    require_workers_comp: boolean;
  };
}

export interface AuditRecord {
  id?: number;
  file_name?: string;
  filename?: string; 
  producer_name?: string;
  insured_name?: string;
  gl_limit?: number;
  gl_expiration_date?: string;
  has_additional_insured?: boolean;
  has_subrogation_waived?: boolean;
  has_workers_comp?: boolean;
  flagged_for_human_review?: boolean;
  confidence_score?: number;
  compliance_status: string;
  preview_image?: string;
  violations?: string[];
  warnings?: string[];
}

export interface SampleFile {
  filename: string;
  size_kb: number;
}
