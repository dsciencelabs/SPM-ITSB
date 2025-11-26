
import { useState, FC, FormEvent, ChangeEvent } from 'react';
import { ViewState, UserRole, AuditStandard, User as UserType } from '../types';
import { 
  Users, Settings, Database, X, Plus, Edit, Trash2, Search, 
  Save, FileBox, Clock,
  Power, UserCheck, Info, Crown, Contact, Loader2,
  ListChecks, ChevronDown, ChevronUp, Upload, Palette,
  Camera, User as UserIcon, Lock
} from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { useMasterData, Unit, MasterQuestion } from '../MasterDataContext';
import { useAuth } from '../AuthContext';
import { useSettings } from '../SettingsContext';

// --- SUB-COMPONENTS ---

const UserManagementView: FC = () => {
  const { t } = useLanguage();
  const { users, addUser, updateUser, deleteUser, currentUser } = useAuth();
  const { units } = useMasterData();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Partial<UserType>>({ role: UserRole.AUDITOR, status: 'Active' });
  
  // Modals
  const [confirmModal, setConfirmModal] = useState(false);
  const [deactivateModal, setDeactivateModal] = useState<{ open: boolean; user: UserType | null }>({ open: false, user: null });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; userId: string | null; userName: string }>({ open: false, userId: null, userName: '' });

  const filteredUsers = users.filter(u => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = u.name.toLowerCase().includes(searchLower) || (u.username || '').toLowerCase().includes(searchLower);
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    let matchesDept = true;
    if (deptFilter !== 'ALL') {
        matchesDept = deptFilter === 'Global' ? !u.department : u.department === deptFilter;
    }
    return matchesSearch && matchesRole && matchesDept;
  });

  const handleAvatarUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) return alert("Ukuran file terlalu besar (Maks 1MB)");
      const reader = new FileReader();
      reader.onloadend = () => setForm(prev => ({ ...prev, avatarUrl: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const openAdd = () => {
    setForm({ role: UserRole.AUDITOR, status: 'Active' });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEdit = (user: UserType) => {
    const { password, ...rest } = user; // Exclude password
    setForm(rest);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (isEditing && form.id) {
      const original = users.find(u => u.id === form.id);
      const updated = { ...form, password: form.password ? form.password : original?.password };
      updateUser(updated as UserType);
    } else {
      addUser({ ...form, id: Date.now().toString() } as UserType);
    }
    setConfirmModal(false);
    setIsModalOpen(false);
  };
  
  const getRoleDescription = (role: UserRole | undefined) => {
    switch (role) {
      case UserRole.SUPER_ADMIN: return "Full system access.";
      case UserRole.ADMIN: return "Operational access & reporting.";
      case UserRole.AUDITOR_LEAD: return "Monitor audits & verification.";
      case UserRole.AUDITOR: return "Verify evidence & compliance.";
      case UserRole.DEPT_HEAD: return "Approve Action Plans.";
      case UserRole.AUDITEE: return "Upload evidence & self-assessment.";
      default: return "";
    }
  };

  return (
    <div className="flex flex-col h-full animate-fade-in bg-slate-50">
       <div className="flex-none bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Users className="text-blue-600" /> {t('mgmt.user.title')}</h2>
            <p className="text-slate-500">{t('mgmt.user.desc')}</p>
          </div>
          <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
             <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input type="text" placeholder="Cari user..." className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
             </div>
             <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm"><option value="ALL">Semua Peran</option>{Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}</select>
             <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm max-w-[150px]"><option value="ALL">Semua Unit</option><option value="Global">Non-Unit</option>{units.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}</select>
             <button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"><Plus size={18} /> <span className="hidden md:inline">{t('mgmt.btnAdd')}</span></button>
          </div>
       </div>

       <div className="flex-1 overflow-y-auto px-6 py-6 pb-20">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
             <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                  <tr><th className="px-6 py-3">{t('mgmt.th.name')}</th><th className="px-6 py-3">{t('mgmt.th.role')}</th><th className="px-6 py-3">{t('mgmt.th.dept')}</th><th className="px-6 py-3">{t('mgmt.th.status')}</th><th className="px-6 py-3 text-right">{t('mgmt.th.action')}</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-medium flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold overflow-hidden border border-slate-200">
                            {user.avatarUrl ? <img src={user.avatarUrl} alt="Av" className="w-full h-full object-cover" /> : user.name.charAt(0)}
                         </div>
                         <div><div>{user.name}</div><div className="text-xs text-slate-400">@{user.username}</div></div>
                      </td>
                      <td className="px-6 py-3"><span className="px-2 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">{user.role}</span></td>
                      <td className="px-6 py-3 text-slate-500">{user.department || '-'}</td>
                      <td className="px-6 py-3">
                         <span className={`flex items-center gap-1 text-xs font-bold ${user.status === 'Active' ? 'text-green-600' : 'text-slate-400'}`}>
                           <span className={`w-2 h-2 rounded-full ${user.status === 'Active' ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                           {user.status === 'Active' ? t('status.user_active') : t('status.user_inactive')}
                         </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                         {user.role === UserRole.SUPER_ADMIN && currentUser?.role !== UserRole.SUPER_ADMIN ? (
                            <span className="text-xs text-slate-400 italic px-2 py-1 bg-slate-100 rounded border"><Lock size={10} className="inline mr-1"/>Protected</span>
                         ) : (
                            <div className="flex justify-end gap-2">
                               <button onClick={() => { if(user.status === 'Active') setDeactivateModal({open: true, user}); else updateUser({...user, status: 'Active'}); }} className={`p-1.5 rounded ${user.status === 'Active' ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`}>{user.status === 'Active' ? <Power size={16}/> : <UserCheck size={16}/>}</button>
                               <button onClick={() => openEdit(user)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16}/></button>
                               <button onClick={() => setDeleteModal({open: true, userId: user.id, userName: user.name})} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                            </div>
                         )}
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
       </div>

       {/* Modals */}
       {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800">{isEditing ? t('mgmt.modal.edit') : t('mgmt.modal.add')}</h3>
                <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-slate-400" /></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); setConfirmModal(true); }} className="p-6 space-y-4">
                 <div className="flex justify-center mb-4">
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                            {form.avatarUrl ? <img src={form.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <UserIcon size={40} className="text-slate-300" />}
                        </div>
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"><Camera size={24} /></div>
                        <input type="file" accept="image/*" onChange={handleAvatarUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('mgmt.form.name')}</label><input required type="text" className="w-full border rounded p-2 text-sm" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} /></div>
                  <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('mgmt.form.user')}</label><input required type="text" className="w-full border rounded p-2 text-sm" value={form.username || ''} onChange={e => setForm({...form, username: e.target.value})} /></div>
                 </div>
                 <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">{isEditing ? t('mgmt.form.pass.edit') : t('mgmt.form.pass')}</label><input type="text" className="w-full border rounded p-2 text-sm" value={form.password || ''} onChange={e => setForm({...form, password: e.target.value})} placeholder={isEditing ? "••••••••" : "Set Password"} required={!isEditing} /></div>
                 <div className="grid grid-cols-2 gap-4">
                   <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('mgmt.form.role')}</label><select className="w-full border rounded p-2 text-sm" value={form.role} onChange={e => setForm({...form, role: e.target.value as UserRole})}>{Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                   <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('mgmt.form.dept')}</label><select className="w-full border rounded p-2 text-sm" value={form.department || ''} onChange={e => setForm({...form, department: e.target.value})}><option value="">- None / Global -</option>{units.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}</select></div>
                 </div>
                 <div className="p-3 bg-blue-50 text-blue-700 text-xs rounded border border-blue-100 flex items-start gap-2">
                   <Info size={16} className="mt-0.5 shrink-0" />
                   <div><span className="font-bold block mb-0.5">Role Permission: {form.role}</span><span>{getRoleDescription(form.role)}</span></div>
                 </div>
                 <div className="flex gap-4 items-center">
                    <label className="flex items-center gap-2 text-sm">
                        <input type="radio" checked={form.status === 'Active'} onChange={() => setForm({...form, status: 'Active'})} />
                        <span className="text-green-600 font-medium">{t('status.user_active')}</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                        <input type="radio" checked={form.status === 'Inactive'} onChange={() => setForm({...form, status: 'Inactive'})} />
                        <span className="text-slate-500">{t('status.user_inactive')}</span>
                    </label>
                 </div>
                 <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-4"><button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-lg text-sm">{t('mgmt.btn.cancel')}</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">{isEditing ? t('mgmt.btn.update') : t('mgmt.btn.save')}</button></div>
              </form>
            </div>
          </div>
       )}
       
       {confirmModal && <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"><div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-center space-y-4"><h3 className="text-lg font-bold">{t('confirm.general')}</h3><div className="flex gap-3 pt-2"><button onClick={() => setConfirmModal(false)} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm">{t('confirm.no')}</button><button onClick={handleSave} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">{t('confirm.yes')}</button></div></div></div>}
       {deactivateModal.open && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"><div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-center space-y-4"><h3 className="text-lg font-bold">Ubah Status?</h3><div className="flex gap-3 pt-2"><button onClick={() => setDeactivateModal({open: false, user: null})} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm">{t('confirm.no')}</button><button onClick={() => { updateUser({...deactivateModal.user!, status: 'Inactive'}); setDeactivateModal({open: false, user: null}); }} className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm">{t('confirm.yes')}</button></div></div></div>}
       {deleteModal.open && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"><div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-center space-y-4"><h3 className="text-lg font-bold text-red-600">{t('mgmt.del.title')}</h3><div className="flex gap-3 pt-2"><button onClick={() => setDeleteModal({open: false, userId: null, userName: ''})} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm">{t('mgmt.btn.cancel')}</button><button onClick={() => { if(deleteModal.userId) deleteUser(deleteModal.userId); setDeleteModal({open: false, userId: null, userName: ''}); }} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm">{t('mgmt.del.confirm')}</button></div></div></div>}
    </div>
  );
};

const MasterDataView: FC = () => {
  const { t } = useLanguage();
  const { units, addUnit, updateUnit, deleteUnit } = useMasterData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Partial<Unit>>({});
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; unitId: number | null }>({ open: false, unitId: null });

  const filteredUnits = units.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.code.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (!window.confirm(isEditing ? t('confirm.update') : t('confirm.add'))) return;
    if (isEditing && form.id) updateUnit(form as Unit);
    else addUnit(form as Unit);
    setIsModalOpen(false);
    setForm({});
  };

  return (
    <div className="flex flex-col h-full animate-fade-in bg-slate-50">
        <div className="flex-none bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Database className="text-blue-600" /> {t('master.title')}</h2>
              <p className="text-slate-500 text-sm">{t('master.desc')}</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
               <div className="relative w-full sm:w-64">
                 <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                 <input 
                    type="text" 
                    placeholder="Cari unit..." 
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                 />
               </div>
               <button 
                 onClick={() => { setForm({}); setIsEditing(false); setIsModalOpen(true); }} 
                 className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 shadow-sm transition-colors whitespace-nowrap"
               >
                 <Plus size={18} /> {t('master.btn.add')}
               </button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 pb-20">
            <div className="max-w-7xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-medium"><tr><th className="px-6 py-3">{t('master.th.code')}</th><th className="px-6 py-3">{t('master.th.name')}</th><th className="px-6 py-3">{t('master.th.type')}</th><th className="px-6 py-3">{t('master.th.faculty')}</th><th className="px-6 py-3 text-right">{t('mgmt.th.action')}</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredUnits.map(u => (
                            <tr key={u.id} className="hover:bg-slate-50">
                                <td className="px-6 py-3 font-mono text-slate-600">{u.code}</td>
                                <td className="px-6 py-3 font-medium text-slate-800">{u.name}<div className="text-xs text-slate-400 font-normal">{u.head}</div></td>
                                <td className="px-6 py-3"><span className="bg-slate-100 px-2 py-1 rounded text-xs">{u.type}</span></td>
                                <td className="px-6 py-3 text-slate-500">{u.faculty}</td>
                                <td className="px-6 py-3 text-right flex justify-end gap-2">
                                    <button onClick={() => { setForm(u); setIsEditing(true); setIsModalOpen(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16} /></button>
                                    <button onClick={() => setDeleteModal({ open: true, unitId: u.id })} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
        {isModalOpen && (
             <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                 <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
                     <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50"><h3 className="font-bold text-slate-800">{isEditing ? t('master.modal.edit') : t('master.modal.add')}</h3><button onClick={() => setIsModalOpen(false)}><X size={20} className="text-slate-400" /></button></div>
                     <form onSubmit={handleSave} className="p-6 space-y-4">
                         <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('master.form.code')}</label><input required type="text" className="w-full border rounded p-2 text-sm" value={form.code || ''} onChange={e => setForm({...form, code: e.target.value})} /></div>
                         <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('master.form.name')}</label><input required type="text" className="w-full border rounded p-2 text-sm" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} /></div>
                         <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('master.form.type')}</label><select className="w-full border rounded p-2 text-sm" value={form.type || ''} onChange={e => setForm({...form, type: e.target.value})}><option value="Program Studi">Program Studi</option><option value="Fakultas">Fakultas</option><option value="Direktorat">Direktorat</option><option value="Biro/Lembaga">Biro/Lembaga</option><option value="UPT">UPT</option><option value="Pimpinan Tinggi">Pimpinan Tinggi</option><option value="Yayasan">Yayasan</option></select></div>
                         <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('master.form.faculty')}</label><select className="w-full border rounded p-2 text-sm" value={form.faculty || ''} onChange={e => setForm({...form, faculty: e.target.value})}><option value="-">None (Top Level)</option>{units.filter(u => u.type !== 'Program Studi').map(u => <option key={u.id} value={u.name}>{u.name}</option>)}</select></div>
                         <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('master.form.head')}</label><input required type="text" className="w-full border rounded p-2 text-sm" value={form.head || ''} onChange={e => setForm({...form, head: e.target.value})} /></div>
                         <div className="pt-4 flex justify-end gap-3"><button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-lg text-sm">{t('mgmt.btn.cancel')}</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">{t('mgmt.btn.save')}</button></div>
                     </form>
                 </div>
             </div>
        )}
        {deleteModal.open && <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"><div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-center space-y-4"><h3 className="text-lg font-bold text-red-600">{t('mgmt.del.title')}</h3><div className="flex gap-3 pt-2"><button onClick={() => setDeleteModal({open: false, unitId: null})} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm">Batal</button><button onClick={() => { if(deleteModal.unitId) deleteUnit(deleteModal.unitId); setDeleteModal({open: false, unitId: null}); }} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm">Hapus</button></div></div></div>}
    </div>
  );
};

const TemplateManagementView: FC = () => {
  const { t } = useLanguage();
  const { questions, addQuestion, updateQuestion, deleteQuestion } = useMasterData();
  const { settings } = useSettings();
  
  const [activeStandard, setActiveStandard] = useState<AuditStandard>(settings.defaultStandard || AuditStandard.PERMENDIKTISAINTEK_2025);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Partial<MasterQuestion>>({});
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; questionId: string | null }>({ open: false, questionId: null });

  const filteredQuestions = questions.filter(q => q.standard === activeStandard && (q.text.toLowerCase().includes(searchTerm.toLowerCase()) || q.category.toLowerCase().includes(searchTerm.toLowerCase())));
  const groupedQuestions = filteredQuestions.reduce<Record<string, MasterQuestion[]>>((acc, q) => {
      if (!acc[q.category]) acc[q.category] = [];
      acc[q.category].push(q);
      return acc;
  }, {});

  const handleSave = (e: FormEvent) => {
     e.preventDefault();
     if(!form.id || !form.category || !form.text) return alert("All fields required");
     const qData = { id: form.id, standard: form.standard || activeStandard, category: form.category, text: form.text } as MasterQuestion;
     if(isEditing) updateQuestion(qData);
     else addQuestion(qData);
     setIsModalOpen(false);
     setForm({});
  };

  return (
    <div className="flex flex-col h-full animate-fade-in bg-slate-50">
       <div className="flex-none bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
          <div><h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><FileBox className="text-blue-600" /> {t('mgmt.tmpl.title')}</h2><p className="text-slate-500">{t('mgmt.tmpl.desc')}</p></div>
          <div className="flex gap-3">
             <div className="relative"><Search className="absolute left-3 top-2.5 text-slate-400" size={18} /><input type="text" placeholder="Cari pertanyaan..." className="pl-10 pr-4 py-2 border rounded-lg text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
             <select value={activeStandard} onChange={e => setActiveStandard(e.target.value as AuditStandard)} className="border rounded-lg px-3 py-2 text-sm w-full md:w-auto min-w-[350px]">{Object.values(AuditStandard).map(s => <option key={s} value={s}>{s}</option>)}</select>
             <button onClick={() => { setForm({standard: activeStandard}); setIsEditing(false); setIsModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"><Plus size={18} /> Baru</button>
          </div>
       </div>
       <div className="flex-1 overflow-y-auto px-6 py-6 pb-20">
          <div className="max-w-7xl mx-auto space-y-4">
             {Object.entries(groupedQuestions).map(([category, items]) => (
                <div key={category} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                   <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center cursor-pointer hover:bg-slate-100" onClick={() => setActiveCategory(activeCategory === category ? null : category)}>
                      <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2"><ListChecks size={16} className="text-blue-500" /> {category} <span className="text-xs text-slate-400">({items.length})</span></h4>
                      {activeCategory === category ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                   </div>
                   {activeCategory === category && (
                      <div className="divide-y divide-slate-100">
                         {items.map(q => (
                            <div key={q.id} className="p-4 hover:bg-slate-50 flex justify-between gap-4">
                               <div className="flex-1"><span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{q.id}</span> <span className="text-sm text-slate-800">{q.text}</span></div>
                               <div className="flex gap-2"><button onClick={() => { setForm(q); setIsEditing(true); setIsModalOpen(true); }} className="text-blue-600"><Edit size={16} /></button><button onClick={() => setDeleteModal({ open: true, questionId: q.id })} className="text-red-600"><Trash2 size={16} /></button></div>
                            </div>
                         ))}
                      </div>
                   )}
                </div>
             ))}
          </div>
       </div>
       {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
             <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50"><h3 className="font-bold text-slate-800">{isEditing ? "Edit Pertanyaan" : "Tambah Pertanyaan"}</h3><button onClick={() => setIsModalOpen(false)}><X size={20} className="text-slate-400" /></button></div>
                <form onSubmit={handleSave} className="p-6 space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">ID (Kode)</label><input required type="text" className="w-full border rounded p-2 text-sm font-mono" value={form.id || ''} onChange={e => setForm({...form, id: e.target.value})} /></div>
                        <div className="col-span-2"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kategori</label><input required type="text" className="w-full border rounded p-2 text-sm" value={form.category || ''} onChange={e => setForm({...form, category: e.target.value})} /></div>
                    </div>
                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pertanyaan</label><textarea required rows={4} className="w-full border rounded p-2 text-sm" value={form.text || ''} onChange={e => setForm({...form, text: e.target.value})} /></div>
                    <div className="pt-4 flex justify-end gap-3"><button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-lg text-sm">{t('mgmt.btn.cancel')}</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">{t('mgmt.btn.save')}</button></div>
                </form>
             </div>
          </div>
       )}
       {deleteModal.open && <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"><div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-center space-y-4"><h3 className="text-lg font-bold text-red-600">{t('mgmt.del.title')}</h3><div className="flex gap-3 pt-2"><button onClick={() => setDeleteModal({open: false, questionId: null})} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm">Batal</button><button onClick={() => { if(deleteModal.questionId) deleteQuestion(deleteModal.questionId); setDeleteModal({open: false, questionId: null}); }} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm">Hapus</button></div></div></div>}
    </div>
  );
};

const SettingsView: FC<{ onNavigate?: (view: ViewState) => void }> = ({ onNavigate }) => {
    const { t } = useLanguage();
    const { settings, updateSettings } = useSettings();
    const [localSettings, setLocalSettings] = useState(settings);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            updateSettings(localSettings);
            setIsSaving(false);
            if(onNavigate) onNavigate('DASHBOARD');
        }, 800);
    };

    const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => setLocalSettings(prev => ({ ...prev, logoUrl: reader.result as string }));
          reader.readAsDataURL(file);
        }
    };

    return (
        <div className="flex flex-col h-full animate-fade-in bg-slate-50">
            <div className="flex-none bg-slate-50 border-b border-slate-200 px-6 py-4"><h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Settings className="text-blue-600" /> {t('mgmt.set.title')}</h2><p className="text-slate-500">{t('mgmt.set.desc')}</p></div>
            <div className="flex-1 overflow-y-auto px-6 py-6 pb-20">
                <div className="max-w-3xl mx-auto space-y-6">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Palette size={20} className="text-blue-500" /> {t('mgmt.set.brand')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div><label className="block text-sm font-bold text-slate-700 mb-1">{t('mgmt.set.appName')}</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" value={localSettings.appName} onChange={e => setLocalSettings({...localSettings, appName: e.target.value})} /></div>
                            <div><label className="block text-sm font-bold text-slate-700 mb-1">{t('mgmt.set.theme')}</label><div className="flex gap-2"><input type="color" className="h-10 w-20 p-1 border rounded" value={localSettings.themeColor} onChange={e => setLocalSettings({...localSettings, themeColor: e.target.value})} /><input type="text" className="flex-1 border rounded-lg px-3 py-2 text-sm uppercase" value={localSettings.themeColor} onChange={e => setLocalSettings({...localSettings, themeColor: e.target.value})} /></div></div>
                        </div>
                        <div className="mt-4"><label className="block text-sm font-bold text-slate-700 mb-1">{t('mgmt.set.logo')}</label><div className="flex items-center gap-4"><div className="w-16 h-16 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center overflow-hidden bg-slate-50 relative group">{localSettings.logoUrl ? <img src={localSettings.logoUrl} alt="Logo" className="w-full h-full object-contain" /> : <Upload className="text-slate-400" />}</div><div className="flex-1"><input type="file" accept="image/*" onChange={handleLogoUpload} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" /></div></div></div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                         <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Clock size={20} className="text-green-500" /> {t('mgmt.set.cycle')}</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div><label className="block text-sm font-bold text-slate-700 mb-1">{t('mgmt.set.period')}</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" value={localSettings.auditPeriod} onChange={e => setLocalSettings({...localSettings, auditPeriod: e.target.value})} /></div>
                            <div><label className="block text-sm font-bold text-slate-700 mb-1">{t('mgmt.set.std')}</label><select className="w-full border rounded-lg px-3 py-2 text-sm" value={localSettings.defaultStandard} onChange={e => setLocalSettings({...localSettings, defaultStandard: e.target.value as AuditStandard})}>{Object.values(AuditStandard).map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                         </div>
                    </div>
                    <div className="flex justify-end pt-4"><button onClick={handleSave} disabled={isSaving} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg flex items-center gap-2">{isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />} {t('mgmt.set.save')}</button></div>
                </div>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---

interface Props {
  view: ViewState;
  onNavigate?: (view: ViewState) => void;
}

const ManagementPlaceholder: FC<Props> = ({ view, onNavigate }) => {
  if (view === 'USER_MGMT') return <UserManagementView />;
  if (view === 'MASTER_DATA') return <MasterDataView />;
  if (view === 'TEMPLATE_MGMT') return <TemplateManagementView />;
  if (view === 'SETTINGS') return <SettingsView onNavigate={onNavigate} />;
  return null;
};

export default ManagementPlaceholder;
