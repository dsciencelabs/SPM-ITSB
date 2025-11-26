import { useState, FC, useRef, useEffect, FormEvent, ChangeEvent } from 'react';
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
  X,
  Key,
  User,
  Save,
  Loader2,
  Camera,
  Upload,
  Image as ImageIcon,
  Calculator
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
  const { currentUser, logout, updateUser } = useAuth();
  const { settings } = useSettings();
  const { notifications, markAsRead, markAllAsRead, clearAll } = useNotification();
  
  // Local state for hover interactions
  const [isHovered, setIsHovered] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Profile / Change Password Modal State
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [passForm, setPassForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  // Password Confirmation State
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  // Avatar Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tempAvatar, setTempAvatar] = useState<string | null>(null);
  const [showAvatarConfirm, setShowAvatarConfirm] = useState(false);

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

  // Reset temp avatar when modal opens/closes
  useEffect(() => {
    if (isProfileOpen && currentUser) {
      setTempAvatar(null);
    }
  }, [isProfileOpen, currentUser]);

  const handleNotificationClick = (noteId: string) => {
    markAsRead(noteId);
    // Smart navigation: Redirect to Audit Execution as it's the main action area
    setCurrentView('AUDIT_EXECUTION');
    setShowNotifications(false);
  };

  const handlePasswordValidation = (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (passForm.oldPassword !== currentUser.password) {
      alert("Password Lama salah.");
      return;
    }

    if (passForm.newPassword !== passForm.confirmPassword) {
      alert("Konfirmasi password baru tidak cocok.");
      return;
    }

    if (passForm.newPassword.length < 3) {
       alert("Password terlalu pendek.");
       return;
    }

    // Show Confirmation Modal instead of saving immediately
    setShowPasswordConfirm(true);
  };

  const executePasswordChange = () => {
     if (!currentUser) return;
     
     setIsSavingProfile(true);
     setShowPasswordConfirm(false); // Close confirm modal

     // Simulate API delay
     setTimeout(() => {
        updateUser({ ...currentUser, password: passForm.newPassword });
        setIsSavingProfile(false);
        setIsProfileOpen(false);
        setPassForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
        alert("Password berhasil diperbarui!");
     }, 800);
  };

  // Avatar Handlers
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit
         alert("Ukuran file terlalu besar (Maks 1MB)");
         return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const executeAvatarSave = () => {
    if (!currentUser || !tempAvatar) return;

    updateUser({ ...currentUser, avatarUrl: tempAvatar });
    setShowAvatarConfirm(false);
    setTempAvatar(null); // Reset temp to hide the save button
    alert("Foto profil berhasil diperbarui!");
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
          { id: 'AUDIT_SCHEDULE', label: t('nav.schedule'), icon: CalendarClock }, 
          { id: 'USER_MGMT', label: t('nav.userMgmt'), icon: Users },
          { id: 'TEMPLATE_MGMT', label: t('nav.template'), icon: FileBox },
          { id: 'MASTER_DATA', label: t('nav.master'), icon: Database },
          { id: 'NEW_AUDIT', label: t('nav.newAudit'), icon: FilePlus },
          { id: 'AUDIT_EXECUTION', label: t('nav.all_exec'), icon: ClipboardList },
          { id: 'REPORT', label: t('nav.report'), icon: PieChart },
          { id: 'SETTINGS', label: t('nav.settings'), icon: Settings },
          { id: 'SIMULATION', label: 'Simulasi Nilai', icon: Calculator }, 
        ];
      
      case UserRole.ADMIN:
        return [
          ...base,
          { id: 'AUDIT_SCHEDULE', label: t('nav.schedule'), icon: CalendarClock },
          { id: 'TEMPLATE_MGMT', label: t('nav.template'), icon: FileBox }, 
          { id: 'NEW_AUDIT', label: t('nav.newAudit'), icon: FilePlus },
          { id: 'AUDIT_EXECUTION', label: t('nav.execution'), icon: ClipboardList },
          { id: 'REPORT', label: t('nav.report'), icon: PieChart },
          { id: 'SIMULATION', label: 'Simulasi Nilai', icon: Calculator }, 
        ];

      case UserRole.AUDITOR_LEAD:
        return [
          ...base,
          { id: 'AUDIT_SCHEDULE', label: t('nav.schedule'), icon: CalendarClock },
          { id: 'NEW_AUDIT', label: t('nav.newAudit'), icon: FilePlus },
          { id: 'AUDIT_EXECUTION', label: t('nav.all_active'), icon: ClipboardList },
          { id: 'REPORT', label: t('nav.report'), icon: PieChart },
          { id: 'SIMULATION', label: 'Simulasi Nilai', icon: Calculator }, 
        ];

      case UserRole.AUDITOR:
        return [
          ...base,
          { id: 'AUDIT_EXECUTION', label: t('nav.my_assign'), icon: ClipboardList },
          { id: 'REPORT', label: t('nav.my_reports'), icon: PieChart },
          { id: 'SIMULATION', label: 'Simulasi Nilai', icon: Calculator }, 
        ];
      
      case UserRole.DEPT_HEAD:
        return [
          ...base,
          { id: 'AUDIT_EXECUTION', label: t('nav.my_audits'), icon: ClipboardList },
          { id: 'REPORT', label: t('nav.dept_reports'), icon: PieChart },
          { id: 'SIMULATION', label: 'Simulasi Nilai', icon: Calculator }, 
        ];

      case UserRole.AUDITEE:
        // EXPLICITLY REMOVE DASHBOARD FOR AUDITEE
        // Auditee starts directly at Audit Execution
        return [
          { id: 'AUDIT_EXECUTION', label: t('nav.my_audits'), icon: ClipboardList },
          { id: 'REPORT', label: t('nav.dept_reports'), icon: PieChart },
          { id: 'SIMULATION', label: 'Simulasi Nilai', icon: Calculator }, 
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

      {/* Dynamic Header from Settings - COMPACT */}
      <div className={`flex items-center border-b border-slate-700 transition-all duration-300 ${!isExpanded ? 'p-3 justify-center h-16' : 'p-4 gap-3 h-16'}`}>
        {settings.logoUrl ? (
          <div className={`bg-white rounded-lg p-1 flex items-center justify-center shrink-0 overflow-hidden transition-all duration-300 ${!isExpanded ? 'w-8 h-8' : 'w-9 h-9'}`}>
            <img src={settings.logoUrl} alt="App Logo" className="w-full h-full object-contain" />
          </div>
        ) : (
          <div 
            className={`rounded-lg shrink-0 flex items-center justify-center transition-all duration-300 ${!isExpanded ? 'p-1.5' : 'p-2'}`}
            style={{ backgroundColor: settings.themeColor || '#2563eb' }}
          >
            <ShieldCheck size={isExpanded ? 20 : 24} className="text-white" />
          </div>
        )}
        
        {isExpanded && (
          <div className="overflow-hidden animate-fade-in relative w-full">
            <div className="flex justify-between items-start">
                <div className="flex-1 overflow-hidden group cursor-pointer" onClick={() => setIsProfileOpen(true)} title="Klik untuk edit profil">
                    <h1 className="font-bold text-base tracking-tight truncate leading-tight group-hover:text-blue-400 transition-colors" title={settings.appName}>
                    {settings.appName}
                    </h1>
                    <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                       {currentUser?.role || 'Guest'} <Settings size={8} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </p>
                </div>
                
                {/* Notification Bell */}
                <div ref={notificationRef} className="relative">
                    <button 
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-1 text-slate-400 hover:text-white transition-colors"
                    >
                        <Bell size={16} />
                        {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-slate-900"></span>
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

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
        {isExpanded && (
          <div className="mb-1 px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider animate-fade-in">
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
                !isExpanded ? 'justify-center p-2.5 rounded-xl' : 'gap-3 px-3 py-2.5 rounded-lg'
              } ${
                isActive
                  ? 'shadow-lg shadow-black/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {/* @ts-ignore */}
              <item.icon size={!isExpanded ? 22 : 18} className={`shrink-0 transition-transform duration-300 ${isActive && !isExpanded ? 'scale-110' : ''}`} />
              
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
        
        {/* User Profile / Change Password Quick Access */}
        {isExpanded && (
            <button 
                onClick={() => setIsProfileOpen(true)}
                className="w-full flex items-center gap-3 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700/50 group"
            >
                <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold text-slate-200 group-hover:bg-blue-600 group-hover:text-white transition-colors overflow-hidden">
                    {currentUser?.avatarUrl ? (
                      <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      currentUser?.name.charAt(0)
                    )}
                </div>
                <div className="text-left overflow-hidden flex-1">
                    <p className="text-xs font-bold text-slate-200 truncate">{currentUser?.name}</p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Key size={10} /> Ubah Password
                    </p>
                </div>
            </button>
        )}

        {/* Language Switcher */}
        <div className={`bg-slate-800 rounded-lg flex transition-all ${!isExpanded ? 'flex-col p-1 gap-1' : 'p-1'}`}>
          <button 
            onClick={() => setLanguage('id')}
            className={`flex-1 py-1 text-[10px] font-bold rounded transition-colors ${language === 'id' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            ID
          </button>
          <button 
            onClick={() => setLanguage('en')}
            className={`flex-1 py-1 text-[10px] font-bold rounded transition-colors ${language === 'en' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            EN
          </button>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className={`w-full flex items-center transition-all duration-200 group ${
            !isExpanded ? 'justify-center p-2 rounded-lg' : 'gap-3 px-4 py-2 rounded-lg'
          } text-red-400 hover:bg-red-500/10 hover:text-red-300`}
          title={!isExpanded ? t('nav.logout') : ''}
        >
          <LogOut size={!isExpanded ? 20 : 18} className="shrink-0" />
          {isExpanded && (
             <span className="font-medium text-sm truncate animate-fade-in delay-75">{t('nav.logout')}</span>
          )}
        </button>
      </div>

      {/* PROFILE / CHANGE PASSWORD MODAL */}
      {isProfileOpen && currentUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-slate-800">
            {/* Modal Header & Avatar Section */}
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 border-b border-slate-100 p-6 flex items-start justify-between relative">
               <div className="flex items-center gap-4">
                  {/* Avatar Upload */}
                  <div className="relative group">
                    <div className="w-16 h-16 rounded-full bg-white border-2 border-white shadow-md flex items-center justify-center text-blue-600 overflow-hidden">
                       {(tempAvatar || currentUser.avatarUrl) ? (
                         <img src={tempAvatar || currentUser.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                       ) : (
                         <User size={32} />
                       )}
                    </div>
                    {/* Hover Overlay for Upload */}
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                      title="Ganti Foto"
                    >
                       <Camera size={20} />
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={handleFileChange}
                    />
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-lg">{currentUser.name}</h3>
                    <p className="text-xs text-slate-500">@{currentUser.username} • <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold">{currentUser.role}</span></p>
                    <p className="text-xs text-slate-400 mt-1">{currentUser.department || 'Non-Departmental'}</p>
                    
                    {/* Show "Save Avatar" button if temp avatar exists */}
                    {tempAvatar && (
                       <button 
                         onClick={() => setShowAvatarConfirm(true)}
                         className="mt-2 text-[10px] bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded flex items-center gap-1 transition-colors shadow-sm"
                       >
                         <Save size={10} /> Simpan Foto
                       </button>
                    )}
                  </div>
               </div>
               <button onClick={() => setIsProfileOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={20} />
               </button>
            </div>
            
            <form onSubmit={handlePasswordValidation} className="p-6 space-y-4">
               
               <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-2">
                     <Key size={12} /> Ganti Password
                  </h4>
                  
                  <div>
                     <label className="block text-xs font-medium text-slate-600 mb-1">Password Lama</label>
                     <input 
                        type="password" 
                        required 
                        value={passForm.oldPassword}
                        onChange={(e) => setPassForm({...passForm, oldPassword: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="••••••"
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-medium text-slate-600 mb-1">Password Baru</label>
                     <input 
                        type="password" 
                        required 
                        value={passForm.newPassword}
                        onChange={(e) => setPassForm({...passForm, newPassword: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Minimal 3 karakter"
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-medium text-slate-600 mb-1">Konfirmasi Password Baru</label>
                     <input 
                        type="password" 
                        required 
                        value={passForm.confirmPassword}
                        onChange={(e) => setPassForm({...passForm, confirmPassword: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Ulangi password baru"
                     />
                  </div>
               </div>

               <div className="pt-4 flex gap-3">
                  <button 
                     type="button" 
                     onClick={() => setIsProfileOpen(false)}
                     className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                  >
                     Batal
                  </button>
                  <button 
                     type="submit" 
                     disabled={isSavingProfile}
                     className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                     {isSavingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                     Simpan Password
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL - PASSWORD */}
      {showPasswordConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600">
                 <Key size={24} />
              </div>
              <div>
                 <h3 className="text-lg font-bold text-slate-900 mb-2">Apakah Anda Yakin?</h3>
                 <p className="text-sm text-slate-500">
                    Anda akan mengubah password akun Anda. Pastikan Anda mengingat password baru ini.
                 </p>
              </div>
              <div className="flex gap-3 pt-2">
                 <button 
                   onClick={() => setShowPasswordConfirm(false)}
                   className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-200 transition-colors"
                 >
                   Batal
                 </button>
                 <button 
                   onClick={executePasswordChange}
                   className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/20"
                 >
                   Ya, Simpan
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* CONFIRMATION MODAL - AVATAR */}
      {showAvatarConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                 <ImageIcon size={24} />
              </div>
              <div>
                 <h3 className="text-lg font-bold text-slate-900 mb-2">Ganti Foto Profil?</h3>
                 <p className="text-sm text-slate-500">
                    Apakah Anda yakin ingin memperbarui foto profil Anda dengan gambar yang baru dipilih?
                 </p>
                 {tempAvatar && (
                    <div className="mt-3 flex justify-center">
                       <img src={tempAvatar} alt="Preview" className="w-16 h-16 rounded-full border-2 border-slate-200 object-cover" />
                    </div>
                 )}
              </div>
              <div className="flex gap-3 pt-2">
                 <button 
                   onClick={() => setShowAvatarConfirm(false)}
                   className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-200 transition-colors"
                 >
                   Batal
                 </button>
                 <button 
                   onClick={executeAvatarSave}
                   className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 transition-colors shadow-lg shadow-green-900/20"
                 >
                   Ya, Ganti
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;