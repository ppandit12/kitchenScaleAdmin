import { Suspense, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Info, Menu } from 'lucide-react';
import { LoadingState } from '@/components/common';
import { AdminSidebarContent, GlobalSearch, MobileSidebar, NotificationsMenu, ProfileMenu } from '@/components/admin';
import { useAuthStore } from '@/store';

export default function AdminLayout() {
  const admin = useAuthStore((s) => s.admin);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  if (!admin) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;

  return (
    <div className="admin-shell min-h-screen bg-cream text-ink">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[256px] bg-ink lg:block">
        <AdminSidebarContent />
      </aside>
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex min-h-screen flex-col lg:pl-[256px]">
        <div role="note" className="flex items-center justify-center gap-2 bg-accent-100 px-4 py-1.5 text-center text-xs font-medium text-[#6f5532]">
          <Info className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Pre-launch — payments, emails and courier tracking aren’t connected yet
        </div>
        <header className="sticky top-0 z-30 border-b border-line/80 bg-surface/90 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
          <div className="flex h-16 items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-ink transition hover:bg-sand lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <GlobalSearch className="min-w-0 flex-1 md:max-w-md" />
            <div className="ml-auto flex shrink-0 items-center gap-1">
              <NotificationsMenu />
              <ProfileMenu />
            </div>
          </div>
        </header>
        <main id="main" className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mx-auto w-full max-w-[1400px]">
            <Suspense fallback={<LoadingState className="min-h-[50vh]" />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
