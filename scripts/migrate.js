const { Client } = require('pg');
const dns = require('dns').promises;

const DB_URL =
  process.env.SUPABASE_DB_URL ||
  'postgresql://postgres:ANT%40wasp2026@db.naogyrqswwwrrpnqovzj.supabase.co:5432/postgres';

const MIGRATION_SQL = `
-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  username text UNIQUE NOT NULL,
  phone text DEFAULT '',
  avatar_url text DEFAULT 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_1.png',
  bio text DEFAULT 'NearbyPay user ⚡',
  pin_hash text,
  account_number text DEFAULT ('90' || lpad(floor(random() * 90000000 + 10000000)::text, 8, '0')),
  bank_name text DEFAULT 'Providus Bank • Virtual Account',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- 2. Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 3. Automatic Profile Creation on Signup Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_full_name text;
  v_username text;
  v_avatar_url text;
  v_phone text;
BEGIN
  v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'NearbyPay User');
  v_username := COALESCE(new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'tag', split_part(new.email, '@', 1));
  v_avatar_url := COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_1.png');
  v_phone := COALESCE(new.raw_user_meta_data->>'phone', '');

  -- Handle collision if username already exists
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username) THEN
    v_username := v_username || '_' || substr(new.id::text, 1, 4);
  END IF;

  INSERT INTO public.profiles (id, full_name, username, phone, avatar_url)
  VALUES (new.id, v_full_name, v_username, v_phone, v_avatar_url)
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = now();

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Avatars Storage Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public can view buckets" ON storage.buckets;
CREATE POLICY "Public can view buckets"
  ON storage.buckets FOR SELECT
  USING (true);

-- Storage Policies
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;
CREATE POLICY "Avatars are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
`;

async function run() {
  console.log('Connecting to PostgreSQL database...');

  // Try direct connection or resolve host
  let client;
  try {
    client = new Client({
      connectionString: DB_URL,
      ssl: { rejectUnauthorized: false },
    });
    await client.connect();
  } catch (err) {
    console.log('Direct connection failed (' + err.message + '), trying IPv6 resolution...');
    const url = new URL(DB_URL);
    let ipv6 = '2a05:d018:f3f:3101:57a6:c6f3:b137:f987';
    try {
      const addresses = await dns.resolve6(url.hostname);
      if (addresses && addresses.length > 0) {
        ipv6 = addresses[0];
      }
    } catch {
      // use fallback
    }

    client = new Client({
      host: ipv6,
      port: parseInt(url.port || '5432', 10),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, '') || 'postgres',
      ssl: { rejectUnauthorized: false },
    });
    await client.connect();
  }

  console.log('PostgreSQL connected! Executing migration...');
  await client.query(MIGRATION_SQL);
  console.log('Migration executed successfully!');

  // Verify tables
  const res = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public';
  `);
  console.log('Public tables in database:', res.rows.map((r) => r.table_name));

  const buckets = await client.query(`SELECT id, name, public FROM storage.buckets;`);
  console.log('Storage buckets in database:', buckets.rows);

  await client.end();
  console.log('Done!');
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
