
import { useState, useEffect, FC, FormEvent } from 'react';
import { AuditStandard, AuditSession, AuditStatus, AuditQuestion, UserRole } from '../types';
import { generateChecklist } from '../services/geminiService';
import { Sparkles, Loader2, ArrowRight, Plus, Trash2, Edit3, Save, ArrowLeft, GripVertical, AlertTriangle, Database, Bot, Filter, User, Lock, UserX, Send, CheckCircle2, FileText, CalendarClock } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { useAuth } from '../AuthContext';
import { useMasterData } from '../MasterDataContext';
import { useSettings } from '../SettingsContext';

interface NewAuditFormProps {
  onAuditCreated: (audit: AuditSession) => void;
  onCancel: () => void;
}

const NewAuditForm: FC<NewAuditFormProps> = ({ onAuditCreated, onCancel }) => {
  const { t } = useLanguage();
  const { currentUser, users } = useAuth();
  const { units, questions: masterQuestions } = useMasterData(); 
  const { settings } = useSettings();
  
  // Form State
  const [step, setStep] = useState<1 | 2>(1);
  const [department, setDepartment] = useState('');
  const [standard, setStandard] = useState<AuditStandard>(settings.defaultStandard || AuditStandard.PERMENDIKTISAINTEK_2025);
  const [assignedAuditorId, setAssignedAuditorId] = useState(''); 
  
  // Drafting State
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // State for submission process
  const [draftQuestions, setDraftQuestions] = useState<AuditQuestion[]>([]);
  const [sourceType, setSourceType] = useState<'MASTER' | 'AI'>('MASTER');

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; index: number | null }>({
    open: false,
    index: null
  });

  // Confirmation Submit Modal State
  const [submitModalOpen, setSubmitModalOpen] = useState(false);

  // --- ACCESS CONTROL CHECK ---
  const isAuthorized = 
    currentUser?.role === UserRole.SUPER_ADMIN || 
    currentUser?.role === UserRole.ADMIN ||
    currentUser?.role === UserRole.AUDITOR_LEAD;
  
  if (!isAuthorized) {
    return (
      <div className="p-8 text-center max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-slate-100 mt-10">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600 mb-4">
          <Lock size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Akses Ditolak</h2>
        <p className="text-slate-500 mb-6">Anda tidak memiliki izin untuk membuat Penugasan Audit baru.</p>
        <button onClick={onCancel} className="bg-slate-800 text-white px-6 py-2 rounded-lg hover:bg-slate-900">
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  // 1. Logic: Filter Units based on Selected Standard
  const getFilteredUnits = () => {
    if (standard === AuditStandard.PERMENDIKTISAINTEK_2025) {
      return units;
    }

    return units.filter(unit => {
      const f = (unit.faculty || '').toUpperCase();
      const n = (unit.name || '').toUpperCase();

      if (standard === AuditStandard.LAM_TEKNIK) {
        return f.includes('TEKNIK') || f.includes('FTSP') || f.includes('PERENCANAAN');
      }
      if (standard === AuditStandard.LAM_INFOKOM) {
        return f.includes('DIGITAL') || f.includes('BISNIS') || f.includes('FDDB') || n.includes('INFORMATIKA');
      }
      if (standard === AuditStandard.BAN_PT) {
        return f.includes('VOKASI') || f.includes('FV') || unit.type === 'Yayasan' || unit.type === 'Pimpinan Tinggi' || unit.type === 'Biro/Lembaga';
      }
      return true;
    });
  };

  const filteredUnits = getFilteredUnits();
  
  // 2. Logic: Get Valid Auditors
  const activeAuditors = users
    .filter(u => {
      if (u.status !== 'Active') return false;
      if (department && u.department === department) return false;
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  useEffect(() => {
    if (assignedAuditorId) {
       const currentAuditor = users.find(u => u.id === assignedAuditorId);
       if (currentAuditor && currentAuditor.department === department) {
         setAssignedAuditorId('');
       }
    }
  }, [department, users, assignedAuditorId]);

  useEffect(() => {
    if (!department) return;

    const selectedUnit = units.find(u => u.name === department);
    if (selectedUnit) {
      const f = (selectedUnit.faculty || '').toUpperCase();
      
      if (f.includes('TEKNIK') || f.includes('FTSP')) {
        setStandard(AuditStandard.LAM_TEKNIK);
      } else if (f.includes('DIGITAL') || f.includes('BISNIS') || f.includes('FDDB')) {
        setStandard(AuditStandard.LAM_INFOKOM);
      } else if (f.includes('VOKASI') || f.includes('FV')) {
        setStandard(AuditStandard.BAN_PT);
      } 
    }
  }, [department, units]);

  const handleStandardClick = (newStd: AuditStandard) => {
    setStandard(newStd);
    setDepartment(''); 
    setAssignedAuditorId(''); 
  };

  const handleGenerateDraft = async (e: FormEvent) => {
    e.preventDefault();
    if (!department || !assignedAuditorId) {
      alert("Mohon lengkapi Unit dan Auditor Penanggung Jawab.");
      return;
    }

    setIsLoading(true);

    try {
      const relevantMasterQuestions = masterQuestions.filter(q => q.standard === standard);

      if (relevantMasterQuestions.length > 0) {
        const mappedQuestions: AuditQuestion[] = relevantMasterQuestions.map(q => ({
          id: q.id,
          category: q.category,
          questionText: q.text,
          compliance: null,
          evidence: "",
          auditorNotes: ""
        }));
        
        setDraftQuestions(mappedQuestions);
        setSourceType('MASTER');
        setStep(2);
      } else {
        const questions = await generateChecklist(standard, department);
        setDraftQuestions(questions);
        setSourceType('AI');
        setStep(2);
      }

    } catch (error) {
      alert(t('new.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddManualQuestion = () => {
    const newId = `ADD.${draftQuestions.length + 1}`;
    const newQuestion: AuditQuestion = {
      id: newId,
      category: 'Tambahan',
      questionText: '',
      compliance: null,
      evidence: '',
      auditorNotes: ''
    };
    setDraftQuestions([...draftQuestions, newQuestion]);
  };

  const promptDelete = (index: number) => {
    setDeleteModal({ open: true, index });
  };

  const confirmDelete = () => {
    if (deleteModal.index !== null) {
      const updated = [...draftQuestions];
      updated.splice(deleteModal.index, 1);
      setDraftQuestions(updated);
      setDeleteModal({ open: false, index: null });
    }
  };

  const handleQuestionChange = (index: number, field: keyof AuditQuestion, value: string) => {
    const updated = [...draftQuestions];
    updated[index] = { ...updated[index], [field]: value };
    setDraftQuestions(updated);
  };

  // Trigger Confirmation Modal
  const handleFinalizeClick = () => {
    if (draftQuestions.length === 0) {
      alert("Daftar pertanyaan tidak boleh kosong.");
      return;
    }
    setSubmitModalOpen(true);
  };

  // Execute actual submission
  const executeSubmitAudit = async () => {
    setSubmitModalOpen(false);
    setIsSubmitting(true);
    
    // Simulate network delay for better UX (Sending notification simulation)
    await new Promise(resolve => setTimeout(resolve, 1500));

    const now = new Date();
    
    // CALCULATE DEADLINES
    // Auditee: 14 Days (2 Weeks)
    const auditeeDeadline = new Date(now);
    auditeeDeadline.setDate(now.getDate() + 14);

    // Auditor: 21 Days (2 Weeks Auditee + 1 Week Verification)
    const auditorDeadline = new Date(now);
    auditorDeadline.setDate(now.getDate() + 21);

    const newAudit: AuditSession = {
      id: Date.now().toString(),
      name: `Audit ${department} - ${settings.auditPeriod}`,
      department,
      standard,
      status: AuditStatus.IN_PROGRESS,
      date: now.toISOString(),
      auditeeDeadline: auditeeDeadline.toISOString(),
      auditorDeadline: auditorDeadline.toISOString(),
      questions: draftQuestions,
      assignedAuditorId: assignedAuditorId 
    };

    const auditorName = users.find(u => u.id === assignedAuditorId)?.name || 'Auditor';

    onAuditCreated(newAudit);
    setIsSubmitting(false);

    // Detailed Success Message
    alert(`✅ Penugasan Berhasil Dikirim!\n\n• Auditee Deadline: ${auditeeDeadline.toLocaleDateString()} (2 Minggu)\n• Auditor Deadline: ${auditorDeadline.toLocaleDateString()} (3 Minggu)\n\nNotifikasi telah dikirim ke ${auditorName} dan Unit ${department}`);
  };

  const getSelectedAuditorName = () => {
    return users.find(u => u.id === assignedAuditorId)?.name || 'Belum dipilih';
  };

  return (
    <div className="animate-fade-in relative">
      
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200/50">
        <div className="max-w-5xl mx-auto px-8 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
              {step === 1 ? <Sparkles size={24} /> : <Edit3 size={24} />}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {step === 1 ? t('new.title') : t('new.editor.title')}
              </h2>
              <p className="text-slate-500 text-sm">
                {step === 1 
                  ? `Periode Audit: ${settings.auditPeriod} • Konfigurasi Penugasan` 
                  : "Pastikan pertanyaan sesuai dengan instrumen baku."}
              </p>
            </div>
          </div>
          
          {/* Step Indicator */}
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>1</div>
            <div className="w-8 h-1 bg-slate-200">
              <div className={`h-full bg-blue-600 transition-all ${step === 2 ? 'w-full' : 'w-0'}`}></div>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2</div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        
          {/* STEP 1: CONFIGURATION */}
          {step === 1 && (
            <form onSubmit={handleGenerateDraft} className="p-8 space-y-8">
              
              {/* 1. STANDARD SELECTION */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  1. Pilih Standar Instrumen (Wajib)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.values(AuditStandard).map((std) => {
                    const hasMasterData = masterQuestions.some(q => q.standard === std);
                    
                    return (
                      <div
                        key={std}
                        onClick={() => handleStandardClick(std)}
                        className={`cursor-pointer rounded-xl p-4 border-2 transition-all relative overflow-hidden ${
                          standard === std
                            ? 'border-blue-50 bg-blue-50 text-blue-700 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${standard === std ? 'border-blue-500' : 'border-slate-300'}`}>
                            {standard === std && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                          </div>
                          {hasMasterData ? (
                            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                               <Database size={10} /> Instrumen Tersedia
                            </span>
                          ) : (
                            <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                               <Bot size={10} /> Auto-Gen (Darurat)
                            </span>
                          )}
                        </div>
                        <span className="font-medium text-sm">{std}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 2. DEPARTMENT SELECTION */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="block text-sm font-medium text-slate-700">
                        2. Pilih Auditee (Unit/Prodi)
                      </label>
                      {standard && (
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1">
                          <Filter size={10} /> Filtered
                        </span>
                      )}
                    </div>
                    
                    <select
                      required
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 transition-all outline-none bg-white"
                    >
                      <option value="">
                        {filteredUnits.length === 0 
                          ? "-- Tidak ada unit yang sesuai --" 
                          : "-- Pilih Unit / Program Studi --"}
                      </option>
                      {filteredUnits.map(unit => (
                        <option key={unit.id} value={unit.name}>
                          [{unit.code}] {unit.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 3. AUDITOR SELECTION (MANDATORY) */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      3. Penugasan Auditor (Semua User Aktif)
                    </label>
                    <div className="relative">
                      <select
                        required
                        value={assignedAuditorId}
                        onChange={(e) => setAssignedAuditorId(e.target.value)}
                        className="w-full px-4 py-3 pl-10 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 transition-all outline-none bg-white disabled:bg-slate-50 disabled:text-slate-400"
                        disabled={!department}
                      >
                        <option value="">-- Pilih Auditor --</option>
                        {activeAuditors.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.name} ({user.role})
                          </option>
                        ))}
                      </select>
                      <User size={18} className="absolute left-3 top-3.5 text-slate-400" />
                    </div>
                    {department && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-100">
                        <UserX size={14} />
                        <span><strong>Info:</strong> Auditor yang berasal dari departemen <strong>{department}</strong> tidak ditampilkan (Conflict of Interest).</span>
                      </div>
                    )}
                  </div>
              </div>

              <div className="pt-6 flex items-center justify-end gap-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  {t('new.btn.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !department || !assignedAuditorId}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Memuat Instrumen...
                    </>
                  ) : (
                    <>
                      {t('new.btn.next')}
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: EDITOR (Super Admin / Admin) */}
          {step === 2 && (
            <div className="flex flex-col h-[600px]">
              {/* Toolbar */}
              <div className="px-8 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                    sourceType === 'MASTER' 
                      ? 'bg-green-50 text-green-700 border-green-100' 
                      : 'bg-purple-50 text-purple-700 border-purple-100'
                  }`}>
                    {sourceType === 'MASTER' ? <Database size={12} /> : <Bot size={12} />}
                    {sourceType === 'MASTER' ? 'Sumber: Master Instrumen (Baku)' : 'Sumber: AI Generated'}
                  </div>
                  <span className="text-slate-300">|</span>
                  <div className="text-sm text-slate-500">
                    <strong>{draftQuestions.length}</strong> Butir Pertanyaan
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={handleAddManualQuestion}
                  className="text-blue-600 hover:bg-blue-50 hover:text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border border-transparent hover:border-blue-200"
                >
                  <Plus size={16} />
                  {t('new.btn.addManual')}
                </button>
              </div>

              {/* Scrollable List */}
              <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
                 <div className="space-y-3">
                   {draftQuestions.map((q, idx) => {
                     // Determine if this question is from Master Data
                     const isMasterItem = sourceType === 'MASTER' && !q.id.startsWith('ADD.');

                     return (
                       <div key={idx} className={`bg-white p-4 rounded-xl border shadow-sm hover:shadow-md transition-shadow group ${isMasterItem ? 'border-green-200/60' : 'border-slate-200'}`}>
                         <div className="flex gap-4 items-start">
                           <div className="pt-3 text-slate-300 cursor-move">
                             <GripVertical size={20} />
                           </div>
                           
                           <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4">
                              {/* ID & Category Inputs */}
                              <div className="md:col-span-2">
                                 <label className="block text-xs font-bold text-slate-400 uppercase mb-1">ID</label>
                                 <input 
                                   type="text" 
                                   value={q.id}
                                   readOnly={isMasterItem} // Lock ID if Master
                                   onChange={(e) => handleQuestionChange(idx, 'id', e.target.value)}
                                   className={`w-full text-sm font-mono font-medium text-slate-700 border rounded px-2 py-1 outline-none ${isMasterItem ? 'bg-slate-100 border-transparent' : 'bg-slate-50 border-slate-200 focus:border-blue-500'}`}
                                 />
                              </div>
                              <div className="md:col-span-3">
                                 <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Category</label>
                                 <input 
                                   type="text" 
                                   value={q.category}
                                   readOnly={isMasterItem} // Lock Category if Master
                                   onChange={(e) => handleQuestionChange(idx, 'category', e.target.value)}
                                   className={`w-full text-sm text-slate-700 border rounded px-2 py-1 outline-none ${isMasterItem ? 'bg-slate-100 border-transparent' : 'bg-slate-50 border-slate-200 focus:border-blue-500'}`}
                                 />
                              </div>
                              
                              {/* Question Text Input */}
                              <div className="md:col-span-7 relative">
                                 <div className="flex justify-between mb-1">
                                   <label className="block text-xs font-bold text-slate-400 uppercase">Question / Indicator</label>
                                   {isMasterItem && (
                                     <span className="text-[10px] text-green-600 bg-green-50 px-1.5 rounded flex items-center gap-0.5">
                                       <Lock size={8} /> Instrumen Baku
                                     </span>
                                   )}
                                 </div>
                                 <textarea 
                                   rows={2}
                                   value={q.questionText}
                                   readOnly={isMasterItem} // LOCK QUESTION TEXT IF FROM MASTER DATA
                                   onChange={(e) => handleQuestionChange(idx, 'questionText', e.target.value)}
                                   className={`w-full text-sm text-slate-800 rounded-lg px-3 py-2 outline-none resize-none ${
                                     isMasterItem 
                                       ? 'bg-slate-50 border border-transparent' 
                                       : 'bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                                   }`}
                                 />
                              </div>
                           </div>

                           <div className="pt-6">
                              <button 
                                onClick={() => promptDelete(idx)}
                                className="text-slate-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
                                title="Hapus Item"
                              >
                                <Trash2 size={18} />
                              </button>
                           </div>
                         </div>
                       </div>
                     );
                   })}
                 </div>
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-slate-200 bg-white flex justify-between items-center z-10 rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <ArrowLeft size={16} />
                  {t('new.btn.back')}
                </button>
                
                <button
                  type="button"
                  onClick={handleFinalizeClick}
                  disabled={isSubmitting}
                  className="px-8 py-2.5 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-wait"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Mengirim Penugasan...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      {t('new.btn.finalize')}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{t('new.del.title')}</h3>
              <p className="text-sm text-slate-500">
                {t('new.del.msg')}
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setDeleteModal({ open: false, index: null })}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-200 transition-colors"
              >
                {t('new.btn.cancel')}
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-700 transition-colors shadow-lg shadow-red-900/20"
              >
                {t('new.del.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FINAL SUBMIT CONFIRMATION MODAL */}
      {submitModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
             <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-6 text-white">
                <div className="flex items-start gap-4">
                   <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md">
                      <Send size={28} className="text-white" />
                   </div>
                   <div>
                      <h3 className="text-xl font-bold">Konfirmasi Penugasan</h3>
                      <p className="text-blue-100 text-sm mt-1 leading-tight">Mohon periksa kembali detail penugasan sebelum dikirim ke sistem.</p>
                   </div>
                </div>
             </div>
             
             <div className="p-6 space-y-4">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800">
                   <p className="font-bold flex items-center gap-2 mb-1"><CalendarClock size={16} /> Batas Waktu Pelaksanaan</p>
                   <ul className="list-disc list-inside pl-1 space-y-1 text-xs">
                      <li>Auditee Deadline: <strong>2 Minggu</strong></li>
                      <li>Auditor Deadline: <strong>3 Minggu</strong> (Total)</li>
                   </ul>
                </div>

                <div className="space-y-3">
                   {/* Auditor */}
                   <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 shrink-0">
                         <User size={20} />
                      </div>
                      <div className="overflow-hidden">
                         <p className="text-xs font-bold text-slate-400 uppercase">Auditor Ditugaskan</p>
                         <p className="text-sm font-bold text-slate-800 truncate">{getSelectedAuditorName()}</p>
                      </div>
                   </div>

                   {/* Auditee */}
                   <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 shrink-0">
                         <Database size={20} />
                      </div>
                      <div className="overflow-hidden">
                         <p className="text-xs font-bold text-slate-400 uppercase">Unit Auditee</p>
                         <p className="text-sm font-bold text-slate-800 truncate">{department}</p>
                      </div>
                   </div>

                   {/* Standard */}
                   <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 shrink-0">
                         <FileText size={20} />
                      </div>
                      <div className="overflow-hidden">
                         <p className="text-xs font-bold text-slate-400 uppercase">Standar Instrumen</p>
                         <p className="text-sm font-bold text-slate-800 truncate">{standard}</p>
                         <p className="text-xs text-slate-500 mt-0.5">{draftQuestions.length} butir pertanyaan</p>
                      </div>
                   </div>
                </div>

                <div className="pt-2 text-center">
                   <p className="text-xs text-slate-500 italic">
                     Dengan mengklik tombol di bawah, notifikasi akan dikirim ke Auditor dan Auditee terkait.
                   </p>
                </div>
             </div>

             <div className="px-6 pb-6 pt-2 flex gap-3">
                <button 
                  onClick={() => setSubmitModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={executeSubmitAudit}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={18} />
                  Ya, Kirim Penugasan
                </button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default NewAuditForm;
