
import { useState, FC, useRef, useEffect } from 'react';
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
  LogOut,
  Bell,
  Check,
  Trash2,
  X
} from 'lucide-react';
import { ViewState, UserRole } from '../types';
import { useLanguage } from '../LanguageContext';
import { useAuth } from '../AuthContext';
import { useSettings } from '../SettingsContext';
import { useNotification } from '../NotificationContext';

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
  const { notifications, markAsRead, markAllAsRead, clearAll } = useNotification();
  
  // Local state for hover interactions
  const [isHovered, setIsHovered] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Filter notifications for current user
  const myNotifications = notifications.filter(n => n.userId === currentUser?.id);
  const unreadCount = myNotifications.filter(n => !n.isRead).length;

  // Handle click outside to close notifications
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = (noteId: string) => {
    markAsRead(noteId);
    // Smart navigation: Redirect to Audit Execution as it's the main action area
    setCurrentView('AUDIT_EXECUTION');
    setShowNotifications(false);
  };

  // Determine if the sidebar is visually expanded
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
          <div className="overflow-hidden animate-fade-in relative w-full">
            <div className="flex justify-between items-start">
                <div className="flex-1 overflow-hidden">
                    <h1 className="font-bold text-lg tracking-tight truncate" title={settings.appName}>
                    {settings.appName}
                    </h1>
                    <p className="text-xs text-slate-400 truncate">{currentUser?.role || 'Guest'}</p>
                </div>
                
                {/* Notification Bell */}
                <div ref={notificationRef} className="relative">
                    <button 
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-1 text-slate-400 hover:text-white transition-colors"
                    >
                        <Bell size={18} />
                        {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border border-slate-900"></span>
                        )}
                    </button>

                    {/* Notification Popover */}
                    {showNotifications && (
                        <div className="absolute left-full top-0 ml-4 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 text-slate-800 z-[60] overflow-hidden animate-fade-in">
                            <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <h3 className="font-bold text-sm">Notifications</h3>
                                <div className="flex gap-1">
                                    {unreadCount > 0 && (
                                        <button 
                                            onClick={() => currentUser && markAllAsRead(currentUser.id)}
                                            className="p-1 text-blue-600 hover:bg-blue-50 rounded" 
                                            title="Mark all read"
                                        >
                                            <Check size={14} />
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => currentUser && clearAll(currentUser.id)}
                                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                        title="Clear all"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                    <button onClick={() => setShowNotifications(false)} className="p-1 text-slate-400 hover:text-slate-600">
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                                {myNotifications.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400 text-xs">
                                        <Bell size={24} className="mx-auto mb-2 opacity-20" />
                                        No notifications
                                    </div>
                                ) : (
                                    myNotifications.map(note => (
                                        <div 
                                            key={note.id} 
                                            onClick={() => handleNotificationClick(note.id)}
                                            className={`p-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors relative ${!note.isRead ? 'bg-blue-50/30' : ''}`}
                                            title="Click to view details"
                                        >
                                            {!note.isRead && <div className="absolute left-2 top-4 w-1.5 h-1.5 rounded-full bg-blue-500"></div>}
                                            <div className="pl-3">
                                                <p className={`text-xs font-bold mb-0.5 ${!note.isRead ? 'text-slate-800' : 'text-slate-600'}`}>{note.title}</p>
                                                <p className="text-xs text-slate-500 line-clamp-2">{note.message}</p>
                                                <p className="text-[10px] text-slate-400 mt-1 text-right">
                                                    {new Date(note.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
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
