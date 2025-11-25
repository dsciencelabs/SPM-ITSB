
import { FC, ElementType, useState } from 'react';
import { AuditSession, AuditStatus, UserRole } from '../types';
import { CheckCircle2, Clock, AlertTriangle, BarChart3, Building2, UserCheck, UserCog, Send, CalendarClock, ShieldCheck, Filter, XCircle } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { useAuth } from '../AuthContext';

interface DashboardProps {
  audits: AuditSession[];
  onCreateNew: () => void;
  onViewAudit: (audit: AuditSession) => void;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: ElementType;
  color: string;
  onClick: () => void;
  isActive: boolean;
}

const StatCard: FC<StatCardProps> = ({ title, value, icon: Icon, color, onClick, isActive }) => (
  <div 
    onClick={onClick}
    className={`bg-white p-6 rounded-xl border cursor-pointer transition-all duration-300 ease-out group relative overflow-hidden ${
      isActive 
        ? `border-${color.replace('bg-', '')} shadow-lg shadow-slate-200 -translate-y-1` 
        : 'border-slate-100 shadow-sm hover:border-slate-300 hover:shadow-md hover:-translate-y-1'
    }`}
  >
    <div className="flex items-start justify-between relative z-10">
      <div>
        <p className={`text-sm font-medium mb-1 ${isActive ? 'text-slate-800 font-bold' : 'text-slate-500'}`}>{title}</p>
        <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
        <Icon size={24} className={color.replace('bg-', 'text-')} />
      </div>
    </div>
    {/* Active Background Indicator */}
    {isActive && (
       <div className={`absolute bottom-0 left-0 h-1 w-full ${color} animate-fade-in`}></div>
    )}
  </div>
);

