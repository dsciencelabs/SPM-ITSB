
import { useState, FC, FormEvent, ChangeEvent } from 'react';
import { ViewState, UserRole, AuditStandard, User, AuditSession, AuditStatus } from '../types';
import { 
  Users, Settings, Database, CheckCircle2, XCircle, X, Plus, Edit, Trash2, Search, Shield, 
  UserCog, Briefcase, Save, Calendar, FileBox, ChevronRight, Clock, MapPin, CalendarDays, Eye,
  Power, UserCheck, AlertTriangle, Info, Crown, Contact, Loader2, HelpCircle,
  ChevronLeft, LayoutList, AlertCircle, Filter, Lock, PlayCircle
} from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { useMasterData, Unit, MasterQuestion } from '../MasterDataContext';
import { useAuth } from '../AuthContext';
import { useSettings } from '../SettingsContext';

interface Props {
  view: ViewState;
  audits?: AuditSession[];
  onCreateAudit?: (audit: AuditSession) => void;
  onUpdateAudit?: (audit: AuditSession) => void;
  onDeleteAudit?: (id: string) => void;
  onNavigate?: (view: ViewState) => void; // Added for redirection
}

const ManagementPlaceholder: FC<Props> = ({ view, audits = [], onCreateAudit, onUpdateAudit, onDeleteAudit, onNavigate }) => {
  const { t } = useLanguage();
  
  // --- CONTEXTS ---
  const { 
    units, addUnit, updateUnit, deleteUnit,
    questions, addQuestion, updateQuestion, deleteQuestion 
  } = useMasterData();
  
  const { 
    users, addUser, updateUser, deleteUser 
  } = useAuth();

  const { settings, updateSettings } = useSettings();

  // --- STATES ---

  // Settings Save State
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [saveSettingsModal, setSaveSettingsModal] = useState(false);

  // User Management
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');
  const [userDeptFilter, setUserDeptFilter] = useState<string>('ALL');
  const [userForm, setUserForm] = useState<Partial<User>>({ role: UserRole.AUDITOR, status: 'Active' });
  const [isEditingUser, setIsEditingUser] = useState(false);
  
  // User Confirmation States
  const [confirmUserModal, setConfirmUserModal] = useState(false);

  // User Deletion & Deactivation Modal States
  const [deactivateModal, setDeactivateModal] = useState<{ open: boolean; user: User | null }>({
    open: false,
    user: null
  });
  const [deleteUserModal, setDeleteUserModal] = useState<{ open: boolean; userId: string | null; userName: string }>({
    open: false,
    userId: null,
    userName: ''
  });

  // Unit Management
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [unitSearchTerm, setUnitSearchTerm] = useState('');
  const [unitForm, setUnitForm] = useState<Partial<Unit>>({});
  const [isEditingUnit, setIsEditingUnit] = useState(false);
  
  // Delete Unit Confirmation State
  const [deleteUnitModal, setDeleteUnitModal] = useState<{ 
    open: boolean; 
    unitId: number | null; 
    unitName: string 
  }>({
    open: false,
    unitId: null,
    unitName: ''
  });

  // Template Management
  const [activeStandard, setActiveStandard] = useState<AuditStandard>(AuditStandard.PERMENDIKTISAINTEK_2025);
  const [isQModalOpen, setIsQModalOpen] = useState(false);
  const [qForm, setQForm] = useState<Partial<MasterQuestion>>({});
  const [isEditingQ, setIsEditingQ] = useState(false);
  const [deleteTemplateModal, setDeleteTemplateModal] = useState<{ open: boolean; questionId: string | null; questionText: string }>({ 
    open: false, 
    questionId: null, 
    questionText: '' 
  });

  // Audit Schedule
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleViewMode, setScheduleViewMode] = useState<'LIST' | 'CALENDAR'>('LIST');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [scheduleForm, setScheduleForm] = useState({
    department: '',
    standard: settings.defaultStandard || AuditStandard.PERMENDIKTISAINTEK_2025,
    auditorId: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Reschedule & Delete Schedule State
  const [rescheduleState, setRescheduleState] = useState<{
    isOpen: boolean;
    audit: AuditSession | null;
    newDate: string;
  }>({ isOpen: false, audit: null, newDate: '' });

  const [deleteScheduleModal, setDeleteScheduleModal] = useState<{ open: boolean; auditId: string | null; auditName: string }>({
    open: false,
    auditId: null,
    auditName: ''
  });

  // --- HANDLERS: AUDIT SCHEDULE ---
  const handleSaveSchedule = (e: FormEvent) => {
    e.preventDefault();
    
    // Manual Validation to ensure user knows what is missing
    if (!scheduleForm.department) {
      alert("Mohon pilih Unit/Departemen (Auditee) terlebih dahulu.");
      return;
    }
    if (!scheduleForm.auditorId) {
      alert("Mohon pilih Auditor yang bertugas.");
      return;
    }
    if (!scheduleForm.date) {
      alert("Mohon tentukan tanggal audit.");
      return;
    }

    // Confirm Save
    if (!window.confirm(t('confirm.add'))) return;

    if (onCreateAudit) {
      // Find master questions for this standard to populate initial checklist
      const relevantQuestions = questions.filter(q => q.standard === scheduleForm.standard);
      
      const startDate = new Date(scheduleForm.date);
      // Auditee: 14 Days (2 Weeks)
      const auditeeDeadline = new Date(startDate);
      auditeeDeadline.setDate(startDate.getDate() + 14);

      // Auditor: 21 Days (3 Weeks)
      const auditorDeadline = new Date(startDate);
      auditorDeadline.setDate(startDate.getDate() + 21);

      const newAudit: AuditSession = {
        id: Date.now().toString(),
        name: `Audit ${scheduleForm.department} - ${settings.auditPeriod}`,
        department: scheduleForm.department,
        standard: scheduleForm.standard,
        status: AuditStatus.PLANNED,
        date: startDate.toISOString(),
        auditeeDeadline: auditeeDeadline.toISOString(),
        auditorDeadline: auditorDeadline.toISOString(),
        assignedAuditorId: scheduleForm.auditorId,
        questions: relevantQuestions.map(q => ({
          id: q.id,
          category: q.category,
          questionText: q.text,
          compliance: null,
          auditeeSelfAssessment: null,
          evidence: "",
          auditorNotes: ""
        }))
      };
      
      onCreateAudit(newAudit);
      setIsScheduleModalOpen(false);
      alert("✅ Jadwal Audit Berhasil Dikonfirmasi dan Disimpan!");
      
      // Reset form
      setScheduleForm({
        department: '',
        standard: settings.defaultStandard || AuditStandard.PERMENDIKTISAINTEK_2025,
        auditorId: '',
        date: new Date().toISOString().split('T')[0]
      });
    }
  };

  const handleStartAudit = (audit: AuditSession) => {
    if (!onUpdateAudit) return;
    if (window.confirm("Konfirmasi: Apakah Anda ingin mengaktifkan audit ini sekarang? Status akan berubah menjadi 'In Progress'.")) {
      onUpdateAudit({
        ...audit,
        status: AuditStatus.IN_PROGRESS
      });
    }
  };

  const handleRescheduleSave = (e: FormEvent) => {
    e.preventDefault();
    
    if (!rescheduleState.newDate) {
       alert("Mohon pilih tanggal baru.");
       return;
    }

    if (!rescheduleState.audit || !onUpdateAudit) return;

    if (window.confirm(t('confirm.update'))) {
      const newDate = new Date(rescheduleState.newDate);
      
      // Re-calculate deadlines based on new date
      const auditeeDeadline = new Date(newDate);
      auditeeDeadline.setDate(newDate.getDate() + 14);

      const auditorDeadline = new Date(newDate);
      auditorDeadline.setDate(newDate.getDate() + 21);

      const updatedAudit = {
        ...rescheduleState.audit,
        date: newDate.toISOString(),
        auditeeDeadline: auditeeDeadline.toISOString(),
        auditorDeadline: auditorDeadline.toISOString()
      };
      onUpdateAudit(updatedAudit);
      // Notification simulation (simulating email/system notification)
      alert(`Jadwal Audit untuk ${updatedAudit.department} berhasil diperbarui ke tanggal ${rescheduleState.newDate}.\n\nNotifikasi perubahan jadwal telah dikirim ke Auditor dan Auditee.`);
      
      setRescheduleState({ isOpen: false, audit: null, newDate: '' });
    }
  };

  const confirmDeleteSchedule = () => {
    if (deleteScheduleModal.auditId && onDeleteAudit) {
      onDeleteAudit(deleteScheduleModal.auditId);
      setDeleteScheduleModal({ open: false, auditId: null, auditName: '' });
    }
  };

  // --- HANDLERS: CALENDAR ---
  const changeMonth = (offset: number) => {
    setCalendarDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday
    return { daysInMonth, firstDayOfMonth, month, year };
  };

  // --- HANDLERS: SETTINGS ---
  const confirmSaveSettings = () => {
    setSaveSettingsModal(false);
    setIsSavingSettings(true);
    // Simulate API call / Persist duration
    setTimeout(() => {
      setIsSavingSettings(false);
      alert("Pengaturan Sistem Berhasil Disimpan & Diterapkan.");
      
      // Redirect to Dashboard if navigation prop is provided
      if (onNavigate) {
        onNavigate('DASHBOARD');
      }
    }, 800);
  };

  // --- HANDLERS: USER ---
  const filteredUsers = users.filter(u => {
    const searchLower = userSearchTerm.toLowerCase();
    const matchesSearch = u.name.toLowerCase().includes(searchLower) ||
                          (u.username || '').toLowerCase().includes(searchLower);
    
    const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    
    let matchesDept = true;
    if (userDeptFilter !== 'ALL') {
        if (userDeptFilter === 'Global') {
            matchesDept = !u.department;
        } else {
            matchesDept = u.department === userDeptFilter;
        }
    }

    return matchesSearch && matchesRole && matchesDept;
  });

  // Trigger Modal Confirmation instead of immediate save
  const handleUserSubmit = (e: FormEvent) => {
    e.preventDefault();
    setConfirmUserModal(true);
  };

  // Actual Execution Logic (Called after modal confirmation)
  const executeSaveUser = () => {
    if (isEditingUser && userForm.id) {
      // Logic: If password provided, update it. If empty, keep original.
      const originalUser = users.find(u => u.id === userForm.id);
      const updatedUser = {
         ...userForm,
         password: userForm.password ? userForm.password : originalUser?.password
      };
      updateUser(updatedUser as User);
    } else {
      addUser({ ...userForm, id: Date.now().toString() } as User);
    }
    
    setConfirmUserModal(false);
    setIsUserModalOpen(false);
    setUserForm({ role: UserRole.AUDITOR, status: 'Active' });
  };

  const openEditUser = (user: User) => {
    // Exclude password from form so it shows as empty (indicating "unchanged")
    const { password, ...rest } = user;
    setUserForm(rest);
    setIsEditingUser(true);
    setIsUserModalOpen(true);
  };

  const openAddUser = () => {
    setUserForm({ role: UserRole.AUDITOR, status: 'Active' });
    setIsEditingUser(false);
    setIsUserModalOpen(true);
  };
  
  const handleStatusToggle = (user: User) => {
    if (user.status === 'Active') {
      setDeactivateModal({ open: true, user });
    } else {
      // Confirm Activation
      if (window.confirm(t('confirm.action'))) {
        updateUser({ ...user, status: 'Active' });
      }
    }
  };

  const confirmDeactivation = () => {
    if (deactivateModal.user) {
      updateUser({ ...deactivateModal.user, status: 'Inactive' });
      setDeactivateModal({ open: false, user: null });
    }
  };

  const confirmDeleteUser = () => {
    if (deleteUserModal.userId) {
      deleteUser(deleteUserModal.userId);
      setDeleteUserModal({ open: false, userId: null, userName: '' });
    }
  };

  // --- HANDLERS: UNIT ---
  const filteredUnits = units.filter(u => 
    u.name.toLowerCase().includes(unitSearchTerm.toLowerCase()) ||
    u.code.toLowerCase().includes(unitSearchTerm.toLowerCase())
  );

  const handleSaveUnit = (e: FormEvent) => {
    e.preventDefault();
    const msg = isEditingUnit ? t('confirm.update') : t('confirm.add');
    // Confirm Add/Update
    if (!window.confirm(msg)) return;

    if (isEditingUnit && unitForm.id) {
      updateUnit(unitForm as Unit);
    } else {
      addUnit(unitForm as Unit);
    }
    setIsUnitModalOpen(false);
    setUnitForm({});
  };

  const confirmDeleteUnit = () => {
    if (deleteUnitModal.unitId !== null) {
      deleteUnit(deleteUnitModal.unitId);
      setDeleteUnitModal({ open: false, unitId: null, unitName: '' });
    }
  };

  // --- HANDLERS: TEMPLATE ---
  const filteredQuestions = questions.filter(q => q.standard === activeStandard);

  const handleSaveQuestion = (e: FormEvent) => {
    e.preventDefault();
    const msg = isEditingQ ? t('confirm.update') : t('confirm.add');
    // Confirm Add/Update
    if (!window.confirm(msg)) return;

    const questionData = { ...qForm, standard: activeStandard } as MasterQuestion;
    
    if (isEditingQ && qForm.id) {
      updateQuestion(questionData);
    } else {
      addQuestion({ ...questionData, id: qForm.id || Date.now().toString() });
    }
    setIsQModalOpen(false);
    setQForm({});
  };

  const confirmDeleteTemplate = () => {
    if (deleteTemplateModal.questionId) {
      deleteQuestion(deleteTemplateModal.questionId);
      setDeleteTemplateModal({ open: false, questionId: null, questionText: '' });
    }
  };

  const getRoleDescription = (role: UserRole | undefined) => {
    switch (role) {
      case UserRole.SUPER_ADMIN: return "Full system access, configuration, and user management. Can view all reports.";
      case UserRole.ADMIN: return "Operational access, scheduling, master data management, and reporting.";
      case UserRole.AUDITOR_LEAD: return "Can monitor ALL active audits, perform verification, and access all reports. Acts as the quality coordinator.";
      case UserRole.AUDITOR: return "Can only access audits assigned to them. Duties: verify evidence, compliance verdict, and provide notes.";
      case UserRole.DEPT_HEAD: return "Head of Unit. Can access all audits within their Department. Duties: Approve Action Plans & Monitor progress.";
      case UserRole.AUDITEE: return "Operational Staff. Restricted to own Unit. Duties: Upload evidence and fill self-assessment.";
      default: return "Select a role to see description.";
    }
  };

  // --- RENDER CONTENT ---

  const renderAuditSchedule = () => {
    const plannedAudits = audits.filter(a => a.status === AuditStatus.PLANNED);
    const otherAudits = audits.filter(a => a.status !== AuditStatus.PLANNED);
    
    const { daysInMonth, firstDayOfMonth, month, year } = getDaysInMonth(calendarDate);
    const monthName = calendarDate.toLocaleString('default', { month: 'long' });

    return (
      <div className="max-w-7xl mx-auto animate-fade-in pb-20">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-sm px-6 py-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <CalendarDays className="text-blue-600" /> {t('nav.dashboard').replace('Dashboard', 'Audit Schedule')}
            </h2>
            <p className="text-slate-500">Plan and manage upcoming audit sessions.</p>
          </div>
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="bg-white border border-slate-300 rounded-lg p-1 flex items-center gap-1 shadow-sm mr-2">
               <button 
                  onClick={() => setScheduleViewMode('LIST')}
                  className={`p-2 rounded transition-colors ${scheduleViewMode === 'LIST' ? 'bg-slate-100 text-blue-600 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}
                  title="List View"
               >
                 <LayoutList size={18} />
               </button>
               <button 
                  onClick={() => setScheduleViewMode('CALENDAR')}
                  className={`p-2 rounded transition-colors ${scheduleViewMode === 'CALENDAR' ? 'bg-slate-100 text-blue-600 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}
                  title="Calendar View"
               >
                 <Calendar size={18} />
               </button>
            </div>

            <button 
              onClick={() => setIsScheduleModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm font-medium text-sm"
            >
              <Plus size={18} /> Schedule New
            </button>
          </div>
        </div>

        <div className="px-6 py-6 space-y-8">
          
          {/* CALENDAR VIEW MODE */}
          {scheduleViewMode === 'CALENDAR' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                   <Calendar size={20} className="text-slate-500" /> {monthName} {year}
                </h3>
                <div className="flex items-center gap-2">
                   <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white rounded-full border border-transparent hover:border-slate-200 transition-all">
                      <ChevronLeft size={20} className="text-slate-600" />
                   </button>
                   <button onClick={() => changeMonth(0)} className="text-xs font-bold px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors">
                      Today
                   </button>
                   <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white rounded-full border border-transparent hover:border-slate-200 transition-all">
                      <ChevronRight size={20} className="text-slate-600" />
                   </button>
                </div>
              </div>

              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/50">
                 {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="p-3 text-center text-xs font-bold text-slate-500 uppercase">{day}</div>
                 ))}
              </div>

              <div className="grid grid-cols-7 auto-rows-fr bg-slate-100 gap-px border-b border-slate-200">
                 {/* Empty Slots for prev month */}
                 {[...Array(firstDayOfMonth)].map((_, i) => (
                    <div key={`empty-${i}`} className="bg-white min-h-[120px] p-2"></div>
                 ))}
                 
                 {/* Days */}
                 {[...Array(daysInMonth)].map((_, i) => {
                    const day = i + 1;
                    // Find audits for this day
                    const dayAudits = audits.filter(a => {
                       const d = new Date(a.date);
                       return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
                    });
                    
                    const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;

                    return (
                      <div key={day} className={`bg-white min-h-[120px] p-2 transition-colors hover:bg-blue-50/30 relative group ${isToday ? 'bg-blue-50/50' : ''}`}>
                         <div className={`text-sm font-semibold mb-2 w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white shadow-md' : 'text-slate-700'}`}>
                            {day}
                         </div>
                         <div className="space-y-1.5">
                            {dayAudits.map(audit => (
                               <div 
                                 key={audit.id}
                                 onClick={() => setRescheduleState({
                                    isOpen: true,
                                    audit: audit,
                                    newDate: new Date(audit.date).toISOString().split('T')[0]
                                 })} 
                                 className={`text-[10px] px-2 py-1.5 rounded border cursor-pointer transition-all hover:shadow-md truncate ${
                                   audit.status === AuditStatus.PLANNED ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' :
                                   audit.status === AuditStatus.COMPLETED ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' :
                                   'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                 }`}
                                 title={`${audit.department}\n${audit.status}`}
                               >
                                  <span className="font-bold block truncate">{audit.department}</span>
                                  <span className="opacity-80 text-[9px]">{audit.standard.split(' ')[0]}</span>
                               </div>
                            ))}
                         </div>
                      </div>
                    );
                 })}
                 
                 {/* Fill remaining grid if needed */}
                 {[...Array(42 - (daysInMonth + firstDayOfMonth))].map((_, i) => (
                     <div key={`empty-end-${i}`} className="bg-slate-50/50 min-h-[120px]"></div>
                 ))}
              </div>
            </div>
          )}

          {/* LIST VIEW MODE */}
          {scheduleViewMode === 'LIST' && (
            <div className="space-y-8 animate-fade-in">
              {/* Upcoming / Planned */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Clock size={18} className="text-blue-500" /> Upcoming (Planned)
                  </h3>
                  <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{plannedAudits.length}</span>
                </div>
                {plannedAudits.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">No upcoming audits scheduled.</div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-medium">
                      <tr>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Department</th>
                        <th className="px-6 py-3">Standard</th>
                        <th className="px-6 py-3">Auditor</th>
                        <th className="px-6 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {plannedAudits.map(audit => (
                        <tr key={audit.id} className="hover:bg-slate-50">
                          <td className="px-6 py-3 font-medium">{new Date(audit.date).toLocaleDateString()}</td>
                          <td className="px-6 py-3">{audit.department}</td>
                          <td className="px-6 py-3">
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-xs border border-slate-200">
                              {audit.standard.split(' ')[0]}
                            </span>
                          </td>
                          <td className="px-6 py-3 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                              {users.find(u => u.id === audit.assignedAuditorId)?.name.charAt(0) || '?'}
                            </div>
                            {users.find(u => u.id === audit.assignedAuditorId)?.name || 'Unassigned'}
                          </td>
                          <td className="px-6 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button 
                                onClick={() => handleStartAudit(audit)}
                                className="flex items-center gap-1 bg-green-50 hover:bg-green-100 text-green-700 px-2 py-1.5 rounded transition-colors mr-2 border border-green-200"
                                title="Start & Confirm Audit Now"
                              >
                                <PlayCircle size={14} /> <span className="text-xs font-bold">Start</span>
                              </button>
                              <button 
                                onClick={() => setRescheduleState({
                                    isOpen: true,
                                    audit: audit,
                                    newDate: new Date(audit.date).toISOString().split('T')[0]
                                })}
                                className="text-blue-600 hover:bg-blue-50 p-2 rounded transition-colors mr-1"
                                title="Reschedule"
                              >
                                <Calendar size={16} />
                              </button>
                              <button 
                                onClick={() => setDeleteScheduleModal({ open: true, auditId: audit.id, auditName: audit.department })}
                                className="text-red-500 hover:bg-red-50 p-2 rounded transition-colors"
                                title="Cancel Schedule"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* History / Active */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                  <h3 className="font-bold text-slate-800 text-sm">Active & Completed History</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white text-slate-500 font-medium sticky top-0 shadow-sm">
                      <tr>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Department</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {otherAudits.length === 0 ? (
                        <tr><td colSpan={4} className="p-6 text-center text-slate-400">No history found.</td></tr>
                      ) : (
                        otherAudits.map(audit => (
                          <tr key={audit.id} className="hover:bg-slate-50">
                            <td className="px-6 py-3 text-slate-500">{new Date(audit.date).toLocaleDateString()}</td>
                            <td className="px-6 py-3 font-medium">{audit.department}</td>
                            <td className="px-6 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                audit.status === AuditStatus.COMPLETED ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {audit.status}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                 <span className="text-xs text-slate-400 hidden lg:inline">View in Reports</span>
                                 <button 
                                   onClick={() => setDeleteScheduleModal({ open: true, auditId: audit.id, auditName: audit.department })}
                                   className="text-red-500 hover:bg-red-50 p-2 rounded transition-colors"
                                   title="Delete Audit Record"
                                 >
                                   <Trash2 size={16} />
                                 </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Schedule Modal - Z-Index 100 */}
        {isScheduleModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800">Schedule New Audit</h3>
                <button onClick={() => setIsScheduleModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSaveSchedule} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Standard</label>
                  <select 
                    value={scheduleForm.standard}
                    onChange={e => setScheduleForm({...scheduleForm, standard: e.target.value as AuditStandard})}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {Object.values(AuditStandard).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Department (Auditee)</label>
                  <select 
                    value={scheduleForm.department}
                    // Reset Auditor when Department changes
                    onChange={e => setScheduleForm({...scheduleForm, department: e.target.value, auditorId: ''})}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">-- Select Unit --</option>
                    {units.map(u => (
                      <option key={u.id} value={u.name}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Assigned Auditor</label>
                  <select 
                    value={scheduleForm.auditorId}
                    onChange={e => setScheduleForm({...scheduleForm, auditorId: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                    disabled={!scheduleForm.department}
                  >
                    <option value="">
                      {!scheduleForm.department ? "-- Select Department First --" : "-- Select Auditor --"}
                    </option>
                    {users.filter(u => {
                      // FILTER: Only show Auditors or Lead Auditors
                      const isAuditorRole = u.role === UserRole.AUDITOR || u.role === UserRole.AUDITOR_LEAD;
                      // FILTER: Conflict of Interest (Same department)
                      const isConflict = scheduleForm.department && u.department === scheduleForm.department;
                      return u.status === 'Active' && isAuditorRole && !isConflict;
                    }).map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                  {scheduleForm.department && (
                    <p className="text-[10px] text-amber-600 mt-1 italic flex items-center gap-1 bg-amber-50 p-1 rounded">
                      <AlertTriangle size={10} /> Auditors from <strong>{scheduleForm.department}</strong> are excluded (Conflict of Interest).
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Scheduled Date</label>
                  <input 
                    type="date"
                    value={scheduleForm.date}
                    onChange={e => setScheduleForm({...scheduleForm, date: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-xs text-blue-800">
                   <p className="font-bold mb-1">Estimated Deadlines:</p>
                   <ul className="list-disc pl-4 space-y-0.5">
                      <li>Auditee (14 Days): {new Date(new Date(scheduleForm.date).getTime() + 14*24*60*60*1000).toLocaleDateString()}</li>
                      <li>Auditor (21 Days): {new Date(new Date(scheduleForm.date).getTime() + 21*24*60*60*1000).toLocaleDateString()}</li>
                   </ul>
                </div>

                <div className="pt-2 flex gap-3">
                  <button type="button" onClick={() => setIsScheduleModalOpen(false)} className="flex-1 py-2 border rounded-lg text-slate-600 hover:bg-slate-50">Cancel</button>
                  <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md">Confirm Schedule</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Reschedule Modal - Z-Index 100 */}
        {rescheduleState.isOpen && rescheduleState.audit && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-fade-in">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800">Reschedule Audit</h3>
                <button onClick={() => setRescheduleState({ ...rescheduleState, isOpen: false })} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleRescheduleSave} className="p-6 space-y-4">
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-800 mb-2">
                   <p className="font-bold mb-1">Current Schedule:</p>
                   <p>{rescheduleState.audit.department}</p>
                   <p>{new Date(rescheduleState.audit.date).toLocaleDateString()}</p>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">New Date</label>
                  <input 
                    type="date" 
                    value={rescheduleState.newDate}
                    onChange={e => setRescheduleState({...rescheduleState, newDate: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                
                <div className="pt-2">
                    <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 font-bold shadow-md">
                       <Save size={16} /> Update Schedule
                    </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Schedule Confirmation Modal */}
        {deleteScheduleModal.open && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{t('mgmt.del.title')}</h3>
                <p className="text-sm text-slate-500">
                  {t('mgmt.del.msg')}
                  <br />
                  <span className="font-bold text-slate-700 block mt-1">{deleteScheduleModal.auditName}</span>
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setDeleteScheduleModal({ open: false, auditId: null, auditName: '' })}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-200 transition-colors"
                >
                  {t('mgmt.btn.cancel')}
                </button>
                <button 
                  onClick={confirmDeleteSchedule}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-700 transition-colors shadow-lg shadow-red-900/20"
                >
                  {t('mgmt.del.confirm')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderUserMgmt = () => (
    <div className="max-w-7xl mx-auto animate-fade-in">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-sm px-6 py-6 border-b border-slate-200 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="text-blue-600" /> {t('mgmt.user.title')}
          </h2>
          <p className="text-slate-500">{t('mgmt.user.desc')}</p>
        </div>
        <button 
          onClick={openAddUser}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={18} /> {t('mgmt.btnAdd')}
        </button>
      </div>

      <div className="px-6 py-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-center gap-4">
             <div className="relative flex-1 w-full">
               <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
               <input 
                 type="text" 
                 placeholder="Cari nama atau username..." 
                 className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                 value={userSearchTerm}
                 onChange={(e) => setUserSearchTerm(e.target.value)}
               />
             </div>
             
             <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                <div className="relative shrink-0">
                   <Filter className="absolute left-3 top-2.5 text-slate-400" size={16} />
                   <select 
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value)}
                      className="pl-9 pr-8 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white appearance-none cursor-pointer hover:bg-slate-50"
                   >
                      <option value="ALL">Semua Peran</option>
                      {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                   </select>
                </div>

                <div className="relative shrink-0 max-w-[200px]">
                   <select 
                      value={userDeptFilter}
                      onChange={(e) => setUserDeptFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white cursor-pointer hover:bg-slate-50 truncate"
                   >
                      <option value="ALL">Semua Unit</option>
                      <option value="Global">Non-Unit (Global)</option>
                      {units.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                   </select>
                </div>
             </div>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-3">{t('mgmt.th.name')}</th>
                <th className="px-6 py-3">{t('mgmt.th.role')}</th>
                <th className="px-6 py-3">{t('mgmt.th.dept')}</th>
                <th className="px-6 py-3">{t('mgmt.th.status')}</th>
                <th className="px-6 py-3 text-right">{t('mgmt.th.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <div>{user.name}</div>
                      <div className="text-xs text-slate-400">@{user.username}</div>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${
                      user.role === UserRole.ADMIN ? 'bg-purple-50 text-purple-700 border-purple-100' :
                      user.role === UserRole.AUDITOR_LEAD ? 'bg-teal-50 text-teal-700 border-teal-100' :
                      user.role === UserRole.AUDITOR ? 'bg-green-50 text-green-700 border-green-100' :
                      user.role === UserRole.DEPT_HEAD ? 'bg-orange-50 text-orange-700 border-orange-100' :
                      user.role === UserRole.SUPER_ADMIN ? 'bg-red-50 text-red-700 border-red-100' :
                      'bg-slate-50 text-slate-600 border-slate-100'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-500">{user.department || '-'}</td>
                  <td className="px-6 py-3">
                    <span className={`flex items-center gap-1 text-xs font-bold ${user.status === 'Active' ? 'text-green-600' : 'text-slate-400'}`}>
                      <span className={`w-2 h-2 rounded-full ${user.status === 'Active' ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    {user.role === UserRole.SUPER_ADMIN ? (
                       <span className="flex items-center justify-end gap-1 text-xs text-slate-400 italic cursor-not-allowed bg-slate-100 px-2 py-1 rounded border border-slate-200 w-fit ml-auto">
                          <Lock size={12} /> Protected
                       </span>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleStatusToggle(user)}
                          className={`p-1.5 rounded transition-colors ${
                            user.status === 'Active' 
                              ? 'text-amber-600 hover:bg-amber-50' 
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={user.status === 'Active' ? "Deactivate User" : "Activate User"}
                        >
                          {user.status === 'Active' ? <Power size={16} /> : <UserCheck size={16} />}
                        </button>
                        <button onClick={() => openEditUser(user)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16} /></button>
                        <button 
                          onClick={() => setDeleteUserModal({ open: true, userId: user.id, userName: user.name })}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          title="Delete User"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit User Modal - Z-Index 100 */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">{isEditingUser ? t('mgmt.modal.edit') : t('mgmt.modal.add')}</h3>
              <button onClick={() => setIsUserModalOpen(false)}><X size={20} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleUserSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('mgmt.form.name')}</label>
                  <input required type="text" className="w-full border rounded p-2 text-sm" value={userForm.name || ''} onChange={e => setUserForm({...userForm, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('mgmt.form.user')}</label>
                  <input required type="text" className="w-full border rounded p-2 text-sm" value={userForm.username || ''} onChange={e => setUserForm({...userForm, username: e.target.value})} />
                </div>
              </div>

              <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    {isEditingUser ? t('mgmt.form.pass.edit') : t('mgmt.form.pass')}
                  </label>
                  <input 
                    type="text" 
                    className="w-full border rounded p-2 text-sm" 
                    value={userForm.password || ''} 
                    onChange={e => setUserForm({...userForm, password: e.target.value})}
                    placeholder={isEditingUser ? "•••••••• (Unchanged)" : "Set Password"}
                    required={!isEditingUser}
                  />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('mgmt.form.role')}</label>
                   <select className="w-full border rounded p-2 text-sm" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value as UserRole})}>
                     {Object.values(UserRole)
                       .filter(r => r !== UserRole.SUPER_ADMIN) // Exclude SuperAdmin from dropdown
                       .map(r => <option key={r} value={r}>{r}</option>)}
                   </select>
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('mgmt.form.dept')}</label>
                   <select className="w-full border rounded p-2 text-sm" value={userForm.department || ''} onChange={e => setUserForm({...userForm, department: e.target.value})}>
                     <option value="">- None / Global -</option>
                     {units.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                   </select>
                 </div>
              </div>

              {/* Role Description Helper */}
              <div className="p-3 bg-blue-50 text-blue-700 text-xs rounded border border-blue-100 flex items-start gap-2">
                {userForm.role === UserRole.AUDITOR_LEAD ? <Crown size={16} className="mt-0.5 shrink-0" /> : 
                 userForm.role === UserRole.DEPT_HEAD ? <Contact size={16} className="mt-0.5 shrink-0" /> :
                 <Info size={16} className="mt-0.5 shrink-0" />}
                <div>
                   <span className="font-bold block mb-0.5">Role Permission: {userForm.role}</span>
                   <span>{getRoleDescription(userForm.role)}</span>
                </div>
              </div>

              <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                 <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" name="status" checked={userForm.status === 'Active'} onChange={() => setUserForm({...userForm, status: 'Active'})} />
                      <span className="text-green-600 font-medium">Active</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" name="status" checked={userForm.status === 'Inactive'} onChange={() => setUserForm({...userForm, status: 'Inactive'})} />
                      <span className="text-slate-500">Inactive</span>
                    </label>
                 </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-4">
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-lg text-sm">{t('mgmt.btn.cancel')}</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                    {isEditingUser ? t('mgmt.btn.update') : t('mgmt.btn.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM UPDATE / ADD USER MODAL */}
      {confirmUserModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600">
              <HelpCircle size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {isEditingUser ? 'Konfirmasi Pembaruan' : 'Konfirmasi Penambahan'}
              </h3>
              <p className="text-sm text-slate-500">
                Apakah Anda yakin ingin {isEditingUser ? 'memperbarui' : 'menambahkan'} data pengguna 
                <span className="font-bold block mt-1 text-slate-800">{userForm.name}</span>
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setConfirmUserModal(false)}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={executeSaveUser}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/20"
              >
                {isEditingUser ? 'Ya, Perbarui' : 'Ya, Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivation Confirmation Modal - Z-Index 100 */}
      {deactivateModal.open && deactivateModal.user && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600">
              <Power size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Deactivate Account?</h3>
              <p className="text-sm text-slate-500">
                Are you sure you want to deactivate <strong>{deactivateModal.user.name}</strong>?
                They will no longer be able to log in to the system.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setDeactivateModal({ open: false, user: null })}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeactivation}
                className="flex-1 px-4 py-2.5 bg-amber-600 text-white rounded-lg font-medium text-sm hover:bg-amber-700 transition-colors shadow-lg shadow-amber-900/20"
              >
                Yes, Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {deleteUserModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{t('mgmt.del.title')}</h3>
              <p className="text-sm text-slate-500">
                {t('mgmt.del.msg')}
                <br />
                <span className="font-bold text-slate-700 block mt-1">{deleteUserModal.userName}</span>
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setDeleteUserModal({ open: false, userId: null, userName: '' })}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-200 transition-colors"
              >
                {t('mgmt.btn.cancel')}
              </button>
              <button 
                onClick={confirmDeleteUser}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-700 transition-colors shadow-lg shadow-red-900/20"
              >
                {t('mgmt.del.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderMasterData = () => (
    <div className="max-w-7xl mx-auto animate-fade-in">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-sm px-6 py-6 border-b border-slate-200 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Database className="text-blue-600" /> {t('master.title')}
          </h2>
          <p className="text-slate-500">{t('master.desc')}</p>
        </div>
        <button 
          onClick={() => { setUnitForm({}); setIsEditingUnit(false); setIsUnitModalOpen(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={18} /> {t('master.btn.add')}
        </button>
      </div>

      <div className="px-6 py-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-100">
            <input 
              type="text" 
              placeholder="Search units..." 
              className="w-full md:w-64 pl-4 pr-4 py-2 border rounded-lg text-sm outline-none focus:border-blue-500"
              value={unitSearchTerm}
              onChange={(e) => setUnitSearchTerm(e.target.value)}
            />
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-3">{t('master.th.code')}</th>
                <th className="px-6 py-3">{t('master.th.name')}</th>
                <th className="px-6 py-3">{t('master.th.type')}</th>
                <th className="px-6 py-3">{t('master.th.faculty')}</th>
                <th className="px-6 py-3">{t('master.th.head')}</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUnits.map(unit => (
                <tr key={unit.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 font-mono text-slate-600">{unit.code}</td>
                  <td className="px-6 py-3 font-medium">{unit.name}</td>
                  <td className="px-6 py-3 text-slate-500">{unit.type}</td>
                  <td className="px-6 py-3 text-slate-500">{unit.faculty}</td>
                  <td className="px-6 py-3 text-slate-500">{unit.head}</td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { setUnitForm(unit); setIsEditingUnit(true); setIsUnitModalOpen(true); }} className="p-1 text-blue-600"><Edit size={16}/></button>
                      <button 
                        onClick={() => setDeleteUnitModal({ open: true, unitId: unit.id, unitName: unit.name })}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Hapus Unit"
                      >
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unit Modal - Z-Index 100 */}
      {isUnitModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">{isEditingUnit ? t('master.modal.edit') : t('master.modal.add')}</h3>
              <button onClick={() => setIsUnitModalOpen(false)}><X size={20} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleSaveUnit} className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('master.form.code')}</label>
                  <input required type="text" className="w-full border rounded p-2 text-sm" value={unitForm.code || ''} onChange={e => setUnitForm({...unitForm, code: e.target.value})} />
                </div>
                <div className="col-span-2">
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('master.form.name')}</label>
                   <input required type="text" className="w-full border rounded p-2 text-sm" value={unitForm.name || ''} onChange={e => setUnitForm({...unitForm, name: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('master.form.type')}</label>
                   <select className="w-full border rounded p-2 text-sm" value={unitForm.type || ''} onChange={e => setUnitForm({...unitForm, type: e.target.value})}>
                      <option value="Fakultas">Fakultas</option>
                      <option value="Program Studi">Program Studi</option>
                      <option value="Biro/Lembaga">Biro/Lembaga</option>
                      <option value="Yayasan">Yayasan</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('master.form.head')}</label>
                   <input type="text" className="w-full border rounded p-2 text-sm" value={unitForm.head || ''} onChange={e => setUnitForm({...unitForm, head: e.target.value})} />
                 </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium mt-2">{t('mgmt.btn.save')}</button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Unit Modal */}
      {deleteUnitModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{t('mgmt.del.title')}</h3>
              <p className="text-sm text-slate-500">
                {t('master.del.msg')}
                <br />
                <span className="font-bold text-slate-700 block mt-1">{deleteUnitModal.unitName}</span>
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setDeleteUnitModal({ open: false, unitId: null, unitName: '' })}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-200 transition-colors"
              >
                {t('mgmt.btn.cancel')}
              </button>
              <button 
                onClick={confirmDeleteUnit}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-700 transition-colors shadow-lg shadow-red-900/20"
              >
                {t('mgmt.del.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderTemplateMgmt = () => (
    <div className="max-w-7xl mx-auto animate-fade-in">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-sm px-6 py-4 border-b border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <FileBox className="text-blue-600" /> {t('mgmt.tmpl.title')}
            </h2>
            <p className="text-slate-500">{t('mgmt.tmpl.desc')}</p>
          </div>
          <button 
            onClick={() => { setQForm({}); setIsEditingQ(false); setIsQModalOpen(true); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus size={18} /> Add Item
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {Object.values(AuditStandard).map(std => (
            <button 
              key={std}
              onClick={() => setActiveStandard(std)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeStandard === std ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {std.split(' ')[0]}...
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
           <h3 className="font-bold text-lg text-slate-800 mb-4 border-b pb-2">{activeStandard}</h3>
           <div className="space-y-4">
             {filteredQuestions.length === 0 ? (
               <div className="text-center text-slate-400 py-8">No questions defined for this standard yet.</div>
             ) : (
               filteredQuestions.map(q => (
                 <div key={q.id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors group">
                   <div className="w-16 shrink-0">
                     <div className="font-bold text-slate-700">{q.category}</div>
                     <div className="text-xs text-slate-400 font-mono">{q.id}</div>
                   </div>
                   <div className="flex-1 text-slate-800 text-sm leading-relaxed">{q.text}</div>
                   <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setQForm(q); setIsEditingQ(true); setIsQModalOpen(true); }} className="p-1.5 bg-white border rounded text-blue-600 hover:bg-blue-50"><Edit size={14}/></button>
                      <button 
                        onClick={() => setDeleteTemplateModal({ open: true, questionId: q.id, questionText: q.text })}
                        className="p-1.5 bg-white border rounded text-red-600 hover:bg-red-50"
                        title="Delete Item"
                      >
                        <Trash2 size={14}/>
                      </button>
                   </div>
                 </div>
               ))
             )}
           </div>
        </div>
      </div>

      {/* Template Modal - Z-Index 100 */}
      {isQModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
             <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">{isEditingQ ? 'Edit Item' : 'Add Item'}</h3>
                <button onClick={() => setIsQModalOpen(false)}><X size={20} /></button>
             </div>
             <form onSubmit={handleSaveQuestion} className="p-6 space-y-4">
                <div className="grid grid-cols-4 gap-4">
                   <div className="col-span-1">
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">ID</label>
                     <input required type="text" className="w-full border rounded p-2 text-sm" value={qForm.id || ''} onChange={e => setQForm({...qForm, id: e.target.value})} disabled={isEditingQ} />
                   </div>
                   <div className="col-span-3">
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                     <input required type="text" className="w-full border rounded p-2 text-sm" value={qForm.category || ''} onChange={e => setQForm({...qForm, category: e.target.value})} />
                   </div>
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Question Text / Indicator</label>
                   <textarea required rows={4} className="w-full border rounded p-2 text-sm" value={qForm.text || ''} onChange={e => setQForm({...qForm, text: e.target.value})} />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">{t('mgmt.btn.save')}</button>
             </form>
          </div>
        </div>
      )}

      {/* Delete Template Item Confirmation Modal */}
      {deleteTemplateModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{t('mgmt.del.title')}</h3>
              <p className="text-sm text-slate-500">
                {t('mgmt.del.msg')}
              </p>
              {deleteTemplateModal.questionText && (
                  <div className="bg-slate-50 p-2 rounded border border-slate-100 text-xs text-slate-600 italic mt-2 text-left line-clamp-3">
                      "{deleteTemplateModal.questionText}"
                  </div>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setDeleteTemplateModal({ open: false, questionId: null, questionText: '' })}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-200 transition-colors"
              >
                {t('mgmt.btn.cancel')}
              </button>
              <button 
                onClick={confirmDeleteTemplate}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-700 transition-colors shadow-lg shadow-red-900/20"
              >
                {t('mgmt.del.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="max-w-4xl mx-auto animate-fade-in">
       {/* Sticky Header */}
       <div className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-sm px-6 py-6 border-b border-slate-200">
         <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
           <Settings className="text-blue-600" /> {t('mgmt.set.title')}
         </h2>
         <p className="text-slate-500">{t('mgmt.set.desc')}</p>
       </div>

       <div className="px-6 py-6">
         <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 space-y-8">
            <div>
               <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                  <Briefcase size={20} className="text-slate-400" /> {t('mgmt.set.brand')}
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('mgmt.set.appName')}</label>
                     <input 
                       type="text" 
                       className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                       value={settings.appName}
                       onChange={e => updateSettings({ appName: e.target.value })}
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('mgmt.set.theme')}</label>
                     <div className="flex gap-3">
                        {['#2563eb', '#dc2626', '#16a34a', '#d97706', '#7c3aed', '#0f172a'].map(color => (
                          <button 
                            key={color}
                            onClick={() => updateSettings({ themeColor: color })}
                            className={`w-8 h-8 rounded-full shadow-sm transition-transform hover:scale-110 ${settings.themeColor === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                     </div>
                  </div>
               </div>

               {/* Logo Upload Section */}
               <div className="mt-6 pt-6 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-3">{t('mgmt.set.logo')}</label>
                  <div className="flex items-start gap-6">
                    <div className="shrink-0 relative group">
                      <div className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                        {settings.logoUrl ? (
                          <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                        ) : (
                          <Shield size={32} className="text-slate-300" />
                        )}
                      </div>
                      {settings.logoUrl && (
                        <button 
                          onClick={() => updateSettings({ logoUrl: null })}
                          className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer shadow-sm transition-colors">
                        <Plus size={16} />
                        {t('mgmt.set.upload')}
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/png, image/jpeg, image/svg+xml"
                          onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 2 * 1024 * 1024) {
                                alert("File size must be less than 2MB");
                                return;
                              }
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) {
                                  updateSettings({ logoUrl: event.target.result as string });
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      <p className="mt-2 text-xs text-slate-500 max-w-sm leading-relaxed">
                        Upload your organization's logo (PNG, JPG, or SVG). Max size 2MB. This will replace the default shield icon on the sidebar and login page.
                      </p>
                    </div>
                  </div>
               </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
               <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                  <Clock size={20} className="text-slate-400" /> {t('mgmt.set.cycle')}
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('mgmt.set.period')}</label>
                     <input 
                       type="text" 
                       className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                       value={settings.auditPeriod}
                       onChange={e => updateSettings({ auditPeriod: e.target.value })}
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('mgmt.set.std')}</label>
                     <select 
                        className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={settings.defaultStandard}
                        onChange={e => updateSettings({ defaultStandard: e.target.value as AuditStandard })}
                     >
                        {Object.values(AuditStandard).map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                     </select>
                  </div>
               </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end">
               <button 
                 onClick={() => setSaveSettingsModal(true)}
                 disabled={isSavingSettings}
                 className="bg-slate-900 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
               >
                  {isSavingSettings ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
                  {isSavingSettings ? 'Menyimpan...' : t('mgmt.set.save')}
               </button>
            </div>
         </div>
       </div>

       {/* Save Settings Confirmation Modal */}
       {saveSettingsModal && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center space-y-4">
             <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600">
               <HelpCircle size={24} />
             </div>
             <div>
               <h3 className="text-lg font-bold text-slate-900 mb-2">Konfirmasi Simpan</h3>
               <p className="text-sm text-slate-500">
                 Apakah Anda yakin ingin melakukan Simpan Perubahan Sistem?
               </p>
             </div>
             <div className="flex gap-3 pt-2">
               <button 
                 onClick={() => setSaveSettingsModal(false)}
                 className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-200 transition-colors"
               >
                 {t('mgmt.btn.cancel')}
               </button>
               <button 
                 onClick={confirmSaveSettings}
                 className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/20"
               >
                 Ya, Simpan
               </button>
             </div>
           </div>
         </div>
       )}
    </div>
  );

  // Main Switch
  switch (view) {
    case 'USER_MGMT': return renderUserMgmt();
    case 'MASTER_DATA': return renderMasterData();
    case 'TEMPLATE_MGMT': return renderTemplateMgmt();
    case 'SETTINGS': return renderSettings();
    case 'AUDIT_SCHEDULE': return renderAuditSchedule();
    default: return <div>View not found</div>;
  }
};

export default ManagementPlaceholder;
