
import { useState, useEffect, FC } from 'react';
import { AuditSession, AuditQuestion, AuditStatus, UserRole } from '../types';
import { Save, CheckCircle, AlertCircle, ChevronDown, FileText, Loader2, Calendar, Link as LinkIcon, ExternalLink, Lock, UserCheck, Building2, Scale, Clock, Cloud, Send, ShieldAlert } from 'lucide-react';
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
  
  // Local State for buffering edits
  const [localQuestions, setLocalQuestions] = useState<AuditQuestion[]>([]);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [urlErrors, setUrlErrors] = useState<Record<string, string>>({});

  // --- AUTO-LOAD & INIT LOGIC ---
  useEffect(() => {
    if (audit) {
      const key = `sami_autosave_${audit.id}`;
      const savedData = localStorage.getItem(key);
      
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setLocalQuestions(parsed);
        } catch (e) {
          console.error("Failed to load autosave", e);
          setLocalQuestions(audit.questions);
        }
      } else {
        setLocalQuestions(audit.questions);
      }
    }
  }, [audit?.id]);

  // --- AUTO-SAVE LOGIC (Every 60s) ---
  useEffect(() => {
    if (!audit) return;

    // Don't autosave if completed
    if (audit.status === AuditStatus.COMPLETED) return;

    const autoSaveInterval = setInterval(() => {
      if (localQuestions.length > 0) {
        const key = `sami_autosave_${audit.id}`;
        
        // 1. Save to LocalStorage (Backup)
        localStorage.setItem(key, JSON.stringify(localQuestions));
        
        // 2. Sync to Parent/App State (Main Persistence)
        // Preserve current status during autosave
        onUpdateAudit({ ...audit, questions: localQuestions });
        
        setLastAutoSave(new Date());
      }
    }, 60000); // 60 Seconds

    return () => clearInterval(autoSaveInterval);
  }, [localQuestions, audit, onUpdateAudit]);

  if (!audit) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <AlertCircle size={40} />
        </div>
        <h3 className="text-xl font-semibold text-slate-700 mb-2">{t('exec.noAudit')}</h3>
        <p>{t('exec.selectMsg')}</p>
      </div>
    );
  }

  // --- PERMISSION & LOGIC FLOW ---
  const role = currentUser?.role;
  const isAdmin = role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
  
  const isAuditor = role === UserRole.AUDITOR || role === UserRole.AUDITOR_LEAD || isAdmin;
  const isAuditee = role === UserRole.AUDITEE || role === UserRole.DEPT_HEAD || isAdmin; 
  
  const auditStatus = audit.status;

  // --- ACCESS RULES ---
  
  // Auditee can edit if status is IN_PROGRESS
  const canAuditeeEdit = isAuditee && auditStatus === AuditStatus.IN_PROGRESS;
  
  // Auditor can edit verdict if IN_PROGRESS or SUBMITTED (but can only Finalize if SUBMITTED)
  const canAuditorEdit = isAuditor && (auditStatus === AuditStatus.IN_PROGRESS || auditStatus === AuditStatus.SUBMITTED);

  const handleToggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
    }
  };

  // Auditor: Set Final Verdict
  const handleComplianceChange = (questionId: string, status: AuditQuestion['compliance']) => {
    if (!canAuditorEdit) return;
    setLocalQuestions(prev => prev.map(q => 
      q.id === questionId ? { ...q, compliance: status } : q
    ));
  };

  // Auditee: Set Self Assessment Claim
  const handleSelfAssessmentChange = (questionId: string, status: AuditQuestion['auditeeSelfAssessment']) => {
    if (!canAuditeeEdit) return;
    setLocalQuestions(prev => prev.map(q => 
      q.id === questionId ? { ...q, auditeeSelfAssessment: status } : q
    ));
  };

  const handleTextChange = (questionId: string, field: keyof AuditQuestion, value: string) => {
    if (field === 'auditorNotes' && !canAuditorEdit) return;
    if (field === 'actionPlan' && !canAuditeeEdit) return;
    
    setLocalQuestions(prev => prev.map(q => 
      q.id === questionId ? { ...q, [field]: value } : q
    ));
  };

  const handleEvidenceChange = (questionId: string, value: string) => {
    if (!canAuditeeEdit) return;

    setLocalQuestions(prev => prev.map(q => 
        q.id === questionId ? { ...q, evidence: value } : q
    ));
    
    if (!value.trim()) {
      setUrlErrors(prev => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
      return;
    }

    try {
      if (!/^https?:\/\//i.test(value)) {
         throw new Error("Missing protocol");
      }
      new URL(value);
      setUrlErrors(prev => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
    } catch (_) {
      setUrlErrors(prev => ({
        ...prev,
        [questionId]: t('exec.error.url')
      }));
    }
  };

  // Manual Save Draft
  const handleSaveDraft = () => {
    setIsSaving(true);
    const key = `sami_autosave_${audit.id}`;
    localStorage.setItem(key, JSON.stringify(localQuestions));
    onUpdateAudit({ ...audit, questions: localQuestions }); // Keep existing status
    setLastAutoSave(new Date());
    
    setTimeout(() => {
      setIsSaving(false);
    }, 800);
  };

  // --- ACTION BUTTONS HANDLERS ---

  // 1. AUDITEE SUBMIT
  const handleAuditeeSubmit = () => {
    const incomplete = localQuestions.filter(q => !q.auditeeSelfAssessment || !q.evidence);
    if (incomplete.length > 0) {
        if (!confirm(`Masih ada ${incomplete.length} butir yang belum lengkap klaim/buktinya. Yakin ingin menyerahkan ke Auditor?`)) {
            return;
        }
    } else {
        if (!confirm("Apakah Anda yakin ingin menyelesaikan pengisian? Data akan dikunci dan diserahkan ke Auditor.")) {
            return;
        }
    }

    onUpdateAudit({ ...audit, questions: localQuestions, status: AuditStatus.SUBMITTED });
    alert("✅ Audit berhasil diserahkan ke Auditor untuk verifikasi.");
  };

  // 2. AUDITOR FINALIZE
  const handleAuditorComplete = () => {
    if (audit.status !== AuditStatus.SUBMITTED) {
        alert("Anda belum bisa menyelesaikan audit ini karena Auditee belum melakukan Submit.");
        return;
    }

    if (confirm("Finalisasi Audit? Status akan menjadi COMPLETED dan laporan akan diterbitkan.")) {
      onUpdateAudit({ ...audit, questions: localQuestions, status: AuditStatus.COMPLETED });
      onComplete();
    }
  };

  // Helper to detect URLs
  const getUrl = (text: string | undefined) => {
    if (!text) return null;
    const match = text.match(/(https?:\/\/[^\s]+)/);
    return match ? match[0] : null;
  };

  // Weighted Progress Calculation
  const totalQuestions = localQuestions.length;
  const progressMode = (isAuditee && !isAuditor) ? 'AUDITEE' : 'AUDITOR';
  
  const answeredQuestions = localQuestions.filter(q => {
      if (progressMode === 'AUDITOR') {
        return q.compliance !== null;
      }
      return q.auditeeSelfAssessment !== null || (q.evidence && q.evidence.trim().length > 0);
  }).length;
  
  let progress = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

  // Date Helper for Deadlines
  const getDeadlineText = (dateString?: string) => {
     if (!dateString) return null;
     const deadline = new Date(dateString);
     const today = new Date();
     const diffTime = deadline.getTime() - today.getTime();
     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

     if (diffDays < 0) return { text: 'Overdue', color: 'text-red-600', bg: 'bg-red-50' };
     if (diffDays <= 3) return { text: `${diffDays} Hari Lagi`, color: 'text-amber-600', bg: 'bg-amber-50' };
     return { text: `${diffDays} Hari Lagi`, color: 'text-blue-600', bg: 'bg-blue-50' };
  };

  const auditeeDL = getDeadlineText(audit.auditeeDeadline);
  const auditorDL = getDeadlineText(audit.auditorDeadline);

  return (
    <div className="p-6 max-w-5xl mx-auto h-full flex flex-col">
      {/* Header Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-6 flex-shrink-0 z-10 relative">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-slate-900">{audit.department}</h2>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100">
                {audit.standard}
              </span>
            </div>
            <div className="text-slate-500 text-xs flex items-center gap-4">
                <span>ID: {audit.id}</span>
                <span>•</span>
                <span className={`font-bold px-2 py-0.5 rounded ${
                    audit.status === AuditStatus.IN_PROGRESS ? 'bg-amber-100 text-amber-700' :
                    audit.status === AuditStatus.SUBMITTED ? 'bg-purple-100 text-purple-700' :
                    audit.status === AuditStatus.COMPLETED ? 'bg-green-100 text-green-700' : 'bg-slate-100'
                }`}>
                    Status: {audit.status}
                </span>
            </div>
            
            {/* DEADLINE BADGES */}
            <div className="mt-3 flex items-center gap-3">
               {audit.auditeeDeadline && (
                 <div className={`flex items-center gap-2 px-3 py-1.5 rounded border ${auditeeDL?.bg} ${auditeeDL?.color} border-current/10`}>
                    <Building2 size={14} />
                    <div className="text-xs">
                       <span className="font-semibold">Batas Auditee:</span> {new Date(audit.auditeeDeadline).toLocaleDateString()} ({auditeeDL?.text})
                    </div>
                 </div>
               )}
               {audit.auditorDeadline && (
                 <div className={`flex items-center gap-2 px-3 py-1.5 rounded border ${auditorDL?.bg} ${auditorDL?.color} border-current/10`}>
                    <UserCheck size={14} />
                    <div className="text-xs">
                       <span className="font-semibold">Batas Auditor:</span> {new Date(audit.auditorDeadline).toLocaleDateString()} ({auditorDL?.text})
                    </div>
                 </div>
               )}
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-3">
              {/* Auto-save Indicator */}
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mr-2">
                 <Cloud size={14} className={lastAutoSave ? "text-green-500" : "text-slate-300"} />
                 {lastAutoSave 
                    ? `Saved ${lastAutoSave.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` 
                    : 'Auto-save on'}
              </div>

              {/* Common Save Draft Button (Available to ALL if not completed) */}
              {audit.status !== AuditStatus.COMPLETED && (
                  <button 
                    onClick={handleSaveDraft}
                    disabled={isSaving}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 shadow-sm border ${
                      isSaving 
                        ? 'bg-blue-50 text-blue-400 border-blue-100 cursor-wait' 
                        : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 hover:shadow-md'
                    }`}
                  >
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {t('exec.btn.save')}
                  </button>
              )}

              {/* AUDITEE SUBMIT BUTTON */}
              {isAuditee && audit.status === AuditStatus.IN_PROGRESS && (
                  <button 
                    onClick={handleAuditeeSubmit}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 shadow-sm shadow-blue-200"
                  >
                    <Send size={18} />
                    Selesai & Kirim
                  </button>
              )}

              {/* AUDITOR FINALIZE BUTTON */}
              {isAuditor && audit.status !== AuditStatus.COMPLETED && (
                <button 
                  onClick={handleAuditorComplete}
                  disabled={audit.status !== AuditStatus.SUBMITTED}
                  className={`px-5 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 shadow-sm border ${
                      audit.status === AuditStatus.SUBMITTED
                      ? 'bg-green-600 hover:bg-green-700 text-white border-green-600 shadow-green-200 cursor-pointer'
                      : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  }`}
                  title={audit.status !== AuditStatus.SUBMITTED ? "Menunggu Auditee menyelesaikan pengisian (Submit)." : "Finalisasi Audit"}
                >
                  {audit.status !== AuditStatus.SUBMITTED ? <Lock size={18} /> : <CheckCircle size={18} />}
                  {t('exec.btn.complete')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* STATUS BANNER FOR AUDITOR */}
        {isAuditor && audit.status === AuditStatus.IN_PROGRESS && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-center gap-3 text-sm text-amber-800">
                <Clock size={20} className="text-amber-600" />
                <span><strong>Menunggu Auditee:</strong> Auditee sedang melengkapi data. Anda dapat menyimpan draft, tetapi tombol "Selesai Audit" hanya akan aktif setelah Auditee melakukan Submit.</span>
            </div>
        )}

        {/* STATUS BANNER FOR AUDITEE */}
        {isAuditee && audit.status === AuditStatus.SUBMITTED && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4 flex items-center gap-3 text-sm text-purple-800">
                <ShieldAlert size={20} className="text-purple-600" />
                <span><strong>Audit Diserahkan:</strong> Data telah dikunci dan sedang dalam proses verifikasi oleh Auditor. Anda tidak dapat mengubah data saat ini.</span>
            </div>
        )}
        
        {/* Progress Bar */}
        <div className="space-y-2 mt-4">
          <div className="flex justify-between items-end text-sm">
             <span className="font-medium text-slate-700">
                {progressMode === 'AUDITOR' ? 'Progres Verifikasi Auditor' : 'Progres Pengisian Auditee'}
             </span>
             <div className="flex items-baseline gap-2">
               <span className="text-xs text-slate-400 font-medium">
                 {answeredQuestions}/{totalQuestions} items
               </span>
               <span className={`font-bold text-lg transition-all duration-300 ${progress === 100 ? 'text-green-600' : 'text-blue-600'}`}>
                 {progress}%
               </span>
             </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ease-out relative ${
                progress === 100 ? 'bg-green-500' : 'bg-blue-600'
              }`} 
              style={{ width: `${progress}%` }}
            >
               <div className="absolute inset-0 bg-white/20 w-full h-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Questions List using localQuestions */}
      <div className="space-y-4 overflow-y-auto flex-1 pb-20 pr-2 scroll-smooth">
        {localQuestions.map((q) => {
          const isExpanded = expandedId === q.id;
          const evidenceLink = getUrl(q.evidence);
          
          const isVerified = !!q.compliance;
          const isClaimed = !!q.auditeeSelfAssessment;
          
          let borderColor = 'border-slate-200';
          if (isVerified) {
              borderColor = q.compliance === 'Compliant' ? 'border-green-500' : 'border-red-500';
          } else if (isClaimed) {
              borderColor = 'border-blue-400';
          }

          return (
            <div key={q.id} className={`bg-white rounded-xl border transition-all duration-200 ${borderColor} ${isVerified || isClaimed ? 'border-l-4' : 'border-l-4 shadow-sm'}`}>
              <div 
                className="p-5 cursor-pointer hover:bg-slate-50/50 transition-colors"
                onClick={() => handleToggleExpand(q.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {q.id}
                      </span>
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {q.category}
                      </span>
                    </div>
                    <h4 className="text-slate-800 font-medium leading-relaxed">{q.questionText}</h4>
                    
                    {/* Mini Status Indicators */}
                    {!isExpanded && (
                       <div className="mt-3 flex gap-2">
                          {q.auditeeSelfAssessment ? (
                             <span className="text-[10px] flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 font-medium">
                               <Building2 size={10} /> Claim: {q.auditeeSelfAssessment}
                             </span>
                          ) : (
                             <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                               Belum Ada Klaim
                             </span>
                          )}
                          
                          {q.compliance && (
                             <span className={`text-[10px] flex items-center gap-1 px-2 py-0.5 rounded border font-bold ${
                                q.compliance === 'Compliant' ? 'bg-green-50 text-green-700 border-green-100' : 
                                q.compliance === 'Non-Compliant' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                             }`}>
                               <UserCheck size={10} /> Final: {q.compliance}
                             </span>
                          )}
                       </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                     <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''} text-slate-400`}>
                        <ChevronDown size={20} />
                     </div>
                  </div>
                </div>
              </div>

              {/* Detailed Form */}
              {isExpanded && (
                <div className="animate-fade-in">
                   
                   {/* AREA AUDITEE */}
                   <div className={`p-5 border-t border-slate-100 ${canAuditeeEdit ? 'bg-slate-50/80' : 'bg-slate-100/50 opacity-90'}`}>
                      <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2 text-blue-700 font-bold text-sm uppercase tracking-wider">
                             <Building2 size={16} />
                             Area Auditee: Klaim & Bukti
                          </div>
                          {!canAuditeeEdit && (
                              <span className="text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded flex items-center gap-1">
                                  <Lock size={10} /> Locked
                              </span>
                          )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {/* 1. SELF ASSESSMENT */}
                         <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">Klaim Kepatuhan (Self Assessment)</label>
                            <div className="flex gap-2">
                               {['Compliant', 'Non-Compliant', 'Observation'].map((status) => (
                                 <button
                                   key={status}
                                   onClick={() => handleSelfAssessmentChange(q.id, status as AuditQuestion['auditeeSelfAssessment'])}
                                   disabled={!canAuditeeEdit}
                                   className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                                     q.auditeeSelfAssessment === status 
                                       ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                                       : 'bg-white text-slate-500 border-slate-200 hover:bg-blue-50'
                                   } ${!canAuditeeEdit ? 'cursor-not-allowed opacity-70' : ''}`}
                                 >
                                   {status}
                                 </button>
                               ))}
                            </div>
                         </div>

                         {/* 2. EVIDENCE */}
                         <div className="space-y-2">
                            <div className="flex justify-between items-center">
                               <label className="block text-xs font-bold text-slate-500">Tautan Bukti (URL)</label>
                               {evidenceLink && (
                                 <a href={evidenceLink} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 text-blue-600 hover:underline">
                                   Buka Tautan <ExternalLink size={10} />
                                 </a>
                               )}
                            </div>
                            <input
                               type="text"
                               value={q.evidence || ''}
                               onChange={(e) => handleEvidenceChange(q.id, e.target.value)}
                               disabled={!canAuditeeEdit}
                               placeholder="https://..."
                               className={`w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:bg-slate-200 ${
                                 urlErrors[q.id] ? 'border-red-300 bg-red-50' : 'border-slate-300'
                               }`}
                            />
                         </div>
                      </div>
                   </div>

                   {/* AREA AUDITOR */}
                   <div className={`p-5 border-t border-slate-200 relative ${canAuditorEdit ? 'bg-white' : 'bg-slate-50'}`}>
                      <div className="flex items-center justify-between mb-4">
                         <div className="flex items-center gap-2 text-slate-800 font-bold text-sm uppercase tracking-wider">
                            <UserCheck size={16} className="text-slate-600" />
                            Area Auditor: Verifikasi & Keputusan
                         </div>
                         {!canAuditorEdit && (
                             <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                                 <Lock size={10}/> Read Only
                             </span>
                         )}
                      </div>

                      {q.auditeeSelfAssessment && (
                         <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-center justify-between animate-fade-in">
                            <span className="text-xs text-blue-700 font-medium">Klaim Auditee: <strong>{q.auditeeSelfAssessment}</strong></span>
                            {canAuditorEdit && (
                               <span className="text-[10px] text-blue-500">Silakan verifikasi bukti di atas sebelum memutuskan.</span>
                            )}
                         </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {/* 3. VERDICT */}
                         <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">Status Kepatuhan Final (Verdict)</label>
                            <div className="flex gap-2">
                               {['Compliant', 'Non-Compliant', 'Observation'].map((status) => (
                                 <button
                                   key={status}
                                   onClick={() => handleComplianceChange(q.id, status as AuditQuestion['compliance'])}
                                   disabled={!canAuditorEdit}
                                   className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1 ${
                                     q.compliance === status 
                                       ? status === 'Compliant' ? 'bg-green-600 text-white border-green-700' 
                                       : status === 'Non-Compliant' ? 'bg-red-600 text-white border-red-700'
                                       : 'bg-amber-500 text-white border-amber-600'
                                       : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                                   } ${!canAuditorEdit ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                                 >
                                   {!canAuditorEdit && <Lock size={10} />}
                                   {status === 'Compliant' ? 'Valid (C)' : status === 'Non-Compliant' ? 'Tidak (NC)' : 'Obs (OB)'}
                                 </button>
                               ))}
                            </div>
                         </div>

                         {/* 4. NOTES */}
                         <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2 flex items-center gap-2">
                               <FileText size={14} /> Catatan Auditor
                            </label>
                            <textarea
                               rows={5}
                               value={q.auditorNotes || ''}
                               onChange={(e) => handleTextChange(q.id, 'auditorNotes', e.target.value)}
                               disabled={!canAuditorEdit}
                               placeholder={canAuditorEdit ? "Tuliskan detail temuan, observasi, atau rekomendasi perbaikan di sini..." : "Read Only"}
                               className="w-full px-4 py-3 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-500 shadow-sm transition-all resize-y placeholder:text-slate-400"
                            />
                         </div>
                      </div>
                   </div>
                   
                   {/* 5. FOLLOW UP */}
                   {(q.compliance === 'Non-Compliant' || q.compliance === 'Observation') && (
                      <div className="p-5 bg-amber-50/50 border-t border-amber-100 animate-fade-in">
                         <div className="flex items-center gap-2 text-amber-800 font-bold text-sm uppercase tracking-wider mb-4">
                            <Calendar size={16}/> 
                            Rencana Tindak Lanjut (Action Plan)
                         </div>
                         
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             <div className="md:col-span-2">
                                 <label className="block text-xs font-bold text-slate-500 mb-2">Deskripsi Rencana Perbaikan</label>
                                 <textarea
                                   rows={3}
                                   value={q.actionPlan || ''}
                                   onChange={(e) => handleTextChange(q.id, 'actionPlan', e.target.value)}
                                   disabled={!canAuditeeEdit} 
                                   placeholder="Jelaskan langkah konkret perbaikan yang akan dilakukan..."
                                   className="w-full px-4 py-2 rounded-lg border border-amber-200 text-sm focus:ring-2 focus:ring-amber-500 outline-none disabled:bg-slate-50 transition-all shadow-sm placeholder:text-slate-400 bg-white"
                                 />
                             </div>
                             <div>
                                 <label className="block text-xs font-bold text-slate-500 mb-2">Target Penyelesaian (Deadline)</label>
                                 <input
                                   type="date"
                                   value={q.actionPlanDeadline || ''}
                                   onChange={(e) => handleTextChange(q.id, 'actionPlanDeadline', e.target.value)}
                                   disabled={!canAuditeeEdit}
                                   className="w-full px-4 py-2 rounded-lg border border-amber-200 text-sm focus:ring-2 focus:ring-amber-500 outline-none disabled:bg-slate-50 transition-all shadow-sm bg-white text-slate-700"
                                 />
                             </div>
                         </div>
                         {canAuditeeEdit && (
                            <p className="text-[10px] text-amber-600 mt-3 italic flex items-center gap-1">
                               <AlertCircle size={10} />
                               Wajib diisi oleh Auditee sebagai komitmen perbaikan atas temuan audit.
                            </p>
                         )}
                      </div>
                   )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AuditExecution;
