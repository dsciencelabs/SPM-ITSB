
import { createContext, useState, useContext, ReactNode, useEffect, FC } from 'react';

export interface Notification {
  id: string;
  userId: string; // The recipient
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  isRead: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (userId: string, title: string, message: string, type?: Notification['type']) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: (userId: string) => void;
  clearAll: (userId: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const STORAGE_KEY = 'ami_notifications_v1';

export const NotificationProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = (userId: string, title: string, message: string, type: Notification['type'] = 'INFO') => {
    const newNote: Notification = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      userId,
      title,
      message,
      type,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    setNotifications(prev => [newNote, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllAsRead = (userId: string) => {
    setNotifications(prev => prev.map(n => n.userId === userId ? { ...n, isRead: true } : n));
  };

  const clearAll = (userId: string) => {
    setNotifications(prev => prev.filter(n => n.userId !== userId));
  };

  // Calculate unread count dynamically in the hook where currentUser is known, 
  // but here we provide the raw list.
  const unreadCount = 0; // Placeholder, logic handled in consuming components

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      addNotification, 
      markAsRead, 
      markAllAsRead, 
      clearAll 
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
