import { createContext, useState, useContext, ReactNode, useEffect, FC } from 'react';
import { User, UserRole } from './types';

interface AuthContextType {
  currentUser: User | null;
  users: User[]; // List of all users
  login: (roleOrUser: UserRole | User) => void;
  logout: () => void;
  // CRUD Operations
  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  deleteUser: (id: string) => void;
}

// Comprehensive Initial Users for all Departments
const INITIAL_USERS: User[] = [
  // --- 1. SYSTEM ADMINISTRATORS & LPM ---
  { id: 'sa-bakti', name: 'Bakti (SuperAdmin)', username: 'bakti', password: '123', role: UserRole.SUPER_ADMIN, status: 'Active' },
  { id: 'sa-1', name: 'Super Administrator', username: 'superadmin', password: '123', role: UserRole.SUPER_ADMIN, status: 'Active' },
  { id: 'ad-1', name: 'Admin LPM', username: 'admin', password: '123', role: UserRole.ADMIN, department: 'Lembaga Penjaminan Mutu', status: 'Active' },
  { id: 'au-lpm', name: 'Auditor Internal LPM', username: 'au.lpm', password: '123', role: UserRole.AUDITOR, department: 'Lembaga Penjaminan Mutu', status: 'Active' },
  
  // --- 2. LEAD AUDITOR (Oversight) ---
  { id: 'lead-1', name: 'Ketua Auditor (Lead)', username: 'lead', password: '123', role: UserRole.AUDITOR_LEAD, status: 'Active' },

  // ==============================================================================
  // YAYASAN & REKTORAT (Top Level)
  // ==============================================================================
  // Yayasan
  { id: 'yys-head', name: 'Ketua Yayasan', username: 'yayasan', password: '123', role: UserRole.DEPT_HEAD, department: 'Yayasan ITSB', status: 'Active' },
  { id: 'yys-auditee', name: 'Sekretariat Yayasan', username: 'ka.yys', password: '123', role: UserRole.AUDITEE, department: 'Yayasan ITSB', status: 'Active' },
  { id: 'yys-auditor', name: 'Auditor Yayasan', username: 'au.yys', password: '123', role: UserRole.AUDITOR, department: 'Yayasan ITSB', status: 'Active' },

  // Rektorat
  { id: 'rektor', name: 'Rektor ITSB', username: 'rektor', password: '123', role: UserRole.DEPT_HEAD, department: 'Rektorat', status: 'Active' },
  { id: 'rek-auditee', name: 'Sekretariat Rektorat', username: 'ka.rek', password: '123', role: UserRole.AUDITEE, department: 'Rektorat', status: 'Active' },
  { id: 'rek-auditor', name: 'Auditor Rektorat', username: 'au.rek', password: '123', role: UserRole.AUDITOR, department: 'Rektorat', status: 'Active' },

  // ==============================================================================
  // FAKULTAS TEKNIK DAN PERENCANAAN (FTSP) - LAM TEKNIK
  // ==============================================================================
  // Dekanat FTSP
  { id: 'dekan-ftsp', name: 'Dekan FTSP', username: 'dekan.ftsp', password: '123', role: UserRole.DEPT_HEAD, department: 'Fakultas Teknik dan Perencanaan', status: 'Active' },
  { id: 'au-ftsp', name: 'Auditor FTSP', username: 'au.ftsp', password: '123', role: UserRole.AUDITOR, department: 'Fakultas Teknik dan Perencanaan', status: 'Active' },
  
  // S1 - Teknik Sipil
  { id: 'ts-kaprodi', name: 'Kaprodi Teknik Sipil', username: 'ka.ts', password: '123', role: UserRole.AUDITEE, department: 'S1 - Teknik Sipil', status: 'Active' },
  { id: 'ts-auditor', name: 'Auditor Sipil (Dr. Budi)', username: 'au.ts', password: '123', role: UserRole.AUDITOR, department: 'S1 - Teknik Sipil', status: 'Active' },
  
  // S1 - Perencanaan Wilayah dan Kota
  { id: 'pwk-kaprodi', name: 'Kaprodi PWK', username: 'ka.pwk', password: '123', role: UserRole.AUDITEE, department: 'S1 - Perencanaan Wilayah dan Kota', status: 'Active' },
  { id: 'pwk-auditor', name: 'Auditor PWK (Ir. Siti)', username: 'au.pwk', password: '123', role: UserRole.AUDITOR, department: 'S1 - Perencanaan Wilayah dan Kota', status: 'Active' },
  
  // S1 - Teknik Pertambangan
  { id: 'tm-kaprodi', name: 'Kaprodi Tambang', username: 'ka.tm', password: '123', role: UserRole.AUDITEE, department: 'S1 - Teknik Pertambangan', status: 'Active' },
  { id: 'tm-auditor', name: 'Auditor Tambang (Ir. Eko)', username: 'au.tm', password: '123', role: UserRole.AUDITOR, department: 'S1 - Teknik Pertambangan', status: 'Active' },
  
  // S1 - Teknik Metalurgi
  { id: 'tmt-kaprodi', name: 'Kaprodi Metalurgi', username: 'ka.tmt', password: '123', role: UserRole.AUDITEE, department: 'S1 - Teknik Metalurgi', status: 'Active' },
  { id: 'tmt-auditor', name: 'Auditor Metalurgi', username: 'au.tmt', password: '123', role: UserRole.AUDITOR, department: 'S1 - Teknik Metalurgi', status: 'Active' },

  // S1 - Teknik Perminyakan
  { id: 'tp-kaprodi', name: 'Kaprodi Perminyakan', username: 'ka.tp', password: '123', role: UserRole.AUDITEE, department: 'S1 - Teknik Perminyakan', status: 'Active' },
  { id: 'tp-auditor', name: 'Auditor Perminyakan', username: 'au.tp', password: '123', role: UserRole.AUDITOR, department: 'S1 - Teknik Perminyakan', status: 'Active' },

  // ==============================================================================
  // FAKULTAS DIGITAL, DESAIN DAN BISNIS (FDDB) - LAM INFOKOM
  // ==============================================================================
  // Dekanat FDDB
  { id: 'dekan-fddb', name: 'Dekan FDDB', username: 'dekan.fddb', password: '123', role: UserRole.DEPT_HEAD, department: 'Fakultas Digital, Desain dan Bisnis', status: 'Active' },
  { id: 'au-fddb', name: 'Auditor FDDB', username: 'au.fddb', password: '123', role: UserRole.AUDITOR, department: 'Fakultas Digital, Desain dan Bisnis', status: 'Active' },

  // S1 - Informatika
  { id: 'if-kaprodi', name: 'Kaprodi Informatika', username: 'ka.if', password: '123', role: UserRole.AUDITEE, department: 'S1 - Informatika', status: 'Active' },
  { id: 'if-auditor', name: 'Auditor Informatika (Pak Asep)', username: 'au.if', password: '123', role: UserRole.AUDITOR, department: 'S1 - Informatika', status: 'Active' },

  // S1 - Sains Data
  { id: 'sd-kaprodi', name: 'Kaprodi Sains Data', username: 'ka.sd', password: '123', role: UserRole.AUDITEE, department: 'S1 - Sains Data', status: 'Active' },
  { id: 'sd-auditor', name: 'Auditor Sains Data', username: 'au.sd', password: '123', role: UserRole.AUDITOR, department: 'S1 - Sains Data', status: 'Active' },

  // S1 - Bisnis Digital
  { id: 'bd-kaprodi', name: 'Kaprodi Bisnis Digital', username: 'ka.bd', password: '123', role: UserRole.AUDITEE, department: 'S1 - Bisnis Digital', status: 'Active' },
  { id: 'bd-auditor', name: 'Auditor Bisnis Digital', username: 'au.bd', password: '123', role: UserRole.AUDITOR, department: 'S1 - Bisnis Digital', status: 'Active' },

  // S1 - Desain Produk
  { id: 'dp-kaprodi', name: 'Kaprodi Desain Produk', username: 'ka.dp', password: '123', role: UserRole.AUDITEE, department: 'S1 - Desain Produk', status: 'Active' },
  { id: 'dp-auditor', name: 'Auditor Desain Produk', username: 'au.dp', password: '123', role: UserRole.AUDITOR, department: 'S1 - Desain Produk', status: 'Active' },

  // ==============================================================================
  // FAKULTAS VOKASI (FV) - BAN PT
  // ==============================================================================
  // Dekanat Vokasi
  { id: 'dekan-fv', name: 'Dekan Vokasi', username: 'dekan.fv', password: '123', role: UserRole.DEPT_HEAD, department: 'Fakultas Vokasi', status: 'Active' },
  { id: 'au-fv', name: 'Auditor Vokasi', username: 'au.fv', password: '123', role: UserRole.AUDITOR, department: 'Fakultas Vokasi', status: 'Active' },

  // D3 - Teknologi Pengolahan Sawit
  { id: 'tps-kaprodi', name: 'Kaprodi Sawit', username: 'ka.tps', password: '123', role: UserRole.AUDITEE, department: 'D3 - Teknologi Pengolahan Sawit', status: 'Active' },
  { id: 'tps-auditor', name: 'Auditor Sawit', username: 'au.tps', password: '123', role: UserRole.AUDITOR, department: 'D3 - Teknologi Pengolahan Sawit', status: 'Active' },

  // D4 - Teknologi Pengolahan Pulp dan Kertas
  { id: 'tpp-kaprodi', name: 'Kaprodi Pulp & Kertas', username: 'ka.tpp', password: '123', role: UserRole.AUDITEE, department: 'D4 - Teknologi Pengolahan Pulp dan Kertas', status: 'Active' },
  { id: 'tpp-auditor', name: 'Auditor Pulp & Kertas', username: 'au.tpp', password: '123', role: UserRole.AUDITOR, department: 'D4 - Teknologi Pengolahan Pulp dan Kertas', status: 'Active' },

  // ==============================================================================
  // UNIT / BIRO / LEMBAGA LAINNYA (New Additions)
  // ==============================================================================
  
  // 1. Direktorat Pendidikan & Kemahasiswaan (Dir DikMa)
  { id: 'dikma-head', name: 'Direktur DikMa', username: 'ka.dikma', password: '123', role: UserRole.DEPT_HEAD, department: 'Direktorat Pendidikan & Kemahasiswaan', status: 'Active' },
  { id: 'dikma-auditee', name: 'Staff DikMa', username: 'st.dikma', password: '123', role: UserRole.AUDITEE, department: 'Direktorat Pendidikan & Kemahasiswaan', status: 'Active' },
  { id: 'dikma-auditor', name: 'Auditor DikMa', username: 'au.dikma', password: '123', role: UserRole.AUDITOR, department: 'Direktorat Pendidikan & Kemahasiswaan', status: 'Active' },

  // 2. Perpustakaan
  { id: 'lib-head', name: 'Kepala Perpustakaan', username: 'ka.lib', password: '123', role: UserRole.DEPT_HEAD, department: 'Perpustakaan', status: 'Active' },
  { id: 'lib-auditee', name: 'Staff Perpustakaan', username: 'st.lib', password: '123', role: UserRole.AUDITEE, department: 'Perpustakaan', status: 'Active' },
  { id: 'lib-auditor', name: 'Auditor Perpustakaan', username: 'au.lib', password: '123', role: UserRole.AUDITOR, department: 'Perpustakaan', status: 'Active' },

  // 3. LP3B
  { id: 'lp3b-head', name: 'Ketua LP3B', username: 'ka.lp3b', password: '123', role: UserRole.DEPT_HEAD, department: 'LP3B', status: 'Active' },
  { id: 'lp3b-auditee', name: 'Staff LP3B', username: 'st.lp3b', password: '123', role: UserRole.AUDITEE, department: 'LP3B', status: 'Active' },
  { id: 'lp3b-auditor', name: 'Auditor LP3B', username: 'au.lp3b', password: '123', role: UserRole.AUDITOR, department: 'LP3B', status: 'Active' },

  // 4. Direktorat IT
  { id: 'it-head', name: 'Direktur IT', username: 'ka.it', password: '123', role: UserRole.DEPT_HEAD, department: 'Direktorat IT', status: 'Active' },
  { id: 'it-auditee', name: 'Staff IT', username: 'st.it', password: '123', role: UserRole.AUDITEE, department: 'Direktorat IT', status: 'Active' },
  { id: 'it-auditor', name: 'Auditor IT', username: 'au.it', password: '123', role: UserRole.AUDITOR, department: 'Direktorat IT', status: 'Active' },

  // 5. Direktorat Sistem Informasi
  { id: 'si-head', name: 'Direktur SI', username: 'ka.si', password: '123', role: UserRole.DEPT_HEAD, department: 'Direktorat Sistem Informasi', status: 'Active' },
  { id: 'si-auditee', name: 'Staff SI', username: 'st.si', password: '123', role: UserRole.AUDITEE, department: 'Direktorat Sistem Informasi', status: 'Active' },
  { id: 'si-auditor', name: 'Auditor SI', username: 'au.si', password: '123', role: UserRole.AUDITOR, department: 'Direktorat Sistem Informasi', status: 'Active' },

  // 6. Lembaga Sertifikasi Profesi (LSP)
  { id: 'lsp-head', name: 'Ketua LSP', username: 'ka.lsp', password: '123', role: UserRole.DEPT_HEAD, department: 'LSP', status: 'Active' },
  { id: 'lsp-auditee', name: 'Staff LSP', username: 'st.lsp', password: '123', role: UserRole.AUDITEE, department: 'LSP', status: 'Active' },
  { id: 'lsp-auditor', name: 'Auditor LSP', username: 'au.lsp', password: '123', role: UserRole.AUDITOR, department: 'LSP', status: 'Active' },
];

