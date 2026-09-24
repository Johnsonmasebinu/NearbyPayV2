import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/hooks/auth-provider';
import { supabase } from '@/lib/supabase';

export type Transaction = {
  id: string;
  title: string;
  category: string;
  amount: number;
  type: 'sent' | 'received';
  status: 'Completed' | 'Pending';
  reference: string;
  channel: string;
  created_at: string;
};

async function fetchTransactions(userId: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('id, title, category, amount, type, status, reference, channel, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching transactions from Supabase:', error.message);
    return [];
  }

  return ((data ?? []) as any[]).map((row) => ({
    id: row.id,
    title: row.title,
    category: row.category,
    amount: typeof row.amount === 'number' ? row.amount : parseFloat(String(row.amount)) || 0,
    type: row.type,
    status: row.status,
    reference: row.reference,
    channel: row.channel,
    created_at: row.created_at,
  }));
}

export function useTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTransactions = useCallback(async () => {
    if (!user) {
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    try {
      // Ensure Hackathon 10,000 welcome deposit is claimed/active
      await supabase.rpc('claim_welcome_deposit');
    } catch {
      // ignore
    }

    const data = await fetchTransactions(user.id);
    setTransactions(data);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    void (async () => {
      try {
        await supabase.rpc('claim_welcome_deposit');
      } catch {
        // ignore
      }
      const data = await fetchTransactions(user.id);
      if (isMounted) {
        setTransactions(data);
        setIsLoading(false);
      }
    })();

    const channel = supabase
      .channel(`transactions:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` },
        () => loadTransactions(),
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [loadTransactions, user]);

  const balance = transactions.reduce((total, transaction) => {
    const amt = typeof transaction.amount === 'number' ? transaction.amount : parseFloat(String(transaction.amount)) || 0;
    return total + (transaction.type === 'received' ? amt : -amt);
  }, 0);

  return { transactions, balance, isLoading, refresh: loadTransactions };
}