const { Client } = require('pg');

const SQL = `
-- 1. Ensure description column exists in transactions
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS description text DEFAULT '';

-- 2. Enhanced get_weekly_checkins function
CREATE OR REPLACE FUNCTION public.get_weekly_checkins()
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_today date := current_date;
  v_week_start date := date_trunc('week', v_today)::date;
  v_day date;
  v_dow int;
  v_result jsonb := '[]'::jsonb;
  v_record public.daily_checkins;
  v_status text;
  v_reward text;
  v_amount numeric;
  v_is_spin boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required.');
  END IF;

  FOR i IN 0..6 LOOP
    v_day := v_week_start + i;
    v_dow := EXTRACT(ISODOW FROM v_day)::int; -- 1 = Monday ... 7 = Sunday
    v_is_spin := (v_dow = 1);

    SELECT * INTO v_record
    FROM public.daily_checkins
    WHERE user_id = v_user_id AND checkin_date = v_day;

    IF v_record.id IS NOT NULL THEN
      v_status := 'Completed';
      v_reward := v_record.reward_label;
      v_amount := v_record.reward_amount;
    ELSE
      IF v_day = v_today THEN
        v_status := 'Available';
      ELSIF v_day < v_today THEN
        v_status := 'Missed';
      ELSE
        v_status := 'Upcoming';
      END IF;

      -- Standard display per day
      IF v_dow = 1 THEN
        v_reward := '🎰 Spin: ₦50 / ₦100 / ₦150';
        v_amount := NULL;
      ELSIF v_dow = 2 THEN
        v_reward := '₦200';
        v_amount := 200;
      ELSIF v_dow = 3 THEN
        v_reward := '₦250';
        v_amount := 250;
      ELSIF v_dow = 4 THEN
        v_reward := '₦300';
        v_amount := 300;
      ELSIF v_dow = 5 THEN
        v_reward := '₦350';
        v_amount := 350;
      ELSIF v_dow = 6 THEN
        v_reward := '₦400';
        v_amount := 400;
      ELSE
        v_reward := '₦500';
        v_amount := 500;
      END IF;
    END IF;

    v_result := v_result || jsonb_build_object(
      'date', v_day,
      'dayName', to_char(v_day, 'FMDay'),
      'status', v_status,
      'reward', v_reward,
      'amount', v_amount,
      'isSpin', v_is_spin,
      'isToday', (v_day = v_today)
    );
  END LOOP;

  RETURN jsonb_build_object(
    'success', true, 
    'weekStart', to_char(v_week_start, 'YYYY-MM-DD'),
    'currentDate', to_char(v_today, 'YYYY-MM-DD'),
    'currentDayName', to_char(v_today, 'FMDay'),
    'days', v_result
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Enhanced check_in_today function
CREATE OR REPLACE FUNCTION public.check_in_today(p_spin_choice int DEFAULT NULL)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_today date := current_date;
  v_week_start date := date_trunc('week', v_today)::date;
  v_dow int := EXTRACT(ISODOW FROM v_today)::int; -- 1=Mon, 2=Tue, ..., 7=Sun
  v_day_name text := to_char(v_today, 'FMDay');
  v_amount numeric;
  v_label text;
  v_reference text;
  v_roll int;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required.');
  END IF;

  -- Verify user has not already checked in today
  IF EXISTS (
    SELECT 1 FROM public.daily_checkins
    WHERE user_id = v_user_id AND checkin_date = v_today
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You have already checked in today. Come back tomorrow!');
  END IF;

  -- Determine reward based on server day of week
  IF v_dow = 1 THEN
    -- Monday Spin: 50, 100, or 150
    IF p_spin_choice IN (50, 100, 150) THEN
      v_amount := p_spin_choice;
    ELSE
      v_roll := floor(random() * 3)::int;
      IF v_roll = 0 THEN v_amount := 50;
      ELSIF v_roll = 1 THEN v_amount := 100;
      ELSE v_amount := 150;
      END IF;
    END IF;
    v_label := '🎰 Monday Spin Reward: ₦' || v_amount::int;
  ELSIF v_dow = 2 THEN
    v_amount := 200;
    v_label := 'Tuesday Daily Reward: ₦200';
  ELSIF v_dow = 3 THEN
    v_amount := 250;
    v_label := 'Wednesday Daily Reward: ₦250';
  ELSIF v_dow = 4 THEN
    v_amount := 300;
    v_label := 'Thursday Daily Reward: ₦300';
  ELSIF v_dow = 5 THEN
    v_amount := 350;
    v_label := 'Friday Daily Reward: ₦350';
  ELSIF v_dow = 6 THEN
    v_amount := 400;
    v_label := 'Saturday Daily Reward: ₦400';
  ELSIF v_dow = 7 THEN
    v_amount := 500;
    v_label := 'Sunday Daily Reward: ₦500';
  ELSE
    v_amount := 100;
    v_label := 'Daily Check-In Reward: ₦100';
  END IF;

  v_reference := 'NPP-CHK-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS') || '-' || upper(substr(md5(random()::text), 1, 6));

  -- Record check-in
  INSERT INTO public.daily_checkins (
    user_id, checkin_date, week_start, day_name, reward_amount, reward_label
  ) VALUES (
    v_user_id, v_today, v_week_start, v_day_name, v_amount, v_label
  );

  -- Credit to live transactions
  INSERT INTO public.transactions (
    user_id, title, category, amount, type, status, reference, channel, description, created_at
  ) VALUES (
    v_user_id,
    'Daily Check-In Reward • ' || v_day_name,
    'Daily Check-In',
    v_amount,
    'received',
    'Completed',
    v_reference,
    'NearbyPay Weekly Rewards',
    v_label,
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'date', to_char(v_today, 'YYYY-MM-DD'),
    'dayName', v_day_name,
    'amount', v_amount,
    'reward', v_label,
    'reference', v_reference
  );
EXCEPTION WHEN unique_violation THEN
  RETURN jsonb_build_object('success', false, 'error', 'You have already checked in today.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_weekly_checkins() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.check_in_today(int) TO authenticated, anon;
`;

async function main() {
  const client = new Client({
    host: '2a05:d018:f3f:3101:57a6:c6f3:b137:f987',
    port: 5432,
    user: 'postgres',
    password: 'ANT@wasp2026',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected to PostgreSQL.');
  await client.query(SQL);
  console.log('Successfully applied checkin rules and transactions description column!');
  await client.end();
}

main().catch((err) => {
  console.error('Error deploying:', err);
  process.exit(1);
});
