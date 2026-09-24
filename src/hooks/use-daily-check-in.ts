import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

type CheckInStatus = 'Available' | 'Completed' | 'Missed' | 'Upcoming';

export type CheckInDay = {
  date: string;
  dayName: string;
  status: CheckInStatus;
  reward: string;
  amount: number | null;
};

type CheckInResponse = {
  success?: boolean;
  error?: string;
  weekStart?: string;
  days?: CheckInDay[];
  amount?: number;
  reward?: string;
};

async function fetchWeeklyCheckIns() {
  const { data, error } = await supabase.rpc('get_weekly_checkins');
  if (error) throw new Error(error.message);

  const result = data as CheckInResponse;
  if (!result.success) throw new Error(result.error || 'Unable to load check-ins.');
  return result;
}

export function useDailyCheckIn() {
  const [days, setDays] = useState<CheckInDay[]>([]);
  const [weekStart, setWeekStart] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  const loadWeek = useCallback(async () => {
    const result = await fetchWeeklyCheckIns();

    setDays(result.days ?? []);
    setWeekStart(result.weekStart ?? null);
  }, []);

  useEffect(() => {
    void fetchWeeklyCheckIns()
      .then((result) => {
        setDays(result.days ?? []);
        setWeekStart(result.weekStart ?? null);
      })
      .catch((error: Error) => console.error('Unable to load daily check-ins:', error.message))
      .finally(() => setIsLoading(false));
  }, []);

  const checkIn = async () => {
    setIsCheckingIn(true);
    try {
      const { data, error } = await supabase.rpc('check_in_today');
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
