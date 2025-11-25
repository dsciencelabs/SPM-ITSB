
import { createContext, useState, useContext, ReactNode, useEffect, FC } from 'react';
import { AuditStandard } from './types';

export interface Unit {
  id: number;
  code: string;
  name: string;
  type: string;
  faculty: string;
  head: string;
}

export interface MasterQuestion {
  id: string;
  standard: string; // e.g., 'BAN-PT', 'LAM INFOKOM'
  category: string; // e.g., 'Kriteria 1', 'C.1'
  text: string;
}

interface MasterDataContextType {
  // Units
  units: Unit[];
  addUnit: (unit: Omit<Unit, 'id'>) => void;
  updateUnit: (unit: Unit) => void;
  deleteUnit: (id: number) => void;
  
  // Questions (Instruments)
  questions: MasterQuestion[];
  addQuestion: (q: MasterQuestion) => void;
  updateQuestion: (q: MasterQuestion) => void;
  deleteQuestion: (id: string) => void;
}

const MasterDataContext = createContext<MasterDataContextType | undefined>(undefined);

const INITIAL_UNITS: Unit[] = [
    // Level 1: Yayasan & Rektorat
    { id: 100, code: 'YYS', name: 'Yayasan ITSB', type: 'Yayasan', faculty: '-', head: 'Ketua Yayasan' },
    { id: 101, code: 'REK', name: 'Rektorat', type: 'Pimpinan Tinggi', faculty: 'Yayasan ITSB', head: 'Rektor' },
    
    // ============================================================
    // 1. Fakultas Teknik dan Perencanaan (FTSP) -> LAM TEKNIK
    // ============================================================
    { id: 1, code: 'FTSP', name: 'Fakultas Teknik dan Perencanaan', type: 'Fakultas', faculty: 'Rektorat', head: 'Dekan FTSP' },
    { id: 11, code: 'TS', name: 'S1 - Teknik Sipil', type: 'Program Studi', faculty: 'Fakultas Teknik dan Perencanaan', head: 'Kaprodi Sipil' },
    { id: 12, code: 'PWK', name: 'S1 - Perencanaan Wilayah dan Kota', type: 'Program Studi', faculty: 'Fakultas Teknik dan Perencanaan', head: 'Kaprodi PWK' },
    { id: 13, code: 'TM', name: 'S1 - Teknik Pertambangan', type: 'Program Studi', faculty: 'Fakultas Teknik dan Perencanaan', head: 'Kaprodi Tambang' },
    { id: 14, code: 'TMT', name: 'S1 - Teknik Metalurgi', type: 'Program Studi', faculty: 'Fakultas Teknik dan Perencanaan', head: 'Kaprodi Metalurgi' },
    { id: 15, code: 'TP', name: 'S1 - Teknik Perminyakan', type: 'Program Studi', faculty: 'Fakultas Teknik dan Perencanaan', head: 'Kaprodi Minyak' },

    // ============================================================
    // 2. Fakultas Digital, Desain dan Bisnis (FDDB) -> LAM INFOKOM
    // ============================================================
    { id: 2, code: 'FDDB', name: 'Fakultas Digital, Desain dan Bisnis', type: 'Fakultas', faculty: 'Rektorat', head: 'Dekan FDDB' },
    { id: 21, code: 'IF', name: 'S1 - Informatika', type: 'Program Studi', faculty: 'Fakultas Digital, Desain dan Bisnis', head: 'Kaprodi Informatika' },
    { id: 22, code: 'SD', name: 'S1 - Sains Data', type: 'Program Studi', faculty: 'Fakultas Digital, Desain dan Bisnis', head: 'Kaprodi Sains Data' },
    { id: 23, code: 'BD', name: 'S1 - Bisnis Digital', type: 'Program Studi', faculty: 'Fakultas Digital, Desain dan Bisnis', head: 'Kaprodi Bisnis Digital' },
    { id: 24, code: 'DP', name: 'S1 - Desain Produk', type: 'Program Studi', faculty: 'Fakultas Digital, Desain dan Bisnis', head: 'Kaprodi Desain Produk' },

    // ============================================================
    // 3. Fakultas Vokasi (FV) -> BAN-PT
    // ============================================================
    { id: 3, code: 'FV', name: 'Fakultas Vokasi', type: 'Fakultas', faculty: 'Rektorat', head: 'Dekan Vokasi' },
    { id: 31, code: 'TPS', name: 'D3 - Teknologi Pengolahan Sawit', type: 'Program Studi', faculty: 'Fakultas Vokasi', head: 'Kaprodi Sawit' },
    { id: 32, code: 'TPP', name: 'D4 - Teknologi Pengolahan Pulp dan Kertas', type: 'Program Studi', faculty: 'Fakultas Vokasi', head: 'Kaprodi Pulp & Kertas' },

    // ============================================================
    // Biro / Lembaga / Direktorat / UPT (New Additions)
    // ============================================================
    { id: 99, code: 'LPM', name: 'Lembaga Penjaminan Mutu', type: 'Biro/Lembaga', faculty: 'Rektorat', head: 'Ka. LPM' },
    { id: 201, code: 'DIKMA', name: 'Direktorat Pendidikan & Kemahasiswaan', type: 'Direktorat', faculty: 'Rektorat', head: 'Direktur DikMa' },
    { id: 202, code: 'PERPUS', name: 'Perpustakaan', type: 'UPT', faculty: 'Rektorat', head: 'Kepala Perpustakaan' },
    { id: 203, code: 'LP3B', name: 'LP3B', type: 'Biro/Lembaga', faculty: 'Rektorat', head: 'Ketua LP3B' },
    { id: 204, code: 'DIR-IT', name: 'Direktorat IT', type: 'Direktorat', faculty: 'Rektorat', head: 'Direktur IT' },
    { id: 205, code: 'DIR-SI', name: 'Direktorat Sistem Informasi', type: 'Direktorat', faculty: 'Rektorat', head: 'Direktur SI' },
    { id: 206, code: 'LSP', name: 'LSP', type: 'Lembaga', faculty: 'Rektorat', head: 'Ketua LSP' },
];

