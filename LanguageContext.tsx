
import { createContext, useState, useContext, ReactNode, FC } from 'react';

type Language = 'id' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  id: {
    // Global Confirmations
    'confirm.general': 'Konfirmasi Tindakan',
    'confirm.save': 'Apakah Anda yakin ingin MENYIMPAN data ini?',
    'confirm.delete': 'Apakah Anda yakin ingin MENGHAPUS data ini? Tindakan ini tidak dapat dibatalkan.',
    'confirm.update': 'Apakah Anda yakin ingin MEMPERBARUI data ini?',
    'confirm.add': 'Apakah Anda yakin ingin MENAMBAH data baru?',
    'confirm.action': 'Apakah Anda yakin ingin melanjutkan tindakan ini?',
    'confirm.cancel': 'Apakah Anda yakin ingin membatalkan?',

    // Sidebar
    'nav.dashboard': 'Dashboard',
    'nav.newAudit': 'Audit Baru',
    'nav.execution': 'Pelaksanaan',
    'nav.report': 'Laporan & AI',
    'nav.systemStatus': 'Status Sistem',
    'nav.aiConnected': 'Gemini AI Terhubung',
    'nav.logout': 'Keluar Aplikasi',
    
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
    'new.title': 'Konfigurasi Audit',
    'new.subtitle': 'Pilih unit dan standar akreditasi untuk memulai.',
    'new.editor.title': 'Review Instrumen Audit',
    'new.editor.subtitle': 'Tinjau, edit, atau tambahkan pertanyaan audit secara manual sebelum memulai.',
    'new.editor.count': 'Pertanyaan dalam draf',
    'new.label.dept': 'Unit / Program Studi',
    'new.placeholder.dept': 'Contoh: S1 Teknik Informatika',
    'new.label.std': 'Standar Akreditasi',
    'new.btn.cancel': 'Batal',
    'new.btn.generate': 'Membuat Draf Instrumen...',
    'new.btn.next': 'Lanjut ke Review',
    'new.btn.back': 'Kembali',
    'new.btn.start': 'Mulai Audit',
    'new.btn.finalize': 'Mulai Audit Resmi',
    'new.btn.addManual': '+ Tambah Manual',
    'new.error': 'Gagal menghubungkan ke Gemini AI. Pastikan API Key valid.',
    'new.del.title': 'Hapus Pertanyaan?',
    'new.del.msg': 'Apakah Anda yakin ingin menghapus butir pertanyaan ini dari daftar? Tindakan ini tidak dapat dibatalkan.',
    'new.del.confirm': 'Ya, Hapus',

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
    'exec.ph.evidence': 'Tempel tautan URL di sini (contoh: https://drive.google.com/...)',
    'exec.label.notes': 'Catatan Auditor',
    'exec.ph.notes': 'Catatan tambahan terkait temuan...',
    'exec.confirm': 'Selesaikan audit ini? Status akan berubah menjadi Completed dan tidak dapat diedit lagi.',
    'exec.error.url': 'Format URL tidak valid. Harap gunakan http:// atau https://',

    // Reports
    'report.select': 'Pilih audit untuk melihat laporan.',
    'report.title': 'Laporan Audit Mutu Internal',
    'report.btn.export': 'Export PDF',
    'report.btn.reopen': 'Buka Kembali (Draft)',
    'report.reopenConfirm': 'Kembalikan status audit menjadi Draft? Auditor dan Auditee dapat mengubah isian kembali.',
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
    
    // Repository (List View)
    'repo.title': 'Repositori Laporan Audit',
    'repo.subtitle': 'Pusat akses seluruh laporan audit, draf, dan penilaian yang sedang berlangsung.',
    'repo.all': 'Semua Laporan',
    'repo.completed': 'Selesai',
    'repo.progress': 'Dalam Proses / Draf',
    'repo.access.admin': 'Akses Admin: Menampilkan seluruh data audit (Draf, Berlangsung, Selesai).',
    'repo.access.user': 'Menampilkan laporan yang diizinkan untuk unit Anda.',
    'repo.search': 'Cari Unit / Prodi...',
    'repo.empty': 'Tidak ada laporan yang ditemukan sesuai kriteria.',
    'repo.btn.view': 'Lihat Detail',

    // User Management
    'mgmt.user.title': 'Manajemen Pengguna',
    'mgmt.user.desc': 'Kelola akses SuperAdmin, Admin, Auditor Lead, Auditor, Dept Head dan Auditee.',
    'mgmt.active.title': 'Pengguna Aktif',
    'mgmt.active.desc': 'Pengguna dengan akses aktif ke sistem',
    'mgmt.btnAdd': 'Tambah Pengguna',
    'mgmt.pending.title': 'Pengguna Tertunda / Non-Aktif',
    'mgmt.pending.desc': 'Registrasi baru menunggu persetujuan',
    'mgmt.th.name': 'Nama',
    'mgmt.th.username': 'Username',
    'mgmt.th.role': 'Peran',
    'mgmt.th.dept': 'Departemen',
    'mgmt.th.status': 'Status',
    'mgmt.th.action': 'Aksi',
    'mgmt.btn.edit': 'Edit',
    'mgmt.btn.activate': 'Aktifkan',
    'mgmt.btn.reject': 'Tolak',
    
    'mgmt.modal.add': 'Tambah Pengguna Baru',
    'mgmt.modal.edit': 'Edit Detail Pengguna',
    'mgmt.form.name': 'Nama Lengkap',
    'mgmt.form.user': 'Username',
    'mgmt.form.pass': 'Password',
    'mgmt.form.pass.edit': 'Password (Kosongkan jika tidak diubah)',
    'mgmt.form.role': 'Peran',
    'mgmt.form.dept': 'Departemen / Unit',
    'mgmt.btn.cancel': 'Batal',
    'mgmt.btn.save': 'Simpan',
    'mgmt.btn.update': 'Perbarui',

    'mgmt.del.title': 'Konfirmasi Hapus',
    'mgmt.del.msg': 'Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.',
    'mgmt.del.confirm': 'Ya, Hapus',

    // Master Data
    'master.title': 'Unit Kerja',
    'master.desc': 'Kelola data referensi Unit, Program Studi, dan Fakultas.',
    'master.tab.prodi': 'Daftar Unit Kerja',
    'master.btn.add': 'Tambah Unit',
    'master.th.code': 'Kode',
    'master.th.name': 'Nama Unit Kerja',
    'master.th.type': 'Tipe Unit',
    'master.th.faculty': 'Induk / Fakultas',
    'master.th.head': 'Pimpinan',
    'master.modal.add': 'Tambah Unit Kerja',
    'master.modal.edit': 'Edit Unit Kerja',
    'master.form.code': 'Kode Unit',
    'master.form.name': 'Nama Unit',
    'master.form.type': 'Tipe Unit',
    'master.form.faculty': 'Induk / Fakultas',
    'master.form.head': 'Nama Pimpinan',
    'master.del.msg': 'Apakah Anda yakin ingin menghapus unit ini?',

    'mgmt.tmpl.title': 'Manajemen Instrumen Audit',
    'mgmt.tmpl.desc': 'Kelola standar dan butir pertanyaan audit (Dikti, LAM, BAN-PT).',
    
    'mgmt.set.title': 'Pengaturan Sistem',
    'mgmt.set.desc': 'Branding aplikasi, logo, warna tema, dan konfigurasi siklus audit.',
    'mgmt.set.brand': 'Branding & Tampilan',
    'mgmt.set.appName': 'Nama Aplikasi',
    'mgmt.set.logo': 'Logo Aplikasi',
    'mgmt.set.upload': 'Klik untuk unggah logo (PNG/SVG)',
    'mgmt.set.theme': 'Warna Tema',
    'mgmt.set.cycle': 'Konfigurasi Siklus Audit',
    'mgmt.set.period': 'Periode Audit Aktif',
    'mgmt.set.std': 'Standar Default',
    'mgmt.set.save': 'Simpan Perubahan Sistem',
  },
  en: {
    // Global Confirmations
    'confirm.general': 'Action Confirmation',
    'confirm.save': 'Are you sure you want to SAVE this data?',
    'confirm.delete': 'Are you sure you want to DELETE this data? This cannot be undone.',
    'confirm.update': 'Are you sure you want to UPDATE this data?',
    'confirm.add': 'Are you sure you want to ADD this new data?',
    'confirm.action': 'Are you sure you want to proceed?',
    'confirm.cancel': 'Are you sure you want to cancel?',

    // Sidebar
    'nav.dashboard': 'Dashboard',
    'nav.newAudit': 'New Audit',
    'nav.execution': 'Execution',
    'nav.report': 'Report & AI',
    'nav.systemStatus': 'System Status',
    'nav.aiConnected': 'Gemini AI Connected',
    'nav.logout': 'Logout',
    
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
    'new.title': 'Audit Configuration',
    'new.subtitle': 'Select department and accreditation standard to begin.',
    'new.editor.title': 'Review Audit Instrument',
    'new.editor.subtitle': 'Review, edit, or manually add audit questions before starting.',
    'new.editor.count': 'Questions in draft',
    'new.label.dept': 'Unit / Study Program',
    'new.placeholder.dept': 'Example: Computer Science Dept',
    'new.label.std': 'Accreditation Standard',
    'new.btn.cancel': 'Cancel',
    'new.btn.generate': 'Creating Draft...',
    'new.btn.next': 'Proceed to Review',
    'new.btn.back': 'Back',
    'new.btn.start': 'Start Audit',
    'new.btn.finalize': 'Finalize & Start',
    'new.btn.addManual': '+ Add Manual',
    'new.error': 'Failed to connect to Gemini AI. Please check your API Key.',
    'new.del.title': 'Delete Question?',
    'new.del.msg': 'Are you sure you want to remove this item? This action cannot be undone.',
    'new.del.confirm': 'Yes, Delete',

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
    'exec.ph.evidence': 'Paste URL here (e.g., https://drive.google.com/...)',
    'exec.label.notes': 'Auditor Notes',
    'exec.ph.notes': 'Additional notes regarding the finding...',
    'exec.confirm': 'Complete this audit? Status will change to Completed and cannot be edited.',
    'exec.error.url': 'Invalid URL format. Please use http:// or https://',

    // Reports
    'report.select': 'Select an audit to view the report.',
    'report.title': 'Internal Quality Audit Report',
    'report.btn.export': 'Export PDF',
    'report.btn.reopen': 'Re-open (Draft)',
    'report.reopenConfirm': 'Revert audit status to Draft? Auditor and Auditee can edit entries again.',
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

    // Repository (List View)
    'repo.title': 'Audit Report Repository',
    'repo.subtitle': 'Centralized access to all audit reports, drafts, and ongoing assessments.',
    'repo.all': 'All Reports',
    'repo.completed': 'Completed',
    'repo.progress': 'In Progress / Draft',
    'repo.access.admin': 'Admin Access: Viewing comprehensive list of all audits (Drafts, In Progress, Completed).',
    'repo.access.user': 'Viewing reports authorized for your department.',
    'repo.search': 'Search Department...',
    'repo.empty': 'No reports found matching your criteria.',
    'repo.btn.view': 'View Details',

    // User Management
    'mgmt.user.title': 'User Management',
    'mgmt.user.desc': 'Manage SuperAdmins, Admins, Auditors, and Auditees access.',
    'mgmt.active.title': 'Active Users',
    'mgmt.active.desc': 'Users with active access to the system',
    'mgmt.btnAdd': 'Add User',
    'mgmt.pending.title': 'Pending / Inactive Users',
    'mgmt.pending.desc': 'New registrations waiting for approval',
    'mgmt.th.name': 'Name',
    'mgmt.th.username': 'Username',
    'mgmt.th.role': 'Role',
    'mgmt.th.dept': 'Department',
    'mgmt.th.status': 'Status',
    'mgmt.th.action': 'Action',
    'mgmt.btn.edit': 'Edit',
    'mgmt.btn.activate': 'Activate',
    'mgmt.btn.reject': 'Reject',

    'mgmt.modal.add': 'Add New User',
    'mgmt.modal.edit': 'Edit User Details',
    'mgmt.form.name': 'Full Name',
    'mgmt.form.user': 'Username',
    'mgmt.form.pass': 'Password',
    'mgmt.form.pass.edit': 'Password (Leave blank to keep current)',
    'mgmt.form.role': 'Role',
    'mgmt.form.dept': 'Department / Unit',
    'mgmt.btn.cancel': 'Cancel',
    'mgmt.btn.save': 'Save User',
    'mgmt.btn.update': 'Update User',

    'mgmt.del.title': 'Confirm Delete',
    'mgmt.del.msg': 'Are you sure you want to remove this item? This action cannot be undone.',
    'mgmt.del.confirm': 'Yes, Delete',

    // Master Data
    'master.title': 'Work Units',
    'master.desc': 'Manage Departments, Faculties, and Standards reference data.',
    'master.tab.prodi': 'List of Work Units',
    'master.btn.add': 'Add Unit',
    'master.th.code': 'Code',
    'master.th.name': 'Unit Name',
    'master.th.type': 'Type',
    'master.th.faculty': 'Parent / Faculty',
    'master.th.head': 'Head of Unit',
    'master.modal.add': 'Add Work Unit',
    'master.modal.edit': 'Edit Work Unit',
    'master.form.code': 'Unit Code',
    'master.form.name': 'Unit Name',
    'master.form.type': 'Unit Type',
    'master.form.faculty': 'Parent / Faculty',
    'master.form.head': 'Head Name',
    'master.del.msg': 'Are you sure you want to delete this unit?',

    'mgmt.tmpl.title': 'Audit Instruments',
    'mgmt.tmpl.desc': 'Manage audit standards, questions, and indicators (Dikti, LAM, BAN-PT).',

    'mgmt.set.title': 'System Settings',
    'mgmt.set.desc': 'App branding, logos, theme colors, and audit cycle configuration.',
    'mgmt.set.brand': 'Branding & Appearance',
    'mgmt.set.appName': 'Application Name',
    'mgmt.set.logo': 'Logo Application',
    'mgmt.set.upload': 'Click to upload logo (PNG/SVG)',
    'mgmt.set.theme': 'Theme Color',
    'mgmt.set.cycle': 'Audit Cycle Configuration',
    'mgmt.set.period': 'Active Audit Period',
    'mgmt.set.std': 'Default Standard',
    'mgmt.set.save': 'Save System Changes',
  }
};

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: FC<{ children: ReactNode }> = ({ children }) => {
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
