
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
import { MasterDataProvider } from './MasterDataContext';

// Mock Data for initial visualization
const MOCK_AUDITS: AuditSession[] = [
  {
    id: '1',
    name: 'Audit S1 Informatika 2023',
    department: 'S1 - Informatika',
    standard: AuditStandard.LAM_INFOKOM,
    status: AuditStatus.COMPLETED,
    date: '2023-10-15T09:00:00Z',
    questions: [],
    aiSummary: 'Program studi menunjukkan kesiapan yang sangat baik pada kriteria kurikulum, namun perlu peningkatan pada publikasi penelitian mahasiswa.'
  },
  {
    id: '2',
    name: 'Audit S1 Perencanaan Wilayah 2024',
    department: 'S1 - Perencanaan Wilayah dan Kota',
    standard: AuditStandard.BAN_PT,
    status: AuditStatus.IN_PROGRESS,
    date: '2024-02-20T09:00:00Z',
    assignedAuditorId: 'au-1', // Assigned to Dr. Budi Santoso
    questions: [
       {
         id: 'A.1',
         category: 'Tata Pamong',
         questionText: 'Apakah dokumen Renstra unit tersedia dan selaras dengan universitas?',
         compliance: 'Non-Compliant', // Auditor Verdict
         auditeeSelfAssessment: 'Compliant', // Auditee Claim
         evidence: 'https://drive.google.com/file/d/renstra-draft.pdf',
         auditorNotes: 'Renstra ada, tapi belum disahkan oleh Dekan (Perlu TTD).',
         actionPlan: 'Akan dilakukan revisi dan pengesahan',
         actionPlanDeadline: '2024-03-30'
       },
       {
         id: 'A.2',
         category: 'Tata Pamong',
         questionText: 'Apakah struktur organisasi sesuai dengan statuta?',
         compliance: null, // Not yet verified
         auditeeSelfAssessment: 'Compliant',
         evidence: 'https://drive.google.com/org-chart',
         auditorNotes: '',
         actionPlan: ''
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

  // Navigation handler for Dashboard clicks
  const handleViewAudit = (audit: AuditSession) => {
    setActiveAuditId(audit.id);
    
    // Direct navigation based on status
    if (audit.status === AuditStatus.COMPLETED) {
      setCurrentView('REPORT');
    } else {
      setCurrentView('AUDIT_EXECUTION');
    }
  };

  // Handler for Reports List selection
  const handleReportSelect = (audit: AuditSession) => {
    setActiveAuditId(audit.id);
    // Stay in REPORT view
  };

  // Handler to go back to list (clear selection)
  const handleClearSelection = () => {
    setActiveAuditId(null);
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
            onViewAudit={handleViewAudit}
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
            audits={audits}
            onUpdateAudit={handleUpdateAudit}
            onSelectAudit={handleReportSelect}
            onBackToList={handleClearSelection}
          />
        );
      case 'USER_MGMT':
      case 'TEMPLATE_MGMT':
      case 'SETTINGS':
      case 'MASTER_DATA':
      case 'AUDIT_SCHEDULE':
        return <ManagementPlaceholder view={currentView} />;
      default:
        return <Dashboard audits={audits} onCreateNew={() => setCurrentView('NEW_AUDIT')} onViewAudit={handleViewAudit} />;
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
        <MasterDataProvider>
          <AppContent />
        </MasterDataProvider>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
