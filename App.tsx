
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
  // 1. COMPLETED AUDIT (Example for Reports) - LAM INFOKOM
  {
    id: 'audit-if-2024-complete',
    name: 'Audit Mutu Internal - Siklus Ganjil 2024/2025',
    department: 'S1 - Informatika',
    standard: AuditStandard.LAM_INFOKOM,
    status: AuditStatus.COMPLETED,
    date: '2024-10-15T09:00:00Z',
    auditeeDeadline: '2024-10-29T09:00:00Z',
    auditorDeadline: '2024-11-05T09:00:00Z',
    assignedAuditorId: 'au-lpm', // Auditor Internal LPM
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
         auditeeSelfAssessment: 'Compliant',
         evidence: 'https://informatika.itsb.ac.id/visi-misi-dokumen-sk-rektor.pdf',
         compliance: 'Compliant',
         auditorNotes: 'Visi sangat jelas memuat unsur "Green & Digital Eco-City". Bukti sosialisasi tersedia di website dan notulensi rapat prodi.',
         actionPlan: '',
         actionPlanDeadline: ''
       },
       {
         id: 'LI.C.4',
         category: 'C.4 Sumber Daya Manusia',
         questionText: 'Apakah minimal 50% Dosen Tetap telah memiliki Jabatan Fungsional Lektor Kepala?',
         auditeeSelfAssessment: 'Non-Compliant',
         evidence: 'https://hrd.itsb.ac.id/data-dosen-if-2024.pdf',
         compliance: 'Non-Compliant',
         auditorNotes: 'Berdasarkan data, baru 25% dosen yang Lektor Kepala. Mayoritas masih Asisten Ahli dan Lektor. Ini temuan Mayor.',
         actionPlan: '1. Membentuk tim task force percepatan Jafung. 2. Mengalokasikan dana hibah internal untuk publikasi syarat khusus.',
         actionPlanDeadline: '2025-06-30'
       }
    ],
  },

  // 2. ACTIVE AUDIT - REKTORAT (Auditor Lead vs Rektorat Staff)
  {
    id: 'audit-rek-001',
    name: 'Audit Kinerja Rektorat 2024',
    department: 'Rektorat',
    standard: AuditStandard.PERMENDIKTISAINTEK_2025,
    status: AuditStatus.IN_PROGRESS,
    date: new Date().toISOString(),
    // Current + 14 days
    auditeeDeadline: new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    // Current + 21 days
    auditorDeadline: new Date(new Date().getTime() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    assignedAuditorId: 'lead-1', // Assigned to Lead Auditor
    questions: [
       {
         id: 'P.A.1',
         category: 'A. Kebijakan',
         questionText: 'Apakah unit kerja memiliki dokumen kebijakan SPMI yang selaras dengan Permendiktisaintek No. 39/2025?',
         auditeeSelfAssessment: 'Compliant',
         evidence: 'https://drive.itsb.ac.id/sk-kebijakan-spmi-2025',
         compliance: null, // Waiting for Auditor Verdict
         auditorNotes: '',
       },
       {
         id: 'P.C.1',
         category: 'C. Pelaporan',
         questionText: 'Apakah laporan kinerja unit disampaikan secara berkala kepada pimpinan universitas dan yayasan?',
         auditeeSelfAssessment: null, // Waiting for Auditee (Staff Rektorat)
         evidence: '',
         compliance: null,
         auditorNotes: '',
       }
    ],
  },

  // 3. ACTIVE AUDIT - DIREKTORAT IT (Auditee needs to fill)
  {
    id: 'audit-it-001',
    name: 'Audit Tata Kelola IT & Infrastruktur',
    department: 'Direktorat IT',
    standard: AuditStandard.PERMENDIKTISAINTEK_2025,
    status: AuditStatus.IN_PROGRESS,
    date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    auditeeDeadline: new Date(Date.now() + 1209600000).toISOString(), // +14 days approx
    auditorDeadline: new Date(Date.now() + 1814400000).toISOString(), // +21 days approx
    assignedAuditorId: 'au-lpm', // Auditor Internal LPM
    questions: [
       {
         id: 'IT.1.1',
         category: 'Infrastruktur',
         questionText: 'Ketersediaan dokumen Disaster Recovery Plan (DRP) untuk sistem informasi akademik.',
         auditeeSelfAssessment: 'Observation',
         evidence: 'https://it.itsb.ac.id/drp-draft-v1',
         compliance: 'Observation',
         auditorNotes: 'Dokumen masih berupa draft, belum disahkan oleh Rektor. Mohon segera difinalisasi.',
         actionPlan: 'Finalisasi dokumen DRP dan pengajuan tanda tangan Rektor.',
         actionPlanDeadline: '2024-12-01'
       },
       {
         id: 'IT.2.1',
         category: 'Keamanan Siber',
         questionText: 'Apakah telah dilakukan Penetration Testing (Pentest) pada aplikasi utama minimal 1 tahun sekali?',
         auditeeSelfAssessment: null, // Auditee (Staff IT) needs to fill this
         evidence: '',
         compliance: null,
         auditorNotes: '',
       }
    ],
  },

  // 4. ACTIVE AUDIT - LP3B (Example of SUBMITTED state)
  {
    id: 'audit-lp3b-001',
    name: 'Audit Pengembangan Pembelajaran LP3B',
    department: 'LP3B',
    standard: AuditStandard.PERMENDIKTISAINTEK_2025,
    status: AuditStatus.SUBMITTED, // AUDITEE HAS SUBMITTED!
    date: new Date().toISOString(),
    auditeeDeadline: new Date(Date.now() + 1209600000).toISOString(),
    auditorDeadline: new Date(Date.now() + 1814400000).toISOString(),
    assignedAuditorId: 'lead-1',
    questions: [
       {
         id: 'LP.1',
         category: 'Kurikulum',
         questionText: 'Persentase mata kuliah yang telah menggunakan metode Case Method dan Team Based Project.',
         auditeeSelfAssessment: 'Compliant',
         evidence: 'https://lp3b.itsb.ac.id/laporan-rps-2024',
         compliance: null, // Auditor needs to verify this now
         auditorNotes: '',
       }
    ],
  },

  // 5. PLANNED AUDIT - PRODI SIPIL - LAM TEKNIK
  {
    id: 'audit-ts-plan',
    name: 'Audit Lapangan Teknik Sipil',
    department: 'S1 - Teknik Sipil',
    standard: AuditStandard.LAM_TEKNIK,
    status: AuditStatus.PLANNED,
    date: '2024-12-20T09:00:00Z',
    auditeeDeadline: '2025-01-03T09:00:00Z',
    auditorDeadline: '2025-01-10T09:00:00Z',
    assignedAuditorId: 'pwk-auditor', // Cross audit from PWK
    questions: [],
  },

  // 6. PLANNED AUDIT - SAWIT (Vokasi) - BAN PT
  {
    id: 'audit-tps-plan',
    name: 'Asesmen Lapangan D3 Sawit',
    department: 'D3 - Teknologi Pengolahan Sawit',
    standard: AuditStandard.BAN_PT,
    status: AuditStatus.PLANNED,
    date: '2025-01-10T09:00:00Z',
    auditeeDeadline: '2025-01-24T09:00:00Z',
    auditorDeadline: '2025-01-31T09:00:00Z',
    assignedAuditorId: 'au-lpm',
    questions: [],
  },

  // 7. Audit Dir DikMa (Planned)
  {
    id: 'audit-dikma-plan',
    name: 'Audit Layanan Akademik & Kemahasiswaan',
    department: 'Direktorat Pendidikan & Kemahasiswaan',
    standard: AuditStandard.PERMENDIKTISAINTEK_2025,
    status: AuditStatus.PLANNED,
    date: '2025-02-15T09:00:00Z',
    auditeeDeadline: '2025-03-01T09:00:00Z',
    auditorDeadline: '2025-03-08T09:00:00Z',
    assignedAuditorId: 'au-lpm', 
    questions: [],
  },

  // 8. Audit Perpustakaan (In Progress)
  {
    id: 'audit-lib-001',
    name: 'Audit Standar Perpustakaan Nasional',
    department: 'Perpustakaan',
    standard: AuditStandard.PERMENDIKTISAINTEK_2025,
    status: AuditStatus.IN_PROGRESS,
    date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    auditeeDeadline: new Date(Date.now() + 1000000000).toISOString(),
    auditorDeadline: new Date(Date.now() + 1500000000).toISOString(),
    assignedAuditorId: 'au-lpm',
    questions: [
       {
         id: 'LIB.1',
         category: 'Koleksi',
         questionText: 'Kecukupan jumlah judul buku teks per program studi (minimal 200 judul/prodi).',
         auditeeSelfAssessment: 'Compliant',
         evidence: 'https://lib.itsb.ac.id/laporan-koleksi-2024.pdf',
         compliance: null,
         auditorNotes: '',
       }
    ],
  },
  
  // 9. Audit Dir Sistem Informasi (Completed)
  {
    id: 'audit-si-complete',
    name: 'Audit Pengembangan Sistem Informasi Terintegrasi',
    department: 'Direktorat Sistem Informasi',
    standard: AuditStandard.PERMENDIKTISAINTEK_2025,
    status: AuditStatus.COMPLETED,
    date: '2024-11-20T09:00:00Z',
    auditeeDeadline: '2024-12-04T09:00:00Z',
    auditorDeadline: '2024-12-11T09:00:00Z',
    assignedAuditorId: 'it-auditor', // Internal IT Auditor for SI
    aiSummary: 'Direktorat Sistem Informasi telah berhasil mengintegrasikan 80% layanan akademik ke dalam portal tunggal. Kepatuhan terhadap standar keamanan data sangat baik.',
    aiRecommendations: ['Perlu peningkatan kapasitas server untuk periode KRS.', 'Implementasi SSO untuk layanan eksternal.'],
    questions: [
       {
         id: 'SI.1',
         category: 'Integrasi Data',
         questionText: 'Apakah pangkalan data perguruan tinggi (PDDikti) terhubung secara realtime dengan sistem internal?',
         auditeeSelfAssessment: 'Compliant',
         evidence: 'https://si.itsb.ac.id/api-logs-pddikti',
         compliance: 'Compliant',
         auditorNotes: 'Sync berjalan otomatis setiap 6 jam. Tidak ada isu backlog data.',
         actionPlan: '',
         actionPlanDeadline: ''
       }
    ],
  },
];

const STORAGE_KEY = 'ami_smart_audits_v9'; // Bumped version to load new mocks with deadlines and SUBMITTED status

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
              onNavigate={setCurrentView} 
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
