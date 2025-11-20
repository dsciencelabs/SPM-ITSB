
export enum AuditStandard {
  PERMENDIKTISAINTEK_2025 = 'Permendiktisaintek No. 39/2025 (Semua Unit)',
  LAM_TEKNIK = 'LAM TEKNIK (FTSP)',
  LAM_INFOKOM = 'LAM INFOKOM (FDDB)',
  BAN_PT = 'BAN-PT (Vokasi & Institusi)'
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
  username?: string; // Added for login/management
  password?: string; // Added for management (demo)
  role: UserRole;
  department?: string; // For Auditee
  status?: 'Active' | 'Inactive'; // Added for management
}

export interface AuditQuestion {
  id: string;
  category: string;
  questionText: string;
  
  // Auditor Final Decision (Verification)
  compliance: 'Compliant' | 'Non-Compliant' | 'Observation' | null;
  
  // Auditee Self Assessment (Claim)
  auditeeSelfAssessment?: 'Compliant' | 'Non-Compliant' | 'Observation' | null;
  
  evidence?: string;
  auditorNotes?: string;
  
  // Auditee Response (Legacy/Additional text)
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