const INITIAL_QUESTIONS: MasterQuestion[] = [
  // ==========================================================================================
  // PERMENDIKTISAINTEK (Standar Nasional Pendidikan Tinggi) - COMPREHENSIVE LIST (72 QUESTIONS)
  // ==========================================================================================
  
  // --- 1. TATA KELOLA & KELEMBAGAAN (12 Butir) ---
  { id: 'P.1.1', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '1. Tata Kelola & Kelembagaan', text: 'Apakah unit memiliki rencana strategis (Renstra) yang selaras dengan Renstra ITSB?' },
  { id: 'P.1.2', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '1. Tata Kelola & Kelembagaan', text: 'Apakah tersedia SOP yang terdokumentasi dan digunakan secara konsisten?' },
  { id: 'P.1.3', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '1. Tata Kelola & Kelembagaan', text: 'Apakah unit melakukan evaluasi diri secara berkala (EDM/Self Assessment)?' },
  { id: 'P.1.4', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '1. Tata Kelola & Kelembagaan', text: 'Apakah tersedia mekanisme audit internal mutu (AMI) tahunan?' },
  { id: 'P.1.5', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '1. Tata Kelola & Kelembagaan', text: 'Apakah hasil AMI ditindaklanjuti dengan rencana perbaikan (RTL)?' },
  { id: 'P.1.6', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '1. Tata Kelola & Kelembagaan', text: 'Apakah struktur organisasi sesuai regulasi & tupoksi berjalan efektif?' },
  { id: 'P.1.7', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '1. Tata Kelola & Kelembagaan', text: 'Apakah rapat koordinasi dilakukan rutin dengan notulen?' },
  { id: 'P.1.8', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '1. Tata Kelola & Kelembagaan', text: 'Apakah unit memiliki standar mutu dan indikator kinerja (IKU/IKT) yang relevan?' },
  { id: 'P.1.9', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '1. Tata Kelola & Kelembagaan', text: 'Apakah pengambilan keputusan berbasis data (evidence-based)?' },
  { id: 'P.1.10', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '1. Tata Kelola & Kelembagaan', text: 'Apakah risiko di unit telah dipetakan dan dikelola?' },
  { id: 'P.1.11', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '1. Tata Kelola & Kelembagaan', text: 'Apakah ada transparansi dokumen (kebijakan, laporan, anggaran)?' },
  { id: 'P.1.12', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '1. Tata Kelola & Kelembagaan', text: 'Apakah sistem pelaporan kinerja dan pemantauan berjalan baik?' },

  // --- 2. PENDIDIKAN & PEMBELAJARAN (12 Butir) ---
  { id: 'P.2.1', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '2. Pendidikan & Pembelajaran', text: 'Apakah kurikulum mengacu KKNI, OBE, dan regulasi LAM/BAN-PT?' },
  { id: 'P.2.2', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '2. Pendidikan & Pembelajaran', text: 'Apakah Capaian Pembelajaran Lulusan (CPL) diturunkan ke CPMK dan RPS?' },
  { id: 'P.2.3', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '2. Pendidikan & Pembelajaran', text: 'Apakah seluruh mata kuliah memiliki RPS yang mutakhir?' },
  { id: 'P.2.4', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '2. Pendidikan & Pembelajaran', text: 'Apakah pembelajaran memanfaatkan LMS secara efektif?' },
  { id: 'P.2.5', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '2. Pendidikan & Pembelajaran', text: 'Apakah metode pembelajaran aktif (PBL, project-based, case-based) diterapkan?' },
  { id: 'P.2.6', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '2. Pendidikan & Pembelajaran', text: 'Apakah evaluasi pembelajaran dilakukan setiap semester?' },
  { id: 'P.2.7', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '2. Pendidikan & Pembelajaran', text: 'Apakah terdapat monitoring mata kuliah (teaching log, kontrak kuliah)?' },
  { id: 'P.2.8', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '2. Pendidikan & Pembelajaran', text: 'Apakah pelaksanaan UTS/UAS sesuai standar mutu?' },
  { id: 'P.2.9', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '2. Pendidikan & Pembelajaran', text: 'Apakah terdapat tracer study dan hasilnya digunakan untuk perbaikan kurikulum?' },
  { id: 'P.2.10', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '2. Pendidikan & Pembelajaran', text: 'Apakah sumber belajar (buku, jurnal, database) memadai dan mutakhir?' },
  { id: 'P.2.11', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '2. Pendidikan & Pembelajaran', text: 'Apakah pembelajaran praktikum/ studio/ laboratorium berjalan standar?' },
  { id: 'P.2.12', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '2. Pendidikan & Pembelajaran', text: 'Apakah lulusan memenuhi standar kompetensi sesuai profil lulusan?' },

  // --- 3. PENELITIAN (10 Butir) ---
  { id: 'P.3.1', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '3. Penelitian', text: 'Apakah road map penelitian tersedia dan digunakan?' },
  { id: 'P.3.2', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '3. Penelitian', text: 'Apakah jumlah penelitian dosen memenuhi standar LAM/BAN-PT?' },
  { id: 'P.3.3', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '3. Penelitian', text: 'Apakah unit menyelenggarakan hibah internal penelitian?' },
  { id: 'P.3.4', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '3. Penelitian', text: 'Apakah penelitian melibatkan mahasiswa?' },
  { id: 'P.3.5', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '3. Penelitian', text: 'Apakah penelitian dipublikasikan pada jurnal bereputasi?' },
  { id: 'P.3.6', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '3. Penelitian', text: 'Apakah penelitian menghasilkan HKI/Patent?' },
  { id: 'P.3.7', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '3. Penelitian', text: 'Apakah penelitian menghasilkan buku ajar/monograf?' },
  { id: 'P.3.8', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '3. Penelitian', text: 'Apakah hasil penelitian dimanfaatkan untuk pembelajaran?' },
  { id: 'P.3.9', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '3. Penelitian', text: 'Apakah penelitian berkontribusi ke industri/masyarakat?' },
  { id: 'P.3.10', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '3. Penelitian', text: 'Apakah dokumentasi & pelaporan penelitian lengkap (proposal–laporan–luaran)?' },

  // --- 4. PENGABDIAN KEPADA MASYARAKAT (8 Butir) ---
  { id: 'P.4.1', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '4. Pengabdian Kpd Masyarakat', text: 'Apakah tersedia road map PkM?' },
  { id: 'P.4.2', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '4. Pengabdian Kpd Masyarakat', text: 'Apakah PkM dilakukan rutin dan relevan dengan keilmuan?' },
  { id: 'P.4.3', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '4. Pengabdian Kpd Masyarakat', text: 'Apakah PkM melibatkan mahasiswa dan pemangku kepentingan?' },
  { id: 'P.4.4', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '4. Pengabdian Kpd Masyarakat', text: 'Apakah PkM menghasilkan luaran (HKI, publikasi, modul)?' },
  { id: 'P.4.5', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '4. Pengabdian Kpd Masyarakat', text: 'Apakah PkM menyelesaikan masalah masyarakat/industri?' },
  { id: 'P.4.6', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '4. Pengabdian Kpd Masyarakat', text: 'Apakah ada pendanaan internal/eksternal untuk PkM?' },
  { id: 'P.4.7', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '4. Pengabdian Kpd Masyarakat', text: 'Apakah laporan PkM terdokumentasi lengkap?' },
  { id: 'P.4.8', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '4. Pengabdian Kpd Masyarakat', text: 'Apakah hasil PkM dimanfaatkan untuk pembelajaran?' },

  // --- 5. SDM, KEUANGAN, SARANA PRASARANA (15 Butir) ---
  { id: 'P.5.1', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '5. SDM, Keu, Sarpras', text: 'Apakah perencanaan kebutuhan SDM dilakukan berbasis beban kerja?' },
  { id: 'P.5.2', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '5. SDM, Keu, Sarpras', text: 'Apakah kualifikasi dosen memenuhi ketentuan LAM/BAN-PT?' },
  { id: 'P.5.3', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '5. SDM, Keu, Sarpras', text: 'Apakah pengembangan dosen (sertifikasi, pelatihan, studi lanjut) berjalan?' },
  { id: 'P.5.4', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '5. SDM, Keu, Sarpras', text: 'Apakah beban kerja dosen sesuai aturan (BKD)?' },
  { id: 'P.5.5', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '5. SDM, Keu, Sarpras', text: 'Apakah tenaga kependidikan cukup dan kompeten?' },
  { id: 'P.5.6', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '5. SDM, Keu, Sarpras', text: 'Apakah perencanaan anggaran dilakukan secara transparan?' },
  { id: 'P.5.7', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '5. SDM, Keu, Sarpras', text: 'Apakah realisasi anggaran tepat sasaran?' },
  { id: 'P.5.8', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '5. SDM, Keu, Sarpras', text: 'Apakah sarana-prasarana kelas memadai dan terawat?' },
  { id: 'P.5.9', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '5. SDM, Keu, Sarpras', text: 'Apakah laboratorium/ studio memenuhi standar keselamatan?' },
  { id: 'P.5.10', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '5. SDM, Keu, Sarpras', text: 'Apakah perpustakaan memiliki koleksi yang mutakhir dan relevan?' },
  { id: 'P.5.11', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '5. SDM, Keu, Sarpras', text: 'Apakah akses database ilmiah tersedia untuk seluruh civitas?' },
  { id: 'P.5.12', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '5. SDM, Keu, Sarpras', text: 'Apakah infrastruktur IT (server, jaringan, LMS, SIA) handal?' },
  { id: 'P.5.13', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '5. SDM, Keu, Sarpras', text: 'Apakah sistem informasi terintegrasi antar unit?' },
  { id: 'P.5.14', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '5. SDM, Keu, Sarpras', text: 'Apakah pemeliharaan sarana dilakukan rutin?' },
  { id: 'P.5.15', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '5. SDM, Keu, Sarpras', text: 'Apakah unit memiliki rencana mitigasi bencana & keamanan data?' },

  // --- 6. MAHASISWA, LAYANAN, DAN KERJA SAMA (15 Butir) ---
  { id: 'P.6.1', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '6. Mhs, Layanan & Kerjasama', text: 'Apakah seleksi mahasiswa dilakukan sesuai SOP?' },
  { id: 'P.6.2', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '6. Mhs, Layanan & Kerjasama', text: 'Apakah layanan akademik mudah diakses dan responsif?' },
  { id: 'P.6.3', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '6. Mhs, Layanan & Kerjasama', text: 'Apakah layanan nonakademik (bimbingan karir, konseling) tersedia?' },
  { id: 'P.6.4', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '6. Mhs, Layanan & Kerjasama', text: 'Apakah ada pembinaan organisasi mahasiswa?' },
  { id: 'P.6.5', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '6. Mhs, Layanan & Kerjasama', text: 'Apakah monitoring prestasi & risiko studi dilakukan?' },
  { id: 'P.6.6', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '6. Mhs, Layanan & Kerjasama', text: 'Apakah unit memiliki program MBKM yang berjalan efektif?' },
  { id: 'P.6.7', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '6. Mhs, Layanan & Kerjasama', text: 'Apakah mahasiswa mendapat kesempatan magang/industri?' },
  { id: 'P.6.8', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '6. Mhs, Layanan & Kerjasama', text: 'Apakah ada pedoman kerjasama (MoU, MoA, IA)?' },
  { id: 'P.6.9', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '6. Mhs, Layanan & Kerjasama', text: 'Apakah kerjasama diimplementasikan dan menghasilkan luaran?' },
  { id: 'P.6.10', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '6. Mhs, Layanan & Kerjasama', text: 'Apakah tracer study terselenggara dan dianalisis?' },
  { id: 'P.6.11', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '6. Mhs, Layanan & Kerjasama', text: 'Apakah kepuasan mahasiswa diukur secara berkala?' },
  { id: 'P.6.12', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '6. Mhs, Layanan & Kerjasama', text: 'Apakah data kemahasiswaan terdokumentasi dengan baik?' },
  { id: 'P.6.13', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '6. Mhs, Layanan & Kerjasama', text: 'Apakah kegiatan kemahasiswaan didukung dana yang memadai?' },
  { id: 'P.6.14', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '6. Mhs, Layanan & Kerjasama', text: 'Apakah mahasiswa berpartisipasi dalam lomba–kompetisi?' },
  { id: 'P.6.15', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: '6. Mhs, Layanan & Kerjasama', text: 'Apakah unit mendukung sertifikasi kompetensi (melalui LSP/mitra)?' },

  // ==========================================
  // LAM TEKNIK (FTSP)
  // ==========================================
  { id: 'LT.1.1', standard: AuditStandard.LAM_TEKNIK, category: 'Kriteria 1 - Visi Misi', text: 'Ketersediaan dokumen formal Renstra FTSP/Prodi yang memuat indikator kinerja utama (IKU) teknik.' },
  { id: 'LT.4.1', standard: AuditStandard.LAM_TEKNIK, category: 'Kriteria 4 - SDM', text: 'Kecukupan jumlah dosen tetap (DTPS) dengan kualifikasi insinyur profesional (IPM/IPU).' },
  { id: 'LT.6.1', standard: AuditStandard.LAM_TEKNIK, category: 'Kriteria 6 - Pendidikan', text: 'Apakah kurikulum teknik memuat mata kuliah Capstone Design?' },
  { id: 'LT.6.2', standard: AuditStandard.LAM_TEKNIK, category: 'Kriteria 6 - Pendidikan', text: 'Ketersediaan laboratorium praktikum yang memenuhi standar keselamatan kerja (K3).' },

  // ==========================================
  // LAM INFOKOM (FDDB)
  // ==========================================
  { id: 'LI.C.1', standard: AuditStandard.LAM_INFOKOM, category: 'C.1 Visi Misi', text: 'Apakah Visi Keilmuan Program Studi (VMTS) memiliki keunikan spesifik di bidang Infokom/Digital?' },
  { id: 'LI.C.2', standard: AuditStandard.LAM_INFOKOM, category: 'C.2 Tata Pamong', text: 'Apakah terdapat sistem informasi manajemen yang terintegrasi untuk mendukung pengambilan keputusan?' },
  { id: 'LI.C.6', standard: AuditStandard.LAM_INFOKOM, category: 'C.6 Pendidikan', text: 'Apakah kurikulum mengakomodasi sertifikasi kompetensi industri (Micro-credential)?' },
  { id: 'LI.C.9', standard: AuditStandard.LAM_INFOKOM, category: 'C.9 Luaran', text: 'Apakah masa tunggu lulusan mendapatkan pekerjaan pertama kurang dari 6 bulan?' },

  // ==========================================
  // BAN-PT (Vokasi)
  // ==========================================
  { id: 'BP.1', standard: AuditStandard.BAN_PT, category: 'Kriteria 1', text: 'Kesesuaian Visi, Misi, Tujuan dan Sasaran dengan strategi pengembangan pendidikan vokasi.' },
  { id: 'BP.5', standard: AuditStandard.BAN_PT, category: 'Kriteria 5', text: 'Apakah kurikulum berbasis praktik industri (Dual System) diterapkan secara efektif?' },
  { id: 'BP.7', standard: AuditStandard.BAN_PT, category: 'Kriteria 7', text: 'Keterlibatan praktisi industri dalam proses pembelajaran (Dosen Tamu/Praktisi Mengajar).' },
  { id: 'BP.9', standard: AuditStandard.BAN_PT, category: 'Kriteria 9', text: 'Produk inovasi terapan yang dihasilkan mahasiswa bersama dosen dan mitra industri.' },
];

