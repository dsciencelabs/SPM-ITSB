
import { useState, FC } from 'react';
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
  Pin,
  PinOff,
  LogOut
} from 'lucide-react';
import { ViewState, UserRole } from '../types';
import { useLanguage } from '../LanguageContext';
import { useAuth } from '../AuthContext';
import { useSettings } from '../SettingsContext';

interface SidebarProps {
  currentView: ViewState;
  setCurrentView: (view: ViewState) => void;
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

const Sidebar: FC<SidebarProps> = ({ currentView, setCurrentView, isCollapsed, toggleSidebar }) => {
  const { t, language, setLanguage } = useLanguage();
  const { currentUser, logout } = useAuth();
  const { settings } = useSettings();
  
  // Local state for hover interactions
  const [isHovered, setIsHovered] = useState(false);

  // Determine if the sidebar is visually expanded
  // It is expanded if it's PINNED (!isCollapsed) OR if the mouse is HOVERING (isHovered)
  const isExpanded = !isCollapsed || isHovered;

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
          { id: 'AUDIT_SCHEDULE', label: 'Audit Schedule', icon: CalendarClock }, 
          { id: 'USER_MGMT', label: 'User Management', icon: Users },
          { id: 'TEMPLATE_MGMT', label: 'Instrumen Audit', icon: FileBox },
          { id: 'MASTER_DATA', label: 'Unit Kerja', icon: Database },
          { id: 'NEW_AUDIT', label: t('nav.newAudit'), icon: FilePlus },
          { id: 'AUDIT_EXECUTION', label: 'All Audits (Exec)', icon: ClipboardList },
          { id: 'REPORT', label: 'All Reports', icon: PieChart },
          { id: 'SETTINGS', label: 'System Settings', icon: Settings },
        ];
      
      case UserRole.ADMIN:
        return [
          ...base,
          { id: 'AUDIT_SCHEDULE', label: 'Audit Schedule', icon: CalendarClock },
          // REMOVED: User Management & Master Data (Super Admin only)
          { id: 'TEMPLATE_MGMT', label: 'Instrumen Audit', icon: FileBox }, 
          { id: 'NEW_AUDIT', label: t('nav.newAudit'), icon: FilePlus },
          { id: 'AUDIT_EXECUTION', label: t('nav.execution'), icon: ClipboardList },
          { id: 'REPORT', label: 'All Reports', icon: PieChart },
        ];

      case UserRole.AUDITOR_LEAD:
        return [
          ...base,
          { id: 'AUDIT_SCHEDULE', label: 'Jadwal & Penugasan', icon: CalendarClock },
          { id: 'NEW_AUDIT', label: t('nav.newAudit'), icon: FilePlus },
          { id: 'TEMPLATE_MGMT', label: 'Instrumen Audit', icon: FileBox }, // Enabled
          { id: 'AUDIT_EXECUTION', label: 'All Active Audits', icon: ClipboardList },
          { id: 'REPORT', label: 'All Reports', icon: PieChart },
        ];

      case UserRole.AUDITOR:
        return [
          ...base,
          { id: 'AUDIT_EXECUTION', label: 'My Assignments', icon: ClipboardList },
          { id: 'REPORT', label: 'My Reports', icon: PieChart },
        ];
      
      case UserRole.DEPT_HEAD:
      case UserRole.AUDITEE:
        return [
          ...base,
          { id: 'AUDIT_EXECUTION', label: 'My Audits (Action)', icon: ClipboardList },
          { id: 'REPORT', label: 'Dept Reports', icon: PieChart },
        ];
        
