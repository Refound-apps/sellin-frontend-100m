import type { Metadata } from 'next';
import UsersList from '@/components/UsersList';

export const metadata: Metadata = {
  title: 'Uživatelé a prodejci | Sellin.cz',
  description: 'Správa uživatelů, prodejců a jejich inzertních účtů',
};

export default function UsersPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <UsersList />
    </main>
  );
}
