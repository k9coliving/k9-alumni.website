import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { listSubscribers } from '@/lib/subscribers';
import SubscribersClient from './SubscribersClient';

export const dynamic = 'force-dynamic';

export default async function AdminSubscribers() {
  if (!(await isAdminAuthenticated())) {
    redirect('/admin/login?next=/admin/newsletter/subscribers');
  }

  const subscribers = await listSubscribers();
  return <SubscribersClient subscribers={subscribers} />;
}
