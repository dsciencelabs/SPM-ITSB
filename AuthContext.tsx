
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

// Initial Mock Data
const INITIAL_USERS: User[] = [
  // Requested Super Admin
  { id: 'sa-bakti', name: 'Bakti', username: 'Bakti', password: '123', role: UserRole.SUPER_ADMIN, status: 'Active' },
  
  { id: 'sa-1', name: 'Super Administrator', username: 'superadmin', password: '123', role: UserRole.SUPER_ADMIN, status: 'Active' },
  { id: 'ad-1', name: 'Admin Operasional', username: 'admin', password: '123', role: UserRole.ADMIN, status: 'Active' },
  
  // LEAD AUDITOR (Sees ALL Audits)
  { id: 'lead-1', name: 'Ketua Auditor', username: 'lead', password: '123', role: UserRole.AUDITOR_LEAD, status: 'Active' },
  
  // DEPT HEAD (Matches S1 - Informatika Audit)
  { id: 'dept-1', name: 'Dekan FDDB', username: 'dekan', password: '123', role: UserRole.DEPT_HEAD, department: 'S1 - Informatika', status: 'Active' },

  // AUDITORS (Cross-Unit assignment)
  // au-1 is from Civil Eng, so he CAN audit Informatics (No conflict)
  { id: 'au-1', name: 'Dr. Budi Santoso', username: 'budi.auditor', password: '123', role: UserRole.AUDITOR, department: 'S1 - Teknik Sipil', status: 'Active' },
  { id: 'au-2', name: 'Ir. Siti Aminah', username: 'siti.auditor', password: '123', role: UserRole.AUDITOR, department: 'S1 - Perencanaan Wilayah dan Kota', status: 'Active' },
  
  // AUDITEES (Unit Owners)
  { id: 'd-1', name: 'Kaprodi Informatika', username: 'kaprodi.if', password: '123', role: UserRole.AUDITEE, department: 'S1 - Informatika', status: 'Active' },
  { id: 'd-2', name: 'Kaprodi Teknik Sipil', username: 'kaprodi.ts', password: '123', role: UserRole.AUDITEE, department: 'S1 - Teknik Sipil', status: 'Active' }
];

// Updated key to v3 to force reload of new initial users for the scenario
const STORAGE_KEY = 'ami_users_v3';

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