// Updated key to v8 to force reload of new initial users
const STORAGE_KEY = 'ami_users_v8';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Load users from local storage or use initial data
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch (e) {
      return INITIAL_USERS;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  // Login Logic (Simplified for Demo)
  // Accepts either a specific User object OR a Role (legacy support for Login.tsx quick buttons)
  const login = (roleOrUser: UserRole | User) => {
    if (typeof roleOrUser === 'string') {
      // Find first active user with this role
      const found = users.find(u => u.role === roleOrUser && u.status === 'Active');
      if (found) {
        setCurrentUser(found);
      } else {
        // Fallback if no user found (should not happen with initial data)
        const tempUser: User = { id: 'temp', name: 'Guest ' + roleOrUser, role: roleOrUser as UserRole, status: 'Active' };
        setCurrentUser(tempUser);
      }
    } else {
      setCurrentUser(roleOrUser);
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  // CRUD Implementation
  const addUser = (user: User) => {
    setUsers([...users, user]);
  };

  const updateUser = (updatedUser: User) => {
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    // If current user updates their own profile, reflect changes immediately
    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
  };

  const deleteUser = (id: string) => {
    setUsers(users.filter(u => u.id !== id));
    if (currentUser && currentUser.id === id) {
      logout(); // Logout if self-deleted
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, users, login, logout, addUser, updateUser, deleteUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};