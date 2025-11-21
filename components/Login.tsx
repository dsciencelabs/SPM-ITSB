
import { useState, FC, FormEvent } from 'react';
import { useAuth } from '../AuthContext';
import { useSettings } from '../SettingsContext';
import { UserRole } from '../types';
import { ShieldCheck, Users, UserCog, Building2, Crown, Contact, LogIn, AlertCircle, Lock, User, ArrowLeft, ChevronRight } from 'lucide-react';

const Login: FC = () => {
  const { login, users } = useAuth();
  const { settings } = useSettings();

  const [step, setStep] = useState<'ROLE_SELECTION' | 'LOGIN_FORM'>('ROLE_SELECTION');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [selectedRoleLabel, setSelectedRoleLabel] = useState('');

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    const user = users.find(u => 
      (u.username?.toLowerCase() === username.toLowerCase()) && 
      (u.password === password || (!u.password && password === '')) 
    );
    
    if (user) {
      if (user.status === 'Inactive') {
        setError('Akun ini telah dinonaktifkan. Hubungi administrator.');
        return;
      }
      login(user);
    } else {
      setError('Username atau Password salah.');
    }
  };

  const handleRoleSelect = (role: UserRole, label: string) => {
    // Find demo user
    const demoUser = users.find(u => u.role === role && u.status === 'Active');
    
    if (demoUser) {
      setUsername(demoUser.username || '');
      setPassword(demoUser.password || '');
      setError('');
    } else {
      // Fallback if no user found: Clear fields but still show form
      setUsername('');
      setPassword('');
      setError('');
    }
    
    // Always navigate to form
    setSelectedRoleLabel(label);
    setStep('LOGIN_FORM');
  };
  
  const handleBack = () => {
      setStep('ROLE_SELECTION');
      setError('');
      setUsername('');
      setPassword('');
  }

  const roles = [
    { 
      role: UserRole.SUPER_ADMIN, 
      label: 'SuperAdmin', 
      desc: 'Full Access',
      icon: ShieldCheck,
      colorClass: 'bg-purple-600'
    },
    { 
      role: UserRole.ADMIN, 
      label: 'Admin', 
      desc: 'Operational',
      icon: UserCog,
      colorClass: 'bg-blue-600'
    },
    { 
      role: UserRole.AUDITOR_LEAD, 
      label: 'Lead Auditor', 
      desc: 'Verification',
      icon: Crown,
      colorClass: 'bg-teal-600'
    },
    { 
      role: UserRole.AUDITOR, 
      label: 'Auditor', 
      desc: 'Assessment',
      icon: Users,
      colorClass: 'bg-green-600'
    },
    { 
      role: UserRole.DEPT_HEAD, 
      label: 'Dept. Head', 
      desc: 'Approval',
      icon: Contact,
      colorClass: 'bg-orange-600'
    },
    { 
      role: UserRole.AUDITEE, 
      label: 'Auditee', 
      desc: 'Evidence',
      icon: Building2,
      colorClass: 'bg-amber-600'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
         <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-blue-600/10 blur-[100px]"></div>
         <div className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-purple-600/10 blur-[100px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl">
        
        {/* STEP 1: ROLE SELECTION */}
        {step === 'ROLE_SELECTION' && (
          <div className="animate-fade-in flex flex-col items-center">
             <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center p-3 bg-white/5 rounded-2xl mb-6 backdrop-blur-sm border border-white/10 shadow-2xl">
                   {settings.logoUrl ? (
                      <img src={settings.logoUrl} alt="Logo" className="h-16 w-auto object-contain" />
                   ) : (
                      <ShieldCheck size={48} className="text-blue-500" />
                   )}
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
                  {settings.appName}
                </h1>
                <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                  Sistem Penjaminan Mutu Internal Cerdas berbasis AI. <br/>
                  <span className="text-blue-400 font-medium">Silakan pilih peran Anda untuk masuk.</span>
                </p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full max-w-4xl px-4">
                {roles.map((item) => (
                  <button
                    key={item.role}
                    onClick={() => handleRoleSelect(item.role, item.label)}
                    className="group relative bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/50 hover:border-blue-500/50 rounded-2xl p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-900/20 backdrop-blur-md overflow-hidden"
                  >
                     <div className="absolute inset-0 bg-gradient-to-br from-blue-600/0 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"/>
                     
                     <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className={`${item.colorClass} w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                          <item.icon size={24} />
                        </div>
                        <div className="bg-white/5 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0">
                           <ChevronRight size={16} className="text-blue-300" />
                        </div>
                     </div>
                     
                     <div className="relative z-10">
                        <h3 className="text-xl font-bold text-slate-100 mb-1 group-hover:text-white">{item.label}</h3>
                        <p className="text-sm text-slate-500 group-hover:text-slate-400">{item.desc}</p>
                     </div>
                  </button>
                ))}
             </div>
             
             <div className="mt-12 text-slate-600 text-sm">
                &copy; {new Date().getFullYear()} {settings.appName}. All Rights Reserved.
             </div>
          </div>
        )}

        {/* STEP 2: LOGIN FORM */}
        {step === 'LOGIN_FORM' && (
          <div className="animate-fade-in max-w-md mx-auto w-full px-4">
             <button 
               onClick={handleBack}
               className="mb-8 w-full flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-blue-100 hover:text-white border border-white/10 hover:border-white/30 rounded-xl transition-all duration-300 text-sm font-semibold shadow-lg backdrop-blur-md group"
             >
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform duration-300" />
                Kembali ke Pilihan Peran
             </button>

             <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-8">
                   <div className="text-center mb-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-2xl mb-4 text-blue-600">
                         {(() => {
                            const matchedRole = roles.find(r => r.label === selectedRoleLabel);
                            // Fixed: Render component as JSX, not function call
                            const IconComponent = matchedRole ? matchedRole.icon : User;
                            return <IconComponent size={32} />;
                         })()}
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900">Login {selectedRoleLabel}</h2>
                      <p className="text-slate-500 text-sm mt-1">Masukkan kredensial Anda untuk melanjutkan.</p>
                   </div>

                   <form onSubmit={handleLogin} className="space-y-5">
                      {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2 animate-fade-in">
                          <AlertCircle size={18} />
                          {error}
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Username</label>
                        <div className="relative">
                          <User size={20} className="absolute left-3 top-3 text-slate-400" />
                          <input 
                            type="text" 
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-800 font-medium"
                            placeholder="Username"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
                        <div className="relative">
                          <Lock size={20} className="absolute left-3 top-3 text-slate-400" />
                          <input 
                            type="password" 
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-800 font-medium"
                            placeholder="Password"
                          />
                        </div>
                      </div>

                      <button 
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 mt-2 group"
                      >
                        <LogIn size={20} className="group-hover:translate-x-0.5 transition-transform"/>
                        Masuk Aplikasi
                      </button>
                   </form>
                </div>
                <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 text-center">
                   <p className="text-xs text-slate-400">
                     Sistem terenkripsi & aman.
                   </p>
                </div>
             </div>
          </div>
        )}
        
      </div>
    </div>
  );
};

export default Login;
