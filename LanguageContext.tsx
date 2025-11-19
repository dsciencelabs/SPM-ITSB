import React, { createContext, useState, useContext, ReactNode } from 'react';

type Language = 'id' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  id: {
    // Sidebar
    'nav.dashboard': 'Dashboard',
    'nav.newAudit': 'Audit Baru',
    'nav.execution': 'Pelaksanaan',
    'nav.report': 'Laporan & AI',
    'nav.systemStatus': 'Status Sistem',
    'nav.aiConnected': 'Gemini AI Terhubung',
    
    // Dashboard
    'dash.title': 'Dashboard Audit',
    'dash.subtitle': 'Ringkasan aktivitas penjaminan mutu',
    'dash.btnNew': '+ Audit Baru',
    'dash.total': 'Total Audit',
    'dash.inProgress': 'Sedang Berjalan',
    'dash.completed': 'Selesai',
    'dash.findings': 'Temuan Mayor',
    'dash.recentHistory': 'Riwayat Audit Terbaru',
    'dash.th.dept': 'Program Studi',
    'dash.th.std': 'Standar',
    'dash.th.status': 'Status',
    'dash.th.date': 'Tanggal',
    'dash.empty': 'Belum ada data audit. Mulai audit baru.',
    'dash.aiTitle': 'Integrasi Gemini AI',
    'dash.aiDesc': 'Sistem SAMI ITSB ini menggunakan Google Gemini untuk menghasilkan instrumen audit secara otomatis berdasarkan standar (LAM/BAN-PT) dan menganalisis hasil temuan.',

    // New Audit
    'new.title': 'Buat Audit Baru',
    'new.subtitle': 'Gemini AI akan membuatkan daftar pertanyaan audit yang relevan secara otomatis.',
    'new.label.dept': 'Unit / Program Studi',
    'new.placeholder.dept': 'Contoh: S1 Teknik Informatika',
    'new.label.std': 'Standar Akreditasi',
    'new.btn.cancel': 'Batal',
    'new.btn.generate': 'Sedang Generate Instrumen...',
    'new.btn.start': 'Mulai Audit',
    'new.error': 'Gagal menghubungkan ke Gemini AI. Pastikan API Key valid.',

    // Execution
    'exec.noAudit': 'Tidak ada audit aktif',
    'exec.selectMsg': 'Silakan pilih audit dari dashboard atau buat audit baru.',
    'exec.btn.save': 'Simpan Draft',
    'exec.btn.saving': 'Menyimpan...',
    'exec.btn.complete': 'Selesai Audit',
    'exec.progress': 'Kelengkapan Audit',
    'exec.answered': 'butir telah dinilai',
    'exec.status.c': 'Memenuhi (C)',
    'exec.status.ob': 'Observasi (OB)',
    'exec.status.nc': 'Tidak Memenuhi (NC)',
    'exec.notFilled': 'Belum diisi',
    'exec.toggle.show': 'Tulis Bukti & Catatan',
    'exec.toggle.hide': 'Sembunyikan Detail',
    'exec.label.evidence': 'Bukti Audit / Evidence',
    'exec.ph.evidence': 'Contoh: Dokumen Kurikulum 2023, SK Rektor No...',
    'exec.label.notes': 'Catatan Auditor',
    'exec.ph.notes': 'Catatan tambahan terkait temuan...',
    'exec.confirm': 'Selesaikan audit ini? Status akan berubah menjadi Completed dan tidak dapat diedit lagi.',

    // Reports
    'report.select': 'Pilih audit untuk melihat laporan.',
    'report.title': 'Laporan Audit Mutu Internal',
    'report.btn.export': 'Export PDF',
    'report.compliant': 'Kepatuhan (Compliant)',
    'report.nc': 'Ketidaksesuaian (NC)',
    'report.ob': 'Observasi',
    'report.aiTitle': 'Analisis Cerdas Gemini AI',
    'report.aiEmpty': 'Dapatkan ringkasan eksekutif dan rekomendasi strategis berbasis standar menggunakan kecerdasan buatan.',
    'report.btn.analyze': 'Analisis Hasil Audit Sekarang',
    'report.btn.analyzing': 'Menganalisis Temuan...',
    'report.execSummary': 'Executive Summary',
    'report.recommendations': 'Rekomendasi Strategis',
    'report.refresh': 'Refresh Analisis',
    'report.details': 'Rincian Temuan',
    'report.shown': 'ditampilkan',
    'report.filter': 'FILTER:',
    'report.th.code': 'Kode',
    'report.th.question': 'Pertanyaan',
    'report.th.status': 'Status',
    'report.th.notes': 'Bukti / Catatan',
    'report.emptyFilter': 'Tidak ada temuan yang sesuai dengan filter yang dipilih.',
    'report.alert': 'Gagal menganalisis data dengan Gemini AI.',
  },
  en: {
    // Sidebar
    'nav.dashboard': 'Dashboard',
    'nav.newAudit': 'New Audit',
    'nav.execution': 'Execution',
    'nav.report': 'Report & AI',
    'nav.systemStatus': 'System Status',
    'nav.aiConnected': 'Gemini AI Connected',
    
    // Dashboard
    'dash.title': 'Audit Dashboard',
    'dash.subtitle': 'Quality assurance activity overview',
    'dash.btnNew': '+ New Audit',
    'dash.total': 'Total Audits',
    'dash.inProgress': 'In Progress',
    'dash.completed': 'Completed',
    'dash.findings': 'Major Findings',
    'dash.recentHistory': 'Recent Audit History',
    'dash.th.dept': 'Department',
    'dash.th.std': 'Standard',
    'dash.th.status': 'Status',
    'dash.th.date': 'Date',
    'dash.empty': 'No audit data yet. Start a new audit.',
    'dash.aiTitle': 'Gemini AI Integration',
    'dash.aiDesc': 'This SAMI ITSB System uses Google Gemini to automatically generate audit instruments based on standards (LAM/BAN-PT) and analyze findings.',

    // New Audit
    'new.title': 'Create New Audit',
    'new.subtitle': 'Gemini AI will automatically generate a list of relevant audit questions.',
    'new.label.dept': 'Unit / Study Program',
    'new.placeholder.dept': 'Example: Computer Science Dept',
    'new.label.std': 'Accreditation Standard',
    'new.btn.cancel': 'Cancel',
    'new.btn.generate': 'Generating Instrument...',
    'new.btn.start': 'Start Audit',
    'new.error': 'Failed to connect to Gemini AI. Please check your API Key.',

    // Execution
    'exec.noAudit': 'No active audit',
    'exec.selectMsg': 'Please select an audit from the dashboard or create a new one.',
    'exec.btn.save': 'Save Draft',
    'exec.btn.saving': 'Saving...',
    'exec.btn.complete': 'Complete Audit',
    'exec.progress': 'Audit Completeness',
    'exec.answered': 'items assessed',
    'exec.status.c': 'Compliant (C)',
    'exec.status.ob': 'Observation (OB)',
    'exec.status.nc': 'Non-Compliant (NC)',
    'exec.notFilled': 'Empty',
    'exec.toggle.show': 'Write Evidence & Notes',
    'exec.toggle.hide': 'Hide Details',
    'exec.label.evidence': 'Evidence',
    'exec.ph.evidence': 'Ex: Curriculum Doc 2023, Rector Decree No...',
    'exec.label.notes': 'Auditor Notes',
    'exec.ph.notes': 'Additional notes regarding the finding...',
    'exec.confirm': 'Complete this audit? Status will change to Completed and cannot be edited.',

    // Reports
    'report.select': 'Select an audit to view the report.',
    'report.title': 'Internal Quality Audit Report',
    'report.btn.export': 'Export PDF',
    'report.compliant': 'Compliant',
    'report.nc': 'Non-Compliant',
    'report.ob': 'Observation',
    'report.aiTitle': 'Gemini AI Smart Analysis',
    'report.aiEmpty': 'Get an executive summary and strategic recommendations based on standards using AI.',
    'report.btn.analyze': 'Analyze Audit Results',
    'report.btn.analyzing': 'Analyzing Findings...',
    'report.execSummary': 'Executive Summary',
    'report.recommendations': 'Strategic Recommendations',
    'report.refresh': 'Refresh Analysis',
    'report.details': 'Findings Details',
    'report.shown': 'shown',
    'report.filter': 'FILTER:',
    'report.th.code': 'Code',
    'report.th.question': 'Question',
    'report.th.status': 'Status',
    'report.th.notes': 'Evidence / Notes',
    'report.emptyFilter': 'No findings match the selected filters.',
    'report.alert': 'Failed to analyze data with Gemini AI.',
  }
};

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('id');

  const t = (key: string): string => {
    // @ts-ignore
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};