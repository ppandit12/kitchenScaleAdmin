import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  FileText,
  Inbox,
  ChartColumn,
  CheckCheck,
  CircleUser,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Package,
  Search,
  Settings,
  ShoppingBag,
  Star,
  Store,
  Ticket,
  Truck,
  Users,
  X,
} from 'lucide-react';
import { Badge, Spinner } from '@/components/common';
import { useDismiss } from '@/hooks';
import { customerService, notificationService, orderService, productService } from '@/services';
import { useAuthStore } from '@/store';
import type { AdminNotification, Customer, Order, Product } from '@/types';
import { cn, formatDateTime } from '@/utils';
import { storefrontUrl } from '@/config/storefront';
import { mediaUrl } from '@/services/mediaService';

/* ------------------------------- Navigation ------------------------------ */

export const ADMIN_NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/blog', label: 'Blog', icon: FileText },
  { to: '/admin/content', label: 'Page content', icon: FileText },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/dropshipping', label: 'Dropshipping', icon: Truck },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { to: '/admin/reviews', label: 'Reviews', icon: Star },
  { to: '/admin/messages', label: 'Messages', icon: Inbox },
  { to: '/admin/marketing', label: 'Marketing', icon: Megaphone },
  { to: '/admin/analytics', label: 'Analytics', icon: ChartColumn },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
] as const;

export function AdminSidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <Link to="/admin" onClick={onNavigate} aria-label="KitchenScale Co. admin dashboard" className="mx-5 mt-5 mb-5 flex shrink-0 flex-col items-center gap-2 rounded-xl px-3 py-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
        <img src="/images/client/kitchenscaleco-logo.png" alt="KitchenScale Co." width={626} height={417} className="h-auto w-[176px] object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
        <span className="text-[10px] font-medium tracking-[0.2em] text-cream/70 uppercase">Admin</span>
      </Link>
      <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3">
        <ul className="space-y-0.5">
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={'end' in item ? item.end : false}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition',
                      isActive ? 'bg-cream/12 text-cream' : 'text-cream/70 hover:bg-cream/6 hover:text-cream',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <span className="absolute top-2 bottom-2 left-0 w-[3px] rounded-full bg-accent" aria-hidden />}
                      <Icon className={cn('h-[18px] w-[18px]', isActive ? 'text-accent' : 'text-cream/60 group-hover:text-cream/90')} aria-hidden />
                      {item.label}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-cream/10 p-3">
        <Link
          to={storefrontUrl('/')}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium text-cream/70 transition hover:bg-cream/6 hover:text-cream"
        >
          <Store className="h-[18px] w-[18px] text-cream/60" aria-hidden />
          View storefront
          <ExternalLink className="ml-auto h-3.5 w-3.5 opacity-60" aria-hidden />
        </Link>
        <p className="mt-2 px-3 text-[11px] leading-relaxed text-cream/45">
          Manage your catalog, website content, and store settings.
        </p>
      </div>
    </div>
  );
}

/** Mobile slide-over version of the sidebar (dark, matches desktop). */
export function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const t = setTimeout(() => panel.current?.querySelector<HTMLElement>('a')?.focus(), 50);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
      clearTimeout(t);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <motion.div
            className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label="Admin navigation"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="absolute inset-y-0 left-0 w-[280px] admin-mobile-panel max-w-[85vw] bg-ink shadow-lift"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close navigation"
              className="absolute top-5 right-3 rounded-full p-2 text-cream/70 hover:bg-cream/10 hover:text-cream"
            >
              <X className="h-5 w-5" />
            </button>
            <AdminSidebarContent onNavigate={onClose} />
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------ Global search ---------------------------- */

interface SearchIndex {
  orders: Order[];
  customers: Customer[];
  products: Product[];
}

