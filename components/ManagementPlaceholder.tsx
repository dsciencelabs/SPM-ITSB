
import { useState, FC, FormEvent, ChangeEvent } from 'react';
import { ViewState, UserRole, AuditStandard, User } from '../types';
import { 
  Users, Settings, Database, CheckCircle2, XCircle, X, Plus, Edit, Trash2, Search, Shield, 
  UserCog, Briefcase, Save, FileBox, Clock,
  Power, UserCheck, Info, Crown, Contact, Loader2, HelpCircle,
  Filter, Lock, ListChecks, ChevronDown, ChevronUp
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
  
  // State to track open/closed categories in the matrix view
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  // --- HANDLERS: SETTINGS ---
  const confirmSaveSettings = () => {
    setSaveSettingsModal(false);
    setIsSavingSettings(true);
    // Simulate API call / Persist duration
    setTimeout(() => {
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

    // FIX: Determine Standard (Form value or Active Tab fallback)
    // This fixes the bug where adding an item without changing dropdown would fail validation
    const finalStandard = qForm.standard || activeStandard;

    // VALIDATION - Enforce ID, Category, Text
    if (!qForm.id || !qForm.category || !qForm.text) {
      alert("Mohon lengkapi semua field wajib: ID, Kategori, dan Pertanyaan.");
      return;
    }

    const msg = isEditingQ ? t('confirm.update') : t('confirm.add');
    if (!window.confirm(msg)) return;

    const questionData: MasterQuestion = { 
        id: qForm.id,
        standard: finalStandard,
        category: qForm.category,
        text: qForm.text
    };
    
    if (isEditingQ) {
      updateQuestion(questionData);
    } else {
      // CHECK DUPLICATE ID
      const exists = questions.some(q => q.id === questionData.id);
      if (exists) {
         alert(`ID Pertanyaan '${questionData.id}' sudah digunakan. Mohon gunakan ID yang unik.`);
         return;
      }
      addQuestion(questionData);
    }
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
    <div className="max-w-7xl mx-auto animate-fade-in">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-sm px-6 py-6 border-b border-slate-200 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="text-blue-600" /> {t('mgmt.user.title')}
          </h2>
          <p className="text-slate-500">{t('mgmt.user.desc')}</p>
        </div>
        <button 
          onClick={openAddUser}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={18} /> {t('mgmt.btnAdd')}
        </button>
      </div>

      <div className="px-6 py-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-center gap-4">
             <div className="relative flex-1 w-full">
               <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
               <input 
                 type="text" 
                 placeholder="Cari nama atau username..." 
                 className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                 value={userSearchTerm}
                 onChange={(e) => setUserSearchTerm(e.target.value)}
               />
             </div>
             
             <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                <div className="relative shrink-0">
                   <Filter className="absolute left-3 top-2.5 text-slate-400" size={16} />
                   <select 
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value)}
                      className="pl-9 pr-8 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white appearance-none cursor-pointer hover:bg-slate-50"
                   >
                      <option value="ALL">Semua Peran</option>
                      {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                   </select>
                </div>

                <div className="relative shrink-0 max-w-[200px]">
                   <select 
                      value={userDeptFilter}
                      onChange={(e) => setUserDeptFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white cursor-pointer hover:bg-slate-50 truncate"
                   >
                      <option value="ALL">Semua Unit</option>
                      <option value="Global">Non-Unit (Global)</option>
                      {units.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                   </select>
                </div>
             </div>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-3">{t('mgmt.th.name')}</th>
                <th className="px-6 py-3">{t('mgmt.th.role')}</th>
                <th className="px-6 py-3">{t('mgmt.th.dept')}</th>
                <th className="px-6 py-3">{t('mgmt.th.status')}</th>
                <th className="px-6 py-3 text-right">{t('mgmt.th.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                      {user.name.charAt(0)}
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
                    {/* 
                      Permission Logic: 
                      - If Target is SuperAdmin AND Current User is NOT SuperAdmin -> Protected.
                      - Otherwise (SuperAdmin editing SuperAdmin, or Admin editing others) -> Allowed.
                    */}
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit User Modal - Z-Index 100 */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">{isEditingUser ? t('mgmt.modal.edit') : t('mgmt.modal.add')}</h3>
              <button onClick={() => setIsUserModalOpen(false)}><X size={20} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleUserSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('mgmt.form.name')}</label>
                  <input required type="text" className="w-full border rounded p-2 text-sm" value={userForm.name || ''} onChange={e => setUserForm({...userForm, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('mgmt.form.user')}</label>
                  <input required type="text" className="w-full border rounded p-2 text-sm" value={userForm.username || ''} onChange={e => setUserForm({...userForm, username: e.target.value})} />
                </div>
              </div>

              <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    {isEditingUser ? t('mgmt.form.pass.edit') : t('mgmt.form.pass')}
                  </label>
                  <input 
                    type="text" 
                    className="w-full border rounded p-2 text-sm" 
                    value={userForm.password || ''} 
                    onChange={e => setUserForm({...userForm, password: e.target.value})}
                    placeholder={isEditingUser ? "•••••••• (Unchanged)" : "Set Password"}
                    required={!isEditingUser}
                  />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('mgmt.form.role')}</label>
                   <select className="w-full border rounded p-2 text-sm" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value as UserRole})}>
                     {Object.values(UserRole)
                       .filter(r => {
                          // SuperAdmin can assign ANY role (including SuperAdmin). 
                          // Admin cannot assign SuperAdmin.
                          if (currentUser?.role === UserRole.SUPER_ADMIN) return true;
                          return r !== UserRole.SUPER_ADMIN;
                       })
                       .map(r => <option key={r} value={r}>{r}</option>)}
                   </select>
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('mgmt.form.dept')}</label>
                   <select className="w-full border rounded p-2 text-sm" value={userForm.department || ''} onChange={e => setUserForm({...userForm, department: e.target.value})}>
                     <option value="">- None / Global -</option>
                     {units.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                   </select>
                 </div>
              </div>

              {/* Role Description Helper */}
              <div className="p-3 bg-blue-50 text-blue-700 text-xs rounded border border-blue-100 flex items-start gap-2">
                {userForm.role === UserRole.AUDITOR_LEAD ? <Crown size={16} className="mt-0.5 shrink-0" /> : 
                 userForm.role === UserRole.DEPT_HEAD ? <Contact size={16} className="mt-0.5 shrink-0" /> :
                 <Info size={16} className="mt-0.5 shrink-0" />}
                <div>
                   <span className="font-bold block mb-0.5">Role Permission: {userForm.role}</span>
                   <span>{getRoleDescription(userForm.role)}</span>
                </div>
              </div>

              <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                 <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" name="status" checked={userForm.status === 'Active'} onChange={() => setUserForm({...userForm, status: 'Active'})} />
                      <span className="text-green-600 font-medium">Active</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" name="status" checked={userForm.status === 'Inactive'} onChange={() => setUserForm({...userForm, status: 'Inactive'})} />
                      <span className="text-slate-500">Inactive</span>
                    </label>
                 </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-4">
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-lg text-sm">{t('mgmt.btn.cancel')}</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                    {isEditingUser ? t('mgmt.btn.update') : t('mgmt.btn.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM UPDATE / ADD USER MODAL */}
      {confirmUserModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600">
              <HelpCircle size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {isEditingUser ? 'Konfirmasi Pembaruan' : 'Konfirmasi Penambahan'}
              </h3>
              <p className="text-sm text-slate-500">
                Apakah Anda yakin ingin {isEditingUser ? 'memperbarui' : 'menambahkan'} data pengguna 
                <span className="font-bold block mt-1 text-slate-800">{userForm.name}</span>
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setConfirmUserModal(false)}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={executeSaveUser}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/20"
              >
                {isEditingUser ? 'Ya, Perbarui' : 'Ya, Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivation Confirmation Modal - Z-Index 100 */}
      {deactivateModal.open && deactivateModal.user && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600">
              <Power size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Deactivate Account?</h3>
              <p className="text-sm text-slate-500">
                Are you sure you want to deactivate <strong>{deactivateModal.user.name}</strong>?
                They will no longer be able to log in to the system.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setDeactivateModal({ open: false, user: null })}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeactivation}
                className="flex-1 px-4 py-2.5 bg-amber-600 text-white rounded-lg font-medium text-sm hover:bg-amber-700 transition-colors shadow-lg shadow-amber-900/20"
              >
                Yes, Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {deleteUserModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{t('mgmt.del.title')}</h3>
              <p className="text-sm text-slate-500">
                {t('mgmt.del.msg')}
                <br />
                <span className="font-bold text-slate-700 block mt-1">{deleteUserModal.userName}</span>
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setDeleteUserModal({ open: false, userId: null, userName: '' })}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-200 transition-colors"
              >
                {t('mgmt.btn.cancel')}
              </button>
              <button 
                onClick={confirmDeleteUser}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-700 transition-colors shadow-lg shadow-red-900/20"
              >
                {t('mgmt.del.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderMasterData = () => (
    <div className="max-w-7xl mx-auto animate-fade-in">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-sm px-6 py-6 border-b border-slate-200 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Database className="text-blue-600" /> {t('master.title')}
          </h2>
          <p className="text-slate-500">{t('master.desc')}</p>
        </div>
        <button 
          onClick={() => { setUnitForm({}); setIsEditingUnit(false); setIsUnitModalOpen(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={18} /> {t('master.btn.add')}
        </button>
      </div>

      <div className="px-6 py-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-100">
            <input 
              type="text" 
              placeholder="Search units..." 
              className="w-full md:w-64 pl-4 pr-4 py-2 border rounded-lg text-sm outline-none focus:border-blue-500"
              value={unitSearchTerm}
              onChange={(e) => setUnitSearchTerm(e.target.value)}
            />
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-3">{t('master.th.code')}</th>
                <th className="px-6 py-3">{t('master.th.name')}</th>
                <th className="px-6 py-3">{t('master.th.type')}</th>
                <th className="px-6 py-3">{t('master.th.faculty')}</th>
                <th className="px-6 py-3">{t('master.th.head')}</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUnits.map(unit => (
                <tr key={unit.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 font-mono text-slate-600">{unit.code}</td>
                  <td className="px-6 py-3 font-medium">{unit.name}</td>
                  <td className="px-6 py-3 text-slate-500">{unit.type}</td>
                  <td className="px-6 py-3 text-slate-500">{unit.faculty}</td>
                  <td className="px-6 py-3 text-slate-500">{unit.head}</td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { setUnitForm(unit); setIsEditingUnit(true); setIsUnitModalOpen(true); }} className="p-1 text-blue-600"><Edit size={16}/></button>
                      <button 
                        onClick={() => setDeleteUnitModal({ open: true, unitId: unit.id, unitName: unit.name })}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Hapus Unit"
                      >
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unit Modal - Z-Index 100 */}
      {isUnitModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">{isEditingUnit ? t('master.modal.edit') : t('master.modal.add')}</h3>
              <button onClick={() => setIsUnitModalOpen(false)}><X size={20} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleSaveUnit} className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('master.form.code')}</label>
                  <input required type="text" className="w-full border rounded p-2 text-sm" value={unitForm.code || ''} onChange={e => setUnitForm({...unitForm, code: e.target.value})} />
                </div>
                <div className="col-span-2">
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('master.form.name')}</label>
                   <input required type="text" className="w-full border rounded p-2 text-sm" value={unitForm.name || ''} onChange={e => setUnitForm({...unitForm, name: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('master.form.type')}</label>
                   <select className="w-full border rounded p-2 text-sm" value={unitForm.type || ''} onChange={e => setUnitForm({...unitForm, type: e.target.value})}>
                      <option value="Fakultas">Fakultas</option>
                      <option value="Program Studi">Program Studi</option>
                      <option value="Biro/Lembaga">Biro/Lembaga</option>
                      <option value="Yayasan">Yayasan</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('master.form.head')}</label>
                   <input type="text" className="w-full border rounded p-2 text-sm" value={unitForm.head || ''} onChange={e => setUnitForm({...unitForm, head: e.target.value})} />
                 </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium mt-2">{t('mgmt.btn.save')}</button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Unit Modal */}
      {deleteUnitModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{t('mgmt.del.title')}</h3>
              <p className="text-sm text-slate-500">
                {t('master.del.msg')}
                <br />
                <span className="font-bold text-slate-700 block mt-1">{deleteUnitModal.unitName}</span>
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setDeleteUnitModal({ open: false, unitId: null, unitName: '' })}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-200 transition-colors"
              >
                {t('mgmt.btn.cancel')}
              </button>
              <button 
                onClick={confirmDeleteUnit}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-700 transition-colors shadow-lg shadow-red-900/20"
              >
                {t('mgmt.del.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderTemplateMgmt = () => {
    // Access Control: Strict Check
    if (currentUser?.role !== UserRole.SUPER_ADMIN && currentUser?.role !== UserRole.ADMIN) {
        return (
            <div className="h-[500px] flex flex-col items-center justify-center text-center text-slate-500 p-8 animate-fade-in">
                <div className="bg-slate-100 p-6 rounded-full mb-4">
                    <Shield size={48} className="text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-700">Akses Dibatasi</h3>
                <p className="max-w-md mx-auto mt-2">
                    Anda tidak memiliki izin untuk mengelola instrumen audit. 
                    Hanya Administrator yang dapat mengubah standar dan butir pertanyaan.
                </p>
            </div>
        );
    }

    return (
      <div className="max-w-7xl mx-auto animate-fade-in">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-sm px-6 py-4 border-b border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <FileBox className="text-blue-600" /> {t('mgmt.tmpl.title')}
              </h2>
              <p className="text-slate-500">{t('mgmt.tmpl.desc')}</p>
            </div>
            <button 
              onClick={() => { setQForm({ standard: activeStandard }); setIsEditingQ(false); setIsQModalOpen(true); }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus size={18} /> Add Item
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              {/* Standard Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide max-w-full md:max-w-3xl">
                {Object.values(AuditStandard).map((std) => {
                  // Explicit labels for specific standards
                  let label: string = std;
                  if (std.includes('LAM TEKNIK')) label = 'LAM TEKNIK';
                  else if (std.includes('LAM INFOKOM')) label = 'LAM INFOKOM';
                  else if (std.includes('BAN-PT')) label = 'BAN-PT';
                  else if (std.includes('Permendiktisaintek')) label = 'Permendiktisaintek';

                  return (
                    <button 
                      key={std}
                      onClick={() => setActiveStandard(std)}
                      className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all border ${
                        activeStandard === std 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Question Search */}
              <div className="relative w-full md:w-64">
                  <input 
                    type="text" 
                    placeholder="Cari butir pertanyaan..."
                    value={qSearchTerm}
                    onChange={(e) => setQSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
              </div>
          </div>
        </div>

        <div className="px-6 py-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center border-b pb-4 mb-4">
                <h3 className="font-bold text-lg text-slate-800">{activeStandard}</h3>
                <span className="text-xs bg-slate-100 px-3 py-1 rounded-full font-bold text-slate-600 border border-slate-200">
                    Total: {filteredQuestions.length} Butir
                </span>
            </div>
            
            {/* MATRIX VIEW GROUPED BY CATEGORY */}
            <div className="space-y-6">
              {Object.keys(groupedQuestions).length === 0 ? (
                <div className="text-center text-slate-400 py-12 border-2 border-dashed border-slate-100 rounded-xl">
                    <Search size={32} className="mx-auto mb-2 opacity-20"/>
                    <p>Tidak ada butir pertanyaan yang ditemukan.</p>
                </div>
              ) : (
                Object.entries(groupedQuestions).map(([category, qs], idx) => {
                  const isOpen = openCategories[category] !== false; // Default open

                  return (
                    <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden">
                        {/* Category Header */}
                        <button 
                          onClick={() => toggleCategory(category)}
                          className="w-full flex justify-between items-center p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                        >
                          <div className="font-bold text-slate-700 text-sm flex items-center gap-2">
                              <ListChecks size={18} className="text-blue-500" />
                              {category}
                          </div>
                          <div className="flex items-center gap-3">
                              <span className="text-xs font-semibold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-500">
                                {qs.length} item
                              </span>
                              {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                          </div>
                        </button>
                        
                        {/* Questions List */}
                        {isOpen && (
                          <div className="divide-y divide-slate-100">
                              {qs.map(q => (
                                  <div key={q.id} className="p-4 flex gap-4 items-start bg-white hover:bg-blue-50/30 transition-colors group">
                                    <div className="shrink-0 w-16 pt-0.5">
                                        <div className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-center border border-slate-200">
                                          {q.id}
                                        </div>
                                    </div>
                                    <div className="flex-1 text-sm text-slate-700 leading-relaxed">
                                        {q.text}
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                          onClick={() => { setQForm(q); setIsEditingQ(true); setIsQModalOpen(true); }} 
                                          className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"
                                          title="Edit"
                                        >
                                          <Edit size={16} />
                                        </button>
                                        <button 
                                          onClick={() => setDeleteTemplateModal({ open: true, questionId: q.id, questionText: q.text })}
                                          className="p-1.5 text-red-600 hover:bg-red-100 rounded"
                                          title="Hapus"
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                    </div>
                                  </div>
                              ))}
                          </div>
                        )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Template Modal - Z-Index 100 */}
        {isQModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800">{isEditingQ ? 'Edit Item' : 'Add Item'}</h3>
                  <button onClick={() => setIsQModalOpen(false)}><X size={20} /></button>
              </div>
              <form onSubmit={handleSaveQuestion} className="p-6 space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Standard</label>
                        <select 
                          className="w-full border rounded p-2 text-sm bg-white" 
                          value={qForm.standard || activeStandard} 
                          onChange={e => setQForm({...qForm, standard: e.target.value})}
                        >
                          {Object.values(AuditStandard).map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-1">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">ID</label>
                      <input 
                        required 
                        type="text" 
                        className="w-full border rounded p-2 text-sm" 
                        value={qForm.id || ''} 
                        onChange={e => setQForm({...qForm, id: e.target.value})} 
                        disabled={isEditingQ} 
                        placeholder="e.g. C.1" 
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                      <input 
                        required 
                        type="text" 
                        className="w-full border rounded p-2 text-sm" 
                        value={qForm.category || ''} 
                        onChange={e => setQForm({...qForm, category: e.target.value})} 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Question Text / Indicator</label>
                    <textarea 
                        required 
                        rows={4} 
                        className="w-full border rounded p-2 text-sm" 
                        value={qForm.text || ''} 
                        onChange={e => setQForm({...qForm, text: e.target.value})} 
                    />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">{t('mgmt.btn.save')}</button>
              </form>
            </div>
          </div>
        )}

        {/* Delete Template Item Confirmation Modal */}
        {deleteTemplateModal.open && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{t('mgmt.del.title')}</h3>
                <p className="text-sm text-slate-500">
                  {t('mgmt.del.msg')}
                </p>
                {deleteTemplateModal.questionText && (
                    <div className="bg-slate-50 p-2 rounded border border-slate-100 text-xs text-slate-600 italic mt-2 text-left line-clamp-3">
                        "{deleteTemplateModal.questionText}"
                    </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setDeleteTemplateModal({ open: false, questionId: null, questionText: '' })}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-200 transition-colors"
                >
                  {t('mgmt.btn.cancel')}
                </button>
                <button 
                  onClick={confirmDeleteTemplate}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-700 transition-colors shadow-lg shadow-red-900/20"
                >
                  {t('mgmt.del.confirm')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const renderSettings = () => (
    <div className="max-w-4xl mx-auto animate-fade-in">
       {/* Sticky Header */}
       <div className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-sm px-6 py-6 border-b border-slate-200">
         <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
           <Settings className="text-blue-600" /> {t('mgmt.set.title')}
         </h2>
         <p className="text-slate-500">{t('mgmt.set.desc')}</p>
       </div>

       <div className="px-6 py-6">
         <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 space-y-8">
            <div>
               <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                  <Briefcase size={20} className="text-slate-400" /> {t('mgmt.set.brand')}
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('mgmt.set.appName')}</label>
                     <input 
                       type="text" 
                       className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                       value={settings.appName}
                       onChange={e => updateSettings({ appName: e.target.value })}
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('mgmt.set.theme')}</label>
                     <div className="flex gap-3">
                        {['#2563eb', '#dc2626', '#16a34a', '#d97706', '#7c3aed', '#0f172a'].map(color => (
                          <button 
                            key={color}
                            onClick={() => updateSettings({ themeColor: color })}
                            className={`w-8 h-8 rounded-full shadow-sm transition-transform hover:scale-110 ${settings.themeColor === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                     </div>
                  </div>
               </div>

               {/* Logo Upload Section */}
               <div className="mt-6 pt-6 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-3">{t('mgmt.set.logo')}</label>
                  <div className="flex items-start gap-6">
                    <div className="shrink-0 relative group">
                      <div className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                        {settings.logoUrl ? (
                          <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                        ) : (
                          <Shield size={32} className="text-slate-300" />
                        )}
                      </div>
                      {settings.logoUrl && (
                        <button 
                          onClick={() => updateSettings({ logoUrl: null })}
                          className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer shadow-sm transition-colors">
                        <Plus size={16} />
                        {t('mgmt.set.upload')}
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/png, image/jpeg, image/svg+xml"
                          onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 2 * 1024 * 1024) {
                                alert("File size must be less than 2MB");
                                return;
                              }
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) {
                                  updateSettings({ logoUrl: event.target.result as string });
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      <p className="mt-2 text-xs text-slate-500 max-w-sm leading-relaxed">
                        Upload your organization's logo (PNG, JPG, or SVG). Max size 2MB. This will replace the default shield icon on the sidebar and login page.
                      </p>
                    </div>
                  </div>
               </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
               <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                  <Clock size={20} className="text-slate-400" /> {t('mgmt.set.cycle')}
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('mgmt.set.period')}</label>
                     <input 
                       type="text" 
                       className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                       value={settings.auditPeriod}
                       onChange={e => updateSettings({ auditPeriod: e.target.value })}
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('mgmt.set.std')}</label>
                     <select 
                        className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={settings.defaultStandard}
                        onChange={e => updateSettings({ defaultStandard: e.target.value as AuditStandard })}
                     >
                        {Object.values(AuditStandard).map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                     </select>
                  </div>
               </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end">
               <button 
                 onClick={() => setSaveSettingsModal(true)}
                 disabled={isSavingSettings}
                 className="bg-slate-900 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
               >
                  {isSavingSettings ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
                  {isSavingSettings ? 'Menyimpan...' : t('mgmt.set.save')}
               </button>
            </div>
         </div>
       </div>

       {/* Save Settings Confirmation Modal */}
       {saveSettingsModal && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center space-y-4">
             <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600">
               <HelpCircle size={24} />
             </div>
             <div>
               <h3 className="text-lg font-bold text-slate-900 mb-2">Konfirmasi Simpan</h3>
               <p className="text-sm text-slate-500">
                 Apakah Anda yakin ingin melakukan Simpan Perubahan Sistem?
               </p>
             </div>
             <div className="flex gap-3 pt-2">
               <button 
                 onClick={() => setSaveSettingsModal(false)}
                 className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-200 transition-colors"
               >
                 {t('mgmt.btn.cancel')}
               </button>
               <button 
                 onClick={confirmSaveSettings}
                 className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/20"
               >
                 Ya, Simpan
               </button>
             </div>
           </div>
         </div>
       )}
    </div>
  );

  // Main Switch
  switch (view) {
    case 'USER_MGMT': return renderUserMgmt();
    case 'MASTER_DATA': return renderMasterData();
    case 'TEMPLATE_MGMT': return renderTemplateMgmt();
    case 'SETTINGS': return renderSettings();
    default: return <div>View not found</div>;
  }
};

export default ManagementPlaceholder;
