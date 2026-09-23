import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export const AVAILABLE_AVATARS: string[] = Array.from(
  { length: 25 },
  (_, i) => `https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_${i + 1}.png`
);

// Preload all 25 avatar images into disk and memory cache
export function preloadAvatarImages() {
  try {
    AVAILABLE_AVATARS.forEach((url) => {
      Image.prefetch(url);
    });
  } catch {
    // ignore
  }
}

export type UserProfile = {
  name: string;
  tag: string;
  email: string;
  phone: string;
  bio: string;
  avatar: string;
  accountNumber: string;
  bankName: string;
};

type UserProfileContextType = {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  updateAvatar: (newAvatarUrl: string) => void;
  updateProfile: (partial: Partial<UserProfile>) => void;
  isLoaded: boolean;
};

const STORAGE_KEY = '@nearbypay_user_profile_v2';

const DEFAULT_PROFILE: UserProfile = {
  name: 'Chinedu Okafor',
  tag: 'chinedu',
  email: 'chinedu.okafor@gmail.com',
  phone: '+234 803 123 4567',
  bio: 'Fintech enthusiast & frequent nearby merchant payer ⚡',
  avatar: AVAILABLE_AVATARS[0], // Starts at memo_1.png, not memo_23
  accountNumber: '9012345678',
  bankName: 'Providus Bank • Virtual Account',
};

const UserProfileContext = createContext<UserProfileContextType | null>(null);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isLoaded, setIsLoaded] = useState(false);

  // Preload all avatar images and load saved profile from storage on mount
  useEffect(() => {
    preloadAvatarImages();

    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            setProfile((prev) => ({ ...prev, ...parsed }));
          }
        }
      } catch {
        // fallback to default
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  const saveToStorage = async (updated: UserProfile) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const updateAvatar = (newAvatarUrl: string) => {
    setProfile((prev) => {
      const next = { ...prev, avatar: newAvatarUrl };
      saveToStorage(next);
      return next;
    });
  };

  const updateProfile = (partial: Partial<UserProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...partial };
      saveToStorage(next);
      return next;
    });
  };

  return (
    <UserProfileContext.Provider value={{ profile, setProfile, updateAvatar, updateProfile, isLoaded }}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const ctx = useContext(UserProfileContext);
  if (!ctx) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return ctx;
}
