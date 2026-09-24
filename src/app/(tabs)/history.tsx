import { useLocalSearchParams, useRouter } from 'expo-router';

import TransactionHistoryScreen from '@/components/transaction-history';

export default function HistoryTab() {
  const router = useRouter();
  const { transactionId } = useLocalSearchParams<{ transactionId?: string }>();
  return (
    <TransactionHistoryScreen
      onBack={() => router.navigate('/(tabs)/home')}
      initialTransactionId={transactionId}
    />
  );
}
