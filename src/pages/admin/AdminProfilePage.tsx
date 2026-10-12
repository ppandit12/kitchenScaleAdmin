import { PageTitle } from '@/components/admin';
import { AdminProfileSettings } from '@/components/admin/AdminProfileSettings';

export default function AdminProfilePage() {
  return (
    <>
      <PageTitle title="Profile" description="Manage your account name and profile photo." />
      <div className="max-w-3xl"><AdminProfileSettings /></div>
    </>
  );
}
