import { useRouter } from 'expo-router';

import TransactionHistoryScreen from '@/components/transaction-history';

export default function HistoryTab() {
  const router = useRouter();
  return <TransactionHistoryScreen onBack={() => router.navigate('/(tabs)/home')} />;
}
