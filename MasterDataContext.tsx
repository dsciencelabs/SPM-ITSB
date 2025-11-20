
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
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

    // Biro / Lembaga
    { id: 99, code: 'LPM', name: 'Lembaga Penjaminan Mutu', type: 'Biro/Lembaga', faculty: 'Rektorat', head: 'Ka. LPM' },
];

const INITIAL_QUESTIONS: MasterQuestion[] = [
  // ==========================================
  // PERMENDIKTISAINTEK (Berlaku Semua Unit)
  // ==========================================
  { id: 'P.A.1', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: 'A. Kebijakan', text: 'Apakah unit kerja memiliki dokumen kebijakan SPMI yang selaras dengan Permendiktisaintek No. 39/2025?' },
  { id: 'P.B.1', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: 'B. Pelaksanaan', text: 'Apakah siklus PPEPP (Penetapan, Pelaksanaan, Evaluasi, Pengendalian, Peningkatan) berjalan secara konsisten?' },
  { id: 'P.C.1', standard: AuditStandard.PERMENDIKTISAINTEK_2025, category: 'C. Pelaporan', text: 'Apakah laporan kinerja unit disampaikan secara berkala kepada pimpinan universitas?' },

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

const STORAGE_KEY = 'ami_master_data_v3';

export const MasterDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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
