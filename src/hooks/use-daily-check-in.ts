import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/hooks/auth-provider';
import { supabase } from '@/lib/supabase';

type CheckInStatus = 'Available' | 'Completed' | 'Missed' | 'Upcoming';

export type CheckInDay = {
  date: string;
  dayName: string;
  status: CheckInStatus;
  reward: string;
  amount: number | null;
  isSpin?: boolean;
  isToday?: boolean;
};

type CheckInResponse = {
  success?: boolean;
  error?: string;
  weekStart?: string;
  currentDate?: string;
  currentDayName?: string;
  days?: CheckInDay[];
  amount?: number;
  reward?: string;
};

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

async function fetchWeeklyCheckIns(userId: string) {
  try {
    const { data, error } = await supabase.rpc('get_weekly_checkins');
    if (error) throw new Error(error.message);

    const result = data as CheckInResponse;
    if (!result.success) throw new Error(result.error || 'Unable to load check-ins.');
    return result;
  } catch (rpcError) {
    const today = new Date();
    const todayDate = formatDate(today);
    const weekStartDate = new Date(`${todayDate}T00:00:00.000Z`);
    weekStartDate.setUTCDate(weekStartDate.getUTCDate() - ((weekStartDate.getUTCDay() + 6) % 7));
    const weekStart = formatDate(weekStartDate);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setUTCDate(weekEndDate.getUTCDate() + 6);

    const { data, error } = await supabase
      .from('daily_checkins')
      .select('checkin_date, day_name, reward_amount, reward_label')
      .eq('user_id', userId)
      .gte('checkin_date', weekStart)
      .lte('checkin_date', formatDate(weekEndDate));

    if (error) {
      const rpcMessage = rpcError instanceof Error ? rpcError.message : 'Unknown RPC error';
      throw new Error(`${rpcMessage}; direct check-in lookup failed: ${error.message}`);
    }

    const completedByDate = new Map((data ?? []).map((row) => [row.checkin_date, row]));
    const days: CheckInDay[] = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStartDate);
      date.setUTCDate(date.getUTCDate() + index);
      const dateString = formatDate(date);
      const record = completedByDate.get(dateString);
      const status: CheckInStatus = record
        ? 'Completed'
        : dateString === todayDate
          ? 'Available'
          : dateString < todayDate
            ? 'Missed'
            : 'Upcoming';

      return {
        date: dateString,
        dayName: date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }),
        status,
        reward: record?.reward_label ?? '',
        amount: record ? Number(record.reward_amount) : null,
        isSpin: true,
        isToday: dateString === todayDate,
      };
    });

    return { success: true, weekStart, days };
  }
}

export function useDailyCheckIn() {
  const { user } = useAuth();
  const [days, setDays] = useState<CheckInDay[]>([]);
  const [weekStart, setWeekStart] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  const loadWeek = useCallback(async () => {
    if (!user) return;

    const result = await fetchWeeklyCheckIns(user.id);

    setDays(result.days ?? []);
    setWeekStart(result.weekStart ?? null);
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    if (!user) return;

    void fetchWeeklyCheckIns(user.id)
      .then((result) => {
        if (!isMounted) return;
        setDays(result.days ?? []);
        setWeekStart(result.weekStart ?? null);
      })
      .catch((error: Error) => console.error('Unable to load daily check-ins:', error.message))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const checkIn = async (spinChoice?: number) => {
    setIsCheckingIn(true);
    try {
      const { data, error } = await supabase.rpc('check_in_today', {
        p_spin_choice: spinChoice ?? null,
      });
      if (error) throw new Error(error.message);

      const result = data as CheckInResponse;
      if (!result.success) throw new Error(result.error || 'Check-in failed.');

      await loadWeek();
      return { amount: result.amount ?? 0, reward: result.reward ?? '' };
    } finally {
      setIsCheckingIn(false);
    }
  };

  return { days, weekStart, isLoading, isCheckingIn, checkIn, refresh: loadWeek };
}