const Dashboard: FC<DashboardProps> = ({ audits, onCreateNew, onViewAudit }) => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  
  // State for filtering based on clicked card
  const [activeFilter, setActiveFilter] = useState<'ALL' | AuditStatus>('ALL');

  // Filter Audits based on Role (Base Data)
  const getFilteredAudits = () => {
    if (!currentUser) return [];
    
    switch (currentUser.role) {
      case UserRole.SUPER_ADMIN:
      case UserRole.ADMIN:
      case UserRole.AUDITOR_LEAD: 
        return audits; 
      
      case UserRole.AUDITOR:
        return audits.filter(a => 
          !a.assignedAuditorId || 
          a.assignedAuditorId === currentUser.id
        );
      
      case UserRole.AUDITEE:
      case UserRole.DEPT_HEAD: 
        return audits.filter(a => a.department === currentUser.department);
        
      default:
        return [];
    }
  };

  const baseAudits = getFilteredAudits();

  // Calculate Stats
  const completed = baseAudits.filter(a => a.status === AuditStatus.COMPLETED).length;
  const inProgress = baseAudits.filter(a => a.status === AuditStatus.IN_PROGRESS).length;
  const submitted = baseAudits.filter(a => a.status === AuditStatus.SUBMITTED).length;
  const planned = baseAudits.filter(a => a.status === AuditStatus.PLANNED).length;
  const reviewDept = baseAudits.filter(a => a.status === AuditStatus.REVIEW_DEPT_HEAD).length;
  const total = baseAudits.length;

  const canCreateAudit = currentUser?.role === UserRole.SUPER_ADMIN || currentUser?.role === UserRole.ADMIN;

  // Apply Active Card Filter for the Table
  const tableData = baseAudits.filter(a => {
    if (activeFilter === 'ALL') return true;
    return a.status === activeFilter;
  });

  return (
    <div className="flex flex-col h-full animate-fade-in bg-slate-50">
      {/* Fixed Header */}
      <div className="flex-none bg-slate-50 border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
               <h2 className="text-2xl font-bold text-slate-900">{t('dash.title')}</h2>
               <span className={`px-2 py-1 text-xs font-bold rounded uppercase ${
                  currentUser?.role === UserRole.AUDITEE || currentUser?.role === UserRole.DEPT_HEAD ? 'bg-amber-100 text-amber-700' :
                  currentUser?.role === UserRole.AUDITOR || currentUser?.role === UserRole.AUDITOR_LEAD ? 'bg-green-100 text-green-700' :
                  'bg-blue-100 text-blue-700'
               }`}>
                 {currentUser?.role}
               </span>
            </div>
            <p className="text-slate-500 text-sm">{t('dash.subtitle')}</p>
          </div>
          {canCreateAudit && (
            <button 
              onClick={onCreateNew}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
            >
              {t('dash.btnNew')}
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-8 py-6 pb-20">
          {/* Welcome Banner for Auditee/Dept Head */}
          {(currentUser?.role === UserRole.AUDITEE || currentUser?.role === UserRole.DEPT_HEAD) && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center gap-3 text-amber-800">
              <Building2 size={24} />
              <div>
                <p className="font-bold">Area Unit: {currentUser.department}</p>
                <p className="text-sm">Anda hanya dapat mengakses data audit untuk unit kerja Anda. Silakan lengkapi bukti dan rencana tindak lanjut pada audit yang aktif.</p>
              </div>
            </div>
          )}
          
          {/* Welcome Banner for Auditor/Lead */}
          {(currentUser?.role === UserRole.AUDITOR || currentUser?.role === UserRole.AUDITOR_LEAD) && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3 text-green-800">
              <UserCheck size={24} />
              <div>
                <p className="font-bold">{currentUser.role === UserRole.AUDITOR_LEAD ? 'Lead Auditor Oversight' : 'Penugasan Auditor'}</p>
                <p className="text-sm">
                  {currentUser.role === UserRole.AUDITOR_LEAD 
                    ? 'Anda memiliki akses untuk memantau seluruh audit yang berjalan serta melakukan verifikasi.'
                    : 'Menampilkan daftar audit yang ditugaskan kepada Anda. Silakan lakukan penilaian kepatuhan dan berikan catatan.'}
                </p>
              </div>
            </div>
          )}

          {/* Stats Grid - Clickable */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <StatCard 
              title={t('dash.total')} 
              value={total} 
              icon={BarChart3} 
              color="bg-blue-500" 
              isActive={activeFilter === 'ALL'}
              onClick={() => setActiveFilter('ALL')}
            />
            <StatCard 
              title={t('dash.inProgress')} 
              value={inProgress} 
              icon={Clock} 
              color="bg-amber-500" 
              isActive={activeFilter === AuditStatus.IN_PROGRESS}
              onClick={() => setActiveFilter(AuditStatus.IN_PROGRESS)}
            />
            <StatCard 
              title="Verifikasi Auditor" 
              value={submitted} 
              icon={Send} 
              color="bg-purple-500" 
              isActive={activeFilter === AuditStatus.SUBMITTED}
              onClick={() => setActiveFilter(AuditStatus.SUBMITTED)}
            />
            <StatCard 
              title="Review DeptHead" 
              value={reviewDept} 
              icon={ShieldCheck} 
              color="bg-indigo-500" 
              isActive={activeFilter === AuditStatus.REVIEW_DEPT_HEAD}
              onClick={() => setActiveFilter(AuditStatus.REVIEW_DEPT_HEAD)}
            />
            <StatCard 
              title={t('dash.completed')} 
              value={completed} 
              icon={CheckCircle2} 
              color="bg-green-500" 
              isActive={activeFilter === AuditStatus.COMPLETED}
              onClick={() => setActiveFilter(AuditStatus.COMPLETED)}
            />
          </div>

          {/* Recent History Table - Filtered */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                 <h3 className="font-semibold text-slate-800">{t('dash.recentHistory')}</h3>
                 {activeFilter !== 'ALL' && (
                    <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 bg-blue-100 text-blue-700 rounded-full animate-fade-in">
                       <Filter size={10} /> {activeFilter === AuditStatus.SUBMITTED ? 'Verifikasi Auditor' : activeFilter === AuditStatus.REVIEW_DEPT_HEAD ? 'Review DeptHead' : activeFilter}
                       <button onClick={(e) => { e.stopPropagation(); setActiveFilter('ALL'); }} className="ml-1 hover:text-blue-900"><XCircle size={12}/></button>
                    </span>
                 )}
              </div>
              <span className="text-xs text-slate-400">Menampilkan {tableData.length} data</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-6 py-3 font-medium">{t('dash.th.dept')}</th>
                    <th className="px-6 py-3 font-medium">{t('dash.th.std')}</th>
                    <th className="px-6 py-3 font-medium">{t('dash.th.status')}</th>
                    <th className="px-6 py-3 font-medium">{t('dash.th.date')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tableData.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                         <div className="flex flex-col items-center justify-center">
                            <Filter size={32} className="opacity-20 mb-2" />
                            <p>{t('report.emptyFilter')}</p>
                            <button onClick={() => setActiveFilter('ALL')} className="mt-2 text-xs text-blue-600 font-bold hover:underline">Reset Filter</button>
                         </div>
                      </td>
                    </tr>
                  ) : (
                    tableData.map((audit) => (
                      <tr 
                        key={audit.id} 
                        className="hover:bg-slate-50 transition-colors cursor-pointer group"
                        onClick={() => onViewAudit(audit)}
                      >
                        <td className="px-6 py-4 font-medium text-slate-900 group-hover:text-blue-600 transition-colors">{audit.department}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                            {audit.standard}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            audit.status === AuditStatus.COMPLETED ? 'bg-green-100 text-green-800' : 
                            audit.status === AuditStatus.REVIEW_DEPT_HEAD ? 'bg-indigo-100 text-indigo-800' :
                            audit.status === AuditStatus.SUBMITTED ? 'bg-purple-100 text-purple-800' :
                            audit.status === AuditStatus.IN_PROGRESS ? 'bg-amber-100 text-amber-800' : 
                            audit.status === AuditStatus.PLANNED ? 'bg-slate-100 text-slate-800' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {audit.status === AuditStatus.SUBMITTED ? 'Verifikasi Auditor' : 
                             audit.status === AuditStatus.REVIEW_DEPT_HEAD ? 'Review DeptHead' :
                             audit.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{new Date(audit.date).toLocaleDateString('id-ID')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
