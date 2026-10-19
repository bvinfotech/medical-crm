import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { NotificationItem } from '../types/crm';
import { getAllFromStore, putToStore, subscribeToDatabase } from '../services/db';

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const loadNotifications = useCallback(async () => {
    try {
      const items = await getAllFromStore<NotificationItem>('notifications');
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setNotifications(items);
    } catch (err) {
      console.error('Failed loading notifications', err);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const unsubscribe = subscribeToDatabase(() => {
      loadNotifications();
    });
    return () => unsubscribe();
  }, [loadNotifications]);

  const markAsRead = async (id: string) => {
    const item = notifications.find((n) => n.id === id);
    if (item) {
      const updated = { ...item, read: true };
      await putToStore('notifications', updated);
      setNotifications((prev) => prev.map((n) => (n.id === id ? updated : n)));
    }
  };

  const markAllAsRead = async () => {
    for (const item of notifications.filter((n) => !n.read)) {
      await putToStore('notifications', { ...item, read: true });
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const addNotification = async (item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => {
    const newItem: NotificationItem = {
      ...item,
      id: 'notif-' + Date.now(),
      timestamp: new Date().toISOString(),
      read: false,
    };
    await putToStore('notifications', newItem);
    setNotifications((prev) => [newItem, ...prev]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
}
