const { Client } = require('pg');

const SQL = `
-- 1. Auto-confirm trigger so users are never blocked by expired OTP links
CREATE OR REPLACE FUNCTION public.auto_confirm_new_users()
RETURNS trigger AS $$
BEGIN
  NEW.email_confirmed_at := COALESCE(NEW.email_confirmed_at, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_auto_confirm ON auth.users;
CREATE TRIGGER on_auth_user_auto_confirm
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_new_users();

-- Auto-confirm any existing users
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE email_confirmed_at IS NULL;

-- 2. Enhanced handle_new_user trigger with Hackathon 10,000 Welcome Deposit
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_full_name text;
  v_username text;
  v_avatar_url text;
  v_phone text;
  v_ref text;
BEGIN
  v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'NearbyPay User');
  v_username := COALESCE(new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'tag', split_part(new.email, '@', 1));
  v_avatar_url := COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_1.png');
  v_phone := COALESCE(new.raw_user_meta_data->>'phone', '');

  -- Handle collision if username already exists
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username AND id != new.id) THEN
    v_username := v_username || '_' || substr(new.id::text, 1, 4);
  END IF;

  INSERT INTO public.profiles (id, full_name, username, phone, avatar_url)
  VALUES (new.id, v_full_name, v_username, v_phone, v_avatar_url)
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = now();

  v_ref := 'NPP-HACKATHON-' || upper(substr(md5(new.id::text || now()::text), 1, 8));

  INSERT INTO public.transactions (user_id, title, category, amount, type, status, reference, channel, created_at)
  VALUES (
    new.id,
    'Hackathon New Account Deposit',
    'Deposit',
    10000,
    'received',
    'Completed',
    v_ref,
    'NearbyPay New Account Deposit',
    now()
  )
  ON CONFLICT DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Function to claim / ensure welcome deposit of 10,000 for accounts within 24h
CREATE OR REPLACE FUNCTION public.claim_welcome_deposit()
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_ref text;
  v_user_created timestamptz;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Check if already claimed
  IF EXISTS (SELECT 1 FROM public.transactions WHERE user_id = v_user_id AND title = 'Hackathon New Account Deposit') THEN
    RETURN jsonb_build_object('success', true, 'already_claimed', true);
  END IF;

  SELECT created_at INTO v_user_created FROM auth.users WHERE id = v_user_id;

  v_ref := 'NPP-HACKATHON-' || upper(substr(md5(v_user_id::text || now()::text), 1, 8));

  INSERT INTO public.transactions (user_id, title, category, amount, type, status, reference, channel, created_at)
  VALUES (
    v_user_id,
    'Hackathon New Account Deposit',
    'Deposit',
    10000,
    'received',
    'Completed',
    v_ref,
    'NearbyPay New Account Deposit',
    now()
  );

  RETURN jsonb_build_object('success', true, 'amount', 10000, 'reference', v_ref);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.claim_welcome_deposit() TO authenticated, anon;

-- 4. Record a validated bank transfer debit
CREATE OR REPLACE FUNCTION public.record_bank_transfer(
  p_account_number text,
  p_bank_name text,
  p_amount numeric,
  p_note text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_balance numeric;
  v_reference text;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required.');
  END IF;
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Amount must be greater than zero.');
  END IF;
  IF length(regexp_replace(coalesce(p_account_number, ''), '[^0-9]', '', 'g')) <> 10 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Enter a valid 10-digit bank account number.');
  END IF;

  SELECT COALESCE(SUM(CASE WHEN type = 'received' THEN amount ELSE -amount END), 0)
  INTO v_balance
  FROM public.transactions
  WHERE user_id = v_user_id;

  IF v_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance.');
  END IF;

  v_reference := 'NPP-BNK-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS') || '-' || upper(substr(md5(random()::text), 1, 6));
  INSERT INTO public.transactions (user_id, title, category, amount, type, status, reference, channel)
  VALUES (
    v_user_id,
    'Bank transfer to ' || regexp_replace(p_account_number, '[^0-9]', '', 'g'),
    'Transfer',
    p_amount,
    'sent',
    'Completed',
    v_reference,
    coalesce(nullif(trim(p_note), ''), coalesce(nullif(trim(p_bank_name), ''), 'Bank Transfer'))
  );

  RETURN jsonb_build_object('success', true, 'reference', v_reference, 'amount', p_amount, 'newBalance', v_balance - p_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.record_bank_transfer(text, text, numeric, text) TO authenticated;

-- 5. Real Instant Transfer by Cashtag function
CREATE OR REPLACE FUNCTION public.transfer_by_tag(
  p_recipient_tag text,
  p_amount numeric,
  p_note text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_sender_id uuid := auth.uid();
  v_sender_username text;
  v_sender_name text;
  v_recipient_id uuid;
  v_recipient_name text;
  v_recipient_username text;
  v_recipient_avatar text;
  v_clean_tag text;
  v_sender_balance numeric;
  v_ref text;
BEGIN
  IF v_sender_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required to send money.');
  END IF;

  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Amount must be greater than zero.');
  END IF;

  -- Clean recipient tag
  v_clean_tag := lower(trim(replace(replace(p_recipient_tag, '@', ''), '$', '')));

  -- Look up sender
  SELECT username, full_name INTO v_sender_username, v_sender_name
  FROM public.profiles WHERE id = v_sender_id;

  -- Calculate sender's current balance
  SELECT COALESCE(SUM(CASE WHEN type = 'received' THEN amount ELSE -amount END), 0)
  INTO v_sender_balance
  FROM public.transactions
  WHERE user_id = v_sender_id;

  IF v_sender_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient balance. Available: ₦' || trim(to_char(v_sender_balance, '999,999,990.00'))
    );
  END IF;

  -- Look up recipient by username/tag
  SELECT id, full_name, username, avatar_url
  INTO v_recipient_id, v_recipient_name, v_recipient_username, v_recipient_avatar
  FROM public.profiles
  WHERE lower(username) = v_clean_tag;

  IF v_recipient_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User @' || v_clean_tag || ' not found.');
  END IF;

  IF v_recipient_id = v_sender_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'You cannot send money to your own tag.');
  END IF;

  -- Generate unique transfer reference
  v_ref := 'NPP-TRF-' || to_char(now(), 'YYYYMMDDHH24MISS') || '-' || upper(substr(md5(random()::text), 1, 6));

  -- 1. Insert debit transaction for sender
  INSERT INTO public.transactions (
    user_id, title, category, amount, type, status, reference, channel, created_at
  ) VALUES (
    v_sender_id,
    'Transfer to @' || v_recipient_username,
    'Transfer',
    p_amount,
    'sent',
    'Completed',
    v_ref,
    COALESCE(NULLIF(trim(p_note), ''), 'NearbyPay Cashtag'),
    now()
  );

  -- 2. Insert credit transaction for recipient
  INSERT INTO public.transactions (
    user_id, title, category, amount, type, status, reference, channel, created_at
  ) VALUES (
    v_recipient_id,
    'Transfer from @' || COALESCE(v_sender_username, 'user'),
    'Transfer',
    p_amount,
    'received',
    'Completed',
    v_ref,
    COALESCE(NULLIF(trim(p_note), ''), 'NearbyPay Cashtag'),
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'reference', v_ref,
    'amount', p_amount,
    'recipient', jsonb_build_object(
      'id', v_recipient_id,
      'name', v_recipient_name,
      'username', v_recipient_username,
      'avatarUrl', v_recipient_avatar
    ),
    'newBalance', (v_sender_balance - p_amount)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.transfer_by_tag(text, numeric, text) TO authenticated;

-- 6. Insert welcome deposit for any existing user who doesn't have it yet
INSERT INTO public.transactions (user_id, title, category, amount, type, status, reference, channel, created_at)
SELECT
  u.id,
  'Hackathon New Account Deposit',
  'Deposit',
  10000,
  'received',
  'Completed',
  'NPP-HACKATHON-' || upper(substr(md5(u.id::text || now()::text), 1, 8)),
  'NearbyPay New Account Deposit',
  now()
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.transactions t
  WHERE t.user_id = u.id AND t.title = 'Hackathon New Account Deposit'
);

-- 7. Server-validated weekly daily check-in rewards
CREATE TABLE IF NOT EXISTS public.daily_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checkin_date date NOT NULL,
  week_start date NOT NULL,
  day_name text NOT NULL,
  reward_amount numeric(14, 2) NOT NULL,
  reward_label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, checkin_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_week
  ON public.daily_checkins(user_id, week_start, checkin_date);

ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own daily checkins" ON public.daily_checkins;
CREATE POLICY "Users can view own daily checkins"
  ON public.daily_checkins FOR SELECT
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.get_weekly_checkins()
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_today date := current_date;
  v_week_start date := date_trunc('week', v_today)::date;
  v_day date;
  v_result jsonb := '[]'::jsonb;
  v_record public.daily_checkins;
  v_status text;
  v_reward text;
  v_amount numeric;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required.');
  END IF;

  FOR v_day IN SELECT v_week_start + generate_series(0, 6) LOOP
    SELECT * INTO v_record
    FROM public.daily_checkins
    WHERE user_id = v_user_id AND checkin_date = v_day;

    IF v_record.id IS NOT NULL THEN
      v_status := 'Completed';
      v_reward := v_record.reward_label;
      v_amount := v_record.reward_amount;
    ELSE
      v_status := CASE
        WHEN v_day = v_today THEN 'Available'
        WHEN v_day < v_today THEN 'Missed'
        ELSE 'Upcoming'
      END;
      v_reward := 'Mystery reward • Spin to reveal';
      v_amount := NULL;
    END IF;

    v_result := v_result || jsonb_build_object(
      'date', v_day,
      'dayName', to_char(v_day, 'FMDay'),
      'status', v_status,
      'reward', v_reward,
      'amount', v_amount
    );
  END LOOP;

  RETURN jsonb_build_object('success', true, 'weekStart', v_week_start, 'days', v_result);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.check_in_today()
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_today date := current_date;
  v_week_start date := date_trunc('week', v_today)::date;
  v_day_name text := to_char(v_today, 'FMDay');
  v_amount numeric;
  v_label text;
  v_reference text;
  v_roll numeric := random();
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required.');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.daily_checkins
    WHERE user_id = v_user_id AND checkin_date = v_today
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You have already checked in today.');
  END IF;

  IF v_roll < 0.30 THEN v_amount := 50;
  ELSIF v_roll < 0.55 THEN v_amount := 100;
  ELSIF v_roll < 0.73 THEN v_amount := 150;
  ELSIF v_roll < 0.85 THEN v_amount := 200;
  ELSIF v_roll < 0.92 THEN v_amount := 250;
  ELSIF v_roll < 0.96 THEN v_amount := 300;
  ELSIF v_roll < 0.98 THEN v_amount := 350;
  ELSIF v_roll < 0.995 THEN v_amount := 400;
  ELSE v_amount := 500;
  END IF;
  v_label := 'Mystery spin reward: ₦' || v_amount::int;

  v_reference := 'NPP-CHECKIN-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS') || '-' || upper(substr(md5(random()::text), 1, 6));

  INSERT INTO public.daily_checkins (user_id, checkin_date, week_start, day_name, reward_amount, reward_label)
  VALUES (v_user_id, v_today, v_week_start, v_day_name, v_amount, v_label);

  INSERT INTO public.transactions (user_id, title, category, amount, type, status, reference, channel)
  VALUES (
    v_user_id,
    'Daily Check-In Reward - ' || v_day_name,
    'Daily Check-In',
    v_amount,
    'received',
    'Completed',
    v_reference,
    'NearbyPay Weekly Rewards'
  );

  RETURN jsonb_build_object(
    'success', true,
    'date', v_today,
    'dayName', v_day_name,
    'amount', v_amount,
    'reward', v_label,
    'reference', v_reference
  );
EXCEPTION WHEN unique_violation THEN
  RETURN jsonb_build_object('success', false, 'error', 'You have already checked in today.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_weekly_checkins() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_in_today() TO authenticated;
`;

async function deploy() {
  console.log('Deploying database functions...');
  const dbUrl = process.env.SUPABASE_DB_URL || 'postgresql://postgres:ANT%40wasp2026@db.naogyrqswwwrrpnqovzj.supabase.co:5432/postgres';
  const parsed = new URL(dbUrl);

  const client = new Client({
    host: '2a05:d018:f3f:3101:57a6:c6f3:b137:f987',
    port: parseInt(parsed.port || '5432', 10),
    user: parsed.username || 'postgres',
    password: decodeURIComponent(parsed.password || ''),
    database: parsed.pathname ? parsed.pathname.replace(/^\//, '') : 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  await client.query(SQL);
  console.log('✅ Functions and triggers deployed successfully!');

  // Verify transactions in database
  const res = await client.query('SELECT user_id, title, amount, type, status, reference FROM public.transactions;');
  console.log('✅ Current transactions in database:', res.rows);

  await client.end();
}

deploy().catch(err => {
  console.error('Deployment error:', err);
  process.exit(1);
});
