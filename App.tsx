
import { useState, useEffect, useRef, FC } from 'react';
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
import { SettingsProvider, useSettings } from './SettingsContext';
import { ArrowUp } from 'lucide-react';

// Mock Data for initial visualization
const MOCK_AUDITS: AuditSession[] = [
  {
    id: 'audit-if-2024-complete',
    name: 'Audit Mutu Internal - Siklus Ganjil 2024/2025',
    department: 'S1 - Informatika',
    standard: AuditStandard.LAM_INFOKOM,
    status: AuditStatus.COMPLETED,
    date: '2024-10-15T09:00:00Z',
    assignedAuditorId: 'au-1', // Dr. Budi Santoso (External from Sipil)
    aiSummary: 'Secara umum, Prodi S1 Informatika telah memenuhi standar LAM INFOKOM dengan baik, terutama pada aspek Kurikulum OBE dan Kualifikasi Dosen. Namun, ditemukan ketidaksesuaian pada aspek jabatan fungsional dosen yang perlu segera ditindaklanjuti.',
    aiRecommendations: [
      'Percepatan pengurusan Jabatan Fungsional Lektor Kepala bagi 30% dosen.',
      'Peningkatan publikasi internasional bereputasi (Scopus Q3 ke atas).',
      'Dokumentasi umpan balik pengguna lulusan perlu disistematisasi.'
    ],
    questions: [
       {
         id: 'LI.C.1',
         category: 'C.1 Visi Misi',
         questionText: 'Apakah Visi Keilmuan Program Studi (VMTS) memiliki keunikan spesifik di bidang Infokom/Digital dan telah disosialisasikan?',
         // Auditee Action
         auditeeSelfAssessment: 'Compliant',
         evidence: 'https://informatika.itsb.ac.id/visi-misi-dokumen-sk-rektor.pdf',
         // Auditor Action
         compliance: 'Compliant',
         auditorNotes: 'Visi sangat jelas memuat unsur "Green & Digital Eco-City". Bukti sosialisasi tersedia di website dan notulensi rapat prodi.',
         actionPlan: '',
         actionPlanDeadline: ''
       },
       {
         id: 'LI.C.4',
         category: 'C.4 Sumber Daya Manusia',
         questionText: 'Apakah minimal 50% Dosen Tetap telah memiliki Jabatan Fungsional Lektor Kepala?',
         // Auditee Action
         auditeeSelfAssessment: 'Non-Compliant',
         evidence: 'https://hrd.itsb.ac.id/data-dosen-if-2024.pdf',
         // Auditor Action
         compliance: 'Non-Compliant',
         auditorNotes: 'Berdasarkan data, baru 25% dosen yang Lektor Kepala. Mayoritas masih Asisten Ahli dan Lektor. Ini temuan Mayor.',
         // Auditee Reaction (Action Plan)
         actionPlan: '1. Membentuk tim task force percepatan Jafung. 2. Mengalokasikan dana hibah internal untuk publikasi syarat khusus.',
         actionPlanDeadline: '2025-06-30'
       },
       {
         id: 'LI.C.6',
         category: 'C.6 Pendidikan',
         questionText: 'Apakah kurikulum mengakomodasi sertifikasi kompetensi industri (Micro-credential) bagi mahasiswa?',
         // Auditee Action
         auditeeSelfAssessment: 'Compliant',
         evidence: 'https://drive.google.com/pks-oracle-academy-2024',
         // Auditor Action
         compliance: 'Observation', // Auditor disagrees/observes nuance
         auditorNotes: 'Kerjasama dengan Oracle Academy ada, namun belum terintegrasi penuh ke dalam SKS transkrip nilai. Baru sebatas SKPI.',
         actionPlan: 'Akan dilakukan revisi kurikulum 2025 untuk ekuivalensi sertifikasi ke mata kuliah pilihan.',
         actionPlanDeadline: '2024-12-20'
       }
    ],
  },
  {
    id: 'audit-ts-2024-active',
    name: 'Audit Mutu Internal - Siklus Ganjil 2024/2025',
    department: 'S1 - Teknik Sipil',
    standard: AuditStandard.LAM_TEKNIK,
    status: AuditStatus.IN_PROGRESS,
    date: new Date().toISOString(),
    assignedAuditorId: 'au-2', // Ir. Siti Aminah
    questions: [
       {
         id: 'LT.1.1',
         category: 'Kriteria 1 - Visi Misi',
         questionText: 'Ketersediaan dokumen formal Renstra FTSP/Prodi yang memuat indikator kinerja utama (IKU) teknik.',
         auditeeSelfAssessment: 'Compliant',
         evidence: 'https://sipil.itsb.ac.id/renstra-final',
         compliance: null, // Auditor hasn't verified yet
         auditorNotes: '',
       },
       {
         id: 'LT.4.1',
         category: 'Kriteria 4 - SDM',
         questionText: 'Kecukupan jumlah dosen tetap (DTPS) dengan kualifikasi insinyur profesional (IPM/IPU).',
         auditeeSelfAssessment: null, // Auditee hasn't filled yet
         evidence: '',
         compliance: null,
         auditorNotes: '',
       }
    ],
  }
];

