
import { useState, FC, FormEvent } from 'react';
import { AuditSession, AuditStatus, AuditStandard, UserRole } from '../types';
import { 
  CalendarDays, 
  Plus, 
  LayoutList, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  Clock, 
  PlayCircle, 
  Save, 
  X, 
  AlertTriangle,
  CheckCircle,
  MoreVertical,
  AlertCircle,
  HelpCircle,
  Play,
  PieChart,
  CalendarClock
} from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { useMasterData } from '../MasterDataContext';
import { useAuth } from '../AuthContext';
import { useSettings } from '../SettingsContext';
import { useNotification } from '../NotificationContext';

interface AuditScheduleProps {
  audits: AuditSession[];
  onCreateAudit: (audit: AuditSession) => void;
  onUpdateAudit: (audit: AuditSession) => void;
  onDeleteAudit: (id: string) => void;
  onViewReport: (audit: AuditSession) => void; 
}

const AuditSchedule: FC<AuditScheduleProps> = ({ audits, onCreateAudit, onUpdateAudit, onDeleteAudit, onViewReport }) => {
  const { t } = useLanguage();
  const { units, questions } = useMasterData();
  const { users, currentUser } = useAuth();
  const { settings } = useSettings();
  const { addNotification } = useNotification();

  // States
  const [scheduleViewMode, setScheduleViewMode] = useState<'LIST' | 'CALENDAR'>('LIST'); 
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    department: '',
    standard: settings.defaultStandard || AuditStandard.PERMENDIKTISAINTEK_2025,
    auditorId: '',
    date: new Date().toISOString().split('T')[0],
    auditName: '' 
  });

  // Reschedule & Delete States
  const [rescheduleState, setRescheduleState] = useState<{
    isOpen: boolean;
    audit: AuditSession | null;
    newDate: string;
  }>({ isOpen: false, audit: null, newDate: '' });

  // Confirmation Modal State for Reschedule
  const [rescheduleConfirmOpen, setRescheduleConfirmOpen] = useState(false);

  // NEW: Confirmation Modal for CREATE Schedule
  const [createConfirmOpen, setCreateConfirmOpen] = useState(false);

  const [deleteScheduleModal, setDeleteScheduleModal] = useState<{ open: boolean; auditId: string | null; auditName: string }>({
    open: false,
    auditId: null,
    auditName: ''
  });

  // START AUDIT CONFIRMATION STATES
  const [startConfirmModal, setStartConfirmModal] = useState<{
    isOpen: boolean;
    type: 'SINGLE' | 'ALL';
    audit: AuditSession | null;
  }>({
    isOpen: false,
    type: 'SINGLE',
    audit: null
  });

  // Access Control for Reschedule & Start
  const canManageSchedule = 
    currentUser?.role === UserRole.SUPER_ADMIN || 
    currentUser?.role === UserRole.ADMIN || 
    currentUser?.role === UserRole.AUDITOR_LEAD;
  
  const canStartAudit = canManageSchedule;

  // Access Control for Viewing Reports in History
  const canViewReports = 
    currentUser?.role === UserRole.SUPER_ADMIN || 
    currentUser?.role === UserRole.ADMIN || 
    currentUser?.role === UserRole.AUDITOR_LEAD;

  // Access Control for Deleting History (Strict: Only Admin/SuperAdmin)
  const canDeleteHistory = 
    currentUser?.role === UserRole.SUPER_ADMIN || 
    currentUser?.role === UserRole.ADMIN;

  // Calendar Helpers
  const changeMonth = (offset: number) => {
    setCalendarDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(1); 
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
  };

  const goToToday = () => {
    setCalendarDate(new Date());
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday
    return { daysInMonth, firstDayOfMonth, month, year };
  };

  // Check if a planned audit is overdue
  const isPlanOverdue = (dateStr: string) => {
    const auditDate = new Date(dateStr);
    const today = new Date();
    auditDate.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    return auditDate < today;
  };

  // Handlers

  // 1. Initiate: Validate form only
  const handleInitiateSchedule = (e: FormEvent) => {
    e.preventDefault();
    
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
    if (!scheduleForm.auditName) {
      alert("Mohon isi Nama Audit.");
      return;
    }

    setCreateConfirmOpen(true);
  };

  // 2. Execute: Create Data after confirmation
  const executeSaveSchedule = () => {
    // Populate questions based on standard
    const relevantQuestions = questions.filter(q => q.standard === scheduleForm.standard);
    
    const startDate = new Date(scheduleForm.date);
    // Deadlines
    const auditeeDeadline = new Date(startDate);
    auditeeDeadline.setDate(startDate.getDate() + 14); // 2 weeks

    const auditorDeadline = new Date(startDate);
    auditorDeadline.setDate(startDate.getDate() + 21); // 3 weeks

    const newAudit: AuditSession = {
      id: Date.now().toString(),
      name: scheduleForm.auditName, 
      department: scheduleForm.department,
      standard: scheduleForm.standard,
      status: AuditStatus.PENDING_SCHEDULING, // UPDATED: Changed from PLANNED
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
    
    // --- NOTIFICATION LOGIC ---
    const dateStr = startDate.toLocaleDateString();

    // 1. Notify Assigned Auditor
    if (scheduleForm.auditorId) {
      addNotification(
        scheduleForm.auditorId, 
        "New Audit Pending", 
        `Audit for ${scheduleForm.department} scheduled. Waiting for Dept Head confirmation.`
      );
    }

    // 2. Notify Auditee (Dept Head)
    const deptHeads = users.filter(u => u.department === scheduleForm.department && u.role === UserRole.DEPT_HEAD);
    deptHeads.forEach(u => {
      addNotification(
        u.id,
        "Konfirmasi Jadwal Audit",
        `Audit baru dijadwalkan untuk ${scheduleForm.department} pada ${dateStr}. Mohon konfirmasi (Setujui/Tolak).`
      );
    });

    setCreateConfirmOpen(false);
    setIsScheduleModalOpen(false);
    
    alert("✅ Jadwal Berhasil Dibuat! Menunggu Konfirmasi Kepala Unit.");
    
    // Reset Form
    setScheduleForm({
      department: '',
      standard: settings.defaultStandard || AuditStandard.PERMENDIKTISAINTEK_2025,
      auditorId: '',
      date: new Date().toISOString().split('T')[0],
      auditName: ''
    });
  };

  // --- START AUDIT LOGIC ---

  const initiateStartSingle = (audit: AuditSession) => {
     setStartConfirmModal({ isOpen: true, type: 'SINGLE', audit });
  };

  const initiateStartAll = () => {
    setStartConfirmModal({ isOpen: true, type: 'ALL', audit: null });
  };

  const executeStartAudit = () => {
    if (startConfirmModal.type === 'SINGLE' && startConfirmModal.audit) {
        // SINGLE START
        const audit = startConfirmModal.audit;
        onUpdateAudit({
            ...audit,
            status: AuditStatus.IN_PROGRESS
        });

        const auditees = users.filter(u => u.department === audit.department);
        auditees.forEach(u => {
            addNotification(
                u.id,
                "Audit Started",
                `The audit for ${audit.department} is now IN PROGRESS. You may begin self-assessment.`
            );
        });
        
        alert(`✅ Audit untuk ${audit.department} telah diaktifkan (In Progress).`);

    } else if (startConfirmModal.type === 'ALL') {
        // BATCH START
        const planned = audits.filter(a => a.status === AuditStatus.PLANNED);
        
        planned.forEach(audit => {
             onUpdateAudit({ ...audit, status: AuditStatus.IN_PROGRESS });
             
             const auditees = users.filter(u => u.department === audit.department);
             auditees.forEach(u => {
                addNotification(
                    u.id,
                    "Audit Started",
                    `The audit for ${audit.department} is now IN PROGRESS. You may begin self-assessment.`
                );
             });
        });

        alert(`✅ Berhasil memulai ${planned.length} audit sekaligus.`);
    }

    setStartConfirmModal({ isOpen: false, type: 'SINGLE', audit: null });
  };

  const handleRescheduleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!rescheduleState.newDate || !rescheduleState.audit) return;
    setRescheduleConfirmOpen(true);
  };

  const executeReschedule = () => {
    if (!rescheduleState.newDate || !rescheduleState.audit) return;

    const newDate = new Date(rescheduleState.newDate);
    
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
    
    const dateStr = newDate.toLocaleDateString();
    
    if (updatedAudit.assignedAuditorId) {
      addNotification(
          updatedAudit.assignedAuditorId,
          "Audit Rescheduled",
          `The audit for ${updatedAudit.department} has been rescheduled to ${dateStr}.`,
          "WARNING"
      );
    }

    const auditees = users.filter(u => u.department === updatedAudit.department);
    auditees.forEach(u => {
        addNotification(
          u.id,
          "Audit Rescheduled",
          `Your audit schedule has been changed to ${dateStr}. Please update your calendar.`,
          "WARNING"
        );
    });

    setRescheduleConfirmOpen(false);
    setRescheduleState({ isOpen: false, audit: null, newDate: '' });
    
    alert(`✅ Jadwal Audit untuk ${updatedAudit.department} berhasil diperbarui.`);
  };

  const confirmDeleteSchedule = () => {
    if (deleteScheduleModal.auditId) {
      onDeleteAudit(deleteScheduleModal.auditId);
      setDeleteScheduleModal({ open: false, auditId: null, auditName: '' });
    }
  };

  // Group Pending and Planned together in the top list
  const plannedAudits = audits.filter(a => a.status === AuditStatus.PLANNED || a.status === AuditStatus.PENDING_SCHEDULING);
  // History contains everything else (In Progress, Submitted, Review, Completed)
  const otherAudits = audits.filter(a => a.status !== AuditStatus.PLANNED && a.status !== AuditStatus.PENDING_SCHEDULING);
  
  const { daysInMonth, firstDayOfMonth, month, year } = getDaysInMonth(calendarDate);
  const monthName = calendarDate.toLocaleString('default', { month: 'long' });

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-fade-in pb-20">
        <div className="flex-none p-6 pb-4 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <CalendarDays className="text-blue-600" /> {t('nav.dashboard').replace('Dashboard', 'Audit Schedule')}
            </h2>
            <p className="text-slate-500">Plan, schedule, and visualize audit timelines.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-white border border-slate-300 rounded-lg p-1 flex items-center gap-1 shadow-sm mr-2">
               <button 
                  onClick={() => setScheduleViewMode('LIST')}
                  className={`p-2 rounded transition-colors flex items-center gap-1 ${scheduleViewMode === 'LIST' ? 'bg-slate-100 text-blue-600 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}
                  title="List View"
               >
                 <LayoutList size={18} />
                 <span className="text-xs hidden md:inline">List</span>
               </button>
               <button 
                  onClick={() => setScheduleViewMode('CALENDAR')}
                  className={`p-2 rounded transition-colors flex items-center gap-1 ${scheduleViewMode === 'CALENDAR' ? 'bg-slate-100 text-blue-600 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}
                  title="Calendar View"
               >
                 <Calendar size={18} />
                 <span className="text-xs hidden md:inline">Calendar</span>
               </button>
            </div>

            {canManageSchedule && (
              <button 
                onClick={() => setIsScheduleModalOpen(true)}
                className="bg-blue-600 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm font-medium text-sm"
              >
                <Plus size={18} /> Schedule New
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 max-w-7xl mx-auto w-full">
          
          {scheduleViewMode === 'CALENDAR' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                   <Calendar size={20} className="text-slate-500" /> {monthName} {year}
                </h3>
                <div className="flex items-center gap-2">
                   <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white rounded-full border border-transparent hover:border-slate-200 transition-all"><ChevronLeft size={20} className="text-slate-600" /></button>
                   <button onClick={goToToday} className="text-xs font-bold px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors border border-blue-200">Today</button>
                   <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white rounded-full border border-transparent hover:border-slate-200 transition-all"><ChevronRight size={20} className="text-slate-600" /></button>
                </div>
              </div>

              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/50">
                 {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="p-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">{day}</div>
                 ))}
              </div>

              <div className="grid grid-cols-7 auto-rows-fr bg-slate-100 gap-px border-b border-slate-200">
                 {[...Array(firstDayOfMonth)].map((_, i) => (
                    <div key={`empty-${i}`} className="bg-white min-h-[140px] p-2"></div>
                 ))}
                 
                 {[...Array(daysInMonth)].map((_, i) => {
                    const day = i + 1;
                    const dayAudits = audits.filter(a => {
                       const d = new Date(a.date);
                       return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
                    });
                    
                    const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;

                    return (
                      <div key={day} className={`bg-white min-h-[140px] p-2 transition-colors hover:bg-blue-50/20 relative group ${isToday ? 'bg-blue-50/40' : ''}`}>
                         <div className="flex justify-between items-start mb-2">
                             <div className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white shadow-md' : 'text-slate-700'}`}>
                                {day}
                             </div>
                             {dayAudits.length > 0 && (
                                <span className="text-[10px] text-slate-400 font-medium">{dayAudits.length} events</span>
                             )}
                         </div>
                         
                         <div className="space-y-1.5">
                            {dayAudits.map(audit => {
                               const isOverdue = (audit.status === AuditStatus.PLANNED || audit.status === AuditStatus.PENDING_SCHEDULING) && isPlanOverdue(audit.date);
                               return (
                                <div 
                                  key={audit.id}
                                  onClick={() => {
                                     if (canManageSchedule) {
                                       setRescheduleState({
                                          isOpen: true,
                                          audit: audit,
                                          newDate: new Date(audit.date).toISOString().split('T')[0]
                                       });
                                     }
                                  }} 
                                  className={`text-[10px] px-2 py-1.5 rounded border cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] ${
                                    isOverdue ? 'bg-red-50 text-red-700 border-red-200 ring-1 ring-red-200' :
                                    audit.status === AuditStatus.PENDING_SCHEDULING ? 'bg-slate-100 text-slate-700 border-slate-200 border-dashed' :
                                    audit.status === AuditStatus.PLANNED ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                    audit.status === AuditStatus.IN_PROGRESS ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                    audit.status === AuditStatus.SUBMITTED ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                    'bg-green-50 text-green-700 border-green-100'
                                  }`}
                                  title={`${audit.department}\n${audit.standard}\nStatus: ${audit.status}`}
                                >
                                   <div className="font-bold truncate leading-tight flex items-center gap-1">
                                      {isOverdue && <AlertCircle size={8} className="text-red-600 shrink-0" />}
                                      {audit.department}
                                   </div>
                                   <div className="opacity-80 text-[9px] truncate mt-0.5 flex items-center gap-1">
                                      <span className={`w-1.5 h-1.5 rounded-full ${
                                         isOverdue ? 'bg-red-500' :
                                         audit.status === AuditStatus.PENDING_SCHEDULING ? 'bg-slate-400' :
                                         audit.status === AuditStatus.PLANNED ? 'bg-indigo-400' :
                                         audit.status === AuditStatus.IN_PROGRESS ? 'bg-amber-400' :
                                         audit.status === AuditStatus.SUBMITTED ? 'bg-purple-400' : 'bg-green-400'
                                      }`}></span>
                                      {isOverdue ? 'OVERDUE' : audit.status}
                                   </div>
                                </div>
                             );
                            })}
                         </div>
                      </div>
                    );
                 })}
                 {[...Array(42 - (daysInMonth + firstDayOfMonth))].map((_, i) => (
                     <div key={`empty-end-${i}`} className="bg-slate-50/30 min-h-[140px]"></div>
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
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Clock size={18} className="text-blue-500" /> Upcoming / Pending
                    </h3>
                    <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{plannedAudits.length}</span>
                  </div>
                  
                  {/* START ALL BUTTON - Only valid for Confirmed (PLANNED) audits */}
                  {canStartAudit && plannedAudits.some(a => a.status === AuditStatus.PLANNED) && (
                    <button 
                       onClick={initiateStartAll}
                       className="text-xs font-bold bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 shadow-sm"
                       title="Start All Planned Audits"
                    >
                       <Play size={14} fill="currentColor" /> Start All Planned
                    </button>
                  )}
                </div>
                {plannedAudits.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center text-slate-400">
                    <CalendarDays size={48} className="opacity-20 mb-3" />
                    <p>No upcoming audits scheduled.</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-medium">
                      <tr>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Department</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Auditor</th>
                        <th className="px-6 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {plannedAudits.map(audit => {
                        const isOverdue = isPlanOverdue(audit.date);
                        return (
                        <tr key={audit.id} className={`hover:bg-slate-50 ${isOverdue ? 'bg-red-50/30' : ''}`}>
                          <td className="px-6 py-3 font-medium text-slate-700">
                            {new Date(audit.date).toLocaleDateString()}
                            {isOverdue && (
                              <span className="ml-2 inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-red-200">
                                <AlertCircle size={10} /> Overdue
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-3 font-medium">{audit.department}</td>
                          <td className="px-6 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border ${
                              audit.status === AuditStatus.PENDING_SCHEDULING 
                                ? 'bg-slate-100 border-slate-300 text-slate-600 border-dashed'
                                : 'bg-indigo-50 border-indigo-100 text-indigo-700'
                            }`}>
                              {audit.status === AuditStatus.PENDING_SCHEDULING ? <CalendarClock size={12}/> : <CheckCircle size={12}/>}
                              {audit.status === AuditStatus.PENDING_SCHEDULING ? 'Confirm Wait' : 'Planned'}
                            </span>
                          </td>
                          <td className="px-6 py-3 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold border border-blue-200">
                              {users.find(u => u.id === audit.assignedAuditorId)?.name.charAt(0) || '?'}
                            </div>
                            {users.find(u => u.id === audit.assignedAuditorId)?.name || 'Unassigned'}
                          </td>
                          <td className="px-6 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              
                              {/* SINGLE START BUTTON - Only for PLANNED */}
                              {canStartAudit && audit.status === AuditStatus.PLANNED && (
                                <button 
                                    onClick={() => initiateStartSingle(audit)}
                                    className="flex items-center gap-1 bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1.5 rounded-md transition-colors mr-2 border border-green-200 shadow-sm"
                                    title="Start & Confirm Audit Now"
                                >
                                    <PlayCircle size={14} /> <span className="text-xs font-bold">Start</span>
                                </button>
                              )}
                              
                              {canManageSchedule && (
                                <button 
                                    onClick={() => setRescheduleState({
                                        isOpen: true,
                                        audit: audit,
                                        newDate: new Date(audit.date).toISOString().split('T')[0]
                                    })}
                                    className={`p-2 rounded transition-colors mr-1 border ${
                                        isOverdue 
                                            ? 'bg-red-100 text-red-600 border-red-200 hover:bg-red-200 hover:text-red-800 animate-pulse' 
                                            : 'text-blue-600 hover:bg-blue-50 border-transparent hover:border-blue-100'
                                    }`}
                                    title="Reschedule"
                                >
                                    <Calendar size={16} />
                                </button>
                              )}

                              <button 
                                onClick={() => setDeleteScheduleModal({ open: true, auditId: audit.id, auditName: audit.department })}
                                className="text-red-500 hover:bg-red-50 p-2 rounded transition-colors border border-transparent hover:border-red-100"
                                title="Cancel Schedule"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                )}
              </div>

              {/* History / Active */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                     <LayoutList size={16} className="text-slate-400"/> Active & Completed History
                  </h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white text-slate-500 font-medium sticky top-0 shadow-sm z-10">
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
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                                audit.status === AuditStatus.COMPLETED ? 'bg-green-50 text-green-700 border-green-100' : 
                                audit.status === AuditStatus.SUBMITTED ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                'bg-amber-50 text-amber-700 border-amber-100'
                              }`}>
                                {audit.status}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                 
                                 {canViewReports && (
                                    <button 
                                      onClick={() => onViewReport(audit)}
                                      className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1.5 rounded flex items-center gap-1 transition-colors mr-2 border border-transparent hover:border-blue-100"
                                      title="Open Audit Report"
                                    >
                                      <PieChart size={14} /> View Report
                                    </button>
                                 )}

                                 {/* DELETE BUTTON - STRICTLY RESTRICTED TO SUPER_ADMIN & ADMIN */}
                                 {canDeleteHistory && (
                                    <button 
                                      onClick={() => setDeleteScheduleModal({ open: true, auditId: audit.id, auditName: audit.department })}
                                      className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded transition-colors"
                                      title="Delete Audit Record"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                 )}
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

        {/* Schedule Modal */}
        {isScheduleModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800">Schedule New Audit</h3>
                <button onClick={() => setIsScheduleModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleInitiateSchedule} className="p-6 space-y-4">
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
                    onChange={e => {
                        const dept = e.target.value;
                        setScheduleForm(prev => ({
                            ...prev, 
                            department: dept, 
                            auditorId: '',
                            auditName: dept ? `Audit ${dept} - ${settings.auditPeriod}` : ''
                        }));
                    }}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">-- Select Unit --</option>
                    {units.map(u => (
                      <option key={u.id} value={u.name}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Audit Name (Auto-filled)</label>
                  <input 
                    type="text"
                    value={scheduleForm.auditName}
                    onChange={e => setScheduleForm({...scheduleForm, auditName: e.target.value})}
                    placeholder={`e.g. Audit Unit - ${settings.auditPeriod}`}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
                  />
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
                      const isAuditorRole = u.role === UserRole.AUDITOR || u.role === UserRole.AUDITOR_LEAD;
                      const isConflict = scheduleForm.department && u.department === scheduleForm.department;
                      return u.status === 'Active' && isAuditorRole && !isConflict;
                    }).map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
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
                
                <div className="pt-2 flex gap-3">
                  <button type="button" onClick={() => setIsScheduleModalOpen(false)} className="flex-1 py-2 border rounded-lg text-slate-600 hover:bg-slate-50">Cancel</button>
                  <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md">Confirm Schedule</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {rescheduleState.isOpen && rescheduleState.audit && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-fade-in">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800">Reschedule Audit</h3>
                <button onClick={() => setRescheduleState({ ...rescheduleState, isOpen: false })} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleRescheduleSubmit} className="p-6 space-y-4">
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

        {rescheduleConfirmOpen && (
           <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600">
                <HelpCircle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Konfirmasi Jadwal Ulang</h3>
                <p className="text-sm text-slate-500">
                  Apakah Anda yakin ingin mengubah jadwal audit untuk unit 
                  <span className="font-bold text-slate-700 block mt-1">{rescheduleState.audit?.department}</span>
                  menjadi tanggal <span className="font-bold text-blue-600">{new Date(rescheduleState.newDate).toLocaleDateString()}</span>?
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setRescheduleConfirmOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={executeReschedule}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/20"
                >
                  Ya, Update
                </button>
              </div>
            </div>
          </div>
        )}

        {createConfirmOpen && (
           <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                <Calendar size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Konfirmasi Jadwal Baru</h3>
                <p className="text-sm text-slate-500">
                  Anda akan menjadwalkan audit untuk:
                  <span className="font-bold text-slate-700 block mt-1">{scheduleForm.department}</span>
                </p>
                <div className="mt-2 bg-slate-50 p-2 rounded text-xs font-medium text-slate-600 border border-slate-100">
                   Status Awal: <span className="text-slate-800 font-bold">Pending Schedule</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                   Kepala Unit harus menyetujui jadwal ini agar audit menjadi Planned/Aktif.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setCreateConfirmOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={executeSaveSchedule}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 transition-colors shadow-lg shadow-green-900/20"
                >
                  Ya, Jadwalkan
                </button>
              </div>
            </div>
          </div>
        )}

        {startConfirmModal.isOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center space-y-4">
               <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                  <PlayCircle size={24} />
               </div>
               <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {startConfirmModal.type === 'ALL' ? 'Mulai Semua Audit?' : 'Mulai Audit?'}
                  </h3>
                  <p className="text-sm text-slate-500">
                     Status audit akan berubah menjadi <strong>IN_PROGRESS</strong>.
                  </p>
               </div>
               <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setStartConfirmModal({ isOpen: false, type: 'SINGLE', audit: null })}
                    className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-200 transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={executeStartAudit}
                    className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 transition-colors shadow-lg shadow-green-900/20"
                  >
                    Ya, Mulai
                  </button>
               </div>
            </div>
          </div>
        )}

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

export default AuditSchedule;
