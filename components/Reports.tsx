
import { useState, FC } from 'react';
import { AuditSession, AuditStatus, UserRole } from '../types';
import { generateAuditReport } from '../services/geminiService';
import { Bot, FileText, ThumbsUp, Target, ArrowRight, Loader2, Filter, CheckCircle, AlertCircle, XCircle, Download, ShieldCheck, ChevronLeft, Search, PieChart, Clock, RotateCcw, Send } from 'lucide-react';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useLanguage } from '../LanguageContext';
import { useAuth } from '../AuthContext';

interface ReportsProps {
  audit: AuditSession | null;
  audits: AuditSession[];
  onUpdateAudit: (audit: AuditSession) => void;
  onSelectAudit: (audit: AuditSession) => void;
  onBackToList?: () => void;
}

const Reports: FC<ReportsProps> = ({ audit, audits, onUpdateAudit, onSelectAudit, onBackToList }) => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>(['Compliant', 'Non-Compliant', 'Observation']);
  const [searchTerm, setSearchTerm] = useState('');
  
  // New Status Filter for Repository View
  const [repoStatusFilter, setRepoStatusFilter] = useState<'ALL' | AuditStatus>('ALL');

  // GLOBAL PERMISSION CHECK
  // Explicitly allow SuperAdmin and Admin to view all and perform actions like Reopen
  const isAdmin = currentUser?.role === UserRole.SUPER_ADMIN || currentUser?.role === UserRole.ADMIN;
  
  // Reopen Permission specifically
  const canReopen = isAdmin;

  // Helper to Re-open from List View
  const handleReopenFromList = (targetAudit: AuditSession, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    if (confirm(t('report.reopenConfirm'))) {
        onUpdateAudit({ ...targetAudit, status: AuditStatus.IN_PROGRESS });
    }
  };

  // --- LIST VIEW (REPOSITORY) ---
  if (!audit) {
    // Filter audits based on role and status
    const filteredAudits = audits.filter(a => {
      // 1. Role Access Check
      let allowed = false;
      
      if (!currentUser) return false;

      switch (currentUser.role) {
        case UserRole.SUPER_ADMIN:
        case UserRole.ADMIN:
        case UserRole.AUDITOR_LEAD: // Lead Auditor sees ALL reports
          allowed = true;
          break;
        case UserRole.AUDITEE:
        case UserRole.DEPT_HEAD:
          // STRICT: Only own department
          allowed = a.department === currentUser.department;
          break;
        case UserRole.AUDITOR:
          // Auditor sees ALL reports in repository for reference (or restrict if needed)
          allowed = true;
          break;
        default:
          allowed = false;
      }
      
      if (!allowed) return false;

      // 2. Status Filter Check
      if (repoStatusFilter !== 'ALL' && a.status !== repoStatusFilter) {
        return false;
      }

      // 3. Search Check
      if (searchTerm) {
        return a.department.toLowerCase().includes(searchTerm.toLowerCase()) || 
               a.standard.toLowerCase().includes(searchTerm.toLowerCase());
      }
      
      return true;
    });

    const isAdminOrAuditor = 
      currentUser?.role === UserRole.SUPER_ADMIN || 
      currentUser?.role === UserRole.ADMIN || 
      currentUser?.role === UserRole.AUDITOR_LEAD || 
      currentUser?.role === UserRole.AUDITOR;

    return (
      <div className="animate-fade-in">
        {/* Sticky Header */}
        <div className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200/50">
          <div className="max-w-7xl mx-auto px-8 py-6 flex flex-col md:flex-row justify-between items-end gap-4">
            <div>
               <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                 <PieChart className="text-blue-600" /> {t('repo.title')}
               </h2>
               <p className="text-slate-500 mt-1">
                 {isAdminOrAuditor ? t('repo.access.admin') : t('repo.access.user')}
               </p>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
               {/* Status Tabs */}
               <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm w-full md:w-auto">
                  <button 
                    onClick={() => setRepoStatusFilter('ALL')}
                    className={`flex-1 px-4 py-1.5 text-xs font-medium rounded-md transition-all ${repoStatusFilter === 'ALL' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    {t('repo.all')}
                  </button>
                  <button 
                     onClick={() => setRepoStatusFilter(AuditStatus.COMPLETED)}
                     className={`flex-1 px-4 py-1.5 text-xs font-medium rounded-md transition-all ${repoStatusFilter === AuditStatus.COMPLETED ? 'bg-green-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                     {t('repo.completed')}
                  </button>
                  <button 
                     onClick={() => setRepoStatusFilter(AuditStatus.IN_PROGRESS)}
                     className={`flex-1 px-4 py-1.5 text-xs font-medium rounded-md transition-all ${repoStatusFilter === AuditStatus.IN_PROGRESS ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                     {t('repo.progress')}
                  </button>
               </div>

               <div className="relative w-full md:w-64">
                 <input 
                   type="text" 
                   placeholder={t('repo.search')}
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                 />
                 <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
               </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="px-6 py-4">{t('dash.th.dept')}</th>
                  <th className="px-6 py-4">{t('dash.th.std')}</th>
                  <th className="px-6 py-4">{t('dash.th.date')}</th>
                  <th className="px-6 py-4">{t('exec.progress')}</th>
                  <th className="px-6 py-4">{t('dash.th.status')}</th>
                  <th className="px-6 py-4 text-right">{t('mgmt.th.action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAudits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      {t('repo.empty')}
                    </td>
                  </tr>
                ) : (
                  filteredAudits.map((a) => {
                    const total = a.questions.length;
                    const answered = a.questions.filter(q => q.compliance !== null).length;
                    const progress = total > 0 ? Math.round((answered / total) * 100) : 0;

                    return (
                      <tr key={a.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {a.department}
                          <div className="text-xs text-slate-500 font-normal mt-0.5">{a.name}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          <span className="bg-slate-100 border border-slate-200 px-2 py-1 rounded text-xs">
                            {a.standard.split(' ')[0]}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {new Date(a.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-100 rounded-full h-1.5">
                              <div 
                                className={`h-1.5 rounded-full ${progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`} 
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-slate-500">{progress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                           {a.status === AuditStatus.COMPLETED ? (
                             <span className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-100 w-fit">
                               <CheckCircle size={12} /> {t('repo.completed')}
                             </span>
                           ) : a.status === AuditStatus.SUBMITTED ? (
                             <span className="flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100 w-fit">
                               <Send size={12} /> Submitted
                             </span>
                           ) : (
                             <span className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 w-fit">
                               <Clock size={12} /> {t('repo.progress')}
                             </span>
                           )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            {canReopen && (a.status === AuditStatus.COMPLETED || a.status === AuditStatus.SUBMITTED) && (
                              <button
                                onClick={(e) => handleReopenFromList(a, e)}
                                className="text-amber-600 hover:text-amber-800 text-sm font-medium bg-amber-50 hover:bg-amber-100 p-1.5 rounded transition-colors border border-amber-200"
                                title={t('report.btn.reopen') + " (Admin Only)"}
                              >
                                <RotateCcw size={16} />
                              </button>
                            )}

                            <button 
                              onClick={() => onSelectAudit(a)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline flex items-center gap-1 justify-end"
                            >
                              {t('repo.btn.view')} <ArrowRight size={14} className="transition-transform group-hover:translate-x-1"/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // --- DETAIL VIEW ---
  
  const handleReopenAudit = () => {
    if (confirm(t('report.reopenConfirm'))) {
        onUpdateAudit({ ...audit, status: AuditStatus.IN_PROGRESS });
    }
  };

  const handleGenerateAnalysis = async () => {
    setIsGenerating(true);
    try {
      const analysis = await generateAuditReport(audit);
      onUpdateAudit({
        ...audit,
        aiSummary: analysis.summary,
        aiRecommendations: analysis.recommendations
      });
    } catch (error) {
      alert(t('report.alert'));
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleFilter = (status: string) => {
    setActiveFilters(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status) 
        : [...prev, status]
    );
  };

  const compliantCount = audit.questions.filter(q => q.compliance === 'Compliant').length;
  const nonCompliantCount = audit.questions.filter(q => q.compliance === 'Non-Compliant').length;
  const observationCount = audit.questions.filter(q => q.compliance === 'Observation').length;

  const filteredQuestions = audit.questions.filter(q => {
    if (!q.compliance) return false; 
    return activeFilters.includes(q.compliance);
  });

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(t('report.title'), 14, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);
    doc.text(`${t('new.label.dept')}: ${audit.department}`, 14, 30);
    doc.text(`${t('new.label.std')}: ${audit.standard}`, 14, 35);
    doc.text(`${t('dash.th.date')}: ${new Date(audit.date).toLocaleDateString()}`, 14, 40);
    doc.text(`${t('dash.th.status')}: ${audit.status}`, 14, 45);

    let yPos = 55;

    doc.setDrawColor(200);
    doc.line(14, 50, pageWidth - 14, 50);
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text("Compliance Summary:", 14, yPos);
    yPos += 7;
    doc.setFontSize(10);
    doc.text(`Compliant: ${compliantCount}  |  Non-Compliant: ${nonCompliantCount}  |  Observation: ${observationCount}`, 14, yPos);
    yPos += 12;

    if (audit.aiSummary) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(t('report.execSummary'), 14, yPos);
      yPos += 6;
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const summaryLines = doc.splitTextToSize(audit.aiSummary, pageWidth - 28);
      doc.text(summaryLines, 14, yPos);
      yPos += (summaryLines.length * 5) + 8;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(t('report.details'), 14, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [[t('report.th.code'), t('new.label.std'), t('report.th.question'), t('report.th.status'), t('report.th.notes')]],
      body: filteredQuestions.map(q => [
        q.id,
        q.category,
        q.questionText,
        q.compliance || '-',
        `Ev: ${q.evidence || '-'}\nNote: ${q.auditorNotes || '-'}`
      ]),
      headStyles: { fillColor: [30, 64, 175] },
      styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 25 },
        2: { cellWidth: 60 },
        3: { cellWidth: 25 },
        4: { cellWidth: 'auto' }
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    doc.save(`Laporan_AMI_${audit.department.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">
      {/* Back Button */}
      <div className="mb-4">
        <button 
          onClick={onBackToList}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors"
        >
          <ChevronLeft size={16} /> {t('repo.all')}
        </button>
      </div>

      {/* Sticky Header for Detail View */}
      <div className="sticky top-0 z-30 -mx-8 px-8 pb-6 pt-2 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200/50 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-4 rounded-2xl shadow-lg shadow-blue-500/30 flex-shrink-0">
               <ShieldCheck size={32} className="text-white" />
            </div>
            <div>
               <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{t('report.title')}</h2>
               <div className="flex items-center gap-2 text-slate-500 mt-1 font-medium text-sm">
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs uppercase tracking-wide">
                    {audit.standard.split(' ')[0]}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                  <span>{audit.department}</span>
               </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
             <span className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 border ${
                audit.status === AuditStatus.COMPLETED 
                  ? 'bg-green-50 text-green-700 border-green-100' 
                  : audit.status === AuditStatus.SUBMITTED
                  ? 'bg-purple-50 text-purple-700 border-purple-100'
                  : 'bg-amber-50 text-amber-700 border-amber-100'
             }`}>
                {audit.status === AuditStatus.COMPLETED ? <CheckCircle size={16}/> : <AlertCircle size={16}/>}
                {audit.status}
             </span>
             
             {canReopen && (audit.status === AuditStatus.COMPLETED || audit.status === AuditStatus.SUBMITTED) && (
                <button 
                  onClick={handleReopenAudit}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-amber-100 hover:bg-amber-200 text-amber-800 px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm border border-amber-200"
                  title={t('report.btn.reopen') + " (Admin Only)"}
                >
                  <RotateCcw size={16} />
                  {t('report.btn.reopen')}
                </button>
             )}

             <button 
               onClick={handleExportPDF}
               className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
             >
               <Download size={16} />
               {t('report.btn.export')}
             </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500 font-medium mb-1">{t('report.compliant')}</p>
          <p className="text-4xl font-bold text-green-600">{compliantCount}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500 font-medium mb-1">{t('report.nc')}</p>
          <p className="text-4xl font-bold text-red-600">{nonCompliantCount}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500 font-medium mb-1">{t('report.ob')}</p>
          <p className="text-4xl font-bold text-amber-600">{observationCount}</p>
        </div>
      </div>

      {/* AI Section */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden mb-10">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Bot size={120} />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Bot size={24} className="text-white" />
            </div>
            <h3 className="text-xl font-bold">{t('report.aiTitle')}</h3>
          </div>

          {!audit.aiSummary ? (
            <div className="text-center py-8">
              <p className="text-slate-300 mb-6 max-w-lg mx-auto">
                {t('report.aiEmpty')}
              </p>
              <button
                onClick={handleGenerateAnalysis}
                disabled={isGenerating}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg shadow-blue-900/50 flex items-center gap-2 mx-auto"
              >
                {isGenerating ? <Loader2 className="animate-spin" /> : <Target />}
                {isGenerating ? t('report.btn.analyzing') : t('report.btn.analyze')}
              </button>
            </div>
          ) : (
            <div className="animate-fade-in">
              <div className="bg-white/10 rounded-xl p-6 mb-6 backdrop-blur-sm border border-white/10">
                <h4 className="text-blue-200 font-semibold mb-3 flex items-center gap-2">
                  <FileText size={18} /> {t('report.execSummary')}
                </h4>
                <p className="leading-relaxed text-slate-100 text-lg">
                  {audit.aiSummary}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {audit.aiRecommendations?.map((rec, idx) => (
                  <div key={idx} className="bg-white/5 rounded-xl p-5 border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="bg-green-500/20 p-1.5 rounded text-green-400 mt-0.5">
                        <ThumbsUp size={16} />
                      </div>
                      <p className="text-sm text-slate-200">{rec}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 flex justify-end">
                <button 
                  onClick={handleGenerateAnalysis}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                   {t('report.refresh')} <ArrowRight size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Details Table with Filters */}
      <div className="mt-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            {t('report.details')}
            <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
              {filteredQuestions.length} {t('report.shown')}
            </span>
          </h3>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
              <div className="px-3 py-1.5 text-slate-400 flex items-center gap-2 border-r border-slate-100">
                <Filter size={16} />
                <span className="text-xs font-semibold">{t('report.filter')}</span>
              </div>
              
              <button 
                onClick={() => toggleFilter('Non-Compliant')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeFilters.includes('Non-Compliant') 
                  ? 'bg-red-100 text-red-700 ring-1 ring-red-200' 
                  : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <XCircle size={14} />
                NC ({nonCompliantCount})
              </button>

              <button 
                onClick={() => toggleFilter('Observation')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeFilters.includes('Observation') 
                  ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-200' 
                  : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <AlertCircle size={14} />
                OB ({observationCount})
              </button>

              <button 
                onClick={() => toggleFilter('Compliant')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeFilters.includes('Compliant') 
                  ? 'bg-green-100 text-green-700 ring-1 ring-green-200' 
                  : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <CheckCircle size={14} />
                C ({compliantCount})
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium w-24">{t('report.th.code')}</th>
                <th className="px-6 py-3 font-medium">{t('report.th.question')}</th>
                <th className="px-6 py-3 font-medium w-32">{t('report.th.status')}</th>
                <th className="px-6 py-3 font-medium">{t('report.th.notes')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQuestions.length > 0 ? (
                filteredQuestions.map(q => (
                  <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-500 align-top">{q.id}</td>
                    <td className="px-6 py-4 text-slate-800 align-top">
                      <p className="mb-1">{q.questionText}</p>
                      <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500">{q.category}</span>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <span className={`px-2 py-1 rounded text-xs font-bold border ${
                        q.compliance === 'Compliant' ? 'text-green-700 bg-green-50 border-green-100' :
                        q.compliance === 'Non-Compliant' ? 'text-red-700 bg-red-50 border-red-100' :
                        q.compliance === 'Observation' ? 'text-amber-700 bg-amber-50 border-amber-100' : 'text-slate-400 bg-slate-100'
                      }`}>
                        {q.compliance || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs align-top italic">
                      {q.evidence || q.auditorNotes ? (
                        <>
                          {q.evidence && <p className="mb-1"><span className="font-semibold">Ev:</span> {q.evidence}</p>}
                          {q.auditorNotes && <p><span className="font-semibold">Note:</span> {q.auditorNotes}</p>}
                        </>
                      ) : '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    <Filter size={32} className="mx-auto mb-2 opacity-20" />
                    <p>{t('report.emptyFilter')}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
