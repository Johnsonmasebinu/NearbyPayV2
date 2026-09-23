import { useRouter } from 'expo-router';
import MoreScreen from '@/components/more-screen';

export default function MoreRoute() {
  const router = useRouter();

  return <MoreScreen onBack={() => router.back()} />;
}

