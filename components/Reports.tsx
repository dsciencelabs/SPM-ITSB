
import { useState, useMemo, MouseEvent } from 'react';
import { AuditSession, AuditStatus, UserRole } from '../types';
import { generateAuditReport } from '../services/geminiService';
import { Bot, FileText, ThumbsUp, Target, ArrowRight, Loader2, Filter, CheckCircle, AlertCircle, XCircle, Download, ShieldCheck, ChevronLeft, Search, PieChart, Clock, RotateCcw, Send, Activity, HelpCircle, ExternalLink, File } from 'lucide-react';
import { jsPDF } from "jspdf";
import * as autoTablePlugin from "jspdf-autotable";
import { useLanguage } from '../LanguageContext';
import { useAuth } from '../AuthContext';
import { useSettings } from '../SettingsContext';
import { useNotification } from '../NotificationContext';

interface ReportsProps {
  audit: AuditSession | null;
  audits: AuditSession[];
  onUpdateAudit: (audit: AuditSession) => void;
  onSelectAudit: (audit: AuditSession) => void;
  onBackToList?: () => void;
}

// --- SIMPLE RADAR CHART COMPONENT (Internal) ---
const SimpleRadarChart = ({ data }: { data: { name: string; score: number }[] }) => {
  const size = 300;
  const center = size / 2;
  const radius = (size / 2) - 40; // Padding for labels
  const levels = 4; // 25%, 50%, 75%, 100%

  if (data.length < 3) {
    return (
      <div className="w-full h-[300px] flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
        <Activity size={32} className="mb-2 opacity-50" />
        <p className="text-sm">Butuh minimal 3 kategori untuk grafik radar.</p>
      </div>
    );
  }

  // Helper to calculate coordinates
  const getCoordinates = (value: number, index: number, total: number) => {
    const angle = (Math.PI * 2 * index) / total - (Math.PI / 2);
    const r = (value / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Generate Polygon Points
  const polygonPoints = data.map((d, i) => {
    const { x, y } = getCoordinates(d.score, i, data.length);
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="flex items-center justify-center py-4 w-full">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid Circles (Levels) */}
        {[...Array(levels)].map((_, i) => {
          const levelRadius = (radius / levels) * (i + 1);
          return (
            <circle
              key={`level-${i}`}
              cx={center}
              cy={center}
              r={levelRadius}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="1"
            />
          );
        })}

        {/* Axes Lines */}
        {data.map((_, i) => {
          const { x, y } = getCoordinates(100, i, data.length);
          return (
            <line
              key={`axis-${i}`}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
          );
        })}

        {/* Data Polygon */}
        <polygon
          points={polygonPoints}
          fill="rgba(37, 99, 235, 0.2)" // Blue-600 with opacity
          stroke="#2563eb"
          strokeWidth="2"
        />

        {/* Data Points & Labels */}
        {data.map((d, i) => {
          const point = getCoordinates(d.score, i, data.length);
          const labelPoint = getCoordinates(120, i, data.length); // Push label further out

          return (
            <g key={`point-${i}`}>
              <circle cx={point.x} cy={point.y} r="4" fill="#2563eb" />
              <text
                x={labelPoint.x}
                y={labelPoint.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="10"
                fill="#475569"
                fontWeight="500"
              >
                {d.name.length > 15 ? d.name.substring(0, 12) + '...' : d.name} ({d.score}%)
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
// -----------------------------------------------

export default function Reports({ audit, audits, onUpdateAudit, onSelectAudit, onBackToList }: ReportsProps) {
  const { t, language } = useLanguage();
  const { currentUser, users } = useAuth();
  const { settings } = useSettings(); // Access settings for App/SPM Logo
  const { addNotification } = useNotification();
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>(['Compliant', 'Non-Compliant', 'Observation']);
  const [searchTerm, setSearchTerm] = useState('');
  
  // New Status Filter for Repository View
  const [repoStatusFilter, setRepoStatusFilter] = useState<'ALL' | AuditStatus>('ALL');

  // Modal State for Reopen Confirmation
  const [reopenDialog, setReopenDialog] = useState<{isOpen: boolean; audit: AuditSession | null}>({
    isOpen: false,
    audit: null
  });

  // GLOBAL PERMISSION CHECK
  const isAdmin = currentUser?.role === UserRole.SUPER_ADMIN || currentUser?.role === UserRole.ADMIN;
  
  // Reopen Permission specifically (Only Admin/SuperAdmin)
  const canReopen = isAdmin;

  // HELPER: Status Translation
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

  // HELPER: Compliance Translation
  const getComplianceLabel = (status: string | null, useAbbr: boolean = false) => {
      if (!status) return '-';
      if (useAbbr) {
        if (status === 'Compliant') return t('abbr.compliant');
        if (status === 'Non-Compliant') return t('abbr.noncompliant');
        if (status === 'Observation') return t('abbr.observation');
      }
      if (status === 'Compliant') return t('exec.status.compliant');
      if (status === 'Non-Compliant') return t('exec.status.noncompliant');
      if (status === 'Observation') return t('exec.status.observation');
      return status;
  };

  // CALCULATE RADAR DATA MEMO
  const radarData = useMemo(() => {
    if (!audit) return [];
    
    const groups: Record<string, { total: number; compliant: number }> = {};

    audit.questions.forEach(q => {
      // Simplify category name if needed (e.g., "C.1 Visi Misi" -> "C.1")
      // For now, using full category or simplified splitting
      const cat = q.category.split('-')[0].trim(); // Take part before hyphen if exists
      
      if (!groups[cat]) groups[cat] = { total: 0, compliant: 0 };
      
      groups[cat].total += 1;
      if (q.compliance === 'Compliant') {
        groups[cat].compliant += 1;
      }
    });

    return Object.entries(groups).map(([name, stats]) => ({
      name,
      score: Math.round((stats.compliant / stats.total) * 100)
    }));
  }, [audit]);

  // Handler to Trigger Reopen Modal
  const triggerReopen = (targetAudit: AuditSession, e?: MouseEvent) => {
    if (e) e.stopPropagation(); // Prevent row click
    setReopenDialog({ isOpen: true, audit: targetAudit });
  };

  // Execute Reopen Logic
  const executeReopen = () => {
    if (reopenDialog.audit) {
        onUpdateAudit({ ...reopenDialog.audit, status: AuditStatus.IN_PROGRESS });
        
        // Notification Logic
        if (reopenDialog.audit.assignedAuditorId) {
            addNotification(
                reopenDialog.audit.assignedAuditorId,
                "Audit Dibuka Kembali", 
                `Audit untuk ${reopenDialog.audit.department} telah dibuka kembali oleh Admin. Silakan cek revisi.`,
                "WARNING"
            );
        }

        const auditees = users.filter(u => u.department === reopenDialog.audit?.department && u.role === UserRole.AUDITEE);
        auditees.forEach(a => {
            addNotification(
                a.id,
                "Audit Dibuka Kembali", 
                `Status audit untuk ${reopenDialog.audit?.department} dikembalikan menjadi In Progress.`,
                "WARNING"
            );
        });

        setReopenDialog({ isOpen: false, audit: null });
        alert("Audit berhasil dibuka kembali (Reopened). Notifikasi telah dikirim.");
    }
  };

  // Helper for links
  const getSafeUrl = (url: string | undefined) => {
    if (!url) return '#';
    const trimmed = url.trim();
    if (!trimmed) return '#';
    if (trimmed.match(/^(http|https):\/\//)) {
      return trimmed;
    }
    return `https://${trimmed}`;
  };

  // Helper to open Blob or URL
  const openLink = (url: string) => {
      if (!url) return;
      
      if (url.startsWith('data:')) {
          try {
            const arr = url.split(',');
            const mimeMatch = arr[0].match(/:(.*?);/);
            const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
            
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            
            const blob = new Blob([u8arr], { type: mime });
            const blobUrl = URL.createObjectURL(blob);
            
            // Invisible link technique
            const link = document.createElement('a');
            link.href = blobUrl;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
            
          } catch(e) {
             console.error("Failed to open file:", e);
             // Fallback
             window.open(url, '_blank');
          }
      } else {
          window.open(getSafeUrl(url), '_blank');
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
      <div className="flex flex-col h-full bg-slate-50 animate-fade-in">
        {/* Header - Fixed */}
        <div className="flex-none bg-slate-50 border-b border-slate-200/50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-end gap-4">
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
        <div className="flex-1 overflow-y-auto p-6 pb-20">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 font-medium">{t('dash.th.dept')}</th>
                    <th className="px-6 py-3 font-medium whitespace-nowrap w-[1%]">{t('dash.th.std')}</th>
                    <th className="px-6 py-3 font-medium">{t('dash.th.date')}</th>
                    <th className="px-6 py-3 font-medium">{t('exec.progress')}</th>
                    <th className="px-6 py-3 font-medium">{t('dash.th.status')}</th>
                    <th className="px-6 py-3 font-medium text-right">{t('mgmt.th.action')}</th>
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
                          <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                            <span className="bg-slate-100 border border-slate-200 px-2 py-1 rounded text-xs">
                              {a.standard}
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
                             <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border w-fit ${
                                a.status === AuditStatus.COMPLETED ? 'text-green-700 bg-green-50 border-green-100' :
                                a.status === AuditStatus.SUBMITTED ? 'text-purple-700 bg-purple-50 border-purple-100' :
                                a.status === AuditStatus.REVIEW_DEPT_HEAD ? 'text-indigo-700 bg-indigo-50 border-indigo-100' :
                                'text-amber-700 bg-amber-50 border-amber-100'
                             }`}>
                                {a.status === AuditStatus.COMPLETED ? <CheckCircle size={12}/> : 
                                 a.status === AuditStatus.SUBMITTED ? <Send size={12}/> :
                                 a.status === AuditStatus.REVIEW_DEPT_HEAD ? <ShieldCheck size={12}/> :
                                 <Clock size={12}/>}
                                {getStatusLabel(a.status)}
                             </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-3">
                              {canReopen && (a.status === AuditStatus.COMPLETED || a.status === AuditStatus.SUBMITTED || a.status === AuditStatus.REVIEW_DEPT_HEAD) && (
                                <button
                                  onClick={(e) => triggerReopen(a, e)}
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

        {/* REOPEN CONFIRMATION MODAL */}
        {reopenDialog.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600">
                <HelpCircle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{t('report.btn.reopen')}?</h3>
                <p className="text-sm text-slate-500">
                  {t('report.reopenConfirm')}
                </p>
                <div className="bg-amber-50 border border-amber-100 rounded p-2 mt-2">
                  <p className="text-xs text-amber-800 font-medium">Unit: {reopenDialog.audit?.department}</p>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setReopenDialog({ isOpen: false, audit: null })}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-200 transition-colors"
                >
                  {t('confirm.no')}
                </button>
                <button 
                  onClick={executeReopen}
                  className="flex-1 px-4 py-2.5 bg-amber-600 text-white rounded-lg font-medium text-sm hover:bg-amber-700 transition-colors shadow-lg shadow-amber-900/20"
                >
                  {t('confirm.yes')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- DETAIL VIEW ---

  const handleGenerateAnalysis = async () => {
    setIsGenerating(true);
    try {
      if (!audit) return;
      // Pass the current language preference to the service
      const analysis = await generateAuditReport(audit, language);
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

  const compliantCount = audit ? audit.questions.filter(q => q.compliance === 'Compliant').length : 0;
  const nonCompliantCount = audit ? audit.questions.filter(q => q.compliance === 'Non-Compliant').length : 0;
  const observationCount = audit ? audit.questions.filter(q => q.compliance === 'Observation').length : 0;

  const filteredQuestions = audit ? audit.questions.filter(q => {
    if (!q.compliance) return false; 
    return activeFilters.includes(q.compliance);
  }) : [];

  const handleExportPDF = async () => {
    if (!audit) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Resolve the autotable plugin safely
    // @ts-ignore
    const autoTable = autoTablePlugin.default || autoTablePlugin;

    // --- LOAD IMAGES (ITSB & SPM/App Logo) ---
    const getDataUrl = (url: string): Promise<string> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => resolve('');
        img.src = url;
      });
    };

    // 1. ITSB Logo (Official Wiki Commons)
    const itsbLogoUrl = "https://upload.wikimedia.org/wikipedia/commons/2/28/Logo_ITSB_Baru.png";
    const itsbLogoBase64 = await getDataUrl(itsbLogoUrl);

    // 2. SPM/App Logo (From Settings OR Default Placeholder)
    const spmLogoBase64 = settings.logoUrl 
        ? settings.logoUrl 
        : await getDataUrl("https://cdn-icons-png.flaticon.com/512/9561/9561526.png"); // Generic Blue Shield/Audit Icon

    // --- RENDER HEADER ---
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(t('report.title'), 14, 22);

    // Render Logos (Top Right)
    // Posisi: ITSB paling kanan, SPM sebelah kirinya
    if (itsbLogoBase64) {
        doc.addImage(itsbLogoBase64, 'PNG', pageWidth - 25, 10, 15, 15); // x: ~185
    }
    if (spmLogoBase64) {
        doc.addImage(spmLogoBase64, 'PNG', pageWidth - 45, 10, 15, 15); // x: ~165
    }

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);
    doc.text(`${t('dash.th.dept')}: ${audit.department}`, 14, 32);
    doc.text(`${t('dash.th.std')}: ${audit.standard}`, 14, 37);
    doc.text(`${t('dash.th.date')}: ${new Date(audit.date).toLocaleDateString()}`, 14, 42);
    doc.text(`${t('dash.th.status')}: ${getStatusLabel(audit.status)}`, 14, 47);

    let yPos = 55;

    doc.setDrawColor(200);
    doc.line(14, 50, pageWidth - 14, 50);
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(t('report.compliance_summary'), 14, yPos);
    yPos += 7;
    doc.setFontSize(10);
    doc.text(`${t('term.compliant')}: ${compliantCount}  |  ${t('term.noncompliant')}: ${nonCompliantCount}  |  ${t('term.observation')}: ${observationCount}`, 14, yPos);
    yPos += 15;

    // --- PETA KETERCAPAIAN STANDAR (RADAR CHART) IN PDF ---
    // 1. Calculate Data (Logic copied from radarData useMemo)
    const groups: Record<string, { total: number; compliant: number }> = {};
    audit.questions.forEach(q => {
        const cat = q.category.split('-')[0].trim();
        if (!groups[cat]) groups[cat] = { total: 0, compliant: 0 };
        groups[cat].total += 1;
        if (q.compliance === 'Compliant') groups[cat].compliant += 1;
    });
    const chartData = Object.entries(groups).map(([name, stats]) => ({
        name,
        score: Math.round((stats.compliant / stats.total) * 100)
    }));

    // 2. Draw Chart if data exists
    if (chartData.length >= 3) {
        const chartX = pageWidth / 2;
        const chartY = yPos + 30; 
        const radius = 25;

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0);
        doc.text(t('report.chart.radar'), 14, yPos);
        
        // Draw Webs (Levels: 25, 50, 75, 100%)
        doc.setDrawColor(220);
        doc.setLineWidth(0.1);
        [0.25, 0.5, 0.75, 1].forEach(scale => {
             doc.circle(chartX, chartY, radius * scale, 'S');
        });

        // Draw Axes and Labels
        chartData.forEach((d, i) => {
            const angle = (Math.PI * 2 * i) / chartData.length - (Math.PI / 2);
            // Axis line
            const ax = chartX + radius * Math.cos(angle);
            const ay = chartY + radius * Math.sin(angle);
            doc.setDrawColor(200);
            doc.line(chartX, chartY, ax, ay);

            // Label
            const lx = chartX + (radius + 8) * Math.cos(angle);
            const ly = chartY + (radius + 8) * Math.sin(angle);
            doc.setTextColor(100);
            doc.setFontSize(7);
            doc.text(`${d.name} (${d.score}%)`, lx, ly, { align: 'center', baseline: 'middle' });
        });

        // Draw Data Polygon
        doc.setDrawColor(37, 99, 235); // Blue
        doc.setLineWidth(0.5);
        doc.setFillColor(37, 99, 235);
        
        let firstPoint: {x: number, y: number} | null = null;
        let lastPoint: {x: number, y: number} | null = null;

        chartData.forEach((d, i) => {
            const angle = (Math.PI * 2 * i) / chartData.length - (Math.PI / 2);
            const dist = radius * (d.score / 100);
            const px = chartX + dist * Math.cos(angle);
            const py = chartY + dist * Math.sin(angle);

            if (i === 0) firstPoint = { x: px, y: py };

            if (lastPoint) {
                doc.line(lastPoint.x, lastPoint.y, px, py);
            }
            lastPoint = { x: px, y: py };
            
            // Dot
            doc.circle(px, py, 1, 'F');
        });
        
        // Close loop
        if (lastPoint && firstPoint) {
            doc.line(lastPoint.x, lastPoint.y, firstPoint.x, firstPoint.y);
        }

        yPos += 75; // Add space for chart
    }

    doc.setTextColor(0);
    // --- ANALISIS CERDAS GEMINI AI SECTION ---
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
      
      audit.aiRecommendations.forEach(rec => {
         const cleanRec = rec.replace(/^[-*•]\s*/, ''); // Remove existing bullets if any
         const bulletText = `• ${cleanRec}`;
         const recLines = doc.splitTextToSize(bulletText, pageWidth - 28);
         doc.text(recLines, 14, yPos);
         yPos += (recLines.length * 5) + 2; 
      });
      yPos += 8;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(t('report.details'), 14, yPos);
    yPos += 5;

    // Use autoTable with proper type support
    try {
      if (typeof autoTable === 'function') {
        autoTable(doc, {
          startY: yPos,
          head: [[t('report.th.code'), t('dash.th.std'), t('report.th.question'), t('report.th.status'), t('report.th.notes')]],
          body: filteredQuestions.map(q => [
              q.id,
              q.category,
              q.questionText,
              getComplianceLabel(q.compliance),
              `File: ${q.evidenceFileName || '-'}\nEv: ${q.evidence || '-'}\nNote: ${q.auditorNotes || '-'}`
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
          // Create Hyperlinks for Evidence Column (Index 4)
          didDrawCell: (data: any) => {
            if (data.section === 'body' && data.column.index === 4) {
               const rowIndex = data.row.index;
               const q = filteredQuestions[rowIndex];

               // Check if valid evidence URL exists
               if (q && q.evidence && (q.evidence.startsWith('http') || q.evidence.startsWith('https'))) {
                  // Create link annotation over the cell
                  doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, { url: q.evidence });
               }
            }
          },
          willDrawCell: (data: any) => {
             // Optional: Highlight text blue to indicate it is clickable
             if (data.section === 'body' && data.column.index === 4) {
               const rowIndex = data.row.index;
               const q = filteredQuestions[rowIndex];
               if (q && q.evidence && (q.evidence.startsWith('http') || q.evidence.startsWith('https'))) {
                 doc.setTextColor(37, 99, 235); // Blue-600
               }
             }
          }
        });
      } else {
        console.error("autoTable is not a function", autoTable);
      }
    } catch (e) {
      console.error("AutoTable Error", e);
      alert("Gagal memuat tabel PDF. Coba lagi.");
    }

    doc.save(`Laporan_AMI_${audit.department.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-fade-in relative">
      {/* Fixed Header */}
      <div className="flex-none bg-slate-50 border-b border-slate-200/50 pt-2 px-6 pb-4">
        {/* Back Button */}
        <div className="mb-4">
          <button 
            onClick={onBackToList}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors"
          >
            <ChevronLeft size={16} /> {t('repo.all')}
          </button>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-4 rounded-2xl shadow-lg shadow-blue-500/30 flex-shrink-0">
               <ShieldCheck size={32} className="text-white" />
            </div>
            <div>
               <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{t('report.title')}</h2>
               <div className="flex items-center gap-2 text-slate-500 mt-1 font-medium text-sm">
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs uppercase tracking-wide">
                    {audit.standard}
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
                  : audit.status === AuditStatus.REVIEW_DEPT_HEAD
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                  : 'bg-amber-50 text-amber-700 border-amber-100'
             }`}>
                {audit.status === AuditStatus.COMPLETED ? <CheckCircle size={16}/> : <AlertCircle size={16}/>}
                {getStatusLabel(audit.status)}
             </span>
             
             {canReopen && (audit.status === AuditStatus.COMPLETED || audit.status === AuditStatus.SUBMITTED || audit.status === AuditStatus.REVIEW_DEPT_HEAD) && (
                <button 
                  onClick={() => triggerReopen(audit)}
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

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-8 max-w-6xl mx-auto w-full pb-20">
        
        {/* Radar Chart Section */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Activity size={20} className="text-blue-600" /> {t('report.chart.radar')}
              </h3>
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                  {t('report.chart.subtitle')}
              </span>
            </div>
            <div className="flex justify-center w-full">
              <SimpleRadarChart data={radarData} />
            </div>
        </div>
        
        {/* Details Table with Filters */}
        <div className="mt-8">
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
                  {t('abbr.noncompliant')} ({nonCompliantCount})
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
                  {t('abbr.observation')} ({observationCount})
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
                  {t('abbr.compliant')} ({compliantCount})
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
                  <th className="px-6 py-3 font-medium whitespace-nowrap w-[1%]">{t('report.th.status')}</th>
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
                      <td className="px-6 py-4 align-top whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-xs font-bold border ${
                          q.compliance === 'Compliant' ? 'text-green-700 bg-green-50 border-green-100' :
                          q.compliance === 'Non-Compliant' ? 'text-red-700 bg-red-50 border-red-100' :
                          q.compliance === 'Observation' ? 'text-amber-700 bg-amber-50 border-amber-100' : 'text-slate-400 bg-slate-100'
                        }`}>
                          {getComplianceLabel(q.compliance)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-xs align-top">
                        {(q.evidence || q.evidenceFileName || q.auditorNotes) ? (
                          <div className="space-y-1">
                            {(q.evidence || q.evidenceFileName) && (
                               <div className="flex items-start gap-1">
                                  <span className="font-semibold shrink-0">Ev:</span> 
                                  <button 
                                     onClick={() => openLink(q.evidence!)}
                                     className="text-blue-600 hover:underline break-all flex items-center gap-0.5 text-left"
                                  >
                                    {q.evidenceFileName ? (
                                        <span className="flex items-center gap-1 font-mono bg-slate-100 px-1 rounded border border-slate-200">
                                            <File size={10} /> {q.evidenceFileName}
                                        </span>
                                    ) : (
                                        <span>{q.evidence} <ExternalLink size={8} /></span>
                                    )}
                                  </button>
                               </div>
                            )}
                            {q.auditorNotes && (
                                <p><span className="font-semibold">Note:</span> {q.auditorNotes}</p>
                            )}
                          </div>
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

        {/* AI Section */}
        <div className="mt-10 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden mb-10">
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
        
      </div>

      {/* REOPEN CONFIRMATION MODAL - Moved outside content div for better stacking */}
      {reopenDialog.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600">
              <HelpCircle size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{t('report.btn.reopen')}?</h3>
              <p className="text-sm text-slate-500">
                {t('report.reopenConfirm')}
              </p>
              <div className="bg-amber-50 border border-amber-100 rounded p-2 mt-2">
                <p className="text-xs text-amber-800 font-medium">Unit: {reopenDialog.audit?.department}</p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setReopenDialog({ isOpen: false, audit: null })}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-200 transition-colors"
              >
                {t('confirm.no')}
              </button>
              <button 
                onClick={executeReopen}
                className="flex-1 px-4 py-2.5 bg-amber-600 text-white rounded-lg font-medium text-sm hover:bg-amber-700 transition-colors shadow-lg shadow-amber-900/20"
              >
                {t('confirm.yes')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
