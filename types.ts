
export enum AuditStandard {
  PERMENDIKTISAINTEK_2025 = 'Permendiktisaintek No. 39/2025',
  LAM_TEKNIK = 'LAM TEKNIK (FTSP)',
  LAM_INFOKOM = 'LAM INFOKOM (FDDB)',
  BAN_PT = 'BAN-PT (Vokasi & Institusi)'
}

export enum AuditStatus {
  PENDING_SCHEDULING = 'Pending Schedule', // New: Waiting for DeptHead to confirm date/auditor
  PLANNED = 'Planned', // Confirmed by DeptHead, waiting for start date
  IN_PROGRESS = 'In Progress',
  SUBMITTED = 'Submitted', // Auditee submitted, waiting for Auditor verification
  REVIEW_DEPT_HEAD = 'Review DeptHead', // Auditor verified, waiting for DeptHead approval
  COMPLETED = 'Completed'
}

export enum UserRole {
  SUPER_ADMIN = 'SuperAdmin',
  ADMIN = 'Admin',
  AUDITOR_LEAD = 'AuditorLead',
  AUDITOR = 'Auditor',
  DEPT_HEAD = 'DeptHead',
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
  avatarUrl?: string; // Base64 string for profile picture
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
  description?: string; // Added description field
  department: string;
  standard: AuditStandard;
  status: AuditStatus;
  date: string;
  
  // Deadlines
  auditeeDeadline?: string; // Deadline for Auditee (2 Weeks)
  auditorDeadline?: string; // Deadline for Auditor (3 Weeks)

  assignedAuditorId?: string; // Link to specific auditor
  questions: AuditQuestion[];
  aiSummary?: string;
  aiRecommendations?: string[];
  
  rejectionNote?: string; // Notes from DeptHead when rejecting
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
