import React from 'react';
import { AuditSession, AuditStatus, UserRole } from '../types';
import { CheckCircle2, Clock, AlertTriangle, BarChart3, Shield, Building2 } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { useAuth } from '../AuthContext';

interface DashboardProps {
  audits: AuditSession[];
  onCreateNew: () => void;
}

const StatCard: React.FC<{ title: string; value: number; icon: React.ElementType; color: string }> = ({ title, value, icon: Icon, color }) => (
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

const Dashboard: React.FC<DashboardProps> = ({ audits, onCreateNew }) => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();

  // Filter Audits based on Role
  const getFilteredAudits = () => {
    if (!currentUser) return [];
    
    switch (currentUser.role) {
      case UserRole.SUPER_ADMIN:
      case UserRole.ADMIN:
        return audits; // See all
      case UserRole.AUDITOR:
        // In a real app, match auditorId. For demo, show all or filter mock logic
        return audits; 
      case UserRole.AUDITEE:
        // Filter by department
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
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <h2 className="text-2xl font-bold text-slate-900">{t('dash.title')}</h2>
             <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded uppercase">
               {currentUser?.role}
             </span>
          </div>
          <p className="text-slate-500">{t('dash.subtitle')}</p>
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

      {/* Welcome Banner for Auditee/Auditor */}
      {currentUser?.role === UserRole.AUDITEE && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center gap-3 text-amber-800">
          <Building2 size={24} />
          <div>
            <p className="font-bold">Selamat Datang, {currentUser.name}</p>
            <p className="text-sm">Anda dapat melihat status audit untuk unit <b>{currentUser.department}</b>, mengunggah bukti (evidence), dan mengisi rencana tindak lanjut.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title={t('dash.total')} value={total} icon={BarChart3} color="bg-blue-500" />
        <StatCard title={t('dash.inProgress')} value={inProgress} icon={Clock} color="bg-amber-500" />
        <StatCard title={t('dash.completed')} value={completed} icon={CheckCircle2} color="bg-green-500" />
        <StatCard title={t('dash.findings')} value={Math.floor(Math.random() * 5)} icon={AlertTriangle} color="bg-red-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
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
                    <tr key={audit.id} className="hover:bg-slate-50 transition-colors">
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

        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-lg text-white p-6">
          <h3 className="font-bold text-lg mb-2">{t('dash.aiTitle')}</h3>
          <p className="text-blue-100 text-sm mb-6">
            {t('dash.aiDesc')}
          </p>
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-blue-200">AI Usage Token</span>
              <span className="text-xs font-bold">Normal</span>
            </div>
            <div className="w-full bg-blue-900/50 rounded-full h-1.5">
              <div className="bg-blue-300 h-1.5 rounded-full" style={{ width: '35%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;