import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { useToast } from '@/components/ui/toast';
import { useTransactions } from '@/hooks/use-transactions';
import { succeed } from '@/lib/haptics';
import { playMoneyInSound } from '@/lib/money-sound';

const LAST_SEEN_KEY = '@nearbypay:notifications:lastSeenAt';

export type NotificationItem = {
  id: string;
  kind: 'received' | 'sent';
  title: string;
  subtitle: string;
  amount: number;
  createdAt: string;
  read: boolean;
};

type NotificationsContextType = {
  notifications: NotificationItem[];
  unreadCount: number;
  markAllRead: () => void;
};

const NotificationsContext = createContext<NotificationsContextType>({
  notifications: [],
  unreadCount: 0,
  markAllRead: () => undefined,
});

export function useNotifications() {
  return useContext(NotificationsContext);
}

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString('en-NG')}`;
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { show } = useToast();
  const { transactions } = useTransactions();
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(null);
  const knownIds = useRef<Set<string>>(new Set());
  const seeded = useRef(false);

  // Load the last-seen marker. First launch seeds it to now so old
  // history doesn't all show up as unread.
  useEffect(() => {
    let isActive = true;
    void (async () => {
      try {
        const stored = await AsyncStorage.getItem(LAST_SEEN_KEY);
        if (!isActive) return;
        if (stored) {
          setLastSeenAt(stored);
        } else {
          const now = new Date().toISOString();
          setLastSeenAt(now);
          await AsyncStorage.setItem(LAST_SEEN_KEY, now);
        }
      } catch {
        if (isActive) setLastSeenAt(new Date().toISOString());
      }
    })();
    return () => {
      isActive = false;
    };
  }, []);

  // Toast live arrivals (money in / money out) as the realtime feed delivers them.
  useEffect(() => {
    if (transactions.length === 0) {
      if (knownIds.current.size > 0) {
        knownIds.current.clear();
        seeded.current = false;
      }
      return;
    }
    if (!seeded.current) {
      transactions.forEach((tx) => knownIds.current.add(tx.id));
      seeded.current = true;
      return;
    }
    const fresh = transactions.filter((tx) => !knownIds.current.has(tx.id));
    transactions.forEach((tx) => knownIds.current.add(tx.id));
    fresh.forEach((tx) => {
      if (tx.type === 'received') {
        show({ message: `Money received! +${formatNaira(tx.amount)} from ${tx.title}`, variant: 'success' });
        void playMoneyInSound();
      } else {
        show({ message: `You sent -${formatNaira(tx.amount)} to ${tx.title}`, variant: 'info' });
      }
      succeed();
    });
  }, [transactions, show]);

  const markAllRead = useCallback(() => {
    const now = new Date().toISOString();
    setLastSeenAt(now);
    void AsyncStorage.setItem(LAST_SEEN_KEY, now).catch(() => undefined);
  }, []);

  const { notifications, unreadCount } = useMemo(() => {
    const items: NotificationItem[] = transactions.map((tx) => ({
      id: tx.id,
      kind: tx.type,
      title: tx.title,
      subtitle: tx.channel,
      amount: tx.amount,
      createdAt: tx.created_at,
      read: lastSeenAt ? tx.created_at <= lastSeenAt : true,
    }));
    return { notifications: items, unreadCount: items.filter((item) => !item.read).length };
  }, [transactions, lastSeenAt]);

  const value = useMemo(
    () => ({ notifications, unreadCount, markAllRead }),
    [notifications, unreadCount, markAllRead],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}
