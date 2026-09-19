import { redirect } from 'next/navigation';

export default function TransactionsLegacyRedirect() {
  redirect('/admin/transactions');
}
