export type Department =
  | 'Project Management'
  | 'Operation'
  | 'Finance'
  | 'Procurement'
  | 'Asset Management & Warehouse'
  | 'Human Resources'
  | 'QSHE'
  | 'Legal Operation'
  | 'Tender Proposal/Business Development';

export type QuestionType =
  | 'text'
  | 'textarea'
  | 'radio'
  | 'checkbox'
  | 'select'
  | 'searchable-select'
  | 'date'
  | 'number'
  | 'scale'
  | 'file';

export interface QuestionCondition {
  questionId: string;
  operator: 'equals' | 'notEquals' | 'in' | 'notIn';
  value: any;
}

export interface ScaleConfig {
  min: number;
  max: number;
  minLabel?: string;
  maxLabel?: string;
}

export interface QuestionDefinition {
  id: string;
  section: string;
  subsection?: string;
  number: number | string;
  question: string;
  type: QuestionType;
  required?: boolean;
  options?: string[];
  condition?: QuestionCondition;
  placeholder?: string;
  helperText?: string;
  unit?: string;
  scaleConfig?: ScaleConfig;
  readOnly?: boolean;
}

export interface ProjectMock {
  code: string;
  name: string;
  client: string;
  businessUnit: string;
}

export interface UploadedFileMock {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
}

export type FormResponses = Record<string, any>;

export type StepNumber = 1 | 2 | 3 | 4 | 5;

export interface ValidationErrors {
  [questionId: string]: string;
}

export interface SubmissionAnswerItem {
  question_id: string;
  question: string;
  answer: string;
  function?: string;
  section?: string;
}

export interface QuestionnaireSubmissionPayload {
  submission_id: string;
  timestamp: string;
  respondent_name: string;
  function: string;
  project_code: string;
  project_name: string;
  business_unit: string;
  client: string;
  answers: SubmissionAnswerItem[];
}

export interface SubmissionResponse {
  success: boolean;
  submission_id?: string;
  message?: string;
  error?: string;
  isAppsScriptIssue?: boolean;
  errorType?: string;
  instructions?: string[];
  rawSnippet?: string;
}

export interface CompletedSubmission {
  id: string;
  submittedAt: string;
  payload: QuestionnaireSubmissionPayload;
}