const STORAGE_KEY = 'ami_master_data_v11';

export const MasterDataProvider: FC<{ children: ReactNode }> = ({ children }) => {
  // Units State
  const [units, setUnits] = useState<Unit[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_units');
      return saved ? JSON.parse(saved) : INITIAL_UNITS;
    } catch (e) {
      return INITIAL_UNITS;
    }
  });

  // Questions State
  const [questions, setQuestions] = useState<MasterQuestion[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_questions');
      return saved ? JSON.parse(saved) : INITIAL_QUESTIONS;
    } catch (e) {
      return INITIAL_QUESTIONS;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_units', JSON.stringify(units));
    localStorage.setItem(STORAGE_KEY + '_questions', JSON.stringify(questions));
  }, [units, questions]);

  // Unit CRUD
  const addUnit = (unit: Omit<Unit, 'id'>) => {
    const newUnit = { ...unit, id: Date.now() };
    setUnits([...units, newUnit]);
  };

  const updateUnit = (updatedUnit: Unit) => {
    setUnits(units.map(u => u.id === updatedUnit.id ? updatedUnit : u));
  };

  const deleteUnit = (id: number) => {
    setUnits(units.filter(u => u.id !== id));
  };

  // Question CRUD
  const addQuestion = (q: MasterQuestion) => {
    setQuestions([...questions, q]);
  };

  const updateQuestion = (updatedQ: MasterQuestion) => {
    setQuestions(questions.map(q => q.id === updatedQ.id ? updatedQ : q));
  };

  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  return (
    <MasterDataContext.Provider value={{ 
      units, addUnit, updateUnit, deleteUnit,
      questions, addQuestion, updateQuestion, deleteQuestion
    }}>
      {children}
    </MasterDataContext.Provider>
  );
};

export const useMasterData = () => {
  const context = useContext(MasterDataContext);
  if (context === undefined) {
    throw new Error('useMasterData must be used within a MasterDataProvider');
  }
  return context;
};
