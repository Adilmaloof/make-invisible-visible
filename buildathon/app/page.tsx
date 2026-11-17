import { Gatekeeper } from '@/components/gatekeeper/Gatekeeper';
import { StarField } from '@/components/three/StarField';

export default function Home() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-ink">
      <StarField />
      <Gatekeeper />
    </main>
  );
}
