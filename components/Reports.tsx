import React, { useState } from 'react';
import { AuditSession, AuditStatus } from '../types';
import { generateAuditReport } from '../services/geminiService';
import { Bot, FileText, ThumbsUp, Target, ArrowRight, Loader2, Filter, CheckCircle, AlertCircle, XCircle, Download, ShieldCheck } from 'lucide-react';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useLanguage } from '../LanguageContext';

interface ReportsProps {
  audit: AuditSession | null;
  onUpdateAudit: (audit: AuditSession) => void;
}

const Reports: React.FC<ReportsProps> = ({ audit, onUpdateAudit }) => {
  const { t } = useLanguage();
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>(['Compliant', 'Non-Compliant', 'Observation']);

  if (!audit) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <FileText size={48} className="mb-4 opacity-50" />
        <p>{t('report.select')}</p>
      </div>
    );
  }

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
    if (!q.compliance) return false; // Hide unanswered in report view or handle separately
    return activeFilters.includes(q.compliance);
  });

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(t('report.title'), 14, 20);

    // Meta Info
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);
    doc.text(`${t('new.label.dept')}: ${audit.department}`, 14, 30);
    doc.text(`${t('new.label.std')}: ${audit.standard}`, 14, 35);
    doc.text(`${t('dash.th.date')}: ${new Date(audit.date).toLocaleDateString()}`, 14, 40);
    doc.text(`${t('dash.th.status')}: ${audit.status}`, 14, 45);

    let yPos = 55;

    // Stats
    doc.setDrawColor(200);
    doc.line(14, 50, pageWidth - 14, 50);
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text("Compliance Summary:", 14, yPos);
    yPos += 7;
    doc.setFontSize(10);
    doc.text(`Compliant: ${compliantCount}  |  Non-Compliant: ${nonCompliantCount}  |  Observation: ${observationCount}`, 14, yPos);
    yPos += 12;

    // AI Summary Section
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

    // AI Recommendations Section
    if (audit.aiRecommendations && audit.aiRecommendations.length > 0) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(t('report.recommendations'), 14, yPos);
      yPos += 6;
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      audit.aiRecommendations.forEach((rec) => {
        const recLines = doc.splitTextToSize(`• ${rec}`, pageWidth - 28);
        doc.text(recLines, 14, yPos);
        yPos += (recLines.length * 5) + 2;
      });
      yPos += 8;
    }

    // Table
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
      headStyles: { fillColor: [30, 64, 175] }, // Blue-800
      styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
      columnStyles: {
        0: { cellWidth: 15 }, // Kode
        1: { cellWidth: 25 }, // Kategori
        2: { cellWidth: 60 }, // Pertanyaan
        3: { cellWidth: 25 }, // Status
        4: { cellWidth: 'auto' } // Bukti
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    doc.save(`Laporan_AMI_${audit.department.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">
      {/* Modern Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
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
                : 'bg-amber-50 text-amber-700 border-amber-100'
           }`}>
              {audit.status === AuditStatus.COMPLETED ? <CheckCircle size={16}/> : <AlertCircle size={16}/>}
              {audit.status.toUpperCase()}
           </span>
           
           <button 
             onClick={handleExportPDF}
             className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
           >
             <Download size={16} />
             {t('report.btn.export')}
           </button>
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