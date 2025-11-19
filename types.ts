export enum AuditStandard {
  BAN_PT = 'BAN-PT (9 Kriteria)',
  LAM_TEKNIK = 'LAM TEKNIK',
  LAM_INFOKOM = 'LAM INFOKOM',
  PERMENDIKTISAINTEK_2025 = 'Permendiktisaintek No. 39/2025 (Prodi)'
}

export enum AuditStatus {
  PLANNED = 'Planned',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed'
}

export enum UserRole {
  SUPER_ADMIN = 'SuperAdmin',
  ADMIN = 'Admin',
  AUDITOR = 'Auditor',
  AUDITEE = 'Auditee'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  department?: string; // For Auditee
}

export interface AuditQuestion {
  id: string;
  category: string;
  questionText: string;
  compliance: 'Compliant' | 'Non-Compliant' | 'Observation' | null;
  evidence?: string;
  auditorNotes?: string;
  // New fields for Auditee response
  auditeeResponse?: string;
  actionPlan?: string;
  actionPlanDeadline?: string;
}

export interface AuditSession {
  id: string;
  name: string;
  department: string;
  standard: AuditStandard;
  status: AuditStatus;
  date: string;
  assignedAuditorId?: string; // Link to specific auditor
  questions: AuditQuestion[];
  aiSummary?: string;
  aiRecommendations?: string[];
}

export type ViewState = 
  | 'DASHBOARD' 
  | 'NEW_AUDIT' 
  | 'AUDIT_EXECUTION' 
  | 'REPORT' 
  // SuperAdmin & Admin Views
  | 'USER_MGMT'
  | 'TEMPLATE_MGMT'
  | 'SETTINGS'
  | 'MASTER_DATA'
  | 'AUDIT_SCHEDULE';