export function GlobalSearch({ className }: { className?: string }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState<SearchIndex | null>(null);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  useDismiss(ref, () => setOpen(false), open);

  // Refresh the index whenever the admin navigates (data may have changed).
  useEffect(() => {
    setIndex(null);
    setOpen(false);
  }, [pathname]);

  const ensureIndex = () => {
    if (index || loading) return;
    setLoading(true);
    Promise.all([orderService.list(), customerService.list(), productService.list({ includeDrafts: true })])
      .then(([orders, customers, products]) => setIndex({ orders, customers, products }))
      .finally(() => setLoading(false));
  };

  const term = q.trim().toLowerCase();
  const results = useMemo(() => {
    if (!index || term.length < 2) return [];
    const out: { group: string; to: string; title: string; sub: string }[] = [];
    index.orders
      .filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(term) ||
          o.customer.email.toLowerCase().includes(term) ||
          o.customer.fullName.toLowerCase().includes(term),
      )
      .slice(0, 5)
      .forEach((o) => out.push({ group: 'Orders', to: `/admin/orders/${o.id}`, title: o.orderNumber, sub: `${o.customer.fullName} · ${o.customer.email}` }));
    index.customers
      .filter((c) => c.fullName.toLowerCase().includes(term) || c.email.toLowerCase().includes(term))
      .slice(0, 5)
      .forEach((c) => out.push({ group: 'Customers', to: `/admin/customers/${c.id}`, title: c.fullName, sub: c.email }));
    index.products
      .filter((p) => p.name.toLowerCase().includes(term) || p.variants.some((v) => v.sku.toLowerCase().includes(term)))
      .slice(0, 5)
      .forEach((p) => out.push({ group: 'Products', to: `/admin/products/${p.id}`, title: p.name, sub: `${p.variants.length} variants · ${p.status}` }));
    return out;
  }, [index, term]);

  const go = (to: string) => {
    setOpen(false);
    setQ('');
    navigate(to);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const els = Array.from(ref.current?.querySelectorAll<HTMLAnchorElement>('[data-result]') ?? []);
    const idx = els.indexOf(document.activeElement as HTMLAnchorElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      els[Math.min(els.length - 1, idx + 1)]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (idx <= 0) ref.current?.querySelector('input')?.focus();
      else els[idx - 1]?.focus();
    }
  };

  let lastGroup = '';
  return (
    <div ref={ref} className={cn('relative', className)} onKeyDown={onKeyDown}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
      <input
        type="search"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          ensureIndex();
        }}
        onFocus={() => {
          ensureIndex();
          if (q) setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && results[0]) go(results[0].to);
        }}
        placeholder="Search orders, customers, products…"
        aria-label="Search orders, customers and products"
        aria-expanded={open && term.length >= 2}
        aria-controls="admin-search-results"
        role="combobox"
        className="h-10 w-full rounded-xl border border-line bg-cream/70 pl-10 pr-3 text-sm text-ink placeholder:text-muted/70 focus:border-primary focus:bg-surface focus:ring-2 focus:ring-primary/15 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      <AnimatePresence>
        {open && term.length >= 2 && (
          <motion.div
            id="admin-search-results"
            role="listbox"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full right-0 left-0 z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-2xl border border-line bg-surface p-1.5 shadow-lift"
          >
            {loading || !index ? (
              <div className="flex items-center gap-2 px-3 py-4 text-sm text-muted">
                <Spinner className="h-4 w-4" /> Searching…
              </div>
            ) : results.length === 0 ? (
              <p className="px-3 py-4 text-sm text-muted">No matches for “{q.trim()}”.</p>
            ) : (
              results.map((r) => {
                const header = r.group !== lastGroup;
                lastGroup = r.group;
                return (
                  <div key={r.to}>
                    {header && <p className="px-3 pt-2.5 pb-1 text-[11px] font-semibold tracking-wider text-muted uppercase">{r.group}</p>}
                    <Link
                      to={r.to}
                      data-result
                      role="option"
                      aria-selected={false}
                      onClick={(e) => {
                        e.preventDefault();
                        go(r.to);
                      }}
                      className="block rounded-xl px-3 py-2 transition hover:bg-sand focus:bg-sand focus:outline-none"
                    >
                      <span className="block text-sm font-medium text-ink">{r.title}</span>
                      <span className="block truncate text-xs text-muted">{r.sub}</span>
                    </Link>
                  </div>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------ Notifications ---------------------------- */

export function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AdminNotification[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  useDismiss(ref, () => setOpen(false), open);

  // Refresh on navigation, when the menu opens, and every 60 s so new orders show up.
  useEffect(() => {
    let alive = true;
    const load = () =>
      notificationService
        .list()
        .then((n) => alive && setItems(n))
        .catch(() => undefined);
    void load();
    const timer = window.setInterval(load, 60_000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [pathname, open]);

  const unread = items.filter((n) => !n.read).length;

  const openItem = async (n: AdminNotification) => {
    setOpen(false);
    if (!n.read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      await notificationService.markRead(n.id).catch(() => undefined);
    }
    if (n.link) navigate(n.link);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-ink transition hover:bg-sand"
      >
        <Bell className="h-[19px] w-[19px]" />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white ring-2 ring-surface">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.14 }}
            className="fixed inset-x-3 top-[104px] z-50 overflow-hidden rounded-2xl border border-line bg-surface shadow-lift sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:w-[360px]"
          >
            <div className="flex items-center justify-between border-b border-line/70 px-4 py-3">
              <p className="text-sm font-semibold">Notifications</p>
              <button
                type="button"
                disabled={unread === 0}
                onClick={() => {
                  setItems((prev) => prev.map((n) => ({ ...n, read: true })));
                  void notificationService.markAllRead().catch(() => undefined);
                }}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-primary transition hover:bg-sand disabled:opacity-40"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            </div>
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted">You’re all caught up.</p>
            ) : (
              <ul className="max-h-[380px] divide-y divide-line/60 overflow-y-auto">
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => openItem(n)}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-cream"
                    >
                      <span
                        className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.read ? 'bg-line' : 'bg-accent')}
                        aria-label={n.read ? undefined : 'Unread'}
                      />
                      <span className="min-w-0 flex-1">
                        <span className={cn('block text-sm', n.read ? 'text-muted' : 'font-semibold text-ink')}>{n.title}</span>
                        <span className="block text-xs text-muted">{n.body}</span>
                        <span className="mt-1 block text-[11px] text-muted/80">{formatDateTime(n.createdAt)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="border-t border-line/70 bg-cream/60 px-4 py-2 text-[11px] text-muted">New orders, reviews, subscribers and low-stock alerts.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* -------------------------------- Profile -------------------------------- */

export function ProfileMenu() {
  const admin = useAuthStore((s) => s.admin);
  const signOutAdmin = useAuthStore((s) => s.signOutAdmin);
  const [open, setOpen] = useState(false);
  const [failedAvatar, setFailedAvatar] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  useDismiss(ref, () => setOpen(false), open);
  if (!admin) return null;
  const showAvatar = admin.avatarUrl && failedAvatar !== admin.avatarUrl;

  const item = 'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-ink transition hover:bg-sand focus:bg-sand focus:outline-none';
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Admin profile menu"
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 items-center gap-2 rounded-xl pr-2 pl-1 transition hover:bg-sand"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-xs font-semibold text-cream">
          {showAvatar ? <img src={mediaUrl(admin.avatarUrl!)} alt="" className="h-full w-full object-cover" onError={() => setFailedAvatar(admin.avatarUrl!)} /> : admin.name.trim().split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase()}
        </span>
        <span className="hidden text-left leading-tight md:block">
          <span className="block text-sm font-medium text-ink">{admin.name}</span>
          <span className="block text-[11px] text-muted">Administrator</span>
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.14 }}
            className="absolute top-full right-0 z-50 mt-2 w-64 rounded-2xl border border-line bg-surface p-1.5 shadow-lift"
          >
            <div className="flex items-center gap-3 px-3 pt-2 pb-3">
              {showAvatar ? <img src={mediaUrl(admin.avatarUrl!)} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" onError={() => setFailedAvatar(admin.avatarUrl!)} /> : <CircleUser className="h-9 w-9 text-primary" strokeWidth={1.4} aria-hidden />}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{admin.name}</p>
                <p className="truncate text-xs text-muted">{admin.email}</p>
                <Badge tone="accent" className="mt-1 text-[10px] tracking-wider uppercase">
                  Administrator
                </Badge>
              </div>
            </div>
            <div className="border-t border-line/70 pt-1.5">
              <button type="button" role="menuitem" className={item} onClick={() => { setOpen(false); navigate('/admin/profile'); }}>
                <CircleUser className="h-4 w-4 text-muted" /> Profile
              </button>
              <button type="button" role="menuitem" className={item} onClick={() => { setOpen(false); navigate('/admin/settings'); }}>
                <Settings className="h-4 w-4 text-muted" /> Settings
              </button>
              <button type="button" role="menuitem" className={item} onClick={() => { setOpen(false); navigate('/'); }}>
                <Store className="h-4 w-4 text-muted" /> View store
              </button>
              <button
                type="button"
                role="menuitem"
                className={cn(item, 'text-danger')}
                onClick={() => {
                  setOpen(false);
                  signOutAdmin();
                  navigate('/admin/login');
                }}
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
