
import React, { useState } from 'react';
import { AuditSession, AuditQuestion, AuditStatus, UserRole } from '../types';
import { Save, CheckCircle, AlertCircle, ChevronDown, FileText, Loader2, Calendar, Link as LinkIcon, ExternalLink, Lock, UserCheck, Building2, Scale, Clock } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { useAuth } from '../AuthContext';

interface AuditExecutionProps {
  audit: AuditSession | null;
  onUpdateAudit: (audit: AuditSession) => void;
  onComplete: () => void;
}

const AuditExecution: React.FC<AuditExecutionProps> = ({ audit, onUpdateAudit, onComplete }) => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [urlErrors, setUrlErrors] = useState<Record<string, string>>({});

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

  // --- PERMISSION LOGIC ---
  const role = currentUser?.role;
  const isAdmin = role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
  
  // AUDITOR: Can set Final Verdict & Notes. Can view Claims.
  const isAuditor = role === UserRole.AUDITOR || isAdmin;
  
  // AUDITEE: Can set Claim & Evidence. Cannot set Final Verdict.
  const isAuditee = role === UserRole.AUDITEE || isAdmin; 

  // Specific Field Permissions
  const canEditFinalVerdict = isAuditor;
  const canEditClaim = isAuditee; 

  // Toggle logic for the main row expansion
  const handleToggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
    }
  };

  // Auditor: Set Final Verdict
  const handleComplianceChange = (questionId: string, status: AuditQuestion['compliance']) => {
    // Rule: Auditor cannot fill if Auditee has not filled (unless Admin override might apply, but standard rule is enforced)
    const question = audit.questions.find(q => q.id === questionId);
    const auditeeHasFilled = !!question?.auditeeSelfAssessment;

    if (!canEditFinalVerdict) return;

    // STRICT CHECK: Auditor Block
    if (!auditeeHasFilled && !isAuditee) { // isAuditee check allows Admin who is simulating auditee to potentially bypass, but standard auditor is blocked
       alert("Akses Terkunci: Auditee belum melengkapi Klaim Self-Assessment pada butir ini.");
       return;
    }

    const updatedQuestions = audit.questions.map(q => 
      q.id === questionId ? { ...q, compliance: status } : q
    );
    onUpdateAudit({ ...audit, questions: updatedQuestions });
  };

  // Auditee: Set Self Assessment Claim
  const handleSelfAssessmentChange = (questionId: string, status: AuditQuestion['auditeeSelfAssessment']) => {
    if (!canEditClaim) return;
    const updatedQuestions = audit.questions.map(q => 
      q.id === questionId ? { ...q, auditeeSelfAssessment: status } : q
    );
    onUpdateAudit({ ...audit, questions: updatedQuestions });
  };

  const handleTextChange = (questionId: string, field: keyof AuditQuestion, value: string) => {
    // STRICT CHECK for Auditor Notes
    if (field === 'auditorNotes') {
        const question = audit.questions.find(q => q.id === questionId);
        const auditeeHasFilled = !!question?.auditeeSelfAssessment;
        if (!canEditFinalVerdict || (!auditeeHasFilled && !isAuditee)) {
             // If trying to type in read-only or blocked state
             return; 
        }
    }

    const updatedQuestions = audit.questions.map(q => 
      q.id === questionId ? { ...q, [field]: value } : q
    );
    onUpdateAudit({ ...audit, questions: updatedQuestions });
  };

  const handleEvidenceChange = (questionId: string, value: string) => {
    handleTextChange(questionId, 'evidence', value);
    
    if (!value.trim()) {
      setUrlErrors(prev => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
      return;
    }

    try {
      // Simple protocol check plus basic URL structure
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

  const handleSaveDraft = () => {
    setIsSaving(true);
    onUpdateAudit({ ...audit, status: AuditStatus.IN_PROGRESS });
    setTimeout(() => {
      setIsSaving(false);
    }, 800);
  };

  const handleCompleteAudit = () => {
    if (confirm(t('exec.confirm'))) {
      onUpdateAudit({ ...audit, status: AuditStatus.COMPLETED });
      onComplete();
    }
  };

  // Helper to detect URLs for the "Open Link" button
  const getUrl = (text: string | undefined) => {
    if (!text) return null;
    const match = text.match(/(https?:\/\/[^\s]+)/);
    return match ? match[0] : null;
  };

  // Weighted Progress Calculation
  const totalQuestions = audit.questions.length;
  
  // Progress Logic:
  // If Auditee: Count how many have Evidence OR Self Assessment
  // If Auditor: Count how many have Final Verdict (Compliance)
  const isAuditorMode = currentUser?.role === UserRole.AUDITOR;
  
  const answeredQuestions = audit.questions.filter(q => {
      if (isAuditorMode) return q.compliance !== null;
      return q.auditeeSelfAssessment !== null || (q.evidence && q.evidence.length > 0);
  }).length;
  
  let progress = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto h-[calc(100vh-2rem)] flex flex-col">
      {/* Header Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-6 flex-shrink-0 z-10 relative">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-slate-900">{audit.department}</h2>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100">
                {audit.standard}
              </span>
            </div>
            <p className="text-slate-500 text-sm">ID: {audit.id} • {new Date(audit.date).toLocaleDateString()} • {role}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleSaveDraft}
              disabled={isSaving}
              className={`px-5 py-2.5 rounded-lg font-semibold transition-all flex items-center gap-2 shadow-sm border ${
                isSaving 
                  ? 'bg-blue-50 text-blue-400 border-blue-100 cursor-wait' 
                  : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 hover:shadow-md'
              }`}
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {isSaving ? t('exec.btn.saving') : t('exec.btn.save')}
            </button>

            {/* Only Auditor/Admin can Finalize the audit session */}
            {canEditFinalVerdict && (
              <button 
                onClick={handleCompleteAudit}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-semibold transition-colors flex items-center gap-2 shadow-sm shadow-green-200"
              >
                <CheckCircle size={18} />
                {t('exec.btn.complete')}
              </button>
            )}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-end text-sm">
             <span className="font-medium text-slate-700">
                {isAuditorMode ? 'Progres Verifikasi Auditor' : 'Progres Pengisian Auditee'}
             </span>
             <div className="flex items-baseline gap-2">
               <span className="text-xs text-slate-400 font-medium">
                 {answeredQuestions}/{totalQuestions} items
               </span>
               <span className={`font-bold text-lg transition-colors duration-500 ${progress === 100 ? 'text-green-600' : 'text-blue-600'}`}>
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

      {/* Questions List */}
      <div className="space-y-4 overflow-y-auto flex-1 pb-20 pr-2 scroll-smooth">
        {audit.questions.map((q) => {
          const isExpanded = expandedId === q.id;
          const evidenceLink = getUrl(q.evidence);
          
          // Calculate Status Color
          const isVerified = !!q.compliance;
          const isClaimed = !!q.auditeeSelfAssessment;
          
          // RULE: Auditor cannot act until Auditee has claimed self assessment
          const auditeeHasFilled = !!q.auditeeSelfAssessment;
          const canAuditorAction = canEditFinalVerdict && auditeeHasFilled;
          
          let borderColor = 'border-slate-200';
          if (isVerified) {
              borderColor = q.compliance === 'Compliant' ? 'border-green-500' : 'border-red-500';
          } else if (isClaimed) {
              borderColor = 'border-blue-400'; // Claimed but not verified
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
                          {/* Claim Indicator */}
                          {q.auditeeSelfAssessment ? (
                             <span className="text-[10px] flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 font-medium">
                               <Building2 size={10} /> Claim: {q.auditeeSelfAssessment}
                             </span>
                          ) : (
                             <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                               Belum Ada Klaim
                             </span>
                          )}
                          
                          {/* Verdict Indicator */}
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
                   
                   {/* ------------------------------------------------------- */}
                   {/* AREA AUDITEE (Claim & Evidence) */}
                   {/* ------------------------------------------------------- */}
                   <div className="p-5 bg-slate-50/80 border-t border-slate-100">
                      <div className="flex items-center gap-2 mb-4 text-blue-700 font-bold text-sm uppercase tracking-wider">
                         <Building2 size={16} />
                         Area Auditee: Klaim & Bukti
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {/* 1. SELF ASSESSMENT CLAIM */}
                         <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">Klaim Kepatuhan (Self Assessment)</label>
                            <div className="flex gap-2">
                               {['Compliant', 'Non-Compliant', 'Observation'].map((status) => (
                                 <button
                                   key={status}
                                   onClick={() => handleSelfAssessmentChange(q.id, status as AuditQuestion['auditeeSelfAssessment'])}
                                   disabled={!canEditClaim}
                                   className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                                     q.auditeeSelfAssessment === status 
                                       ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                                       : 'bg-white text-slate-500 border-slate-200 hover:bg-blue-50'
                                   } ${!canEditClaim ? 'opacity-60 cursor-not-allowed' : ''}`}
                                 >
                                   {status}
                                 </button>
                               ))}
                            </div>
                         </div>

                         {/* 2. EVIDENCE URL */}
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
                               disabled={!canEditClaim}
                               placeholder="https://..."
                               className={`w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:bg-slate-100 ${
                                 urlErrors[q.id] ? 'border-red-300 bg-red-50' : 'border-slate-300'
                               }`}
                            />
                         </div>
                      </div>
                   </div>

                   {/* ------------------------------------------------------- */}
                   {/* AREA AUDITOR (Verification) */}
                   {/* ------------------------------------------------------- */}
                   <div className="p-5 bg-white border-t border-slate-200 relative">
                      <div className="flex items-center justify-between mb-4">
                         <div className="flex items-center gap-2 text-slate-800 font-bold text-sm uppercase tracking-wider">
                            <UserCheck size={16} className="text-slate-600" />
                            Area Auditor: Verifikasi & Keputusan
                         </div>
                         {!canAuditorAction && canEditFinalVerdict && (
                            <span className="text-xs text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded flex items-center gap-1 animate-pulse">
                               <Lock size={10}/> Menunggu Auditee
                            </span>
                         )}
                         {!canEditFinalVerdict && !isAuditee && (
                             <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                                 <Lock size={10}/> Read Only
                             </span>
                         )}
                      </div>

                      {/* Blocking Warning if Auditee hasn't filled yet */}
                      {canEditFinalVerdict && !auditeeHasFilled && (
                         <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3 shadow-sm">
                            <AlertCircle size={20} className="text-amber-600 mt-0.5" />
                            <div>
                               <p className="text-sm font-bold text-amber-800">Akses Terkunci</p>
                               <p className="text-xs text-amber-700 mt-1">
                                 Anda tidak dapat memberikan penilaian (verifikasi) atau catatan sebelum Auditee melengkapi Klaim Kepatuhan pada poin ini.
                               </p>
                            </div>
                         </div>
                      )}

                      {/* Verification Comparison Display (Only visible if claim exists) */}
                      {q.auditeeSelfAssessment && (
                         <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-center justify-between animate-fade-in">
                            <span className="text-xs text-blue-700 font-medium">Klaim Auditee: <strong>{q.auditeeSelfAssessment}</strong></span>
                            {canEditFinalVerdict && (
                               <span className="text-[10px] text-blue-500">Silakan verifikasi bukti di atas sebelum memutuskan.</span>
                            )}
                         </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {/* 3. FINAL COMPLIANCE */}
                         <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">Status Kepatuhan Final (Verdict)</label>
                            <div className="flex gap-2">
                               {['Compliant', 'Non-Compliant', 'Observation'].map((status) => (
                                 <button
                                   key={status}
                                   onClick={() => handleComplianceChange(q.id, status as AuditQuestion['compliance'])}
                                   disabled={!canAuditorAction}
                                   className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1 ${
                                     q.compliance === status 
                                       ? status === 'Compliant' ? 'bg-green-600 text-white border-green-700' 
                                       : status === 'Non-Compliant' ? 'bg-red-600 text-white border-red-700'
                                       : 'bg-amber-500 text-white border-amber-600'
                                       : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                                   } ${!canAuditorAction ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                                 >
                                   {!canAuditorAction && <Lock size={10} />}
                                   {status === 'Compliant' ? 'Valid (C)' : status === 'Non-Compliant' ? 'Tidak (NC)' : 'Obs (OB)'}
                                 </button>
                               ))}
                            </div>
                         </div>

                         {/* 4. AUDITOR NOTES */}
                         <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">Catatan Auditor</label>
                            <textarea
                               rows={2}
                               value={q.auditorNotes || ''}
                               onChange={(e) => handleTextChange(q.id, 'auditorNotes', e.target.value)}
                               disabled={!canAuditorAction}
                               placeholder={canAuditorAction ? "Catatan temuan atau rekomendasi..." : "Menunggu Auditee..."}
                               className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                            />
                         </div>
                      </div>
                   </div>
                   
                   {/* 5. FOLLOW UP (Shared) */}
                   {(q.compliance === 'Non-Compliant' || q.compliance === 'Observation') && (
                      <div className="p-5 bg-amber-50/50 border-t border-amber-100">
                         <label className="block text-xs font-bold text-amber-700 mb-2 flex items-center gap-1">
                            <Calendar size={14}/> Rencana Tindak Lanjut (Action Plan)
                         </label>
                         <textarea
                           rows={2}
                           value={q.actionPlan || ''}
                           onChange={(e) => handleTextChange(q.id, 'actionPlan', e.target.value)}
                           disabled={!isAuditee} // Usually Auditee proposes plan
                           placeholder="Jelaskan rencana perbaikan (Diisi oleh Auditee)..."
                           className="w-full px-3 py-2 rounded-lg border border-amber-200 text-sm focus:ring-2 focus:ring-amber-500 outline-none disabled:bg-slate-50"
                         />
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
