
import { FC, ElementType } from 'react';
import { AuditSession, AuditStatus, UserRole } from '../types';
import { CheckCircle2, Clock, AlertTriangle, BarChart3, Building2, UserCheck, UserCog } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { useAuth } from '../AuthContext';

interface DashboardProps {
  audits: AuditSession[];
  onCreateNew: () => void;
  onViewAudit: (audit: AuditSession) => void;
}

const StatCard: FC<{ title: string; value: number; icon: ElementType; color: string }> = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between hover:shadow-md transition-shadow">
    <div>
      <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
    </div>
    <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
      <Icon size={24} className={color.replace('bg-', 'text-')} />
    </div>
  </div>
);

const Dashboard: FC<DashboardProps> = ({ audits, onCreateNew, onViewAudit }) => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();

  // Filter Audits based on Role
  const getFilteredAudits = () => {
    if (!currentUser) return [];
    
    switch (currentUser.role) {
      case UserRole.SUPER_ADMIN:
      case UserRole.ADMIN:
      case UserRole.AUDITOR_LEAD: // Auditor Lead sees all audits to oversee process
        return audits; 
      
      case UserRole.AUDITOR:
        return audits.filter(a => 
          !a.assignedAuditorId || 
          a.assignedAuditorId === currentUser.id
        );
      
      case UserRole.AUDITEE:
      case UserRole.DEPT_HEAD: // Dept Head sees same as Auditee (Department scope)
        return audits.filter(a => a.department === currentUser.department);
        
      default:
        return [];
    }
  };

  const filteredAudits = getFilteredAudits();
  const completed = filteredAudits.filter(a => a.status === AuditStatus.COMPLETED).length;
  const inProgress = filteredAudits.filter(a => a.status === AuditStatus.IN_PROGRESS).length;
  const total = filteredAudits.length;

  const canCreateAudit = currentUser?.role === UserRole.SUPER_ADMIN || currentUser?.role === UserRole.ADMIN;

  return (
    <div className="animate-fade-in">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-8 py-6 flex justify-between items-center">
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
      <div className="max-w-7xl mx-auto px-8 py-6">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title={t('dash.total')} value={total} icon={BarChart3} color="bg-blue-500" />
          <StatCard title={t('dash.inProgress')} value={inProgress} icon={Clock} color="bg-amber-500" />
          <StatCard title={t('dash.completed')} value={completed} icon={CheckCircle2} color="bg-green-500" />
          <StatCard title={t('dash.findings')} value={Math.floor(Math.random() * 5)} icon={AlertTriangle} color="bg-red-500" />
        </div>

        {/* Recent History Table - Full Width */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">{t('dash.recentHistory')}</h3>
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
                {filteredAudits.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                      {t('dash.empty')}
                    </td>
                  </tr>
                ) : (
                  filteredAudits.map((audit) => (
                    <tr 
                      key={audit.id} 
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => onViewAudit(audit)}
                    >
                      <td className="px-6 py-4 font-medium text-slate-900">{audit.department}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                          {audit.standard.split(' ')[0]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          audit.status === AuditStatus.COMPLETED ? 'bg-green-100 text-green-800' : 
                          audit.status === AuditStatus.IN_PROGRESS ? 'bg-amber-100 text-amber-800' : 
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {audit.status}
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
  );
};

export default Dashboard;