      default:
        return base;
    }
  };

  const menuItems = getMenus();

  return (
    <div 
      className={`bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 shadow-xl z-50 transition-all duration-300 ease-in-out ${
        isExpanded ? 'w-64' : 'w-20'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Pin/Unpin Toggle Button */}
      <button 
        onClick={toggleSidebar}
        className={`absolute -right-3 top-12 bg-slate-800 text-slate-300 hover:text-white border border-slate-700 rounded-full p-1.5 shadow-lg transition-all z-50 ${
          !isCollapsed ? 'bg-blue-600 text-white border-blue-500' : 'hover:bg-blue-600'
        }`}
        title={isCollapsed ? "Pin Sidebar Open" : "Unpin (Auto-hide)"}
      >
        {isCollapsed ? <Pin size={14} /> : <PinOff size={14} />}
      </button>

      {/* Dynamic Header from Settings */}
      <div className={`flex items-center border-b border-slate-700 transition-all duration-300 ${!isExpanded ? 'p-4 justify-center h-20' : 'p-6 gap-3 h-24'}`}>
        {settings.logoUrl ? (
          <div className={`bg-white rounded-lg p-1 flex items-center justify-center shrink-0 overflow-hidden transition-all duration-300 ${!isExpanded ? 'w-10 h-10' : 'w-10 h-10'}`}>
            <img src={settings.logoUrl} alt="App Logo" className="w-full h-full object-contain" />
          </div>
        ) : (
          <div 
            className={`rounded-lg shrink-0 flex items-center justify-center transition-all duration-300 ${!isExpanded ? 'p-2' : 'p-2'}`}
            style={{ backgroundColor: settings.themeColor || '#2563eb' }}
          >
            <ShieldCheck size={24} className="text-white" />
          </div>
        )}
        
        {isExpanded && (
          <div className="overflow-hidden animate-fade-in">
            <h1 className="font-bold text-lg tracking-tight truncate" title={settings.appName}>
              {settings.appName}
            </h1>
            <p className="text-xs text-slate-400 truncate">{currentUser?.role || 'Guest'}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
        {isExpanded && (
          <div className="mb-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider animate-fade-in">
            Menu
          </div>
        )}
        
        {menuItems.map((item) => {
          const isActive = currentView === item.id;
          const activeStyle = isActive 
            ? { backgroundColor: settings.themeColor || '#2563eb', color: '#ffffff' } 
            : {};

          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as ViewState)}
              style={activeStyle}
              title={!isExpanded ? item.label : ''}
              className={`w-full flex items-center transition-all duration-200 group ${
                !isExpanded ? 'justify-center p-3 rounded-xl' : 'gap-3 px-4 py-3 rounded-lg'
              } ${
                isActive
                  ? 'shadow-lg shadow-black/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {/* @ts-ignore */}
              <item.icon size={!isExpanded ? 24 : 18} className={`shrink-0 transition-transform duration-300 ${isActive && !isExpanded ? 'scale-110' : ''}`} />
              
              {isExpanded && (
                <span className="font-medium text-sm truncate animate-fade-in delay-75">{item.label}</span>
              )}
              
              {/* Tooltip for fully collapsed state (only if not hovered) */}
              {!isExpanded && !isHovered && (
                <div className="absolute left-16 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap border border-slate-700 shadow-xl z-50">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      <div className={`border-t border-slate-700 transition-all duration-300 ${!isExpanded ? 'p-3 space-y-3' : 'p-4 space-y-4'}`}>
        {/* Language Switcher */}
        <div className={`bg-slate-800 rounded-lg flex transition-all ${!isExpanded ? 'flex-col p-1 gap-1' : 'p-1'}`}>
          <button 
            onClick={() => setLanguage('id')}
            className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${language === 'id' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            ID
          </button>
          <button 
            onClick={() => setLanguage('en')}
            className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${language === 'en' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            EN
          </button>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className={`w-full flex items-center transition-all duration-200 group ${
            !isExpanded ? 'justify-center p-2 rounded-lg' : 'gap-3 px-4 py-2.5 rounded-lg'
          } text-red-400 hover:bg-red-500/10 hover:text-red-300`}
          title={!isExpanded ? t('nav.logout') : ''}
        >
          <LogOut size={!isExpanded ? 20 : 18} className="shrink-0" />
          {isExpanded && (
             <span className="font-medium text-sm truncate animate-fade-in delay-75">{t('nav.logout')}</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
