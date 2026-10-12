import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';
import { Badge, EmptyState, ErrorState, LoadingState, Toggle } from '@/components/common';
import { AdminCard, Avatar, DataTable, KeyValue, PageTitle, StatCard, StatusBadge, useUsd, type Column } from '@/components/admin';
import { countryName } from '@/data/shipping';
import { useAsync, useDocumentTitle } from '@/hooks';
import { customerService, orderService } from '@/services';
import { toast } from '@/store';
import type { Order } from '@/types';
import { formatDate, round2 } from '@/utils';

export default function AdminCustomerDetailsPage() {
  const { id = '' } = useParams();
  const usd = useUsd();
  const navigate = useNavigate();
  const { data, loading, error, reload, setData } = useAsync(async () => {
    const customer = await customerService.get(id);
    const orders = customer ? await orderService.listForCustomer(customer.id, customer.email) : [];
    return { customer, orders };
  }, [id]);
  const [savingOptIn, setSavingOptIn] = useState(false);
  useDocumentTitle(data?.customer ? `${data.customer.fullName} · Admin` : 'Customer · Admin');

  if (loading) return <LoadingState className="min-h-[50vh]" />;
  if (error) return <ErrorState onRetry={reload} />;
  const c = data?.customer;
  if (!c)
    return (
      <EmptyState
        title="Customer not found"
        text="This customer may have been removed from the demo data."
        action={
          <Link to="/admin/customers" className="font-medium text-primary underline">
            Back to customers
          </Link>
        }
      />
    );

  const orders = data.orders;
  const live = orders.filter((o) => o.status !== 'cancelled');
  const spent = round2(live.reduce((s, o) => s + o.total, 0));
  const aov = live.length ? round2(spent / live.length) : 0;

  const toggleOptIn = async (v: boolean) => {
    setSavingOptIn(true);
    try {
      const updated = await customerService.update(c.id, { marketingOptIn: v });
      setData((prev) => ({ customer: updated, orders: prev?.orders ?? [] }));
      toast.success(v ? 'Marketing opt-in recorded.' : 'Marketing opt-out recorded.');
    } catch {
      toast.error('Could not update marketing preference.');
    } finally {
      setSavingOptIn(false);
    }
  };

  const columns: Column<Order>[] = [
    {
      key: 'n',
      header: 'Order',
      cell: (o) => (
        <Link to={`/admin/orders/${o.id}`} onClick={(e) => e.stopPropagation()} className="font-semibold text-primary hover:underline">
          {o.orderNumber}
        </Link>
      ),
    },
    { key: 'date', header: 'Date', hideBelow: 'sm', cell: (o) => <span className="whitespace-nowrap text-muted">{formatDate(o.createdAt)}</span> },
    { key: 'items', header: 'Items', hideBelow: 'md', align: 'right', cell: (o) => o.items.reduce((n, i) => n + i.quantity, 0) },
    { key: 'status', header: 'Status', cell: (o) => <StatusBadge status={o.status} /> },
    { key: 'total', header: 'Total', align: 'right', cell: (o) => <span className="font-medium tabular-nums">{usd(o.total)}</span> },
  ];

  return (
    <>
      <PageTitle
        back={{ to: '/admin/customers', label: 'Customers' }}
        title={
          <span className="flex items-center gap-3">
            <Avatar name={c.fullName} className="h-11 w-11 text-sm" />
            {c.fullName}
          </span>
        }
        demo
        description={`Customer since ${formatDate(c.createdAt)}`}
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Orders" value={orders.length} />
        <StatCard label="Total spent" value={usd(spent)} hint="Excl. cancelled · USD" />
        <StatCard label="Average order" value={usd(aov)} />
        <StatCard label="Last order" value={orders[0] ? formatDate(orders[0].createdAt) : '—'} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-5">
          <AdminCard title="Profile">
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                <a href={`mailto:${c.email}`} className="truncate hover:text-primary">
                  {c.email}
                </a>
              </li>
              {c.phone && (
                <li className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                  {c.phone}
                </li>
              )}
            </ul>
            <dl className="mt-4 border-t border-line/60 pt-2">
              <KeyValue label="Country">{countryName(c.country)}</KeyValue>
              <KeyValue label="Customer ID">
                <span className="font-mono text-xs">{c.id}</span>
              </KeyValue>
            </dl>
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-cream/70 px-3 py-3">
              <div>
                <p className="text-sm font-medium">Marketing opt-in</p>
                <p className="text-xs text-muted">Consent to receive marketing emails</p>
              </div>
              <Toggle checked={c.marketingOptIn} onChange={toggleOptIn} label="Marketing opt-in" disabled={savingOptIn} />
            </div>
          </AdminCard>

          <AdminCard title="Addresses" description={`${c.addresses.length} saved`}>
            {c.addresses.length === 0 ? (
              <p className="text-sm text-muted">No saved addresses.</p>
            ) : (
              <ul className="space-y-3">
                {c.addresses.map((a) => (
                  <li key={a.id} className="rounded-xl border border-line/70 p-3 text-sm">
                    <div className="mb-1.5 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted" aria-hidden />
                      <span className="font-medium">{a.label}</span>
                      {a.isDefault && <Badge tone="info">Default</Badge>}
                    </div>
                    <address className="pl-6 leading-relaxed text-muted not-italic">
                      {a.fullName}
                      <br />
                      {a.line1}
                      {a.line2 ? `, ${a.line2}` : ''}
                      <br />
                      {a.city}, {a.state} {a.postalCode}
                      <br />
                      {countryName(a.country)}
                    </address>
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>
        </div>

        <AdminCard title="Order history" padded={false} className="self-start">
          <DataTable
            columns={columns}
            rows={orders}
            rowKey={(o) => o.id}
            onRowClick={(o) => navigate(`/admin/orders/${o.id}`)}
            empty="This customer hasn’t placed any orders yet."
            caption="Order history"
          />
        </AdminCard>
      </div>
    </>
  );
}
