
import { useState, FC } from 'react';
import { AuditSession, AuditQuestion, AuditStatus, UserRole } from '../types';
import { 
  Save, CheckCircle, AlertCircle, Link as LinkIcon, 
  ChevronDown, ChevronUp, Search, Filter, FileText, 
  ExternalLink, Loader2, Building2, UserCheck, List 
} from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { useAuth } from '../AuthContext';

interface AuditExecutionProps {
  audit: AuditSession | null;
  onUpdateAudit: (audit: AuditSession) => void;
  onComplete: () => void;
}

const AuditExecution: FC<AuditExecutionProps> = ({ audit, onUpdateAudit, onComplete }) => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<'ALL' | 'UNFILLED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!audit || !currentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <AlertCircle size={48} className="mb-4 opacity-50" />
        <p>{t('exec.selectMsg')}</p>
      </div>
    );
  }

  // Permissions Logic
  const isAuditee = currentUser.role === UserRole.AUDITEE || currentUser.role === UserRole.DEPT_HEAD;
  const isAuditor = currentUser.role === UserRole.AUDITOR || currentUser.role === UserRole.AUDITOR_LEAD || currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.ADMIN;
  
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
    } else if (currentUser.role === UserRole.DEPT_HEAD && audit.status === AuditStatus.REVIEW_DEPT_HEAD) {
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
                    currentUser.role === UserRole.DEPT_HEAD && audit.status === AuditStatus.REVIEW_DEPT_HEAD ? 'Approve' :
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
                        
                        // Item Index Display (1-based from entire list, or relative? Using flattened index here for consistency if needed, but grouping makes it tricky. Let's use ID as reference)
                        
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
                                                   <a href={q.evidence} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
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
