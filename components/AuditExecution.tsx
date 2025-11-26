import { useState, FC } from 'react';
import { AuditSession, AuditQuestion, AuditStatus, UserRole } from '../types';
import { 
  Save, CheckCircle, Link as LinkIcon, 
  ChevronDown, ChevronUp, Search, Filter, FileText, 
  ExternalLink, Loader2, Building2, UserCheck, List,
  ArrowRight, ChevronLeft, Calendar, Send, ShieldCheck, Clock,
  Upload, File, X, Eye
} from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { useAuth } from '../AuthContext';
import { useNotification } from '../NotificationContext';

interface AuditExecutionProps {
  audit: AuditSession | null;
  audits: AuditSession[];
  onUpdateAudit: (audit: AuditSession) => void;
  onSelectAudit: (audit: AuditSession | null) => void;
  onComplete: () => void;
}

const AuditExecution: FC<AuditExecutionProps> = ({ audit, audits, onUpdateAudit, onSelectAudit, onComplete }) => {
  const { t } = useLanguage();
  const { currentUser, users } = useAuth();
  const { addNotification } = useNotification();
  
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<'ALL' | 'UNFILLED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [listSearch, setListSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // --- HELPER TRANSLATIONS ---
  const getComplianceLabel = (status: string | null) => {
      if (!status) return '-';
      if (status === 'Compliant') return t('exec.status.compliant');
      if (status === 'Non-Compliant') return t('exec.status.noncompliant');
      if (status === 'Observation') return t('exec.status.observation');
      return status;
  };

  // --- FILE HANDLING HELPERS ---

  // Helper to open evidence correctly
  const openEvidence = (question: AuditQuestion) => {
    const url = question.evidence;
    if (!url) {
        alert(t('alert.no_evidence'));
        return;
    }

    try {
        if (url.startsWith('data:')) {
          // 1. Extract MIME type and Base64 data
          const arr = url.split(',');
          if (arr.length < 2) {
             console.error("Invalid Data URI");
             alert(t('alert.file_invalid'));
             return;
          }
          
          const mimeMatch = arr[0].match(/:(.*?);/);
          const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
          
          const bstr = atob(arr[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
              u8arr[n] = bstr.charCodeAt(n);
          }
          
          // 2. Create Blob and Object URL
          const blob = new Blob([u8arr], { type: mime });
          const blobUrl = URL.createObjectURL(blob);
          
          // 3. Create invisible link and click it (More reliable than window.open for blobs)
          const link = document.createElement('a');
          link.href = blobUrl;
          link.target = '_blank';
          
          // NOTE: Download attribute removed to ensure "Open in New Tab" behavior
          // If we set download, it forces download. Without it, browser attempts to render (PDF/Img).
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Clean up
          setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
        } else {
          // Standard URL
          let validUrl = url.trim();
          if (!validUrl.match(/^(http|https):\/\//)) {
             validUrl = `https://${validUrl}`;
          }
          
          // Use Anchor click for URLs too to ensure consistent behavior
          const link = document.createElement('a');
          link.href = validUrl;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
    } catch (e) {
        console.error("Gagal membuka file:", e);
        alert(t('alert.file_error'));
    }
  };
  
  const getStatusLabel = (status: AuditStatus) => {
    switch(status) {
        case AuditStatus.PENDING_SCHEDULING: return t('status.pending');
        case AuditStatus.PLANNED: return t('status.planned');
        case AuditStatus.IN_PROGRESS: return t('status.progress');
        case AuditStatus.SUBMITTED: return t('status.submitted');
        case AuditStatus.REVIEW_DEPT_HEAD: return t('status.review');
        case AuditStatus.COMPLETED: return t('status.completed');
        default: return status;
    }
  };

  // --- VIEW 1: LIST VIEW (Jika belum ada audit yang dipilih) ---
  if (!audit) {
    if (!currentUser) return null;

    // Filter audits relevant for execution (Active statuses)
    const actionableAudits = audits.filter(a => {
      // 1. Status Filter: Only active or planned audits
      const isActiveStatus = [
        AuditStatus.PLANNED, 
        AuditStatus.IN_PROGRESS, 
        AuditStatus.SUBMITTED, 
        AuditStatus.REVIEW_DEPT_HEAD
      ].includes(a.status);
      
      if (!isActiveStatus) return false;

      // 2. Role Filter
      if (currentUser.role === UserRole.AUDITEE || currentUser.role === UserRole.DEPT_HEAD) {
         return a.department === currentUser.department;
      }
      if (currentUser.role === UserRole.AUDITOR) {
         // Show assigned audits OR audits with no specific assignee if allowed
         return a.assignedAuditorId === currentUser.id || !a.assignedAuditorId;
      }
      // Admins/Leads see all
      return true;
    }).filter(a => 
       a.department.toLowerCase().includes(listSearch.toLowerCase()) || 
       a.name.toLowerCase().includes(listSearch.toLowerCase())
    );

    return (
      <div className="flex flex-col h-full bg-slate-50 animate-fade-in">
        <div className="flex-none bg-slate-50 border-b border-slate-200/50 px-6 py-4">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                 <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <List className="text-blue-600" /> 
                    {currentUser?.role === UserRole.AUDITEE ? 'Aktivitas Audit Unit Saya' : t('exec.list.title')}
                 </h2>
                 <p className="text-slate-500 text-sm">{t('exec.list.subtitle')}</p>
              </div>
              <div className="relative w-full md:w-64">
                 <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
                 <input 
                   type="text" 
                   placeholder={t('exec.search')}
                   value={listSearch}
                   onChange={(e) => setListSearch(e.target.value)}
                   className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                 />
              </div>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pb-20">
           {/* Welcome Banner for Auditee - Moved from Dashboard */}
           {currentUser?.role === UserRole.AUDITEE && (
            <div className="max-w-7xl mx-auto mb-6">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 text-amber-800">
                <Building2 size={24} />
                <div>
                  <p className="font-bold">{t('dash.welcome.auditee')} {currentUser.department}</p>
                  <p className="text-sm">{t('dash.welcome.auditee.msg')}</p>
                </div>
              </div>
            </div>
           )}

           <div className="max-w-7xl mx-auto space-y-4">
              {actionableAudits.length === 0 ? (
                 <div className="text-center py-12 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <CheckCircle size={48} className="mx-auto mb-3 text-slate-300" />
                    <h3 className="text-lg font-bold text-slate-700">{t('exec.no_active')}</h3>
                    <p className="text-slate-500">{t('exec.no_active_msg')}</p>
                 </div>
              ) : (
                 actionableAudits.map(a => {
                    const total = a.questions.length;
                    const filled = a.questions.filter(q => q.compliance || q.auditeeSelfAssessment).length;
                    const percent = total > 0 ? Math.round((filled / total) * 100) : 0;

                    return (
                       <div 
                         key={a.id}
                         onClick={() => onSelectAudit(a)}
                         className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 cursor-pointer transition-all group"
                       >
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                             <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                                   a.status === AuditStatus.IN_PROGRESS ? 'bg-amber-100 text-amber-600' :
                                   a.status === AuditStatus.SUBMITTED ? 'bg-purple-100 text-purple-600' :
                                   a.status === AuditStatus.REVIEW_DEPT_HEAD ? 'bg-indigo-100 text-indigo-600' :
                                   'bg-slate-100 text-slate-600'
                                }`}>
                                   {a.status === AuditStatus.IN_PROGRESS ? <Clock size={24} /> :
                                    a.status === AuditStatus.SUBMITTED ? <Send size={24} /> :
                                    a.status === AuditStatus.REVIEW_DEPT_HEAD ? <ShieldCheck size={24} /> :
                                    <Calendar size={24} />}
                                </div>
                                <div>
                                   <div className="flex items-center gap-2 mb-1">
                                      <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-lg">{a.department}</h3>
                                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded border border-slate-200">{a.standard}</span>
                                   </div>
                                   <p className="text-sm text-slate-500 font-medium mb-1">{a.name}</p>
                                   <p className="text-xs text-slate-400 flex items-center gap-2">
                                      <Calendar size={12} /> {new Date(a.date).toLocaleDateString()}
                                   </p>
                                </div>
                             </div>

                             <div className="flex items-center gap-6 w-full md:w-auto">
                                <div className="flex-1 md:w-48">
                                   <div className="flex justify-between text-xs mb-1 font-bold text-slate-500">
                                      <span>{t('exec.progress')}</span>
                                      <span>{percent}%</span>
                                   </div>
                                   <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                      <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${percent}%` }}></div>
                                   </div>
                                </div>
                                
                                <button className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                                   <ArrowRight size={20} />
                                </button>
                             </div>
                          </div>
                       </div>
                    );
                 })
              )}
           </div>
        </div>
      </div>
    );
  }

  // --- VIEW 2: DETAIL VIEW (Execution Mode) ---
  
  const isAuditee = currentUser?.role === UserRole.AUDITEE || currentUser?.role === UserRole.DEPT_HEAD;
  const isAuditor = currentUser?.role === UserRole.AUDITOR || currentUser?.role === UserRole.AUDITOR_LEAD || currentUser?.role === UserRole.SUPER_ADMIN || currentUser?.role === UserRole.ADMIN;
  
  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleUpdateQuestion = (index: number, updates: Partial<AuditQuestion>) => {
    const updatedQuestions = [...audit.questions];
    updatedQuestions[index] = { ...updatedQuestions[index], ...updates };
    onUpdateAudit({ ...audit, questions: updatedQuestions });
  };

  const handleFileUpload = (index: number, question: AuditQuestion, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert(t('alert.file_too_big'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        // Logic for "Structured Folder" requirement (Simulation)
        const date = new Date().toISOString().split('T')[0];
        const cleanCategory = question.category.replace(/[^a-zA-Z0-9]/g, '_');
        const cleanId = question.id.replace(/[^a-zA-Z0-9]/g, '_');
        
        // Virtual Path Structure to Display
        const virtualPath = `uploads/${date}/${cleanCategory}/${cleanId}/${file.name}`;
        
        // Save Base64 Data AND The Virtual Path
        handleUpdateQuestion(index, {
            evidence: event.target.result as string,
            evidenceFileName: virtualPath
        });
        
        alert(t('exec.alert.upload_success') + `\n\nDisimpan secara terstruktur di:\n${virtualPath}`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClearFile = (index: number) => {
    if(window.confirm(t('confirm.delete'))) {
        handleUpdateQuestion(index, { evidence: "", evidenceFileName: "" });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API persistence
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsSaving(false);
  };

  const handleCompletion = () => {
    // 1. AUDITEE SUBMITS TO AUDITOR
    if (isAuditee && audit.status === AuditStatus.IN_PROGRESS) {
      if (window.confirm(t('exec.alert.submit_auditee'))) {
        onUpdateAudit({ ...audit, status: AuditStatus.SUBMITTED });
        
        // Notify Assigned Auditor
        if (audit.assignedAuditorId) {
           addNotification(
             audit.assignedAuditorId,
             "Self-Assessment Dikirim",
             `Unit ${audit.department} telah mengirimkan self-assessment. Mohon lakukan verifikasi.`,
             "INFO"
           );
        }
      }
    } 
    // 2. AUDITOR SUBMITS TO DEPT HEAD (VERIFICATION)
    else if (isAuditor && (audit.status === AuditStatus.SUBMITTED || audit.status === AuditStatus.IN_PROGRESS)) {
       if (window.confirm(t('exec.alert.submit_auditor'))) {
         onUpdateAudit({ ...audit, status: AuditStatus.REVIEW_DEPT_HEAD });

         // Notify Dept Head
         const deptHeads = users.filter(u => u.department === audit.department && u.role === UserRole.DEPT_HEAD);
         if (deptHeads.length > 0) {
            deptHeads.forEach(dh => {
                addNotification(
                  dh.id,
                  "Verifikasi Audit Selesai",
                  `Auditor telah menyelesaikan verifikasi untuk ${audit.department}. Mohon review dan setujui hasil audit.`,
                  "WARNING"
                );
            });
         }
       }
    } 
    // 3. DEPT HEAD APPROVES (COMPLETION)
    else if (currentUser?.role === UserRole.DEPT_HEAD && audit.status === AuditStatus.REVIEW_DEPT_HEAD) {
       if (window.confirm(t('exec.alert.approve_dept'))) {
         onComplete();

         // Notify Auditee and Auditor of Completion
         if (audit.assignedAuditorId) {
            addNotification(
              audit.assignedAuditorId,
              "Audit Selesai",
              `Audit untuk ${audit.department} telah disetujui dan dinyatakan Selesai.`,
              "SUCCESS"
            );
         }
         
         const auditees = users.filter(u => u.department === audit.department && u.role === UserRole.AUDITEE);
         auditees.forEach(a => {
            addNotification(
              a.id,
              "Audit Selesai",
              `Proses audit untuk ${audit.department} telah selesai sepenuhnya.`,
              "SUCCESS"
            );
         });
       }
    } else {
       // Generic completion for Admin/Fallback
       if (window.confirm(t('confirm.action'))) {
          onComplete();
       }
    }
  };

  const filteredQuestions = audit.questions.filter(q => {
    const matchesSearch = q.questionText.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          q.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesFilter = true;
    if (filter === 'UNFILLED') {
        if (isAuditee) {
            matchesFilter = !q.auditeeSelfAssessment;
        } else if (isAuditor) {
            matchesFilter = !q.compliance;
        }
    }
    
    return matchesSearch && matchesFilter;
  });

  // Group questions by category
  const groupedQuestions = filteredQuestions.reduce((acc, q) => {
    const cat = q.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(q);
    return acc;
  }, {} as Record<string, AuditQuestion[]>);

  const progress = Math.round((audit.questions.filter(q => q.compliance || q.auditeeSelfAssessment).length / audit.questions.length) * 100);

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-fade-in relative">
      {/* Header */}
      <div className="flex-none bg-slate-50 border-b border-slate-200/50 pt-2 px-6 pb-4">
          <button 
             onClick={() => onSelectAudit(null)}
             className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-medium mb-3 transition-colors"
          >
             <ChevronLeft size={16} /> {t('exec.btn.back')}
          </button>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
             <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                   <FileText size={24} />
                </div>
                <div>
                   <h2 className="text-xl font-bold text-slate-900 line-clamp-1">{audit.name}</h2>
                   <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="bg-slate-100 px-2 py-0.5 rounded font-medium">{audit.standard}</span>
                      <span>•</span>
                      <span>{audit.department}</span>
                      <span>•</span>
                      <span className={`font-bold ${
                         audit.status === AuditStatus.IN_PROGRESS ? 'text-amber-600' :
                         audit.status === AuditStatus.SUBMITTED ? 'text-purple-600' :
                         audit.status === AuditStatus.COMPLETED ? 'text-green-600' : 'text-slate-600'
                      }`}>{getStatusLabel(audit.status)}</span>
                   </div>
                </div>
             </div>

             <div className="flex items-center gap-3 w-full md:w-auto">
                 <div className="flex flex-col items-end mr-4 hidden md:flex">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('exec.progress')}</span>
                    <div className="flex items-center gap-2">
                       <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{width: `${progress}%`}}></div>
                       </div>
                       <span className="text-sm font-bold text-slate-700">{progress}%</span>
                    </div>
                 </div>

                 <button 
                   onClick={handleSave}
                   disabled={isSaving}
                   className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                   title={t('exec.btn.save')}
                 >
                   {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                 </button>
                 
                 <button 
                   onClick={handleCompletion}
                   className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-all flex items-center gap-2"
                 >
                   <CheckCircle size={16} />
                   {isAuditee && audit.status === AuditStatus.IN_PROGRESS ? t('exec.btn.submit_assess') : 
                    isAuditor && (audit.status === AuditStatus.SUBMITTED || audit.status === AuditStatus.IN_PROGRESS) ? t('exec.btn.verify_send') : 
                    currentUser?.role === UserRole.DEPT_HEAD && audit.status === AuditStatus.REVIEW_DEPT_HEAD ? t('exec.btn.approve') :
                    t('exec.btn.complete')}
                 </button>
             </div>
          </div>
      </div>

      {/* Toolbar */}
      <div className="flex-none px-6 py-4 flex flex-col md:flex-row gap-4 items-center justify-between sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm">
         <div className="relative w-full md:w-96">
            <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
            <input 
              type="text" 
              placeholder={t('exec.search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
         </div>
         
         <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
            <button 
               onClick={() => setFilter('ALL')}
               className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${filter === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
               {t('exec.filter.all')}
            </button>
            <button 
               onClick={() => setFilter('UNFILLED')}
               className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${filter === 'UNFILLED' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
               {t('exec.filter.unfilled')}
            </button>
         </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto pb-20">
         {Object.keys(groupedQuestions).length === 0 ? (
             <div className="text-center py-12 text-slate-400 px-6">
                <Filter size={48} className="mx-auto mb-3 opacity-20" />
                <p>{t('exec.no_match')}</p>
             </div>
         ) : (
            Object.entries(groupedQuestions).map(([category, questions]) => (
               <div key={category} className="mb-1">
                  {/* Local Sticky Header */}
                  <div className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-md px-6 py-2 border-y border-slate-200 shadow-sm flex justify-between items-center group">
                      <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                         <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                         {category}
                      </h3>
                      <span className="text--[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                         {questions.length}
                      </span>
                  </div>
                  
                  <div className="px-6 py-4 space-y-4">
                     {questions.map((q, idx) => {
                        const isExpanded = expandedItems[q.id];
                        // Find actual index in original array
                        const realIndex = audit.questions.findIndex(aq => aq.id === q.id);
                        
                        return (
                           <div key={q.id} className={`bg-white rounded-xl border transition-all ${isExpanded ? 'border-blue-300 shadow-lg ring-1 ring-blue-100 scale-[1.01]' : 'border-slate-200 shadow-sm hover:border-blue-300'}`}>
                              <div 
                                onClick={() => toggleExpand(q.id)}
                                className={`p-4 cursor-pointer flex items-start gap-4 ${isExpanded ? 'bg-blue-50/10' : ''}`}
                              >
                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                                    (q.compliance || q.auditeeSelfAssessment) ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                                 }`}>
                                    {isExpanded ? <List size={14} /> : (idx + 1)}
                                 </div>
                                 <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                       <span className="text-xs font-mono font-bold text-slate-400">{q.id}</span>
                                       {q.compliance && (
                                         <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                                            q.compliance === 'Compliant' ? 'bg-green-50 text-green-700 border-green-100' :
                                            q.compliance === 'Non-Compliant' ? 'bg-red-50 text-red-700 border-red-100' :
                                            'bg-amber-50 text-amber-700 border-amber-100'
                                         }`}>
                                            Auditor: {getComplianceLabel(q.compliance)}
                                         </span>
                                       )}
                                       {q.auditeeSelfAssessment && (
                                         <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                                            q.auditeeSelfAssessment === 'Compliant' ? 'bg-green-50 text-green-700 border-green-100' :
                                            q.auditeeSelfAssessment === 'Non-Compliant' ? 'bg-red-50 text-red-700 border-red-100' :
                                            'bg-amber-50 text-amber-700 border-amber-100'
                                         }`}>
                                            Self: {getComplianceLabel(q.auditeeSelfAssessment)}
                                         </span>
                                       )}
                                    </div>
                                    <p className={`text-slate-800 text-sm leading-relaxed ${isExpanded ? 'font-semibold' : 'font-medium'}`}>{q.questionText}</p>
                                 </div>
                                 <div className="text-slate-400">
                                    {isExpanded ? <ChevronUp size={20} className="text-blue-500"/> : <ChevronDown size={20} />}
                                 </div>
                              </div>

                              {isExpanded && (
                                 <div className="px-4 pb-6 pt-2 border-t border-slate-100 animate-fade-in bg-white rounded-b-xl">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                       
                                       {/* LEFT: AUDITEE SECTION */}
                                       <div className={`space-y-4 ${!isAuditee ? 'opacity-90' : ''}`}>
                                          <h4 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                             <Building2 size={14} /> {t('exec.label.self_eval')}
                                          </h4>
                                          
                                          <div className="space-y-2">
                                             <label className="text-sm font-medium text-slate-700">{t('exec.label.claim')}</label>
                                             <div className="flex gap-2">
                                                {['Compliant', 'Observation', 'Non-Compliant'].map((status) => (
                                                   <button
                                                      key={status}
                                                      disabled={!isAuditee}
                                                      onClick={() => isAuditee && handleUpdateQuestion(realIndex, { auditeeSelfAssessment: status as any })}
                                                      className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                                                         q.auditeeSelfAssessment === status 
                                                            ? status === 'Compliant' ? 'bg-green-600 text-white border-green-600' :
                                                              status === 'Non-Compliant' ? 'bg-red-600 text-white border-red-600' :
                                                              'bg-amber-500 text-white border-amber-500'
                                                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 disabled:opacity-70 disabled:cursor-not-allowed'
                                                      }`}
                                                   >
                                                      {getComplianceLabel(status)}
                                                   </button>
                                                ))}
                                             </div>
                                          </div>

                                          <div className="space-y-2">
                                             <label className="text-sm font-medium text-slate-700 flex items-center justify-between mb-1.5 gap-2">
                                                <span>{t('exec.label.evidence')}</span>
                                                {q.evidence && (
                                                   <button 
                                                      onClick={(e) => { e.stopPropagation(); openEvidence(q); }}
                                                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 hover:bg-blue-100 transition-colors cursor-pointer"
                                                      style={{ pointerEvents: 'auto' }}
                                                    >
                                                      <Eye size={12} /> {t('exec.btn.open_file')}
                                                   </button>
                                                )}
                                             </label>
                                             
                                             <div className="flex gap-2 items-stretch">
                                                <div className="relative flex-1 min-w-0">
                                                    {q.evidenceFileName ? (
                                                       <div 
                                                          onClick={(e) => { e.stopPropagation(); openEvidence(q); }}
                                                          className="w-full flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors group/file"
                                                          title="Klik untuk melihat file"
                                                          style={{ pointerEvents: 'auto' }}
                                                       >
                                                          <File size={16} className="shrink-0 text-blue-500 group-hover/file:scale-110 transition-transform" />
                                                          <span className="truncate flex-1 font-mono text-xs">{q.evidenceFileName}</span>
                                                          {isAuditee && (
                                                            <button 
                                                              onClick={(e) => { e.stopPropagation(); handleClearFile(realIndex); }} 
                                                              className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                                                              title="Hapus file"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                          )}
                                                       </div>
                                                    ) : (
                                                       <>
                                                          <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                          <input 
                                                            type="text" 
                                                            disabled={!isAuditee}
                                                            value={q.evidence || ''}
                                                            onChange={(e) => handleUpdateQuestion(realIndex, { evidence: e.target.value })}
                                                            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                                                            placeholder={t('exec.placeholder.evidence')}
                                                          />
                                                       </>
                                                    )}
                                                </div>
                                                
                                                {isAuditee && (
                                                    <>
                                                        <input 
                                                            type="file" 
                                                            id={`upload-${q.id}`}
                                                            className="hidden"
                                                            accept="image/*,application/pdf"
                                                            onChange={(e) => handleFileUpload(realIndex, q, e)}
                                                        />
                                                        <label 
                                                            htmlFor={`upload-${q.id}`}
                                                            className="flex items-center justify-center px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg border border-blue-200 cursor-pointer transition-colors shadow-sm h-full whitespace-nowrap"
                                                            title="Upload File"
                                                        >
                                                            <Upload size={18} />
                                                        </label>
                                                    </>
                                                )}
                                             </div>
                                             {isAuditee && !q.evidenceFileName && (
                                                 <p className="text-[10px] text-slate-400">
                                                    {t('exec.help.upload')}
                                                 </p>
                                             )}
                                          </div>
                                          
                                          {(q.auditeeSelfAssessment === 'Non-Compliant' || q.compliance === 'Non-Compliant') && (
                                              <div className="space-y-2 pt-2">
                                                 <label className="text-sm font-medium text-slate-700">{t('exec.label.action_plan')}</label>
                                                 <textarea 
                                                    disabled={!isAuditee}
                                                    rows={2}
                                                    value={q.actionPlan || ''}
                                                    onChange={(e) => handleUpdateQuestion(realIndex, { actionPlan: e.target.value })}
                                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none disabled:bg-slate-50 disabled:text-slate-500"
                                                    placeholder={t('exec.placeholder.action')}
                                                 />
                                              </div>
                                          )}
                                       </div>

                                       {/* RIGHT: AUDITOR SECTION */}
                                       <div className={`space-y-4 pl-0 lg:pl-8 lg:border-l border-slate-100 ${!isAuditor ? 'opacity-90' : ''}`}>
                                          <h4 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                             <UserCheck size={14} /> {t('exec.label.verification')}
                                          </h4>

                                          <div className="space-y-2">
                                             <label className="text-sm font-medium text-slate-700">{t('exec.label.verdict')}</label>
                                             <div className="flex gap-2">
                                                {['Compliant', 'Observation', 'Non-Compliant'].map((status) => (
                                                   <button
                                                      key={status}
                                                      disabled={!isAuditor}
                                                      onClick={() => isAuditor && handleUpdateQuestion(realIndex, { compliance: status as any })}
                                                      className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                                                         q.compliance === status 
                                                            ? status === 'Compliant' ? 'bg-green-600 text-white border-green-600 shadow-md ring-2 ring-green-100' :
                                                              status === 'Non-Compliant' ? 'bg-red-600 text-white border-red-600 shadow-md ring-2 ring-red-100' :
                                                              'bg-amber-500 text-white border-amber-500 shadow-md ring-2 ring-amber-100'
                                                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 disabled:opacity-70 disabled:cursor-not-allowed'
                                                      }`}
                                                   >
                                                      {getComplianceLabel(status)}
                                                   </button>
                                                ))}
                                             </div>
                                          </div>

                                          <div className="space-y-2">
                                             <label className="text-sm font-medium text-slate-700">{t('exec.label.notes')}</label>
                                             <textarea 
                                                disabled={!isAuditor}
                                                rows={3}
                                                value={q.auditorNotes || ''}
                                                onChange={(e) => handleUpdateQuestion(realIndex, { auditorNotes: e.target.value })}
                                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-slate-50 focus:bg-white transition-colors disabled:bg-slate-100 disabled:text-slate-500"
                                                placeholder={t('exec.placeholder.notes')}
                                             />
                                          </div>
                                       </div>

                                    </div>
                                 </div>
                              )}
                           </div>
                        );
                     })}
                  </div>
               </div>
            ))
         )}
      </div>
    </div>
  );
};

export default AuditExecution;