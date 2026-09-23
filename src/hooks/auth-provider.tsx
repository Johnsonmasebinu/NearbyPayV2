import { type Session, type User } from '@supabase/supabase-js';
import React, { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { hashPinWithSalt } from '@/lib/crypto';
import { supabase } from '@/lib/supabase';

export type UserProfile = {
  id: string;
  name: string;
  tag: string;
  email: string;
  phone: string;
  bio: string;
  avatar: string;
  accountNumber: string;
  bankName: string;
  hasPin: boolean;
};

type SignUpParams = {
  email: string;
  password: string;
  fullName: string;
  username: string;
  avatarUrl?: string;
  phone?: string;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  hasPin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (params: SignUpParams) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  setupPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  changePin: (oldPin: string, newPin: string) => Promise<void>;
  resetPin: (password: string, newPin: string) => Promise<void>;
  uploadProfilePicture: (uri: string) => Promise<string>;
  updateProfile: (partial: Partial<UserProfile>) => Promise<void>;
  updateAvatar: (avatarUrl: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  generateUniqueUsername: (seed?: string) => Promise<string>;
};

const AuthContext = createContext<AuthContextType | null>(null);

const DEFAULT_AVATAR = 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_1.png';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch public.profiles row for user
  const fetchProfile = async (currentUser: User): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile from Supabase:', error.message);
        return null;
      }

      if (data) {
        const userProf: UserProfile = {
          id: data.id,
          name: data.full_name || 'NearbyPay User',
          tag: data.username || currentUser.email?.split('@')[0] || 'user',
          email: currentUser.email || '',
          phone: data.phone || '',
          bio: data.bio || 'NearbyPay user ⚡',
          avatar: data.avatar_url || DEFAULT_AVATAR,
          accountNumber: data.account_number || '9012345678',
          bankName: data.bank_name || 'Providus Bank • Virtual Account',
          hasPin: Boolean(data.pin_hash),
        };
        setProfile(userProf);
        return userProf;
      }
    } catch (e) {
      console.error('Failed to load profile:', e);
    }
    return null;
  };

  useEffect(() => {
    let mounted = true;

    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!mounted) return;
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (initialSession?.user) {
        fetchProfile(initialSession.user).finally(() => {
          if (mounted) setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    // 2. Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        await fetchProfile(newSession.user);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user);
    }
  };

  // Sign in
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) {
      throw new Error(error.message);
    }
    if (data.user) {
      await fetchProfile(data.user);
    }
  };

  const generateUniqueUsername = useCallback(async (baseSeed?: string): Promise<string> => {
    let cleanSeed = (baseSeed || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

    // Trim base seed to at most 10 chars so numerals fit comfortably within 20 chars
    cleanSeed = cleanSeed.slice(0, 10);

    if (!cleanSeed || cleanSeed.length < 2) {
      const prefixes = ['pay', 'tag', 'user', 'near', 'cash'];
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      cleanSeed = prefix;
    }

    // Always append numerals (2-4 digits) to ensure usernames always have numbers
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

      if (!data) {
        return candidate;
      }
    }

    return `${cleanSeed}${Math.floor(1000 + Math.random() * 9000)}`.slice(0, 20);
  }, []);

  // Sign up
  const signUp = async ({ email, password, fullName, username, avatarUrl, phone }: SignUpParams) => {
    let cleanUsername = (username || '').trim().toLowerCase().replace(/^[@$]/, '');

    if (!cleanUsername) {
      cleanUsername = await generateUniqueUsername(fullName);
    } else {
      // Check if username is already taken, if so generate a guaranteed unique variation
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', cleanUsername)
        .maybeSingle();

      if (existingUser) {
        cleanUsername = await generateUniqueUsername(cleanUsername);
      }
    }

    const chosenAvatar = avatarUrl || DEFAULT_AVATAR;

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          username: cleanUsername,
          avatar_url: chosenAvatar,
          phone: phone?.trim() || '',
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (data.user) {
      // Ensure profile row exists immediately
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName.trim(),
        username: cleanUsername,
        avatar_url: chosenAvatar,
        phone: phone?.trim() || '',
        bio: 'NearbyPay user ⚡',
      });
      await fetchProfile(data.user);
    }
  };

  // Sign out
  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  // Password Reset
  const sendPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
    if (error) {
      throw new Error(error.message);
    }
  };

  // Setup PIN
  const setupPin = async (pin: string) => {
    if (!user) throw new Error('Not logged in');
    if (!/^\d{4}$/.test(pin)) throw new Error('PIN must be exactly 4 digits');

    const pinHash = hashPinWithSalt(pin, user.id);

    const { error } = await supabase
      .from('profiles')
      .update({ pin_hash: pinHash, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (error) throw new Error(error.message);

    setProfile((prev) => (prev ? { ...prev, hasPin: true } : null));
  };

  // Verify PIN
  const verifyPin = async (pin: string): Promise<boolean> => {
    if (!user) return false;
    const { data, error } = await supabase
      .from('profiles')
      .select('pin_hash')
      .eq('id', user.id)
      .single();

    if (error || !data?.pin_hash) return false;

    const computed = hashPinWithSalt(pin, user.id);
    return computed === data.pin_hash;
  };

  // Change PIN
  const changePin = async (oldPin: string, newPin: string) => {
    if (!user) throw new Error('Not logged in');
    const isValid = await verifyPin(oldPin);
    if (!isValid) throw new Error('Current PIN is incorrect');

    await setupPin(newPin);
  };

  // Reset PIN (re-authenticate with password, then set new PIN)
  const resetPin = async (password: string, newPin: string) => {
    if (!user || !user.email) throw new Error('Not logged in');

    // Verify account password first
    const { error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });
    if (error) throw new Error('Incorrect account password. Cannot reset PIN.');

    await setupPin(newPin);
  };

  // Upload Profile Picture to Supabase Storage
  const uploadProfilePicture = async (uri: string): Promise<string> => {
    if (!user) throw new Error('Not logged in');

    const filename = `${user.id}/avatar_${Date.now()}.jpg`;

    // Fetch local file into Blob/ArrayBuffer
    const response = await fetch(uri);
    const blob = await response.blob();
    const arrayBuffer = await new Response(blob).arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filename, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('avatars').getPublicUrl(filename);

    // Update in profiles table
    await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    setProfile((prev) => (prev ? { ...prev, avatar: publicUrl } : null));

    return publicUrl;
  };

  // Update Profile fields
  const updateProfile = async (partial: Partial<UserProfile>) => {
    if (!user) return;

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (partial.name !== undefined) updates.full_name = partial.name;
    if (partial.phone !== undefined) updates.phone = partial.phone;
    if (partial.bio !== undefined) updates.bio = partial.bio;
    if (partial.avatar !== undefined) updates.avatar_url = partial.avatar;

    if (partial.tag !== undefined) {
      const cleanTag = partial.tag.trim().toLowerCase().replace(/^[@$]/, '');
      if (cleanTag !== profile?.tag) {
        // Check uniqueness
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', cleanTag)
          .maybeSingle();

        if (existing && existing.id !== user.id) {
          throw new Error(`Username @${cleanTag} is already taken.`);
        }
        updates.username = cleanTag;
      }
    }

    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
    if (error) throw new Error(error.message);

    setProfile((prev) => (prev ? { ...prev, ...partial } : null));
  };

  const updateAvatar = async (avatarUrl: string) => {
    await updateProfile({ avatar: avatarUrl });
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isLoading,
        hasPin: Boolean(profile?.hasPin),
        signIn,
        signUp,
        signOut,
        sendPasswordReset,
        setupPin,
        verifyPin,
        changePin,
        resetPin,
        uploadProfilePicture,
        updateProfile,
        updateAvatar,
        refreshProfile,
        generateUniqueUsername,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
