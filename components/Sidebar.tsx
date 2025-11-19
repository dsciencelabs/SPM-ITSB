import React from 'react';
import { 
  LayoutDashboard, 
  FilePlus, 
  ClipboardList, 
  PieChart, 
  ShieldCheck, 
  Users, 
  Settings, 
  Database, 
  FileBox,
  CalendarClock,
  LogOut
} from 'lucide-react';
import { ViewState, UserRole } from '../types';
import { useLanguage } from '../LanguageContext';
import { useAuth } from '../AuthContext';

interface SidebarProps {
  currentView: ViewState;
  setCurrentView: (view: ViewState) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  const { t, language, setLanguage } = useLanguage();
  const { currentUser, logout } = useAuth();

  // Define menus based on Role
  const getMenus = () => {
    const base = [
      { id: 'DASHBOARD', label: t('nav.dashboard'), icon: LayoutDashboard },
    ];

    if (!currentUser) return base;

    switch (currentUser.role) {
      case UserRole.SUPER_ADMIN:
        return [
          ...base,
          { id: 'USER_MGMT', label: 'User Management', icon: Users },
          { id: 'TEMPLATE_MGMT', label: 'Templates', icon: FileBox },
          { id: 'MASTER_DATA', label: 'Master Data', icon: Database },
          { id: 'NEW_AUDIT', label: t('nav.newAudit'), icon: FilePlus },
          { id: 'AUDIT_EXECUTION', label: 'All Audits (Exec)', icon: ClipboardList },
          { id: 'REPORT', label: 'All Reports', icon: PieChart },
          { id: 'SETTINGS', label: 'System Settings', icon: Settings },
        ];
      
      case UserRole.ADMIN:
        return [
          ...base,
          { id: 'AUDIT_SCHEDULE', label: 'Audit Schedule', icon: CalendarClock },
          { id: 'NEW_AUDIT', label: t('nav.newAudit'), icon: FilePlus },
          { id: 'AUDIT_EXECUTION', label: t('nav.execution'), icon: ClipboardList },
          { id: 'REPORT', label: t('nav.report'), icon: PieChart },
        ];

      case UserRole.AUDITOR:
        return [
          ...base,
          { id: 'AUDIT_EXECUTION', label: 'My Assignments', icon: ClipboardList },
          { id: 'REPORT', label: 'My Reports', icon: PieChart },
        ];

      case UserRole.AUDITEE:
        return [
          ...base,
          { id: 'AUDIT_EXECUTION', label: 'My Audits (Action)', icon: ClipboardList },
        ];
        
      default:
        return base;
    }
  };

  const menuItems = getMenus();

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 shadow-xl z-10">
      <div className="p-6 flex items-center gap-3 border-b border-slate-700">
        <div className="bg-blue-500 p-2 rounded-lg">
          <ShieldCheck size={24} className="text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tight">SAMI ITSB</h1>
          <p className="text-xs text-slate-400">{currentUser?.role || 'Guest'}</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="mb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Menu
        </div>
        {menuItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as ViewState)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {/* @ts-ignore */}
              <item.icon size={18} />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700 space-y-4">
        {/* Language Switcher */}
        <div className="bg-slate-800 rounded-lg p-1 flex">
          <button 
            onClick={() => setLanguage('id')}
            className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${language === 'id' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            ID
          </button>
          <button 
            onClick={() => setLanguage('en')}
            className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${language === 'en' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            EN
          </button>
        </div>

        <button 
          onClick={logout}
          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-slate-800 hover:text-red-300 rounded-lg transition-colors"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>

        <div className="bg-slate-800 rounded-lg p-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            {currentUser?.name}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;