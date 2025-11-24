import { useState, FC, FormEvent, ChangeEvent } from 'react';
import { ViewState, UserRole, AuditStandard, User } from '../types';
import { 
  Users, Settings, Database, X, Plus, Edit, Trash2, Search, 
  UserCog, Save, FileBox, Clock,
  Power, UserCheck, Info, Crown, Contact, Loader2, HelpCircle,
  Filter, Lock, ListChecks, ChevronDown, ChevronUp, Upload, Palette, RotateCcw,
  Layers, LayoutList, Camera, User as UserIcon
} from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { useMasterData, Unit, MasterQuestion } from '../MasterDataContext';
import { useAuth } from '../AuthContext';
import { useSettings } from '../SettingsContext';

interface Props {
  view: ViewState;
  onNavigate?: (view: ViewState) => void;
}

const ManagementPlaceholder: FC<Props> = ({ view, onNavigate }) => {
  const { t } = useLanguage();
  
  // --- CONTEXTS ---
  const { 
    units, addUnit, updateUnit, deleteUnit,
    questions, addQuestion, updateQuestion, deleteQuestion 
  } = useMasterData();
  
  const { 
    users, addUser, updateUser, deleteUser, currentUser
  } = useAuth();

  const { settings, updateSettings } = useSettings();

  // --- STATES ---

  // Settings Save State
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [saveSettingsModal, setSaveSettingsModal] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);

  // User Management
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');
  const [userDeptFilter, setUserDeptFilter] = useState<string>('ALL');
  const [userForm, setUserForm] = useState<Partial<User>>({ role: UserRole.AUDITOR, status: 'Active' });
  const [isEditingUser, setIsEditingUser] = useState(false);
  
  // User Confirmation States
  const [confirmUserModal, setConfirmUserModal] = useState(false);

  // User Deletion & Deactivation Modal States
  const [deactivateModal, setDeactivateModal] = useState<{ open: boolean; user: User | null }>({
    open: false,
    user: null
  });
  const [deleteUserModal, setDeleteUserModal] = useState<{ open: boolean; userId: string | null; userName: string }>({
    open: false,
    userId: null,
    userName: ''
  });

  // Unit Management
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [unitSearchTerm, setUnitSearchTerm] = useState('');
  const [unitForm, setUnitForm] = useState<Partial<Unit>>({});
  const [isEditingUnit, setIsEditingUnit] = useState(false);
  
  // Delete Unit Confirmation State
  const [deleteUnitModal, setDeleteUnitModal] = useState<{ 
    open: boolean; 
    unitId: number | null; 
    unitName: string 
  }>({
    open: false,
    unitId: null,
    unitName: ''
  });

  // Template Management
  const [activeStandard, setActiveStandard] = useState<AuditStandard>(AuditStandard.PERMENDIKTISAINTEK_2025);
  const [qSearchTerm, setQSearchTerm] = useState('');
  const [isQModalOpen, setIsQModalOpen] = useState(false);
  const [qForm, setQForm] = useState<Partial<MasterQuestion>>({});
  const [isEditingQ, setIsEditingQ] = useState(false);
  const [deleteTemplateModal, setDeleteTemplateModal] = useState<{ open: boolean; questionId: string | null; questionText: string }>({ 
    open: false, 
    questionId: null, 
    questionText: '' 
  });
  const [confirmQuestionModal, setConfirmQuestionModal] = useState(false);
  
  // State to track open/closed categories in the matrix view
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  // --- HANDLERS: SETTINGS ---
  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalSettings(prev => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const confirmSaveSettings = () => {
    setSaveSettingsModal(false);
    setIsSavingSettings(true);
    // Simulate API call / Persist duration
    setTimeout(() => {
      updateSettings(localSettings);
      setIsSavingSettings(false);
      alert("Pengaturan Sistem Berhasil Disimpan & Diterapkan.");
      
      // Redirect to Dashboard if navigation prop is provided
      if (onNavigate) {
        onNavigate('DASHBOARD');
      }
    }, 800);
  };

  // --- HANDLERS: USER ---
  const filteredUsers = users.filter(u => {
    const searchLower = userSearchTerm.toLowerCase();
    const matchesSearch = u.name.toLowerCase().includes(searchLower) ||
                          (u.username || '').toLowerCase().includes(searchLower);
    
    const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    
    let matchesDept = true;
    if (userDeptFilter !== 'ALL') {
        if (userDeptFilter === 'Global') {
            matchesDept = !u.department;
        } else {
            matchesDept = u.department === userDeptFilter;
        }
    }

    return matchesSearch && matchesRole && matchesDept;
  });

  // Handle Avatar Upload for User
  const handleUserAvatarUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit
         alert("Ukuran file terlalu besar (Maks 1MB)");
         return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserForm(prev => ({ ...prev, avatarUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger Modal Confirmation instead of immediate save
  const handleUserSubmit = (e: FormEvent) => {
    e.preventDefault();
    setConfirmUserModal(true);
  };

  // Actual Execution Logic (Called after modal confirmation)
  const executeSaveUser = () => {
    if (isEditingUser && userForm.id) {
      // Logic: If password provided, update it. If empty, keep original.
      const originalUser = users.find(u => u.id === userForm.id);
      const updatedUser = {
         ...userForm,
         password: userForm.password ? userForm.password : originalUser?.password
      };
      updateUser(updatedUser as User);
    } else {
      addUser({ ...userForm, id: Date.now().toString() } as User);
    }
    
    setConfirmUserModal(false);
    setIsUserModalOpen(false);
    setUserForm({ role: UserRole.AUDITOR, status: 'Active' });
  };

  const openEditUser = (user: User) => {
    // Exclude password from form so it shows as empty (indicating "unchanged")
    const { password, ...rest } = user;
    setUserForm(rest);
    setIsEditingUser(true);
    setIsUserModalOpen(true);
  };

  const openAddUser = () => {
    setUserForm({ role: UserRole.AUDITOR, status: 'Active' });
    setIsEditingUser(false);
    setIsUserModalOpen(true);
  };
  
  const handleStatusToggle = (user: User) => {
    if (user.status === 'Active') {
      setDeactivateModal({ open: true, user });
    } else {
      // Confirm Activation
      if (window.confirm(t('confirm.action'))) {
        updateUser({ ...user, status: 'Active' });
      }
    }
  };

  const confirmDeactivation = () => {
    if (deactivateModal.user) {
      updateUser({ ...deactivateModal.user, status: 'Inactive' });
      setDeactivateModal({ open: false, user: null });
    }
  };

  const confirmDeleteUser = () => {
    if (deleteUserModal.userId) {
      deleteUser(deleteUserModal.userId);
      setDeleteUserModal({ open: false, userId: null, userName: '' });
    }
  };

  // --- HANDLERS: UNIT ---
  const filteredUnits = units.filter(u => 
    u.name.toLowerCase().includes(unitSearchTerm.toLowerCase()) ||
    u.code.toLowerCase().includes(unitSearchTerm.toLowerCase())
  );

  const handleSaveUnit = (e: FormEvent) => {
    e.preventDefault();
    const msg = isEditingUnit ? t('confirm.update') : t('confirm.add');
    // Confirm Add/Update
    if (!window.confirm(msg)) return;

    if (isEditingUnit && unitForm.id) {
      updateUnit(unitForm as Unit);
    } else {
      addUnit(unitForm as Unit);
    }
    setIsUnitModalOpen(false);
    setUnitForm({});
  };

  const confirmDeleteUnit = () => {
    if (deleteUnitModal.unitId !== null) {
      deleteUnit(deleteUnitModal.unitId);
      setDeleteUnitModal({ open: false, unitId: null, unitName: '' });
    }
  };

  // --- HANDLERS: TEMPLATE ---
  const filteredQuestions = questions.filter(q => {
      const matchesStandard = q.standard === activeStandard;
      const matchesSearch = qSearchTerm 
        ? q.text.toLowerCase().includes(qSearchTerm.toLowerCase()) || q.category.toLowerCase().includes(qSearchTerm.toLowerCase())
        : true;
      return matchesStandard && matchesSearch;
  });

  // Group questions by category for "Matrix" view
  const groupedQuestions = filteredQuestions.reduce<Record<string, MasterQuestion[]>>((acc, q) => {
      if (!acc[q.category]) {
          acc[q.category] = [];
      }
      acc[q.category].push(q);
      return acc;
  }, {});

  const toggleCategory = (cat: string) => {
    setOpenCategories(prev => ({
      ...prev,
      [cat]: !prev[cat]
    }));
  };

  const handleSaveQuestion = (e: FormEvent) => {
    e.preventDefault();

    // VALIDATION - Enforce ID, Category, Text
    if (!qForm.id || !qForm.category || !qForm.text) {
      alert("Mohon lengkapi semua field wajib: ID, Kategori, dan Pertanyaan.");
      return;
    }
    
    // Check duplicate ID ONLY if adding new
    if (!isEditingQ) {
      const exists = questions.some(q => q.id === qForm.id);
      if (exists) {
         alert(`ID Pertanyaan '${qForm.id}' sudah digunakan. Mohon gunakan ID yang unik.`);
         return;
      }
    }

    // Trigger Modal Confirmation
    setConfirmQuestionModal(true);
  };

  const executeSaveQuestion = () => {
    const finalStandard = qForm.standard || activeStandard;

    const questionData: MasterQuestion = { 
        id: qForm.id!,
        standard: finalStandard,
        category: qForm.category!,
        text: qForm.text!
    };
    
    if (isEditingQ) {
      updateQuestion(questionData);
    } else {
      addQuestion(questionData);
    }
    
    setConfirmQuestionModal(false);
    setIsQModalOpen(false);
    setQForm({});
  };

  const confirmDeleteTemplate = () => {
    if (deleteTemplateModal.questionId) {
      deleteQuestion(deleteTemplateModal.questionId);
      setDeleteTemplateModal({ open: false, questionId: null, questionText: '' });
    }
  };

  const getRoleDescription = (role: UserRole | undefined) => {
    switch (role) {
      case UserRole.SUPER_ADMIN: return "Full system access, configuration, and user management. Can view all reports.";
      case UserRole.ADMIN: return "Operational access, scheduling, master data management, and reporting.";
      case UserRole.AUDITOR_LEAD: return "Can monitor ALL active audits, perform verification, and access all reports. Acts as the quality coordinator.";
      case UserRole.AUDITOR: return "Can only access audits assigned to them. Duties: verify evidence, compliance verdict, and provide notes.";
      case UserRole.DEPT_HEAD: return "Head of Unit. Can access all audits within their Department. Duties: Approve Action Plans & Monitor progress.";
      case UserRole.AUDITEE: return "Operational Staff. Restricted to own Unit. Duties: Upload evidence and fill self-assessment.";
      default: return "Select a role to see description.";
    }
  };

  // --- RENDER CONTENT ---

  const renderUserMgmt = () => (
    <div className="flex flex-col h-full animate-fade-in bg-slate-50">
      {/* Fixed Header with Integrated Filters */}
      <div className="flex-none bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="text-blue-600" /> {t('mgmt.user.title')}
          </h2>
          <p className="text-slate-500">{t('mgmt.user.desc')}</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto items-stretch md:items-center">
            {/* Search Input */}
            <div className="relative flex-1 md:w-64">
                 <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                 <input 
                   type="text" 
                   placeholder="Cari nama atau username..." 
                   className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-white shadow-sm"
                   value={userSearchTerm}
                   onChange={(e) => setUserSearchTerm(e.target.value)}
                 />
            </div>

            {/* Filter Group */}
            <div className="flex gap-2 w-full md:w-auto">
                  <div className="relative shrink-0 flex-1 md:flex-none">
                     <select 
                        value={userRoleFilter}
                        onChange={(e) => setUserRoleFilter(e.target.value)}
                        className="w-full pl-3 pr-8 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white cursor-pointer hover:bg-slate-50 shadow-sm"
                     >
                        <option value="ALL">Semua Peran</option>
                        {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                     </select>
                  </div>

                  <div className="relative shrink-0 flex-1 md:flex-none max-w-[200px]">
                     <select 
                        value={userDeptFilter}
                        onChange={(e) => setUserDeptFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white cursor-pointer hover:bg-slate-50 truncate shadow-sm"
                     >
                        <option value="ALL">Semua Unit</option>
                        <option value="Global">Non-Unit (Global)</option>
                        {units.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                     </select>
                  </div>
            </div>

            {/* Add Button */}
            <button 
                onClick={openAddUser}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-sm shrink-0"
            >
                <Plus size={18} /> 
                <span className="hidden md:inline">{t('mgmt.btnAdd')}</span>
                <span className="md:hidden">Tambah</span>
            </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">{t('mgmt.th.name')}</th>
                  <th className="px-6 py-3">{t('mgmt.th.role')}</th>
                  <th className="px-6 py-3">{t('mgmt.th.dept')}</th>
                  <th className="px-6 py-3">{t('mgmt.th.status')}</th>
                  <th className="px-6 py-3 text-right">{t('mgmt.th.action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                    <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                            <div className="flex flex-col items-center">
                                <Search size={40} className="mb-2 opacity-20" />
                                <p>Tidak ada pengguna yang ditemukan.</p>
                            </div>
                        </td>
                    </tr>
                ) : (
                    filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3 font-medium flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold overflow-hidden border border-slate-200">
                            {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="Av" className="w-full h-full object-cover" />
                            ) : (
                            user.name.charAt(0)
                            )}
                        </div>
                        <div>
                            <div>{user.name}</div>
                            <div className="text-xs text-slate-400">@{user.username}</div>
                        </div>
                        </td>
                        <td className="px-6 py-3">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${
                            user.role === UserRole.ADMIN ? 'bg-purple-50 text-purple-700 border-purple-100' :
                            user.role === UserRole.AUDITOR_LEAD ? 'bg-teal-50 text-teal-700 border-teal-100' :
                            user.role === UserRole.AUDITOR ? 'bg-green-50 text-green-700 border-green-100' :
                            user.role === UserRole.DEPT_HEAD ? 'bg-orange-50 text-orange-700 border-orange-100' :
                            user.role === UserRole.SUPER_ADMIN ? 'bg-red-50 text-red-700 border-red-100' :
                            'bg-slate-50 text-slate-600 border-slate-100'
                        }`}>
                            {user.role}
                        </span>
                        </td>
                        <td className="px-6 py-3 text-slate-500">{user.department || '-'}</td>
                        <td className="px-6 py-3">
                        <span className={`flex items-center gap-1 text-xs font-bold ${user.status === 'Active' ? 'text-green-600' : 'text-slate-400'}`}>
                            <span className={`w-2 h-2 rounded-full ${user.status === 'Active' ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                            {user.status}
                        </span>
                        </td>
                        <td className="px-6 py-3 text-right">
                        {user.role === UserRole.SUPER_ADMIN && currentUser?.role !== UserRole.SUPER_ADMIN ? (
                            <span className="flex items-center justify-end gap-1 text-xs text-slate-400 italic cursor-not-allowed bg-slate-100 px-2 py-1 rounded border border-slate-200 w-fit ml-auto">
                                <Lock size={12} /> Protected
                            </span>
                        ) : (
                            <div className="flex items-center justify-end gap-2">
                            <button 
                                onClick={() => handleStatusToggle(user)}
                                className={`p-1.5 rounded transition-colors ${
                                user.status === 'Active' 
                                    ? 'text-amber-600 hover:bg-amber-50' 
                                    : 'text-green-600 hover:bg-green-50'
                                }`}
                                title={user.status === 'Active' ? "Deactivate User" : "Activate User"}
                            >
                                {user.status === 'Active' ? <Power size={16} /> : <UserCheck size={16} />}
                            </button>
                            <button onClick={() => openEditUser(user)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16} /></button>
                            <button 
                                onClick={() => setDeleteUserModal({ open: true, userId: user.id, userName: user.name })}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                title="Delete User"
                            >
                                <Trash2 size={16} />
                            </button>
                            </div>
                        )}
                        </td>
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

  const renderMasterData = () => (
    <div className="flex flex-col h-full animate-fade-in bg-slate-50">
      <div className="flex-none bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <div><h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Database className="text-blue-600" /> {t('master.title')}</h2><p className="text-slate-500">{t('master.desc')}</p></div>
        <button onClick={() => { setUnitForm({}); setIsEditingUnit(false); setIsUnitModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"><Plus size={18} /> {t('master.btn.add')}</button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-6 pb-20">
         <div className="max-w-7xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-4 border-b border-slate-100 flex items-center gap-4">
                <Search className="text-slate-400" size={18} />
                <input type="text" placeholder="Cari Unit Kerja..." className="w-full text-sm outline-none" value={unitSearchTerm} onChange={(e) => setUnitSearchTerm(e.target.value)} />
            </div>
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-medium"><tr><th className="px-6 py-3">{t('master.th.code')}</th><th className="px-6 py-3">{t('master.th.name')}</th><th className="px-6 py-3">{t('master.th.type')}</th><th className="px-6 py-3">{t('master.th.faculty')}</th><th className="px-6 py-3 text-right">{t('mgmt.th.action')}</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredUnits.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50">
                            <td className="px-6 py-3 font-mono font-medium text-slate-600">{u.code}</td>
                            <td className="px-6 py-3 font-medium text-slate-800">{u.name}<div className="text-xs text-slate-400 font-normal">{u.head}</div></td>
                            <td className="px-6 py-3"><span className="bg-slate-100 px-2 py-1 rounded text-xs">{u.type}</span></td>
                            <td className="px-6 py-3 text-slate-500">{u.faculty}</td>
                            <td className="px-6 py-3 text-right flex justify-end gap-2">
                                <button onClick={() => { setUnitForm(u); setIsEditingUnit(true); setIsUnitModalOpen(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16} /></button>
                                <button onClick={() => setDeleteUnitModal({ open: true, unitId: u.id, unitName: u.name })} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
         </div>
      </div>
    </div>
  );

  const renderTemplateMgmt = () => (
     <div className="flex flex-col h-full animate-fade-in bg-slate-50">
        <div className="flex-none bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
           <div>
             <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
               <FileBox className="text-blue-600" /> {t('mgmt.tmpl.title')}
             </h2>
             <p className="text-slate-500">{t('mgmt.tmpl.desc')}</p>
           </div>

           <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto items-stretch md:items-center">
              {/* Search */}
              <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Cari pertanyaan..." 
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-white shadow-sm" 
                    value={qSearchTerm} 
                    onChange={(e) => setQSearchTerm(e.target.value)} 
                  />
              </div>

              {/* Standard Selector */}
              <div className="relative shrink-0 flex-1 md:flex-none md:w-64">
                 <select 
                    value={activeStandard} 
                    onChange={(e) => setActiveStandard(e.target.value as AuditStandard)} 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white cursor-pointer hover:bg-slate-50 shadow-sm"
                 >
                    {Object.values(AuditStandard).map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
              </div>

              {/* Action Buttons Group */}
              <div className="flex gap-2 shrink-0">
                 {/* Expand/Collapse */}
                 <div className="flex bg-white border border-slate-300 rounded-lg shadow-sm p-0.5">
                    <button 
                      onClick={() => setOpenCategories(Object.keys(groupedQuestions).reduce((acc, key) => ({...acc, [key]: true}), {}))} 
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Expand All"
                    >
                      <LayoutList size={20} />
                    </button>
                    <div className="w-px bg-slate-200 my-1"></div>
                    <button 
                      onClick={() => setOpenCategories({})} 
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Collapse All"
                    >
                      <Layers size={20} />
                    </button>
                 </div>

                 <button 
                   onClick={() => { setQForm({ standard: activeStandard }); setIsEditingQ(false); setIsQModalOpen(true); }} 
                   className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
                 >
                   <Plus size={18} /> 
                   <span className="hidden md:inline">Pertanyaan Baru</span>
                   <span className="md:hidden">Baru</span>
                 </button>
              </div>
           </div>
        </div>
        
        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto px-6 py-6 pb-20">
            <div className="max-w-7xl mx-auto">
                <div className="space-y-4">
                    {Object.entries(groupedQuestions).map(([category, items]) => (
                        <div key={category} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleCategory(category)}>
                                <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2"><ListChecks size={16} className="text-blue-500" /> {category} <span className="text-xs font-normal text-slate-400">({items.length} items)</span></h4>
                                {openCategories[category] ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                            </div>
                            {/* Render if Open (Initialized as false/undefined = Collapsed) */}
                            {(openCategories[category]) && (
                                <div className="divide-y divide-slate-100">
                                    {items.map(q => (
                                        <div key={q.id} className="p-4 hover:bg-slate-50 flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1"><span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{q.id}</span></div>
                                                <p className="text-sm text-slate-800">{q.text}</p>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <button onClick={() => { setQForm(q); setIsEditingQ(true); setIsQModalOpen(true); }} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded"><Edit size={16} /></button>
                                                <button onClick={() => setDeleteTemplateModal({ open: true, questionId: q.id, questionText: q.text })} className="text-red-600 hover:bg-red-50 p-1.5 rounded"><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                    {Object.keys(groupedQuestions).length === 0 && <div className="text-center py-10 text-slate-400"><FileBox size={48} className="mx-auto mb-2 opacity-20" /><p>Belum ada pertanyaan untuk standar ini.</p></div>}
                </div>
            </div>
        </div>
     </div>
  );

  const renderSettings = () => (
     <div className="flex flex-col h-full animate-fade-in bg-slate-50">
        <div className="flex-none bg-slate-50 border-b border-slate-200 px-6 py-4"><h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Settings className="text-blue-600" /> {t('mgmt.set.title')}</h2><p className="text-slate-500">{t('mgmt.set.desc')}</p></div>
        <div className="flex-1 overflow-y-auto px-6 py-6 pb-20">
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Palette size={20} className="text-blue-500" /> {t('mgmt.set.brand')}</h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div><label className="block text-sm font-bold text-slate-700 mb-1">{t('mgmt.set.appName')}</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" value={localSettings.appName} onChange={e => setLocalSettings({...localSettings, appName: e.target.value})} /></div>
                            <div><label className="block text-sm font-bold text-slate-700 mb-1">{t('mgmt.set.theme')}</label><div className="flex gap-2"><input type="color" className="h-10 w-20 p-1 border rounded cursor-pointer" value={localSettings.themeColor} onChange={e => setLocalSettings({...localSettings, themeColor: e.target.value})} /><input type="text" className="flex-1 border rounded-lg px-3 py-2 text-sm uppercase" value={localSettings.themeColor} onChange={e => setLocalSettings({...localSettings, themeColor: e.target.value})} /></div></div>
                        </div>
                        <div><label className="block text-sm font-bold text-slate-700 mb-1">{t('mgmt.set.logo')}</label><div className="flex items-center gap-4"><div className="w-16 h-16 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center overflow-hidden bg-slate-50 relative group">{localSettings.logoUrl ? <img src={localSettings.logoUrl} alt="Logo" className="w-full h-full object-contain" /> : <Upload className="text-slate-400" />}</div><div className="flex-1"><input type="file" accept="image/*" onChange={handleLogoUpload} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" /><p className="text-xs text-slate-400 mt-1">Format: PNG, JPG, SVG (Max 1MB)</p></div></div></div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Clock size={20} className="text-green-500" /> {t('mgmt.set.cycle')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><label className="block text-sm font-bold text-slate-700 mb-1">{t('mgmt.set.period')}</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" value={localSettings.auditPeriod} onChange={e => setLocalSettings({...localSettings, auditPeriod: e.target.value})} placeholder="e.g. 2024/2025 Genap" /></div>
                        <div><label className="block text-sm font-bold text-slate-700 mb-1">{t('mgmt.set.std')}</label><select className="w-full border rounded-lg px-3 py-2 text-sm" value={localSettings.defaultStandard} onChange={e => setLocalSettings({...localSettings, defaultStandard: e.target.value as AuditStandard})}>{Object.values(AuditStandard).map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                    </div>
                </div>
                <div className="flex justify-end pt-4">
                    <button onClick={() => setSaveSettingsModal(true)} disabled={isSavingSettings} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg shadow-blue-900/20 flex items-center gap-2 transition-all">{isSavingSettings ? <Loader2 className="animate-spin" /> : <Save size={20} />} {t('mgmt.set.save')}</button>
                </div>
            </div>
        </div>
        {saveSettingsModal && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in"><div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-center space-y-4"><h3 className="text-lg font-bold text-slate-900">Simpan Pengaturan?</h3><p className="text-sm text-slate-500">Perubahan akan diterapkan ke seluruh sistem.</p><div className="flex gap-3 pt-2"><button onClick={() => setSaveSettingsModal(false)} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium">Batal</button><button onClick={confirmSaveSettings} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">Ya, Simpan</button></div></div></div>
        )}
     </div>
  );

  // Switcher
  if (view === 'USER_MGMT') return (
    <>
      {renderUserMgmt()}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">{isEditingUser ? t('mgmt.modal.edit') : t('mgmt.modal.add')}</h3>
              <button onClick={() => setIsUserModalOpen(false)}><X size={20} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleUserSubmit} className="p-6 space-y-4">
               {/* AVATAR UPLOAD SECTION */}
               <div className="flex justify-center mb-4">
                  <div className="relative group">
                      <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                          {userForm.avatarUrl ? (
                              <img src={userForm.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                              <UserIcon size={40} className="text-slate-300" />
                          )}
                      </div>
                      <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                          <Camera size={24} />
                      </div>
                      <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleUserAvatarUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded-full"
                          title="Upload Foto Profil"
                      />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('mgmt.form.name')}</label><input required type="text" className="w-full border rounded p-2 text-sm" value={userForm.name || ''} onChange={e => setUserForm({...userForm, name: e.target.value})} /></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('mgmt.form.user')}</label><input required type="text" className="w-full border rounded p-2 text-sm" value={userForm.username || ''} onChange={e => setUserForm({...userForm, username: e.target.value})} /></div>
               </div>
               <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">{isEditingUser ? t('mgmt.form.pass.edit') : t('mgmt.form.pass')}</label><input type="text" className="w-full border rounded p-2 text-sm" value={userForm.password || ''} onChange={e => setUserForm({...userForm, password: e.target.value})} placeholder={isEditingUser ? "••••••••" : "Set Password"} required={!isEditingUser} /></div>
               <div className="grid grid-cols-2 gap-4">
                 <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('mgmt.form.role')}</label><select className="w-full border rounded p-2 text-sm" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value as UserRole})}>{Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                 <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('mgmt.form.dept')}</label><select className="w-full border rounded p-2 text-sm" value={userForm.department || ''} onChange={e => setUserForm({...userForm, department: e.target.value})}><option value="">- None / Global -</option>{units.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}</select></div>
               </div>
               
               <div className="p-3 bg-blue-50 text-blue-700 text-xs rounded border border-blue-100 flex items-start gap-2">
                 {userForm.role === UserRole.AUDITOR_LEAD ? <Crown size={16} className="mt-0.5 shrink-0" /> : 
                 userForm.role === UserRole.DEPT_HEAD ? <Contact size={16} className="mt-0.5 shrink-0" /> :
                 <Info size={16} className="mt-0.5 shrink-0" />}
                 <div><span className="font-bold block mb-0.5">Role Permission: {userForm.role}</span><span>{getRoleDescription(userForm.role)}</span></div>
               </div>

               <div className="flex gap-4 items-center"><label className="flex items-center gap-2 text-sm"><input type="radio" name="status" checked={userForm.status === 'Active'} onChange={() => setUserForm({...userForm, status: 'Active'})} /><span className="text-green-600 font-medium">Active</span></label><label className="flex items-center gap-2 text-sm"><input type="radio" name="status" checked={userForm.status === 'Inactive'} onChange={() => setUserForm({...userForm, status: 'Inactive'})} /><span className="text-slate-500">Inactive</span></label></div>
               <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-4"><button type="button" onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-lg text-sm">{t('mgmt.btn.cancel')}</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">{isEditingUser ? t('mgmt.btn.update') : t('mgmt.btn.save')}</button></div>
            </form>
          </div>
        </div>
      )}
      {confirmUserModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in"><div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-center space-y-4"><h3 className="text-lg font-bold text-slate-900">Konfirmasi?</h3><div className="flex gap-3 pt-2"><button onClick={() => setConfirmUserModal(false)} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm">Batal</button><button onClick={executeSaveUser} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Ya</button></div></div></div>
      )}
      {deactivateModal.open && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"><div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-center space-y-4"><h3 className="text-lg font-bold">Nonaktifkan?</h3><div className="flex gap-3 pt-2"><button onClick={() => setDeactivateModal({open: false, user: null})} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm">Batal</button><button onClick={confirmDeactivation} className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm">Ya</button></div></div></div>}
      {deleteUserModal.open && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"><div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-center space-y-4"><h3 className="text-lg font-bold text-red-600">{t('mgmt.del.title')}</h3><div className="flex gap-3 pt-2"><button onClick={() => setDeleteUserModal({open: false, userId: null, userName: ''})} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm">Batal</button><button onClick={confirmDeleteUser} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm">Hapus</button></div></div></div>}
    </>
  );
  
  if (view === 'MASTER_DATA') return (
     <>
       {renderMasterData()}
       {isUnitModalOpen && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
             <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
                 <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50"><h3 className="font-bold text-slate-800">{isEditingUnit ? t('master.modal.edit') : t('master.modal.add')}</h3><button onClick={() => setIsUnitModalOpen(false)}><X size={20} className="text-slate-400" /></button></div>
                 <form onSubmit={handleSaveUnit} className="p-6 space-y-4">
                     <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('master.form.code')}</label><input required type="text" className="w-full border rounded p-2 text-sm" value={unitForm.code || ''} onChange={e => setUnitForm({...unitForm, code: e.target.value})} /></div>
                     <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('master.form.name')}</label><input required type="text" className="w-full border rounded p-2 text-sm" value={unitForm.name || ''} onChange={e => setUnitForm({...unitForm, name: e.target.value})} /></div>
                     <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('master.form.type')}</label><select className="w-full border rounded p-2 text-sm" value={unitForm.type || ''} onChange={e => setUnitForm({...unitForm, type: e.target.value})}><option value="Program Studi">Program Studi</option><option value="Fakultas">Fakultas</option><option value="Direktorat">Direktorat</option><option value="Biro/Lembaga">Biro/Lembaga</option><option value="UPT">UPT</option><option value="Pimpinan Tinggi">Pimpinan Tinggi</option><option value="Yayasan">Yayasan</option></select></div>
                     <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('master.form.faculty')}</label><select className="w-full border rounded p-2 text-sm" value={unitForm.faculty || ''} onChange={e => setUnitForm({...unitForm, faculty: e.target.value})}><option value="-">None (Top Level)</option>{units.filter(u => u.type !== 'Program Studi').map(u => <option key={u.id} value={u.name}>{u.name}</option>)}</select></div>
                     <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('master.form.head')}</label><input required type="text" className="w-full border rounded p-2 text-sm" value={unitForm.head || ''} onChange={e => setUnitForm({...unitForm, head: e.target.value})} /></div>
                     <div className="pt-4 flex justify-end gap-3"><button type="button" onClick={() => setIsUnitModalOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-lg text-sm">{t('mgmt.btn.cancel')}</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">{t('mgmt.btn.save')}</button></div>
                 </form>
             </div>
         </div>
       )}
       {deleteUnitModal.open && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"><div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-center space-y-4"><h3 className="text-lg font-bold text-red-600">{t('mgmt.del.title')}</h3><div className="flex gap-3 pt-2"><button onClick={() => setDeleteUnitModal({open: false, unitId: null, unitName: ''})} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm">Batal</button><button onClick={confirmDeleteUnit} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm">Hapus</button></div></div></div>}
     </>
  );

  if (view === 'TEMPLATE_MGMT') return (
     <>
        {renderTemplateMgmt()}
        {isQModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
             <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50"><h3 className="font-bold text-slate-800">{isEditingQ ? "Edit Pertanyaan" : "Tambah Pertanyaan Baru"}</h3><button onClick={() => setIsQModalOpen(false)}><X size={20} className="text-slate-400" /></button></div>
                <form onSubmit={handleSaveQuestion} className="p-6 space-y-4">
                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Standar</label><select className="w-full border rounded p-2 text-sm bg-slate-50" value={qForm.standard || activeStandard} disabled>{Object.values(AuditStandard).map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                    <div className="grid grid-cols-3 gap-4">
                        <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">ID (Kode)</label><input required type="text" className="w-full border rounded p-2 text-sm font-mono" value={qForm.id || ''} onChange={e => setQForm({...qForm, id: e.target.value})} placeholder="e.g. C.1.a" /></div>
                        <div className="col-span-2"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kategori</label><input required type="text" className="w-full border rounded p-2 text-sm" value={qForm.category || ''} onChange={e => setQForm({...qForm, category: e.target.value})} placeholder="e.g. Kurikulum" /></div>
                    </div>
                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pertanyaan / Indikator</label><textarea required rows={4} className="w-full border rounded p-2 text-sm" value={qForm.text || ''} onChange={e => setQForm({...qForm, text: e.target.value})} placeholder="Isi butir pertanyaan audit..." /></div>
                    <div className="pt-4 flex justify-end gap-3"><button type="button" onClick={() => setIsQModalOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-lg text-sm">{t('mgmt.btn.cancel')}</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">{t('mgmt.btn.save')}</button></div>
                </form>
             </div>
          </div>
        )}
        {confirmQuestionModal && <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"><div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-center space-y-4"><h3 className="text-lg font-bold">Simpan Pertanyaan?</h3><div className="flex gap-3 pt-2"><button onClick={() => setConfirmQuestionModal(false)} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm">Batal</button><button onClick={executeSaveQuestion} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Ya, Simpan</button></div></div></div>}
        {deleteTemplateModal.open && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"><div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-center space-y-4"><h3 className="text-lg font-bold text-red-600">{t('mgmt.del.title')}</h3><div className="flex gap-3 pt-2"><button onClick={() => setDeleteTemplateModal({open: false, questionId: null, questionText: ''})} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm">Batal</button><button onClick={confirmDeleteTemplate} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm">Hapus</button></div></div></div>}
     </>
  );

  if (view === 'SETTINGS') return renderSettings();

  return null;
};

export default ManagementPlaceholder;