import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import NewAuditForm from './components/NewAuditForm';
import AuditExecution from './components/AuditExecution';
import Reports from './components/Reports';
import Login from './components/Login';
import ManagementPlaceholder from './components/ManagementPlaceholder';
import { AuditSession, ViewState, AuditStandard, AuditStatus, UserRole } from './types';
import { LanguageProvider } from './LanguageContext';
import { AuthProvider, useAuth } from './AuthContext';

// Mock Data for initial visualization
const MOCK_AUDITS: AuditSession[] = [
  {
    id: '1',
    name: 'Audit S1 Informatika 2023',
    department: 'S1 Teknik Informatika',
    standard: AuditStandard.LAM_INFOKOM,
    status: AuditStatus.COMPLETED,
    date: '2023-10-15T09:00:00Z',
    questions: [],
    aiSummary: 'Program studi menunjukkan kesiapan yang sangat baik pada kriteria kurikulum, namun perlu peningkatan pada publikasi penelitian mahasiswa.'
  },
  {
    id: '2',
    name: 'Audit S1 Perencanaan Wilayah 2024',
    department: 'S1 Perencanaan Wilayah dan Kota',
    standard: AuditStandard.BAN_PT,
    status: AuditStatus.IN_PROGRESS,
    date: '2024-02-20T09:00:00Z',
    questions: [
       {
         id: 'A.1',
         category: 'Tata Pamong',
         questionText: 'Apakah dokumen Renstra unit tersedia dan selaras dengan universitas?',
         compliance: 'Non-Compliant',
         evidence: '',
         auditorNotes: 'Renstra belum disahkan oleh Dekan',
         actionPlan: 'Akan dilakukan revisi dan pengesahan',
         actionPlanDeadline: '2024-03-30'
       }
    ],
  }
];

const STORAGE_KEY = 'ami_smart_audits_v2';

const AppContent: React.FC = () => {
  const { currentUser } = useAuth();
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  
  // Initialize state from localStorage or fall back to mock data
  const [audits, setAudits] = useState<AuditSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : MOCK_AUDITS;
    } catch (e) {
      console.error("Failed to load from local storage", e);
      return MOCK_AUDITS;
    }
  });
  
  const [activeAuditId, setActiveAuditId] = useState<string | null>(null);

  // Persist audits to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(audits));
    } catch (e) {
      console.error("Failed to save to local storage", e);
    }
  }, [audits]);

  // Redirect to dashboard on login
  useEffect(() => {
    if (currentUser) {
      setCurrentView('DASHBOARD');
    }
  }, [currentUser]);

  const handleCreateAudit = (newAudit: AuditSession) => {
    setAudits([newAudit, ...audits]);
    setActiveAuditId(newAudit.id);
    setCurrentView('AUDIT_EXECUTION');
  };

  const handleUpdateAudit = (updatedAudit: AuditSession) => {
    setAudits(audits.map(a => a.id === updatedAudit.id ? updatedAudit : a));
  };

  const handleAuditComplete = () => {
    setCurrentView('REPORT');
  };

  const getActiveAudit = () => audits.find(a => a.id === activeAuditId) || null;

  if (!currentUser) {
    return <Login />;
  }

  const renderContent = () => {
    const activeAudit = getActiveAudit();

    switch (currentView) {
      case 'DASHBOARD':
        return (
          <Dashboard 
            audits={audits} 
            onCreateNew={() => setCurrentView('NEW_AUDIT')} 
          />
        );
      case 'NEW_AUDIT':
        return (
          <NewAuditForm 
            onAuditCreated={handleCreateAudit} 
            onCancel={() => setCurrentView('DASHBOARD')} 
          />
        );
      case 'AUDIT_EXECUTION':
        return (
          <AuditExecution 
            audit={activeAudit} 
            onUpdateAudit={handleUpdateAudit}
            onComplete={handleAuditComplete}
          />
        );
      case 'REPORT':
        return (
          <Reports 
            audit={activeAudit} 
            onUpdateAudit={handleUpdateAudit}
          />
        );
      case 'USER_MGMT':
      case 'TEMPLATE_MGMT':
      case 'SETTINGS':
      case 'MASTER_DATA':
      case 'AUDIT_SCHEDULE':
        return <ManagementPlaceholder view={currentView} />;
      default:
        return <Dashboard audits={audits} onCreateNew={() => setCurrentView('NEW_AUDIT')} />;
    }
  };

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      <main className="flex-1 ml-64 transition-all duration-300">
        {renderContent()}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;