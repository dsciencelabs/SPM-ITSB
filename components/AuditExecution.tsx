
import { useState, FC } from 'react';
import { AuditSession, AuditQuestion, AuditStatus, UserRole } from '../types';
import { 
  Save, CheckCircle, Link as LinkIcon, 
  ChevronDown, ChevronUp, Search, Filter, FileText, 
  ExternalLink, Loader2, Building2, UserCheck, List,
  ArrowRight, ChevronLeft, Calendar, Send, ShieldCheck, Clock
} from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { useAuth } from '../AuthContext';

interface AuditExecutionProps {
  audit: AuditSession | null;
  audits: AuditSession[];
  onUpdateAudit: (audit: AuditSession) => void;
  onSelectAudit: (audit: AuditSession | null) => void;
  onComplete: () => void;
}

const AuditExecution: FC<AuditExecutionProps> = ({ audit, audits, onUpdateAudit, onSelectAudit, onComplete }) => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<'ALL' | 'UNFILLED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [listSearch, setListSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Helper to ensure URL works (adds https:// if missing)
  const getSafeUrl = (url: string | undefined) => {
    if (!url) return '#';
    const trimmed = url.trim();
    if (!trimmed) return '#';
    if (trimmed.match(/^(http|https):\/\//)) {
      return trimmed;
    }
    return `https://${trimmed}`;
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
                    <List className="text-blue-600" /> Daftar Pelaksanaan Audit
                 </h2>
                 <p className="text-slate-500 text-sm">Pilih audit di bawah ini untuk mulai mengisi kertas kerja atau melakukan verifikasi.</p>
              </div>
              <div className="relative w-full md:w-64">
                 <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
                 <input 
                   type="text" 
                   placeholder="Cari Unit / Nama Audit..."
                   value={listSearch}
                   onChange={(e) => setListSearch(e.target.value)}
                   className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                 />
              </div>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pb-20">
           <div className="max-w-7xl mx-auto space-y-4">
              {actionableAudits.length === 0 ? (
                 <div className="text-center py-12 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <CheckCircle size={48} className="mx-auto mb-3 text-slate-300" />
                    <h3 className="text-lg font-bold text-slate-700">Tidak ada audit aktif</h3>
                    <p className="text-slate-500">Semua tugas audit telah selesai atau belum dijadwalkan.</p>
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
                                      <span>Progress</span>
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

  const handleUpdateQuestion = (index: number, field: keyof AuditQuestion, value: string | null) => {
    const updatedQuestions = [...audit.questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    onUpdateAudit({ ...audit, questions: updatedQuestions });
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API persistence
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsSaving(false);
  };

  const handleCompletion = () => {
    if (isAuditee && audit.status === AuditStatus.IN_PROGRESS) {
      if (window.confirm("Submit self-assessment? Auditor will be notified.")) {
        onUpdateAudit({ ...audit, status: AuditStatus.SUBMITTED });
      }
    } else if (isAuditor && audit.status === AuditStatus.SUBMITTED) {
       if (window.confirm("Finish verification? Report will be sent to Dept Head for review.")) {
         onUpdateAudit({ ...audit, status: AuditStatus.REVIEW_DEPT_HEAD });
       }
    } else if (currentUser?.role === UserRole.DEPT_HEAD && audit.status === AuditStatus.REVIEW_DEPT_HEAD) {
       if (window.confirm("Approve Audit Result? Audit will be marked as Completed.")) {
         onComplete();
       }
    } else {
       if (window.confirm(t('exec.confirm'))) {
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
             <ChevronLeft size={16} /> Kembali ke Daftar
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
                      }`}>{audit.status}</span>
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
                   {isAuditee && audit.status === AuditStatus.IN_PROGRESS ? 'Submit Assessment' : 
                    isAuditor && audit.status === AuditStatus.SUBMITTED ? 'Verify & Send' : 
                    currentUser?.role === UserRole.DEPT_HEAD && audit.status === AuditStatus.REVIEW_DEPT_HEAD ? 'Approve' :
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
              placeholder="Search questions..."
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
               All
            </button>
            <button 
               onClick={() => setFilter('UNFILLED')}
               className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${filter === 'UNFILLED' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
               Unfilled
            </button>
         </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto pb-20">
         {Object.keys(groupedQuestions).length === 0 ? (
             <div className="text-center py-12 text-slate-400 px-6">
                <Filter size={48} className="mx-auto mb-3 opacity-20" />
                <p>No questions match your filter.</p>
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
                      <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
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
                                            Auditor: {q.compliance}
                                         </span>
                                       )}
                                       {q.auditeeSelfAssessment && (
                                         <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                                            q.auditeeSelfAssessment === 'Compliant' ? 'bg-green-50 text-green-700 border-green-100' :
                                            q.auditeeSelfAssessment === 'Non-Compliant' ? 'bg-red-50 text-red-700 border-red-100' :
                                            'bg-amber-50 text-amber-700 border-amber-100'
                                         }`}>
                                            Self: {q.auditeeSelfAssessment}
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
                                       <div className={`space-y-4 ${!isAuditee && 'opacity-80 pointer-events-none'}`}>
                                          <h4 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                             <Building2 size={14} /> Auditee Self Assessment
                                          </h4>
                                          
                                          <div className="space-y-2">
                                             <label className="text-sm font-medium text-slate-700">Self Assessment (Klaim)</label>
                                             <div className="flex gap-2">
                                                {['Compliant', 'Observation', 'Non-Compliant'].map((status) => (
                                                   <button
                                                      key={status}
                                                      onClick={() => isAuditee && handleUpdateQuestion(realIndex, 'auditeeSelfAssessment', status as any)}
                                                      className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                                                         q.auditeeSelfAssessment === status 
                                                            ? status === 'Compliant' ? 'bg-green-600 text-white border-green-600' :
                                                              status === 'Non-Compliant' ? 'bg-red-600 text-white border-red-600' :
                                                              'bg-amber-500 text-white border-amber-500'
                                                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                                                      }`}
                                                   >
                                                      {status}
                                                   </button>
                                                ))}
                                             </div>
                                          </div>

                                          <div className="space-y-2">
                                             <label className="text-sm font-medium text-slate-700 flex items-center justify-between">
                                                <span>Bukti / Evidence (URL)</span>
                                                {q.evidence && (
                                                   <a 
                                                      href={getSafeUrl(q.evidence)} 
                                                      target="_blank" 
                                                      rel="noreferrer" 
                                                      onClick={(e) => e.stopPropagation()}
                                                      className="text-xs text-blue-600 hover:underline flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 hover:bg-blue-100"
                                                    >
                                                      <ExternalLink size={10} /> Open Link
                                                   </a>
                                                )}
                                             </label>
                                             <div className="relative">
                                                <LinkIcon size={16} className="absolute left-3 top-3 text-slate-400" />
                                                <input 
                                                   type="text" 
                                                   disabled={!isAuditee}
                                                   value={q.evidence || ''}
                                                   onChange={(e) => handleUpdateQuestion(realIndex, 'evidence', e.target.value)}
                                                   className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                   placeholder="https://drive.google.com/..."
                                                />
                                             </div>
                                          </div>
                                          
                                          {(q.auditeeSelfAssessment === 'Non-Compliant' || q.compliance === 'Non-Compliant') && (
                                              <div className="space-y-2 pt-2">
                                                 <label className="text-sm font-medium text-slate-700">Rencana Tindak Lanjut (Action Plan)</label>
                                                 <textarea 
                                                    disabled={!isAuditee}
                                                    rows={2}
                                                    value={q.actionPlan || ''}
                                                    onChange={(e) => handleUpdateQuestion(realIndex, 'actionPlan', e.target.value)}
                                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                                    placeholder="Jelaskan rencana perbaikan..."
                                                 />
                                              </div>
                                          )}
                                       </div>

                                       {/* RIGHT: AUDITOR SECTION */}
                                       <div className={`space-y-4 pl-0 lg:pl-8 lg:border-l border-slate-100 ${!isAuditor && 'opacity-80 pointer-events-none'}`}>
                                          <h4 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                             <UserCheck size={14} /> Auditor Verification
                                          </h4>

                                          <div className="space-y-2">
                                             <label className="text-sm font-medium text-slate-700">Auditor Verdict</label>
                                             <div className="flex gap-2">
                                                {['Compliant', 'Observation', 'Non-Compliant'].map((status) => (
                                                   <button
                                                      key={status}
                                                      onClick={() => isAuditor && handleUpdateQuestion(realIndex, 'compliance', status as any)}
                                                      className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                                                         q.compliance === status 
                                                            ? status === 'Compliant' ? 'bg-green-600 text-white border-green-600 shadow-md ring-2 ring-green-100' :
                                                              status === 'Non-Compliant' ? 'bg-red-600 text-white border-red-600 shadow-md ring-2 ring-red-100' :
                                                              'bg-amber-500 text-white border-amber-500 shadow-md ring-2 ring-amber-100'
                                                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                                                      }`}
                                                   >
                                                      {status}
                                                   </button>
                                                ))}
                                             </div>
                                          </div>

                                          <div className="space-y-2">
                                             <label className="text-sm font-medium text-slate-700">Catatan Auditor</label>
                                             <textarea 
                                                disabled={!isAuditor}
                                                rows={3}
                                                value={q.auditorNotes || ''}
                                                onChange={(e) => handleUpdateQuestion(realIndex, 'auditorNotes', e.target.value)}
                                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-slate-50 focus:bg-white transition-colors"
                                                placeholder="Tuliskan temuan atau observasi..."
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
