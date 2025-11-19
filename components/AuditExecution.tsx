import React, { useState } from 'react';
import { AuditSession, AuditQuestion, AuditStatus, UserRole } from '../types';
import { Save, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp, FileText, Loader2, Lock, Calendar, Maximize2, Minimize2 } from 'lucide-react';
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
  const [showDetails, setShowDetails] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  const isAuditee = currentUser?.role === UserRole.AUDITEE;
  const isAuditor = currentUser?.role === UserRole.AUDITOR;
  const isAdmin = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.SUPER_ADMIN;

  const canEditCompliance = !isAuditee; 
  const canEditNotes = !isAuditee;
  const canEditEvidence = true; 
  const canEditActionPlan = true;

  // Toggle logic for the main row expansion
  const handleToggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      setShowDetails(false); // Reset details view when opening new item
    }
  };

  // Toggle logic for the specific details button
  const handleToggleDetails = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (expandedId === id) {
      setShowDetails(!showDetails);
    } else {
      setExpandedId(id);
      setShowDetails(true);
    }
  };

  const handleComplianceChange = (questionId: string, status: AuditQuestion['compliance']) => {
    if (!canEditCompliance) return;
    const updatedQuestions = audit.questions.map(q => 
      q.id === questionId ? { ...q, compliance: status } : q
    );
    onUpdateAudit({ ...audit, questions: updatedQuestions });
  };

  const handleTextChange = (questionId: string, field: keyof AuditQuestion, value: string) => {
    const updatedQuestions = audit.questions.map(q => 
      q.id === questionId ? { ...q, [field]: value } : q
    );
    onUpdateAudit({ ...audit, questions: updatedQuestions });
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

  // Weighted Progress Calculation
  const totalQuestions = audit.questions.length;
  const answeredQuestions = audit.questions.filter(q => q.compliance !== null).length;
  
  const currentScore = audit.questions.reduce((acc, q) => {
    // Compliance gives 1.0 point
    if (q.compliance) return acc + 1;
    
    // Evidence or Notes gives 0.5 point (Work in Progress)
    const hasContent = (q.evidence && q.evidence.trim().length > 0) || (q.auditorNotes && q.auditorNotes.trim().length > 0);
    return acc + (hasContent ? 0.5 : 0);
  }, 0);

  let progress = totalQuestions > 0 ? Math.round((currentScore / totalQuestions) * 100) : 0;
  // Cap at 99% if not fully compliant-checked
  if (progress === 100 && answeredQuestions < totalQuestions) {
    progress = 99;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto h-[calc(100vh-2rem)] flex flex-col">
      {/* Header Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-6 flex-shrink-0">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-slate-900">{audit.department}</h2>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100">
                {audit.standard}
              </span>
            </div>
            <p className="text-slate-500 text-sm">ID: {audit.id} • {new Date(audit.date).toLocaleDateString()} • {currentUser?.role} View</p>
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

            {canEditCompliance && (
              <button 
                onClick={handleCompleteAudit}
                disabled={progress < 100}
                className="bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:text-slate-500 text-white px-6 py-2.5 rounded-lg font-semibold transition-colors flex items-center gap-2 shadow-sm shadow-green-200"
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
             <span className="font-medium text-slate-700">{t('exec.progress')}</span>
             <div className="flex items-baseline gap-2">
               <span className="text-xs text-slate-400 font-medium">
                 {answeredQuestions}/{totalQuestions} {t('exec.answered')}
               </span>
               <span className={`font-bold text-lg ${progress === 100 ? 'text-green-600' : 'text-blue-600'}`}>
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
          const hasDetails = !!((q.evidence && q.evidence.trim()) || (q.auditorNotes && q.auditorNotes.trim()) || (q.actionPlan && q.actionPlan.trim()));
          const isExpanded = expandedId === q.id;
          const areDetailsVisible = isExpanded && showDetails;

          return (
            <div key={q.id} className={`bg-white rounded-xl border transition-all duration-200 ${q.compliance ? 'border-l-4 border-l-green-500 border-y-slate-100 border-r-slate-100' : 'border-l-4 border-l-slate-300 border-slate-200 shadow-sm'}`}>
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
                    
                    {/* Mini Preview (Only when collapsed or details hidden) */}
                    {!areDetailsVisible && hasDetails && (
                      <div className="mt-3 flex gap-2 flex-wrap animate-fade-in">
                        {q.evidence && <span className="text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2 py-1 rounded flex items-center gap-1"><FileText size={12} className="text-blue-400"/> Evidence Added</span>}
                        {q.auditorNotes && <span className="text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2 py-1 rounded flex items-center gap-1"><FileText size={12} className="text-amber-400"/> Note Added</span>}
                        {q.actionPlan && <span className="text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2 py-1 rounded flex items-center gap-1"><Calendar size={12} className="text-purple-400"/> Plan Active</span>}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                     {/* Toggle Button for Details */}
                     <button
                       onClick={(e) => handleToggleDetails(e, q.id)}
                       className={`p-2 rounded-full transition-all border ${
                          areDetailsVisible
                            ? 'bg-blue-100 text-blue-700 border-blue-200 shadow-inner' 
                            : hasDetails 
                              ? 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50 shadow-sm' 
                              : 'bg-transparent text-slate-300 border-transparent hover:bg-slate-100 hover:text-slate-500'
                       }`}
                       title={areDetailsVisible ? "Hide Evidence & Notes" : "Show Evidence & Notes"}
                     >
                        <FileText size={18} />
                     </button>

                     {/* Compliance Status Badge */}
                     {q.compliance ? (
                       <span className={`px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${
                          q.compliance === 'Compliant' ? 'bg-green-50 text-green-700 border-green-200' :
                          q.compliance === 'Non-Compliant' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                       }`}>
                         {q.compliance === 'Compliant' ? 'Compliant' : q.compliance === 'Non-Compliant' ? 'Non-Comp' : 'Observ.'}
                       </span>
                     ) : (
                       <span className="text-xs text-slate-400 font-medium italic px-2">{t('exec.notFilled')}</span>
                     )}

                     {/* Chevron */}
                     <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown size={20} className="text-slate-400" />
                     </div>
                  </div>
                </div>
              </div>

              {/* Expanded Section */}
              {isExpanded && (
                <div className="animate-slide-down">
                  {/* Compliance Buttons Section */}
                  <div className="px-6 pb-4 pt-2 border-t border-slate-50 bg-slate-50/50">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 relative">
                        {!canEditCompliance && (
                          <div className="absolute inset-0 bg-slate-100/60 z-10 flex items-center justify-center backdrop-blur-[1px] rounded-lg cursor-not-allowed">
                            <div className="bg-white px-3 py-1.5 rounded-full shadow-sm flex items-center gap-2 text-xs font-medium text-slate-500 border border-slate-200">
                              <Lock size={12} /> Read Only
                            </div>
                          </div>
                        )}
                        
                        {(['Compliant', 'Observation', 'Non-Compliant'] as const).map((status) => (
                          <button
                            key={status}
                            onClick={() => handleComplianceChange(q.id, status)}
                            className={`p-3 rounded-lg border flex items-center justify-center gap-2 transition-all ${
                              q.compliance === status 
                                ? status === 'Compliant' ? 'bg-green-50 border-green-500 text-green-700 shadow-sm ring-1 ring-green-500' :
                                  status === 'Non-Compliant' ? 'bg-red-50 border-red-500 text-red-700 shadow-sm ring-1 ring-red-500' :
                                  'bg-amber-50 border-amber-500 text-amber-700 shadow-sm ring-1 ring-amber-500'
                                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-500 hover:bg-white'
                            }`}
                          >
                            {status === 'Compliant' && <CheckCircle size={18} />}
                            {status === 'Non-Compliant' && <XCircle size={18} />}
                            {status === 'Observation' && <AlertCircle size={18} />}
                            <span className="text-sm font-medium">{status}</span>
                          </button>
                        ))}
                     </div>

                     {/* Toggle Details Button (Centered) */}
                     <div className="flex justify-center">
                       <button
                         onClick={() => setShowDetails(!showDetails)}
                         className="group flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors bg-white border border-slate-200 hover:border-blue-200 px-4 py-1.5 rounded-full shadow-sm"
                       >
                         {showDetails ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                         {showDetails ? t('exec.toggle.hide') : t('exec.toggle.show')}
                       </button>
                     </div>
                  </div>

                  {/* Details Section (Evidence & Notes) */}
                  {showDetails && (
                    <div className="px-6 pb-6 pt-2 bg-white border-t border-slate-100 animate-fade-in">
                      <div className="grid grid-cols-1 gap-6">
                        {/* Evidence */}
                        <div className={!canEditEvidence ? "opacity-60 pointer-events-none grayscale" : ""}>
                          <div className="flex justify-between items-center mb-2">
                             <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                               <FileText size={14} className="text-blue-500"/>
                               {t('exec.label.evidence')}
                               {isAuditee && <span className="text-red-500 text-[10px] ml-1 bg-red-50 px-1 rounded">REQUIRED</span>}
                             </label>
                          </div>
                          <textarea
                            value={q.evidence || ''}
                            onChange={(e) => handleTextChange(q.id, 'evidence', e.target.value)}
                            placeholder={t('exec.ph.evidence')}
                            className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all min-h-[80px]"
                          />
                        </div>

                        {/* Auditor Notes */}
                        <div className={!canEditNotes ? "opacity-70" : ""}>
                          <div className="flex justify-between items-center mb-2">
                             <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                               <FileText size={14} className="text-amber-500"/>
                               {t('exec.label.notes')}
                               {!canEditNotes && <Lock size={12} className="text-slate-400"/>}
                             </label>
                          </div>
                          <textarea
                            value={q.auditorNotes || ''}
                            onChange={(e) => handleTextChange(q.id, 'auditorNotes', e.target.value)}
                            disabled={!canEditNotes}
                            placeholder={t('exec.ph.notes')}
                            className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all min-h-[80px] disabled:cursor-not-allowed"
                          />
                        </div>

                        {/* Action Plan Section */}
                        {(q.compliance === 'Non-Compliant' || q.compliance === 'Observation' || isAuditee || q.actionPlan) && (
                           <div className="bg-amber-50 rounded-xl p-5 border border-amber-100">
                              <h5 className="font-bold text-amber-900 mb-4 flex items-center gap-2 text-sm">
                                 <Calendar size={16} /> Rencana Tindak Lanjut (Action Plan)
                              </h5>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                 <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-amber-800/70 mb-1">Tindakan Perbaikan</label>
                                    <textarea
                                      value={q.actionPlan || ''}
                                      onChange={(e) => handleTextChange(q.id, 'actionPlan', e.target.value)}
                                      placeholder="Deskripsikan langkah perbaikan..."
                                      className="w-full p-2.5 rounded-lg border border-amber-200 bg-white focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm h-24"
                                    />
                                 </div>
                                 <div>
                                    <label className="block text-xs font-semibold text-amber-800/70 mb-1">Target Penyelesaian</label>
                                    <input 
                                      type="date" 
                                      value={q.actionPlanDeadline || ''}
                                      onChange={(e) => handleTextChange(q.id, 'actionPlanDeadline', e.target.value)}
                                      className="w-full p-2.5 rounded-lg border border-amber-200 bg-white focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm"
                                    />
                                 </div>
                              </div>
                           </div>
                        )}
                      </div>
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