const STORAGE_KEY = 'ami_smart_audits_v3';

const AppContent: FC = () => {
  const { currentUser } = useAuth();
  const { settings } = useSettings();
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  
  // Sidebar State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Scroll To Top Logic (Toggle Auto Scroll Up)
  const mainContentRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const [audits, setAudits] = useState<AuditSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : MOCK_AUDITS;
    } catch (e) {
      return MOCK_AUDITS;
    }
  });

  const [selectedAudit, setSelectedAudit] = useState<AuditSession | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(audits));
  }, [audits]);

  // Scroll Event Listener
  useEffect(() => {
    const handleScroll = () => {
      if (mainContentRef.current) {
        // Show button if scrolled down more than 200px
        setShowScrollTop(mainContentRef.current.scrollTop > 200);
      }
    };

    const mainElement = mainContentRef.current;
    if (mainElement) {
      mainElement.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (mainElement) {
        mainElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const scrollToTop = () => {
    mainContentRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleCreateAudit = (newAudit: AuditSession) => {
    setAudits([newAudit, ...audits]);
    // Only redirect if it's already in progress, otherwise stay (e.g. for scheduling)
    if (newAudit.status === AuditStatus.IN_PROGRESS) {
      setSelectedAudit(newAudit);
      setCurrentView('AUDIT_EXECUTION');
    }
  };

  const handleUpdateAudit = (updatedAudit: AuditSession) => {
    setAudits(audits.map(a => a.id === updatedAudit.id ? updatedAudit : a));
    // If currently viewing this audit, update the selected one too
    if (selectedAudit && selectedAudit.id === updatedAudit.id) {
      setSelectedAudit(updatedAudit);
    }
  };

  const handleDeleteAudit = (auditId: string) => {
    setAudits(audits.filter(a => a.id !== auditId));
    if (selectedAudit?.id === auditId) setSelectedAudit(null);
  };

  const handleViewAudit = (audit: AuditSession) => {
    setSelectedAudit(audit);
    setCurrentView('AUDIT_EXECUTION');
  };

  // If not logged in, show Login screen
  if (!currentUser) {
    return <Login />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className={`flex-1 relative overflow-hidden flex flex-col h-screen transition-all duration-300 ${
        isSidebarCollapsed ? 'ml-20' : 'ml-64'
      }`}>
        {/* Main Scrollable Area */}
        <main 
          ref={mainContentRef}
          className="flex-1 overflow-y-auto bg-slate-50 scroll-smooth"
        >
          {currentView === 'DASHBOARD' && (
            <Dashboard 
              audits={audits} 
              onCreateNew={() => setCurrentView('NEW_AUDIT')}
              onViewAudit={handleViewAudit}
            />
          )}

          {currentView === 'NEW_AUDIT' && (
            <NewAuditForm 
              onAuditCreated={handleCreateAudit}
              onCancel={() => setCurrentView('DASHBOARD')}
            />
          )}

          {currentView === 'AUDIT_EXECUTION' && (
            <AuditExecution 
              audit={selectedAudit}
              onUpdateAudit={handleUpdateAudit}
              onComplete={() => {
                handleUpdateAudit({ ...selectedAudit!, status: AuditStatus.COMPLETED });
                setCurrentView('REPORT');
              }}
            />
          )}

          {currentView === 'REPORT' && (
            <Reports 
              audit={selectedAudit}
              audits={audits}
              onUpdateAudit={handleUpdateAudit}
              onSelectAudit={(audit) => {
                setSelectedAudit(audit);
              }}
              onBackToList={() => setSelectedAudit(null)}
            />
          )}

          {/* Management Views */}
          {['USER_MGMT', 'TEMPLATE_MGMT', 'SETTINGS', 'MASTER_DATA', 'AUDIT_SCHEDULE'].includes(currentView) && (
            <ManagementPlaceholder 
              view={currentView} 
              audits={audits}
              onCreateAudit={handleCreateAudit}
              onUpdateAudit={handleUpdateAudit}
              onDeleteAudit={handleDeleteAudit}
            />
          )}

          {/* Padding at bottom for scroll space */}
          <div className="h-20"></div>
        </main>

        {/* Scroll To Top Button */}
        <button
          onClick={scrollToTop}
          className={`fixed bottom-8 right-8 p-3 rounded-full shadow-lg text-white transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) z-50 hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center ${
            showScrollTop 
              ? 'opacity-100 translate-y-0 scale-100' 
              : 'opacity-0 translate-y-10 scale-75 pointer-events-none'
          }`}
          style={{ backgroundColor: settings.themeColor || '#2563eb' }}
          title="Scroll to Top"
          aria-label="Scroll to top"
        >
          <ArrowUp size={24} strokeWidth={2.5} />
        </button>

      </div>
    </div>
  );
};

const App: FC = () => {
  return (
    <SettingsProvider>
      <AuthProvider>
        <LanguageProvider>
          <MasterDataProvider>
            <AppContent />
          </MasterDataProvider>
        </LanguageProvider>
      </AuthProvider>
    </SettingsProvider>
  );
};

export default App;
