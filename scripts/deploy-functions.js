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

-- 4. Real Instant Transfer by Cashtag function
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

-- 5. Insert welcome deposit for any existing user who doesn't have it yet
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
