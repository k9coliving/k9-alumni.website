import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function AdminNewsletter() {
  if (!(await isAdminAuthenticated())) {
    redirect('/admin/login?next=/admin/newsletter');
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900">Newsletter admin</h1>
        <p className="mt-2 text-gray-600">You&apos;re signed in. Dashboard coming next.</p>
      </div>
    </div>
  );
}
