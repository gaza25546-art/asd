import { SectionHeader } from '@/components/section-header';
import { PredictionsClient } from '@/components/predictions-client';

export const metadata = { title: 'Predictions | DVSC' };

export default function PredictionsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 lg:px-8">
      <PredictionsClient />
    </div>
  );
}
