
export interface Claim {
  claim_id: string;
  patient_id: string;
  provider_name: string;
  date_of_service: string;
  diagnosis_code: string;
  procedure_code: string;
  claim_amount: string;
  insurance_policy_number: string;
  status: 'Submitted' | 'Under Review' | 'Approved' | 'Rejected' | string;
  submitted_date: string;
  approval_date: string;
}

export interface AIAnalysis {
  validationErrors: string[];
  riskLevel: 'Low' | 'Medium' | 'High';
  suggestedWorkflow: string;
}

export interface AnalyzedClaim extends Claim {
  id: number;
  aiAnalysis: AIAnalysis | null;
  processingState: 'pending' | 'processing' | 'done' | 'error';
}

export type ClaimStatus = 'Approved' | 'Rejected' | 'Under Review' | 'Submitted';
