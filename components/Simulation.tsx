
import { useState, useMemo, FC } from 'react';
import { AuditSession, AuditQuestion, UserRole } from '../types';
import { Calculator, Award, RefreshCw, AlertTriangle, Info, Edit3 } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useMasterData } from '../MasterDataContext';

interface SimulationProps {
  audits: AuditSession[];
}

const Simulation: FC<SimulationProps> = ({ audits }) => {
  const { currentUser } = useAuth();
  const { units } = useMasterData();
  const [selectedAuditId, setSelectedAuditId] = useState<string>('');
  
  // Local override state for "What-If" analysis
  // Key: questionId, Value: overridden status (string) OR specific score (number)
  const [overrides, setOverrides] = useState<Record<string, 'Compliant' | 'Non-Compliant' | 'Observation' | number | null>>({});

  // Filter Audits based on Role
  const visibleAudits = useMemo(() => {
    if (!currentUser) return [];

    // Jika Auditee, HANYA tampilkan audit milik departemen mereka (Strict)
    if (currentUser.role === UserRole.AUDITEE) {
        return audits.filter(a => a.department === currentUser.department);
    }

    // Jika Kepala Unit, tampilkan audit milik departemen mereka DAN unit di bawahnya (Hierarchy)
    if (currentUser.role === UserRole.DEPT_HEAD) {
        return audits.filter(a => {
            // 1. Direct match (e.g. Audit Fakultas)
            if (a.department === currentUser.department) return true;
            // 2. Child match (e.g. Audit Prodi under Faculty)
            const unit = units.find(u => u.name === a.department);
            return unit?.faculty === currentUser.department;
        });
    }

    // Jika Auditor Biasa, tampilkan yang ditugaskan kepadanya (opsional, tapi membantu fokus)
    if (currentUser.role === UserRole.AUDITOR) {
        return audits.filter(a => a.assignedAuditorId === currentUser.id || !a.assignedAuditorId);
    }

    // Admin / Lead Auditor / Super Admin lihat semua
    return audits;
  }, [audits, currentUser, units]);

  const selectedAudit = visibleAudits.find(a => a.id === selectedAuditId);

  // Helper to get effective value (Override > Real > Null)
  const getEffectiveValue = (q: AuditQuestion) => {
    if (overrides[q.id] !== undefined) return overrides[q.id];
    return q.compliance; // Default to actual auditor finding
  };

  // Helper to convert status/number to Score Float
  const getNumericScore = (val: string | number | null | undefined): number => {
    if (typeof val === 'number') return val;
    if (val === 'Compliant') return 4.0;
    if (val === 'Observation') return 3.0;
    if (val === 'Non-Compliant') return 2.0;
    return 0;
  };

  // Calculation Logic (Simplified GPA 4.0 Scale)
  const calculation = useMemo(() => {
    if (!selectedAudit) return null;

    let totalScore = 0;
    let count = 0;

    selectedAudit.questions.forEach(q => {
      const val = getEffectiveValue(q);
      
      // Only count if it has a value (either simulated or actual)
      if (val !== null && val !== undefined) {
        const score = getNumericScore(val);
        if (score > 0) {
            totalScore += score;
            count++;
        }
      }
    });

    const average = count > 0 ? totalScore / count : 0;
    
    // Determine Predicate based on average
    let predicate = 'Belum Terakreditasi';
    let colorClass = 'bg-slate-100 text-slate-600';
    
    if (count > 0) {
        if (average >= 3.61) {
            predicate = 'UNGGUL';
            colorClass = 'bg-blue-600 text-white';
        } else if (average >= 3.01) {
            predicate = 'BAIK SEKALI';
            colorClass = 'bg-green-600 text-white';
        } else if (average >= 2.00) {
            predicate = 'BAIK';
            colorClass = 'bg-yellow-500 text-white';
        } else {
            predicate = 'TIDAK TERAKREDITASI';
            colorClass = 'bg-red-600 text-white';
        }
    }

    return {
      score: average.toFixed(2),
      predicate,
      colorClass,
      totalItems: selectedAudit.questions.length,
      scoredItems: count
    };
  }, [selectedAudit, overrides]);

  const handleReset = () => {
    setOverrides({});
  };

  const toggleOverride = (qId: string, currentValue: any) => {
    // If currently a number (manual), switch to Compliant
    if (typeof currentValue === 'number') {
        setOverrides(prev => ({ ...prev, [qId]: 'Compliant' }));
        return;
    }

    // Cycle: Compliant -> Obs -> NC -> Compliant
    let nextStatus: any = 'Compliant';
    if (currentValue === 'Compliant') nextStatus = 'Observation';
    else if (currentValue === 'Observation') nextStatus = 'Non-Compliant';
    else if (currentValue === 'Non-Compliant') nextStatus = 'Compliant';
    
    setOverrides(prev => ({ ...prev, [qId]: nextStatus }));
  };

  const handleManualScoreChange = (qId: string, inputValue: string) => {
    // Jika kosong, hapus override (kembali ke default)
    if (inputValue === '') {
        const newOverrides = { ...overrides };
        delete newOverrides[qId];
        setOverrides(newOverrides);
        return;
    }

    const num = parseFloat(inputValue);
    
    // Validasi: Harus Angka & Range 2.0 - 4.0
    if (!isNaN(num)) {
        if (num >= 2.0 && num <= 4.0) {
            setOverrides(prev => ({ ...prev, [qId]: num }));
        } else {
            // Optional: User feedback or just ignore invalid input
            // For strict UI, we just don't update state if out of bounds
            // But to allow typing (e.g. typing "3." before "5"), we might handle onBlur.
            // Here we strictly check bounds for the final state.
            if (num > 4.0) setOverrides(prev => ({ ...prev, [qId]: 4.0 }));
            if (num < 2.0) setOverrides(prev => ({ ...prev, [qId]: 2.0 }));
        }
    }
  };

  // Grouping for UI
  const groupedQuestions = useMemo(() => {
     if (!selectedAudit) return {};
     return selectedAudit.questions.reduce((acc, q) => {
        const cat = q.category;
        if(!acc[cat]) acc[cat] = [];
        acc[cat].push(q);
        return acc;
     }, {} as Record<string, AuditQuestion[]>);
  }, [selectedAudit]);

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-fade-in">
       {/* Header */}
       <div className="flex-none bg-slate-50 border-b border-slate-200 px-6 py-4">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
             <Calculator className="text-blue-600" /> Simulasi Nilai Akreditasi
          </h2>
          <p className="text-slate-500 text-sm">
             Lakukan simulasi penilaian mandiri (Self-Evaluation) untuk memprediksi peringkat akreditasi.
          </p>
       </div>

       <div className="flex-1 overflow-y-auto p-6 pb-20">
          <div className="max-w-6xl mx-auto space-y-6">
             
             {/* 1. Selection & Score Card */}
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Selection & Matrix Info */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            {currentUser?.role === UserRole.AUDITEE ? 'Pilih Audit' : 'Pilih Audit / Prodi'}
                        </label>
                        <select 
                            value={selectedAuditId} 
                            onChange={(e) => { setSelectedAuditId(e.target.value); setOverrides({}); }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm mb-4"
                        >
                            <option value="">
                                {visibleAudits.length === 0 ? '-- Tidak ada data audit --' : '-- Pilih Data Audit --'}
                            </option>
                            {visibleAudits.map(a => (
                                <option key={a.id} value={a.id}>
                                    {a.department} ({a.standard}) - {new Date(a.date).toLocaleDateString()}
                                </option>
                            ))}
                        </select>
                        {selectedAudit ? (
                            <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded border border-slate-100">
                                <p><strong>Standar:</strong> {selectedAudit.standard}</p>
                                <p><strong>Item:</strong> {selectedAudit.questions.length} butir</p>
                                <p><strong>Status:</strong> {selectedAudit.status}</p>
                            </div>
                        ) : (
                            currentUser?.role === UserRole.AUDITEE && visibleAudits.length === 0 && (
                                <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded border border-amber-100">
                                    <p>Belum ada data audit yang tercatat untuk Unit Kerja Anda ({currentUser.department}).</p>
                                </div>
                            )
                        )}
                    </div>

                    {/* Matriks Penilaian Info */}
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <h4 className="text-sm font-bold text-blue-800 flex items-center gap-2 mb-2">
                            <Info size={16} /> Matriks Penilaian
                        </h4>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between items-center bg-white p-2 rounded border border-blue-100">
                                <span className="font-medium text-slate-600">Compliant (Memenuhi)</span>
                                <span className="font-bold text-blue-600">Skor 4.0</span>
                            </div>
                            <div className="flex justify-between items-center bg-white p-2 rounded border border-blue-100">
                                <span className="font-medium text-slate-600">Observation (Observasi)</span>
                                <span className="font-bold text-amber-600">Skor 3.0</span>
                            </div>
                            <div className="flex justify-between items-center bg-white p-2 rounded border border-blue-100">
                                <span className="font-medium text-slate-600">Non-Compliant (TM)</span>
                                <span className="font-bold text-red-600">Skor 2.0</span>
                            </div>
                             <div className="flex justify-between items-center bg-white p-2 rounded border border-blue-100">
                                <span className="font-medium text-slate-600">Input Manual</span>
                                <span className="font-bold text-purple-600">2.00 - 4.00</span>
                            </div>
                            <p className="text-[10px] text-blue-600/80 mt-2 italic">
                                *Predikat 'Unggul' membutuhkan skor rata-rata minimal 3.61.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Score Display */}
                <div className="lg:col-span-8 bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[300px]">
                    {!selectedAudit ? (
                        <div className="text-slate-400 flex flex-col items-center z-10">
                            <Award size={64} className="mb-4 opacity-20" />
                            <p className="text-lg font-medium">Pilih audit untuk melihat simulasi skor.</p>
                        </div>
                    ) : calculation ? (
                        <div className="w-full animate-fade-in z-10">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Estimasi Skor Akreditasi</h3>
                            
                            <div className="flex flex-col items-center mb-6">
                                <div className="text-7xl font-extrabold text-slate-900 mb-1 tracking-tighter">
                                    {calculation.score}
                                </div>
                                <span className="text-sm font-bold text-slate-400">SKALA 4.00</span>
                            </div>
                            
                            <div className={`inline-block px-8 py-3 rounded-2xl font-bold text-2xl shadow-xl mb-6 transform transition-all hover:scale-105 ${calculation.colorClass}`}>
                                {calculation.predicate}
                            </div>
                            
                            <div className="flex justify-center gap-6 text-sm text-slate-500 bg-slate-50 p-3 rounded-lg inline-flex border border-slate-100">
                                <span>Terisi: <strong>{calculation.scoredItems}</strong> / {calculation.totalItems}</span>
                                {Object.keys(overrides).length > 0 && (
                                    <span className="text-amber-600 font-bold flex items-center gap-1 border-l border-slate-200 pl-4">
                                        <AlertTriangle size={14} /> {Object.keys(overrides).length} Modified
                                    </span>
                                )}
                            </div>

                            {Object.keys(overrides).length > 0 && (
                                <button 
                                  onClick={handleReset}
                                  className="absolute top-6 right-6 text-slate-400 hover:text-blue-600 p-2 rounded-full hover:bg-slate-50 transition-colors"
                                  title="Reset Simulasi"
                                >
                                   <RefreshCw size={20} />
                                </button>
                            )}
                        </div>
                    ) : null}
                    
                    {/* Decor bg */}
                    <div className="absolute -right-12 -bottom-12 opacity-5 pointer-events-none">
                       <Award size={300} />
                    </div>
                </div>
             </div>

             {/* 2. Simulation Table */}
             {selectedAudit && (
                 <div className="space-y-4 animate-fade-in delay-100">
                     <div className="flex justify-between items-center mt-8 mb-4">
                         <h3 className="font-bold text-slate-800 text-lg">Rincian Penilaian & Simulasi</h3>
                         <div className="text-xs text-slate-500 flex items-center gap-3">
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> Compliant (4)</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Obs (3)</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> NC (2)</span>
                         </div>
                     </div>

                     {Object.entries(groupedQuestions).map(([cat, items]) => (
                         <div key={cat} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                             <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 font-bold text-sm text-slate-700 flex justify-between items-center">
                                 {cat}
                                 <span className="bg-white text-slate-400 text-[10px] px-2 py-0.5 rounded border border-slate-200">{items.length} items</span>
                             </div>
                             <div className="divide-y divide-slate-100">
                                 {items.map(q => {
                                     const value = getEffectiveValue(q);
                                     const numericScore = getNumericScore(value);
                                     const isOverridden = overrides[q.id] !== undefined;

                                     return (
                                         <div key={q.id} className="p-4 flex flex-col md:flex-row md:items-center gap-4 hover:bg-slate-50 transition-colors group">
                                             <div className="flex-1">
                                                 <div className="flex items-center gap-2 mb-1">
                                                     <span className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">{q.id}</span>
                                                     {isOverridden && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold border border-amber-200">Edited</span>}
                                                 </div>
                                                 <p className="text-sm text-slate-800 font-medium">{q.questionText}</p>
                                             </div>
                                             
                                             <div className="flex items-center gap-4 bg-slate-50/50 p-2 rounded-lg border border-slate-100 md:border-none md:bg-transparent md:p-0">
                                                 {/* Numeric Score Display */}
                                                 <div className="text-xs text-right min-w-[50px]">
                                                     <p className="text-slate-400">Nilai</p>
                                                     <p className={`font-bold text-lg ${
                                                         numericScore >= 3.5 ? 'text-green-600' :
                                                         numericScore >= 3.0 ? 'text-amber-600' :
                                                         numericScore > 0 ? 'text-red-600' : 'text-slate-300'
                                                     }`}>
                                                         {numericScore > 0 ? numericScore.toFixed(2) : '-'}
                                                     </p>
                                                 </div>

                                                 {/* Standard Toggle Button */}
                                                 <button 
                                                    onClick={() => toggleOverride(q.id, value)}
                                                    className={`px-3 py-2 rounded-lg text-xs font-bold border w-[110px] transition-all shadow-sm active:scale-95 text-center truncate ${
                                                        typeof value === 'number' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                        value === 'Compliant' ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' :
                                                        value === 'Observation' ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' :
                                                        value === 'Non-Compliant' ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' :
                                                        'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                                                    }`}
                                                    title="Klik untuk mengubah status (Siklus: Compliant -> Obs -> NC)"
                                                 >
                                                     {typeof value === 'number' ? 'Custom' : (value || 'Belum Dinilai')}
                                                 </button>

                                                 {/* Manual Input Field */}
                                                 <div className="flex flex-col items-end">
                                                    <span className="text-[9px] text-slate-400 mb-0.5 uppercase font-bold tracking-wider">Manual</span>
                                                    <div className="relative">
                                                        <input 
                                                            type="number"
                                                            min="2.00"
                                                            max="4.00"
                                                            step="0.01"
                                                            className="w-20 text-right px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                            placeholder="0.00"
                                                            value={typeof value === 'number' ? value : ''}
                                                            onChange={(e) => handleManualScoreChange(q.id, e.target.value)}
                                                        />
                                                        {typeof value === 'number' && (
                                                           <Edit3 size={10} className="absolute left-2 top-2.5 text-purple-400 pointer-events-none" />
                                                        )}
                                                    </div>
                                                 </div>
                                             </div>
                                         </div>
                                     );
                                 })}
                             </div>
                         </div>
                     ))}
                 </div>
             )}

          </div>
       </div>
    </div>
  );
};

export default Simulation;
