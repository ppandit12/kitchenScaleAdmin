import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CircleCheck, Clock, DollarSign, MessageSquare, Package, ShoppingBag, TriangleAlert, Users } from 'lucide-react';
import { Badge, ButtonLink, DemoBadge, DemoNotice, ErrorState, ProductArt, Skeleton } from '@/components/common';
import {
  AdminCard,
  CHART,
  ChartCard,
  ChartLegend,
  ChartTooltip,
  DataTable,
  PageTitle,
  StatCard,
  StatusBadge,
  axisProps,
  useUsd,
  yAxisProps,
  type Column,
} from '@/components/admin';
import { countryName } from '@/data/shipping';
import { useAsync, useDocumentTitle } from '@/hooks';
import { customerService, orderService, productService, reviewService } from '@/services';
import { useSettingsStore } from '@/store';
import type { Order, OrderStatus } from '@/types';
import { formatDate, round2 } from '@/utils';

const PENDING: OrderStatus[] = ['placed', 'confirmed', 'processing'];

function weekStart(iso: string): Date {
  const d = new Date(iso);
  const day = (d.getUTCDay() + 6) % 7; // Monday = 0
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day));
}

export default function AdminDashboardPage() {
  useDocumentTitle('Admin dashboard');
  const usd = useUsd();
  const navigate = useNavigate();
  const threshold = useSettingsStore((s) => s.settings.lowStockThreshold);
  const { data, loading, error, reload } = useAsync(
    () =>
      Promise.all([
        orderService.list(),
        customerService.list(),
        productService.list({ includeDrafts: true }),
        reviewService.list(),
      ]).then(([orders, customers, products, reviews]) => ({ orders, customers, products, reviews })),
    [],
  );

  const stats = useMemo(() => {
    if (!data) return null;
    const { orders, customers, products, reviews } = data;
    const live = orders.filter((o) => o.status !== 'cancelled');
    const revenue = round2(live.reduce((s, o) => s + o.total, 0));

    // Weekly series, continuous between first and last order week.
    const weekly = new Map<number, { revenue: number; orders: number }>();
    for (const o of orders) {
      const k = weekStart(o.createdAt).getTime();
      const w = weekly.get(k) ?? { revenue: 0, orders: 0 };
      w.orders += 1;
      if (o.status !== 'cancelled') w.revenue = round2(w.revenue + o.total);
      weekly.set(k, w);
    }
    const keys = [...weekly.keys()].sort((a, b) => a - b);
    const series: { label: string; revenue: number; orders: number }[] = [];
    if (keys.length) {
      for (let t = keys[0]; t <= keys[keys.length - 1]; t += 7 * 86400e3) {
        const w = weekly.get(t) ?? { revenue: 0, orders: 0 };
        series.push({ label: formatDate(new Date(t).toISOString(), 'en', { month: 'short', day: 'numeric', timeZone: 'UTC' }), ...w });
      }
    }

    const byCountry = new Map<string, number>();
    for (const o of live) byCountry.set(o.customer.country, round2((byCountry.get(o.customer.country) ?? 0) + o.total));
    const countries = [...byCountry.entries()]
      .map(([code, value]) => ({ country: countryName(code), value }))
      .sort((a, b) => b.value - a.value);

    const count = (pred: (o: Order) => boolean) => orders.filter(pred).length;
    const statusGroups = [
      { name: 'Delivered', value: count((o) => o.status === 'delivered'), color: CHART.series[0] },
      { name: 'In transit', value: count((o) => o.status === 'shipped' || o.status === 'out_for_delivery'), color: CHART.series[1] },
      { name: 'Pending', value: count((o) => PENDING.includes(o.status)), color: CHART.series[2] },
      { name: 'Cancelled', value: count((o) => o.status === 'cancelled'), color: CHART.series[3] },
    ];

    const lowStock = products.flatMap((p) =>
      p.variants.filter((v) => v.stock <= threshold).map((v) => ({ product: p, variant: v })),
    );

    return {
      revenue,
      totalOrders: orders.length,
      totalCustomers: customers.length,
      totalProducts: products.length,
      pending: count((o) => PENDING.includes(o.status)),
      completed: count((o) => o.status === 'delivered'),
      series,
      countries,
      statusGroups,
      lowStock: lowStock.sort((a, b) => a.variant.stock - b.variant.stock),
      pendingReviews: reviews.filter((r) => r.status === 'pending').length,
      recent: orders.slice(0, 6),
    };
  }, [data, threshold]);

  if (error) return <ErrorState onRetry={reload} />;

  const recentColumns: Column<Order>[] = [
    {
      key: 'number',
      header: 'Order',
      cell: (o) => (
        <Link to={`/admin/orders/${o.id}`} className="font-semibold text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
          {o.orderNumber}
        </Link>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      cell: (o) => (
        <span className="block max-w-[180px] truncate">{o.customer.fullName}</span>
      ),
    },
    { key: 'date', header: 'Date', hideBelow: 'md', cell: (o) => <span className="whitespace-nowrap text-muted">{formatDate(o.createdAt)}</span> },
    { key: 'status', header: 'Status', hideBelow: 'sm', cell: (o) => <StatusBadge status={o.status} /> },
    { key: 'total', header: 'Total', align: 'right', cell: (o) => <span className="font-medium tabular-nums">{usd(o.total)}</span> },
  ];

  const total = stats?.statusGroups.reduce((s, g) => s + g.value, 0) ?? 0;

  return (
    <>
      <PageTitle
        title="Dashboard"
        description="An overview of your store’s orders, customers and products."
        demo
        actions={
          <>
            <ButtonLink to="/admin/orders" variant="outline" size="sm">
              View orders
            </ButtonLink>
            <ButtonLink to="/admin/products/new" size="sm">
              Add product
            </ButtonLink>
          </>
        }
      />

      <DemoNotice className="mb-6">
        All figures below are calculated from sample demo orders, customers and products — they are not real sales.
      </DemoNotice>

      {/* KPIs */}
      <section aria-label="Key metrics" className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Revenue" value={stats ? usd(stats.revenue) : '—'} loading={loading} icon={<DollarSign className="h-4 w-4" />} hint="Excl. cancelled · USD" />
        <StatCard label="Orders" value={stats?.totalOrders ?? '—'} loading={loading} icon={<ShoppingBag className="h-4 w-4" />} to="/admin/orders" hint="All time" />
        <StatCard label="Customers" value={stats?.totalCustomers ?? '—'} loading={loading} icon={<Users className="h-4 w-4" />} to="/admin/customers" hint="Registered" />
        <StatCard label="Products" value={stats?.totalProducts ?? '—'} loading={loading} icon={<Package className="h-4 w-4" />} to="/admin/products" hint="Incl. drafts" />
        <StatCard label="Pending orders" value={stats?.pending ?? '—'} loading={loading} icon={<Clock className="h-4 w-4" />} to="/admin/orders" hint="Placed · confirmed · processing" />
        <StatCard label="Completed" value={stats?.completed ?? '—'} loading={loading} icon={<CircleCheck className="h-4 w-4" />} hint="Delivered" />
      </section>

      {/* Charts */}
      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        {loading || !stats ? (
          <>
            <Skeleton className="h-[340px] rounded-2xl xl:col-span-2" />
            <Skeleton className="h-[340px] rounded-2xl" />
          </>
        ) : (
          <>
            <ChartCard
              className="xl:col-span-2"
              title="Revenue by week"
              description="Sum of non-cancelled demo order totals (USD)"
              height={260}
              empty={stats.series.length === 0 ? 'No orders yet.' : undefined}
              table={{ columns: ['Week of', 'Revenue', 'Orders'], rows: stats.series.map((s) => [s.label, usd(s.revenue), s.orders]) }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.series} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART.single} stopOpacity={0.16} />
                      <stop offset="100%" stopColor={CHART.single} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke={CHART.grid} />
                  <XAxis dataKey="label" {...axisProps} minTickGap={16} />
                  <YAxis {...yAxisProps} tickFormatter={(v: number) => `$${v}`} />
                  <Tooltip
                    cursor={{ stroke: CHART.axis }}
                    content={(p) => <ChartTooltip active={p.active} payload={p.payload} label={p.label} format={(v) => usd(v)} />}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke={CHART.single}
                    strokeWidth={2}
                    fill="url(#revFill)"
                    activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2, fill: CHART.single }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Order status"
              description={`${total} demo orders`}
              height={260}
              empty={total === 0 ? 'No orders yet.' : undefined}
              legend={<ChartLegend items={stats.statusGroups.map((g) => ({ label: g.name, color: g.color, value: String(g.value) }))} />}
              table={{ columns: ['Status', 'Orders'], rows: stats.statusGroups.map((g) => [g.name, g.value]) }}
            >
              <div className="relative h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={(p) => <ChartTooltip active={p.active} payload={p.payload} format={(v) => `${v} orders`} />} />
                    <Pie
                      data={stats.statusGroups.filter((g) => g.value > 0)}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="62%"
                      outerRadius="88%"
                      paddingAngle={2}
                      cornerRadius={4}
                      stroke="#fff"
                      strokeWidth={2}
                      isAnimationActive={false}
                    >
                      {stats.statusGroups
                        .filter((g) => g.value > 0)
                        .map((g) => (
                          <Cell key={g.name} fill={g.color} />
                        ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-semibold text-ink">{total}</span>
                  <span className="text-xs text-muted">orders</span>
                </div>
              </div>
            </ChartCard>

            <ChartCard
              className="xl:col-span-2"
              title="Orders by week"
              description="Number of demo orders placed each week"
              height={220}
              empty={stats.series.length === 0 ? 'No orders yet.' : undefined}
              table={{ columns: ['Week of', 'Orders'], rows: stats.series.map((s) => [s.label, s.orders]) }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.series} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                  <CartesianGrid vertical={false} stroke={CHART.grid} />
                  <XAxis dataKey="label" {...axisProps} minTickGap={16} />
                  <YAxis {...yAxisProps} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: CHART.cursorFill }}
                    content={(p) => <ChartTooltip active={p.active} payload={p.payload} label={p.label} />}
                  />
                  <Bar dataKey="orders" name="Orders" fill={CHART.single} radius={[4, 4, 0, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Sales by country"
              description="Non-cancelled revenue (USD)"
              height={Math.max(160, stats.countries.length * 36)}
              empty={stats.countries.length === 0 ? 'No sales yet.' : undefined}
              table={{ columns: ['Country', 'Revenue'], rows: stats.countries.map((c) => [c.country, usd(c.value)]) }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.countries} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid horizontal={false} stroke={CHART.grid} />
                  <XAxis type="number" {...axisProps} tickFormatter={(v: number) => `$${v}`} />
                  <YAxis type="category" dataKey="country" {...yAxisProps} width={104} />
                  <Tooltip
                    cursor={{ fill: CHART.cursorFill }}
                    content={(p) => <ChartTooltip active={p.active} payload={p.payload} label={p.label} format={(v) => usd(v)} />}
                  />
                  <Bar dataKey="value" name="Revenue" fill={CHART.single} radius={[0, 4, 4, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </>
        )}
      </div>

      {/* Tables */}
      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <AdminCard
          className="xl:col-span-2"
          title={
            <span className="flex items-center gap-2">
              Recent orders <DemoBadge />
            </span>
          }
          actions={
            <Link to="/admin/orders" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          }
          padded={false}
        >
          <DataTable
            columns={recentColumns}
            rows={stats?.recent}
            loading={loading}
            rowKey={(o) => o.id}
            onRowClick={(o) => navigate(`/admin/orders/${o.id}`)}
            empty="No orders yet."
            caption="Recent orders"
          />
        </AdminCard>

        <div className="flex flex-col gap-4">
          <AdminCard
            title={
              <span className="flex items-center gap-2">
                <TriangleAlert className="h-4 w-4 text-warning" aria-hidden /> Low stock
              </span>
            }
            description={`Variants at or below ${threshold} units`}
            actions={
              <Link to="/admin/settings" className="text-xs font-medium text-muted hover:text-primary">
                Threshold
              </Link>
            }
            padded={false}
          >
            {loading || !stats ? (
              <div className="space-y-3 p-5">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
            ) : stats.lowStock.length === 0 ? (
              <p className="p-5 text-sm text-muted">All variants are above the threshold.</p>
            ) : (
              <ul className="divide-y divide-line/60">
                {stats.lowStock.map(({ product, variant }) => (
                  <li key={variant.id}>
                    <Link to={`/admin/products/${product.id}`} className="flex items-center gap-3 px-5 py-3 transition hover:bg-cream/70">
                      <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                        <ProductArt view="front" color={variant.colorHex} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{variant.title}</span>
                        <span className="block truncate text-xs text-muted">{variant.sku}</span>
                      </span>
                      <Badge tone={variant.stock <= 0 ? 'danger' : 'warning'}>{variant.stock <= 0 ? 'Out of stock' : `${variant.stock} left`}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>

          <Link
            to="/admin/reviews"
            className="flex items-center gap-4 rounded-2xl border border-line/80 bg-surface p-5 shadow-[0_1px_2px_rgb(32_39_34/0.04)] transition hover:border-primary/30 hover:shadow-soft"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-100 text-[#8a6a3e]">
              <MessageSquare className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm text-muted">Reviews awaiting moderation</span>
              {loading || !stats ? (
                <Skeleton className="mt-1 h-6 w-10" />
              ) : (
                <span className="block text-2xl font-semibold">{stats.pendingReviews}</span>
              )}
            </span>
            <span className="text-sm font-medium text-primary">Moderate →</span>
          </Link>
        </div>
      </div>
    </>
  );
}
