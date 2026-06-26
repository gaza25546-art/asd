import { SectionHeader } from '@/components/section-header';
import { ForumClient } from '@/components/forum-client';

export const metadata = { title: 'Community Forum | DVSC' };

export default function ForumPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 lg:px-8">
      <ForumClient />
    </div>
  );
}
