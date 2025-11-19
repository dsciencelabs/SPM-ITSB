import React from 'react';
import { useAuth } from '../AuthContext';
import { UserRole } from '../types';
import { ShieldCheck, Users, LayoutDashboard, UserCog, Building2 } from 'lucide-react';

const Login: React.FC = () => {
  const { login } = useAuth();

  const roles = [
    { 
      role: UserRole.SUPER_ADMIN, 
      label: 'SuperAdmin', 
      desc: 'Full Access, Config, User Mgmt',
      icon: ShieldCheck,
      color: 'bg-purple-600'
    },
    { 
      role: UserRole.ADMIN, 
      label: 'Admin', 
      desc: 'Operational, Scheduling, Reports',
      icon: UserCog,
      color: 'bg-blue-600'
    },
    { 
      role: UserRole.AUDITOR, 
      label: 'Auditor', 
      desc: 'Execute Audits, Assessments',
      icon: Users,
      color: 'bg-green-600'
    },
    { 
      role: UserRole.AUDITEE, 
      label: 'Auditee', 
      desc: 'Upload Evidence, Action Plans',
      icon: Building2,
      color: 'bg-amber-600'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-600 text-white mb-4 shadow-lg shadow-blue-500/30">
            <ShieldCheck size={48} />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">SAMI ITSB</h1>
          <p className="text-slate-400 text-lg">Smart Audit Mutu Internal - Login Portal</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {roles.map((item) => (
            <button
              key={item.role}
              onClick={() => login(item.role)}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-xl p-6 text-left transition-all group hover:-translate-y-1 hover:shadow-xl"
            >
              <div className={`${item.color} w-12 h-12 rounded-lg flex items-center justify-center text-white mb-4 shadow-lg`}>
                <item.icon size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{item.label}</h3>
              <p className="text-sm text-slate-400">{item.desc}</p>
            </button>
          ))}
        </div>

        <div className="mt-12 text-center text-slate-600 text-sm">
          &copy; {new Date().getFullYear()} ITSB Quality Assurance System. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default Login;