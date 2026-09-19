import { redirect } from 'next/navigation';

export default function UsersLegacyRedirect() {
  redirect('/admin/users');
}
