import { createContext, useContext, useState, type ReactNode } from 'react';

export const AVAILABLE_AVATARS: string[] = Array.from(
  { length: 25 },
  (_, i) => `https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_${i + 1}.png`
);

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
};

const DEFAULT_PROFILE: UserProfile = {
  name: 'Chinedu Okafor',
  tag: 'chinedu',
  email: 'chinedu.okafor@gmail.com',
  phone: '+234 803 123 4567',
  bio: 'Fintech enthusiast & frequent nearby merchant payer ⚡',
  avatar: 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_23.png',
  accountNumber: '9012345678',
  bankName: 'Providus Bank • Virtual Account',
};

const UserProfileContext = createContext<UserProfileContextType | null>(null);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  const updateAvatar = (newAvatarUrl: string) => {
    setProfile((prev) => ({ ...prev, avatar: newAvatarUrl }));
  };

  const updateProfile = (partial: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...partial }));
  };

  return (
    <UserProfileContext.Provider value={{ profile, setProfile, updateAvatar, updateProfile }}>
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
