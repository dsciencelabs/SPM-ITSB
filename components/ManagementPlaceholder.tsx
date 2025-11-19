import React from 'react';
import { ViewState } from '../types';
import { Users, Settings, Database, FileBox, CalendarClock } from 'lucide-react';

interface Props {
  view: ViewState;
}

const ManagementPlaceholder: React.FC<Props> = ({ view }) => {
  
  const renderContent = () => {
    switch (view) {
      case 'USER_MGMT':
        return {
           title: 'User Management',
           icon: Users,
           desc: 'Manage SuperAdmins, Admins, Auditors, and Auditees access.',
           content: (
             <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
               <div className="flex justify-between mb-4">
                 <h3 className="font-bold text-lg">Registered Users</h3>
                 <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm">+ Add User</button>
               </div>
               <table className="w-full text-sm text-left">
                 <thead className="bg-slate-50 border-b">
                   <tr>
                     <th className="p-3">Name</th>
                     <th className="p-3">Role</th>
                     <th className="p-3">Department</th>
                     <th className="p-3">Action</th>
                   </tr>
                 </thead>
                 <tbody>
                   <tr className="border-b">
                     <td className="p-3">Super Administrator</td>
                     <td className="p-3"><span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">SuperAdmin</span></td>
                     <td className="p-3">-</td>
                     <td className="p-3 text-blue-600 cursor-pointer">Edit</td>
                   </tr>
                   <tr className="border-b">
                     <td className="p-3">Dr. Budi</td>
                     <td className="p-3"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Auditor</span></td>
                     <td className="p-3">Teknik Sipil</td>
                     <td className="p-3 text-blue-600 cursor-pointer">Edit</td>
                   </tr>
                 </tbody>
               </table>
             </div>
           )
        };
      case 'TEMPLATE_MGMT':
        return {
           title: 'Template Management',
           icon: FileBox,
           desc: 'Manage Form AMI templates, Reports, and Standard Operating Procedures.',
           content: (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['Form AMI Standar BAN-PT', 'Form AMI LAM-TEKNIK', 'Template Laporan RTM'].map(t => (
                  <div key={t} className="bg-white p-4 border rounded-lg shadow-sm">
                    <FileBox className="text-slate-400 mb-2" />
                    <h4 className="font-semibold">{t}</h4>
                    <button className="text-xs text-blue-600 mt-2">Edit Template</button>
                  </div>
                ))}
             </div>
           )
        };
      case 'SETTINGS':
        return {
          title: 'System Settings',
          icon: Settings,
          desc: 'App branding, logos, theme colors, and audit cycle configuration.',
          content: (
            <div className="bg-white p-6 border rounded-lg max-w-2xl">
              <div className="mb-4">
                <label className="block text-sm font-bold mb-1">Application Name</label>
                <input type="text" value="SAMI ITSB" className="w-full border p-2 rounded" disabled />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-bold mb-1">Current Audit Cycle</label>
                <select className="w-full border p-2 rounded">
                  <option>2024 - Ganjil</option>
                  <option>2024 - Genap</option>
                </select>
              </div>
              <button className="bg-slate-900 text-white px-4 py-2 rounded">Save Changes</button>
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
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-slate-100 rounded-lg">
          <Icon size={24} className="text-slate-700" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{info.title}</h2>
          <p className="text-slate-500">{info.desc}</p>
        </div>
      </div>
      {info.content}
    </div>
  );
};

export default ManagementPlaceholder;