export interface DashboardSummary {
  total_projects: number;
  total_submissions: number;
  open_issues: number;
  followup_required: number;
  high_critical_priority: number;
  lessons_learned: number;
}

export interface DashboardSubmission {
  submission_id: string;
  timestamp: string;
  respondent_name: string;
  function: string;
  project_code: string;
  project_name: string;
  business_unit: string;
  client: string;
  status: string;
  issues: string;
  followup_required: string;
  action_plan: string;
  pic_name: string;
  target_date: string;
  priority: string;
  finding_category: string;
  lessons_learned: string;
  best_practices: string;
  never_again: string;
}

export interface DashboardProject {
  project_code?: string;
  project_name?: string;
  business_unit?: string;
  client?: string;
  status?: string;
}

export interface DashboardBucket {
  label: string;
  count: number;
}

export interface DashboardDocument {
  document_id?: string;
  submission_id?: string;
  project_code?: string;
  project_name?: string;
  file_name?: string;
  mime_type?: string;
  uploaded_at?: string;
  drive_url?: string;
}

export interface DashboardData {
  success: boolean;
  generated_at: string;
  summary: DashboardSummary;
  projects: DashboardProject[];
  submissions: DashboardSubmission[];
  by_business_unit: DashboardBucket[];
  by_function: DashboardBucket[];
  supporting_documents: DashboardDocument[];
}
