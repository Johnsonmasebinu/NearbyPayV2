const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Read .env manually
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      process.env[key] = val;
    }
  });
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBackend() {
  console.log('Testing Supabase connectivity...');
  console.log('URL:', supabaseUrl);

  // 1. Test profiles table query
  const { data: profiles, error: profileErr } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, pin_hash')
    .limit(5);

  if (profileErr) {
    console.error('Failed to query profiles table:', profileErr.message);
  } else {
    console.log('✅ Profiles table queried successfully. Count:', profiles.length);
  }

  // 2. Test storage bucket
  const { data: buckets, error: bucketErr } = await supabase.storage.listBuckets();
  if (bucketErr) {
    console.error('Failed to list buckets:', bucketErr.message);
  } else {
    const avatarBucket = buckets.find(b => b.name === 'avatars');
    if (avatarBucket) {
      console.log('✅ "avatars" storage bucket exists and is accessible. Public:', avatarBucket.public);
    } else {
      console.log('⚠️ Avatars bucket not found in buckets list:', buckets.map(b => b.name));
    }
  }

  // 3. Test unique username generation
  async function testGenerateUsername(seed) {
    let cleanSeed = (seed || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
    // Trim base seed to at most 10 chars so numerals fit comfortably
    cleanSeed = cleanSeed.slice(0, 10);

    if (!cleanSeed || cleanSeed.length < 2) {
      const prefixes = ['pay', 'tag', 'user', 'near', 'cash'];
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      cleanSeed = prefix;
    }

    const num2Digit = Math.floor(10 + Math.random() * 90);
    const num3Digit = Math.floor(100 + Math.random() * 900);
    const num4Digit = Math.floor(1000 + Math.random() * 9000);

    const candidateSuffixes = [
      `${num2Digit}`,
      `${num3Digit}`,
      `_${num2Digit}`,
      `${num4Digit}`,
      `_${num3Digit}`,
    ];

    for (const suffix of candidateSuffixes) {
      const candidate = `${cleanSeed}${suffix}`.slice(0, 20);
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', candidate)
        .maybeSingle();

      if (!data) return candidate;
    }
    return `${cleanSeed}${Math.floor(1000 + Math.random() * 9000)}`.slice(0, 20);
  }

  const u1 = await testGenerateUsername('Chinedu Okafor');
  const u2 = await testGenerateUsername('Alex Morgan');
  const u3 = await testGenerateUsername();
  console.log('✅ Generated unique system usernames:');
  console.log('   Chinedu Okafor -> @' + u1);
  console.log('   Alex Morgan    -> @' + u2);
  console.log('   Default random -> @' + u3);

  console.log('All backend checks completed.');
}

testBackend().catch(err => {
  console.error('Backend test failed:', err);
  process.exit(1);
});
