
import React, { useState } from 'react';
import { ViewState, UserRole, AuditStandard, User } from '../types';
import { Users, Settings, Database, Upload, CheckCircle2, XCircle, X, Plus, Edit, Trash2, AlertTriangle, Search, ListChecks, Shield, UserCog, Briefcase, Ban } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { useMasterData, Unit, MasterQuestion } from '../MasterDataContext';
import { useAuth } from '../AuthContext';

interface Props {
  view: ViewState;
}

const ManagementPlaceholder: React.FC<Props> = ({ view }) => {
  const { t } = useLanguage();
  
  // Contexts
  const { 
    units, addUnit, updateUnit, deleteUnit,
    questions, addQuestion, updateQuestion, deleteQuestion 
  } = useMasterData();
  
  const { 
    users, addUser, updateUser, deleteUser 
  } = useAuth();

  // --- USER MANAGEMENT STATE ---
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isUserDeleteModalOpen, setIsUserDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  
  const [userFormData, setUserFormData] = useState<User>({
    id: '',
    name: '',
    username: '',
    password: '',
    role: UserRole.AUDITOR,
    department: '',
    status: 'Active'
  });

  // --- MASTER UNIT DATA STATE ---
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
  const [isMasterDeleteModalOpen, setIsMasterDeleteModalOpen] = useState(false);
  const [masterIdToDelete, setMasterIdToDelete] = useState<number | null>(null);
  const [masterFormData, setMasterFormData] = useState<Partial<Unit>>({
    id: undefined, code: '', name: '', type: 'Program Studi', faculty: '', head: ''
  });

  // --- INSTRUMENT / TEMPLATE MANAGEMENT STATE ---
  const [activeStandard, setActiveStandard] = useState<string>(AuditStandard.PERMENDIKTISAINTEK_2025);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [isQuestionDeleteModalOpen, setIsQuestionDeleteModalOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  
  const [questionFormData, setQuestionFormData] = useState<MasterQuestion>({
    id: '',
    standard: AuditStandard.PERMENDIKTISAINTEK_2025,
    category: '',
    text: ''
  });

  // -----------------------------------------------------------------------
  // USER HANDLERS (CRUD)
  // -----------------------------------------------------------------------
  
  const handleOpenUserModal = (user?: User) => {
    if (user) {
      setUserFormData(user);
    } else {
      setUserFormData({
        id: '',
        name: '',
        username: '',
        password: '',
        role: UserRole.AUDITOR,
        department: '',
        status: 'Active'
      });
    }
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (userFormData.id) {
      // Update existing
      updateUser(userFormData);
    } else {
      // Create new
      if (!userFormData.name || !userFormData.username) {
        alert("Nama dan Username wajib diisi");
        return;
      }
      const newUser: User = {
        ...userFormData,
        id: `usr-${Date.now()}`,
      };
      addUser(newUser);
    }
    setIsUserModalOpen(false);
  };

  const handleDeleteUserClick = (id: string) => {
    setUserToDelete(id);
    setIsUserDeleteModalOpen(true);
  };

  const confirmDeleteUser = () => {
    if (userToDelete) {
      deleteUser(userToDelete);
      setIsUserDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  // Filter Users
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    (u.username && u.username.toLowerCase().includes(userSearchTerm.toLowerCase())) ||
    u.role.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  // -----------------------------------------------------------------------
  // MASTER UNIT HANDLERS
  // -----------------------------------------------------------------------
  const handleOpenMasterModal = (unit?: Unit) => {
    if (unit) setMasterFormData(unit);
    else setMasterFormData({ id: undefined, code: '', name: '', type: 'Program Studi', faculty: '', head: '' });
    setIsMasterModalOpen(true);
  };

  const handleSaveMaster = (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterFormData.code || !masterFormData.name) return;
    if (masterFormData.id) updateUnit(masterFormData as Unit);
    else addUnit(masterFormData as Omit<Unit, 'id'>);
    setIsMasterModalOpen(false);
  };

  const handleDeleteMaster = (id: number) => { setMasterIdToDelete(id); setIsMasterDeleteModalOpen(true); };
  const confirmDeleteMaster = () => { if (masterIdToDelete) { deleteUnit(masterIdToDelete); setIsMasterDeleteModalOpen(false); setMasterIdToDelete(null); } };

  // -----------------------------------------------------------------------
  // INSTRUMENT / QUESTION HANDLERS
  // -----------------------------------------------------------------------
  const handleOpenQuestionModal = (q?: MasterQuestion) => {
    if (q) {
      setQuestionFormData(q);
      setIsEditingQuestion(true);
    } else {
      setQuestionFormData({
        id: '',
        standard: activeStandard,
        category: '',
        text: ''
      });
      setIsEditingQuestion(false);
    }
    setIsQuestionModalOpen(true);
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionFormData.id || !questionFormData.text) {
      alert("ID dan Teks Pertanyaan wajib diisi.");
      return;
    }

    if (isEditingQuestion) {
      updateQuestion(questionFormData);
    } else {
      if (questions.some(q => q.id === questionFormData.id)) {
        alert("ID Pertanyaan sudah ada. Gunakan ID unik.");
        return;
      }
      addQuestion(questionFormData);
    }
    setIsQuestionModalOpen(false);
  };

  const handleDeleteQuestion = (id: string) => { setQuestionToDelete(id); setIsQuestionDeleteModalOpen(true); };
  const confirmDeleteQuestion = () => { if (questionToDelete) { deleteQuestion(questionToDelete); setIsQuestionDeleteModalOpen(false); setQuestionToDelete(null); } };

  const filteredQuestions = questions.filter(q => {
    const matchesStandard = q.standard === activeStandard;
    const matchesSearch = 
      q.text.toLowerCase().includes(searchTerm.toLowerCase()) || 
      q.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStandard && matchesSearch;
  });

  // -----------------------------------------------------------------------
  // RENDER CONTENT SWITCH
  // -----------------------------------------------------------------------
  const renderContent = () => {
    switch (view) {
      case 'USER_MGMT':
        return {
           title: t('mgmt.user.title'), icon: Users, desc: t('mgmt.user.desc'),
           content: (
             <div className="space-y-6">
               {/* Action Bar */}
               <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="relative w-full md:w-72">
                    <input 
                      type="text" 
                      placeholder="Cari nama, username, atau role..." 
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                  </div>
                  <button 
                    onClick={() => handleOpenUserModal()}
                    className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    {t('mgmt.btnAdd')}
                  </button>
               </div>

               {/* User Table */}
               <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                 <table className="w-full text-sm text-left">
                   <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                     <tr>
                       <th className="px-6 py-3">{t('mgmt.th.name')}</th>
                       <th className="px-6 py-3">{t('mgmt.th.username')}</th>
                       <th className="px-6 py-3">{t('mgmt.th.role')}</th>
                       <th className="px-6 py-3">{t('mgmt.th.dept')}</th>
                       <th className="px-6 py-3">{t('mgmt.th.status')}</th>
                       <th className="px-6 py-3 text-right">{t('mgmt.th.action')}</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {filteredUsers.map((user) => (
                       <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                         <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                               user.role === UserRole.SUPER_ADMIN ? 'bg-purple-600' :
                               user.role === UserRole.ADMIN ? 'bg-blue-600' :
                               user.role === UserRole.AUDITOR ? 'bg-green-600' : 'bg-amber-600'
                            }`}>
                               {user.name.charAt(0)}
                            </div>
                            {user.name}
                         </td>
                         <td className="px-6 py-4 text-slate-600 font-mono text-xs">{user.username || '-'}</td>
                         <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium border ${
                               user.role === UserRole.SUPER_ADMIN ? 'bg-purple-50 text-purple-700 border-purple-100' :
                               user.role === UserRole.ADMIN ? 'bg-blue-50 text-blue-700 border-blue-100' :
                               user.role === UserRole.AUDITOR ? 'bg-green-50 text-green-700 border-green-100' :
                               'bg-amber-50 text-amber-700 border-amber-100'
                            }`}>
                              {user.role}
                            </span>
                         </td>
                         <td className="px-6 py-4 text-slate-700">{user.department || '-'}</td>
                         <td className="px-6 py-4">
                            {user.status === 'Active' ? (
                               <span className="flex items-center gap-1 text-xs font-bold text-green-600">
                                 <CheckCircle2 size={14} /> Active
                               </span>
                            ) : (
                               <span className="flex items-center gap-1 text-xs font-bold text-slate-400">
                                 <Ban size={14} /> Inactive
                               </span>
                            )}
                         </td>
                         <td className="px-6 py-4 text-right">
                           <div className="flex items-center justify-end gap-2">
                             <button 
                               onClick={() => handleOpenUserModal(user)} 
                               className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                               title="Edit User"
                             >
                               <Edit size={16}/>
                             </button>
                             <button 
                               onClick={() => handleDeleteUserClick(user.id)} 
                               className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                               title="Delete User"
                             >
                               <Trash2 size={16}/>
                             </button>
                           </div>
                         </td>
                       </tr>
                     ))}
                     {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                            Tidak ada pengguna yang cocok dengan pencarian.
                          </td>
                        </tr>
                     )}
                   </tbody>
                 </table>
               </div>
             </div>
           )
        };
      
      case 'MASTER_DATA':
        return {
           title: t('master.title'), icon: Database, desc: t('master.desc'),
           content: (
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
               <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                 <div><h3 className="font-bold text-lg text-slate-800">{t('master.tab.prodi')}</h3></div>
                 <button onClick={() => handleOpenMasterModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm flex items-center gap-2"><Plus size={16} />{t('master.btn.add')}</button>
               </div>
               <table className="w-full text-sm text-left">
                 <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                   <tr><th className="px-6 py-3">{t('master.th.code')}</th><th className="px-6 py-3">{t('master.th.name')}</th><th className="px-6 py-3">{t('master.th.type')}</th><th className="px-6 py-3">{t('master.th.faculty')}</th><th className="px-6 py-3">{t('master.th.head')}</th><th className="px-6 py-3 text-right">{t('mgmt.th.action')}</th></tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {units.map((unit) => (
                     <tr key={unit.id} className="hover:bg-slate-50/50 transition-colors">
                       <td className="px-6 py-4 font-mono text-slate-600 font-medium">{unit.code}</td>
                       <td className="px-6 py-4 font-medium text-slate-900">{unit.name}</td>
                       <td className="px-6 py-4"><span className="bg-slate-100 px-2 py-0.5 rounded text-xs">{unit.type}</span></td>
                       <td className="px-6 py-4 text-slate-600 text-xs">{unit.faculty || '-'}</td>
                       <td className="px-6 py-4 text-slate-600">{unit.head}</td>
                       <td className="px-6 py-4 flex items-center justify-end gap-3"><button onClick={() => handleOpenMasterModal(unit)} className="text-blue-600"><Edit size={16}/></button><button onClick={() => handleDeleteMaster(unit.id)} className="text-red-400"><Trash2 size={16}/></button></td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           )
        };

      case 'TEMPLATE_MGMT':
        return {
           title: 'Manajemen Instrumen Audit',
           icon: ListChecks,
           desc: 'Kelola Master Data Pertanyaan Audit untuk berbagai standar (Dikti, LAM, BAN-PT).',
           content: (
             <div className="space-y-6">
                {/* Filter Tabs */}
                <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex flex-wrap gap-1">
                  {Object.values(AuditStandard).map((std) => (
                    <button
                      key={std}
                      onClick={() => setActiveStandard(std)}
                      className={`px-4 py-2 text-xs font-medium rounded-md transition-all flex-1 md:flex-none whitespace-nowrap ${
                        activeStandard === std 
                          ? 'bg-blue-600 text-white shadow-sm' 
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                      }`}
                    >
                      {std}
                    </button>
                  ))}
                </div>

                {/* Action Bar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="relative w-full md:w-72">
                    <input 
                      type="text" 
                      placeholder="Cari pertanyaan, kode, atau kategori..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                  </div>
                  <button 
                    onClick={() => handleOpenQuestionModal()}
                    className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    Tambah Pertanyaan
                  </button>
                </div>

                {/* Questions Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                     <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                       Daftar Pertanyaan: <span className="text-blue-600">{activeStandard}</span>
                     </span>
                     <span className="text-xs text-slate-400">Total: {filteredQuestions.length}</span>
                  </div>
                  <table className="w-full text-sm text-left">
                    <thead className="bg-white text-slate-500 font-semibold border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3 w-24">Kode</th>
                        <th className="px-6 py-3 w-48">Kategori</th>
                        <th className="px-6 py-3">Pertanyaan / Indikator</th>
                        <th className="px-6 py-3 text-right w-24">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredQuestions.length > 0 ? (
                        filteredQuestions.map((q) => (
                          <tr key={q.id} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="px-6 py-4 font-mono text-slate-600 font-medium align-top">{q.id}</td>
                            <td className="px-6 py-4 align-top">
                              <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium border border-blue-100 inline-block">
                                {q.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-800 align-top leading-relaxed">{q.text}</td>
                            <td className="px-6 py-4 align-top text-right">
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => handleOpenQuestionModal(q)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <Edit size={16}/>
                                </button>
                                <button 
                                  onClick={() => handleDeleteQuestion(q.id)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Hapus"
                                >
                                  <Trash2 size={16}/>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                            Tidak ada data pertanyaan untuk standar ini. Silakan tambah baru.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
             </div>
           )
        };
      
      case 'SETTINGS':
        return {
          title: t('mgmt.set.title'), icon: Settings, desc: t('mgmt.set.desc'),
          content: (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-sm space-y-6">
                  <h3 className="font-bold text-slate-800 pb-2 border-b border-slate-100">{t('mgmt.set.brand')}</h3>
                  <div><label className="block text-sm font-medium text-slate-700 mb-2">{t('mgmt.set.appName')}</label><input type="text" defaultValue="SAMI ITSB" className="w-full border border-slate-300 p-2.5 rounded-lg text-sm outline-none" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-2">{t('mgmt.set.logo')}</label><div className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-slate-500"><Upload size={24} className="mb-2"/><span className="text-xs font-medium">{t('mgmt.set.upload')}</span></div></div>
                </div>
            </div>
          )
        };
      default:
        return { title: 'Module', icon: Database, desc: 'Under Construction', content: null };
    }
  };

  const info = renderContent();
  const Icon = info.icon;

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3.5 bg-white border border-slate-200 shadow-sm rounded-xl">
          <Icon size={28} className="text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{info.title}</h2>
          <p className="text-slate-500">{info.desc}</p>
        </div>
      </div>
      {info.content}

      {/* --- USER MODAL (ADD/EDIT) --- */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
             <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-lg text-slate-900">
                 {userFormData.id ? t('mgmt.modal.edit') : t('mgmt.modal.add')}
               </h3>
               <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
             </div>
             
             <form onSubmit={handleSaveUser} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('mgmt.form.name')}</label>
                  <input 
                    type="text"
                    required
                    value={userFormData.name}
                    onChange={(e) => setUserFormData({...userFormData, name: e.target.value})}
                    className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Nama Lengkap"
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('mgmt.form.user')}</label>
                  <input 
                    type="text"
                    required
                    value={userFormData.username}
                    onChange={(e) => setUserFormData({...userFormData, username: e.target.value})}
                    className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Username"
                  />
                </div>

                {/* Role & Department */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('mgmt.form.role')}</label>
                    <select 
                      value={userFormData.role}
                      onChange={(e) => setUserFormData({...userFormData, role: e.target.value as UserRole})}
                      className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      {Object.values(UserRole).map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                    <select 
                      value={userFormData.status || 'Active'}
                      onChange={(e) => setUserFormData({...userFormData, status: e.target.value as 'Active' | 'Inactive'})}
                      className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Department Selection - Connected to Master Data */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t('mgmt.form.dept')} 
                    <span className="text-xs text-slate-400 font-normal ml-2">(Required for Auditee/Auditor)</span>
                  </label>
                  <select 
                    value={userFormData.department || ''}
                    onChange={(e) => setUserFormData({...userFormData, department: e.target.value})}
                    className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    disabled={userFormData.role === UserRole.SUPER_ADMIN}
                  >
                    <option value="">- Tidak Ada / None -</option>
                    {units.map(unit => (
                       <option key={unit.id} value={unit.name}>
                         {unit.name} ({unit.type})
                       </option>
                    ))}
                  </select>
                </div>

                {/* Password (Demo) */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {userFormData.id ? t('mgmt.form.pass.edit') : t('mgmt.form.pass')}
                  </label>
                  <input 
                    type="text"
                    value={userFormData.password || ''}
                    onChange={(e) => setUserFormData({...userFormData, password: e.target.value})}
                    className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                    placeholder={userFormData.id ? "(Tidak diubah)" : "Set Password"}
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100 mt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsUserModalOpen(false)} 
                    className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                  >
                    {t('mgmt.btn.cancel')}
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    {t('mgmt.btn.save')}
                  </button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* USER DELETE MODAL */}
      {isUserDeleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm text-center space-y-4 shadow-2xl animate-fade-in">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
              <AlertTriangle size={24}/>
            </div>
            <div>
               <h3 className="font-bold text-lg text-slate-900">{t('mgmt.del.title')}</h3>
               <p className="text-sm text-slate-500 mt-1">{t('mgmt.del.msg')}</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setIsUserDeleteModalOpen(false)} 
                className="flex-1 py-2.5 bg-slate-100 rounded-lg text-sm font-medium hover:bg-slate-200"
              >
                {t('mgmt.btn.cancel')}
              </button>
              <button 
                onClick={confirmDeleteUser} 
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 shadow-lg shadow-red-900/20"
              >
                {t('mgmt.del.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MASTER UNIT MODAL */}
      {isMasterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg text-slate-800">{masterFormData.id ? t('master.modal.edit') : t('master.modal.add')}</h3><button onClick={() => setIsMasterModalOpen(false)}><X size={20}/></button></div>
            <form onSubmit={handleSaveMaster} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1"><label className="text-sm block mb-1">Kode</label><input type="text" required value={masterFormData.code} onChange={(e) => setMasterFormData({ ...masterFormData, code: e.target.value })} className="w-full border p-2 rounded text-sm" /></div>
                <div className="col-span-2"><label className="text-sm block mb-1">Nama Unit</label><input type="text" required value={masterFormData.name} onChange={(e) => setMasterFormData({ ...masterFormData, name: e.target.value })} className="w-full border p-2 rounded text-sm" /></div>
              </div>
              <div><label className="text-sm block mb-1">Tipe</label><select value={masterFormData.type} onChange={(e) => setMasterFormData({ ...masterFormData, type: e.target.value })} className="w-full border p-2 rounded text-sm"><option>Program Studi</option><option>Fakultas</option><option>Biro/Lembaga</option><option>Pimpinan Tinggi</option><option>Yayasan</option></select></div>
              <div><label className="text-sm block mb-1">Induk/Fakultas</label><select value={masterFormData.faculty} onChange={(e) => setMasterFormData({ ...masterFormData, faculty: e.target.value })} className="w-full border p-2 rounded text-sm" disabled={masterFormData.type === 'Yayasan'}><option value="">- Tidak Ada -</option>{units.filter(u => ['Fakultas', 'Pimpinan Tinggi', 'Yayasan'].includes(u.type)).map(f => (<option key={f.id} value={f.name}>{f.name}</option>))}</select></div>
              <div className="flex gap-3 pt-2"><button type="button" onClick={() => setIsMasterModalOpen(false)} className="flex-1 py-2 bg-slate-100 rounded text-sm">Batal</button><button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded text-sm">Simpan</button></div>
            </form>
          </div>
        </div>
      )}

      {/* INSTRUMENT QUESTION MODAL */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-slate-800">{isEditingQuestion ? 'Edit Pertanyaan' : 'Tambah Pertanyaan'}</h3>
              <button onClick={() => setIsQuestionModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleSaveQuestion} className="space-y-4">
              <div className="bg-slate-50 p-3 rounded text-sm text-slate-600 border border-slate-200">
                <span className="font-bold">Standar:</span> {activeStandard}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                   <label className="block text-sm font-medium text-slate-700 mb-1">Kode / ID</label>
                   <input 
                      type="text" 
                      required
                      disabled={isEditingQuestion} // ID should not change on edit typically
                      value={questionFormData.id} 
                      onChange={(e) => setQuestionFormData({...questionFormData, id: e.target.value})} 
                      className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100"
                      placeholder="e.g. C.1.a"
                   />
                </div>
                <div className="col-span-2">
                   <label className="block text-sm font-medium text-slate-700 mb-1">Kategori / Kriteria</label>
                   <input 
                      type="text" 
                      required
                      value={questionFormData.category} 
                      onChange={(e) => setQuestionFormData({...questionFormData, category: e.target.value})} 
                      className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="e.g. Kurikulum"
                   />
                </div>
              </div>
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Isi Pertanyaan / Indikator</label>
                 <textarea 
                    rows={4}
                    required
                    value={questionFormData.text} 
                    onChange={(e) => setQuestionFormData({...questionFormData, text: e.target.value})} 
                    className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Tulis pertanyaan audit disini..."
                 />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsQuestionModalOpen(false)} className="flex-1 py-2 bg-slate-100 rounded-lg text-sm font-medium">Batal</button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Question Delete Confirm */}
      {isQuestionDeleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm text-center space-y-4 shadow-2xl">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600"><AlertTriangle size={24}/></div>
            <h3 className="font-bold text-lg">Hapus Pertanyaan?</h3>
            <p className="text-sm text-slate-500">Data yang dihapus tidak dapat dikembalikan.</p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setIsQuestionDeleteModalOpen(false)} className="flex-1 py-2 bg-slate-100 rounded text-sm">Batal</button>
              <button onClick={confirmDeleteQuestion} className="flex-1 py-2 bg-red-600 text-white rounded text-sm">Hapus</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Master Unit Delete Confirm */}
      {isMasterDeleteModalOpen && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm text-center space-y-4 shadow-2xl">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600"><AlertTriangle size={24}/></div>
            <h3 className="font-bold text-lg">Hapus Unit?</h3>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setIsMasterDeleteModalOpen(false)} className="flex-1 py-2 bg-slate-100 rounded text-sm">Batal</button>
              <button onClick={confirmDeleteMaster} className="flex-1 py-2 bg-red-600 text-white rounded text-sm">Hapus</button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default ManagementPlaceholder;
