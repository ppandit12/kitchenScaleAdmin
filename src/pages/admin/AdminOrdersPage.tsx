import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';
import { Button, DemoNotice, ErrorState } from '@/components/common';
import {
  AdminCard,
  DataTable,
  FilterBar,
  FilterSelect,
  ORDER_STATUS_LABEL,
  PageTitle,
  Pagination,
  SearchInput,
  StatusBadge,
  useUsd,
  type Column,
} from '@/components/admin';
import { countryName } from '@/data/shipping';
import { useAsync, useDocumentTitle } from '@/hooks';
import { orderService } from '@/services';
import { toast } from '@/store';
import type { Order, OrderStatus } from '@/types';
import { downloadFile, formatDate, formatDateTime, toCsv } from '@/utils';

const PAGE_SIZE = 10;
type StatusFilter = 'all' | OrderStatus;

export default function AdminOrdersPage() {
  useDocumentTitle('Orders · Admin');
  const usd = useUsd();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useAsync(() => orderService.list(), []);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [q, status, sort]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data ?? [])
      .filter((o) => status === 'all' || o.status === status)
      .filter(
        (o) =>
          !term ||
          o.orderNumber.toLowerCase().includes(term) ||
          o.customer.fullName.toLowerCase().includes(term) ||
          o.customer.email.toLowerCase().includes(term),
      )
      .sort((a, b) => (sort === 'newest' ? b.createdAt.localeCompare(a.createdAt) : a.createdAt.localeCompare(b.createdAt)));
  }, [data, q, status, sort]);

  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exportCsv = () => {
    if (!filtered.length) {
      toast.info('No orders to export.');
      return;
    }
    const csv = toCsv(
      filtered.map((o) => ({
        order_number: o.orderNumber,
        created_at: o.createdAt,
        status: o.status,
        customer_name: o.customer.fullName,
        customer_email: o.customer.email,
        country: o.customer.country,
        items: o.items.reduce((n, i) => n + i.quantity, 0),
        subtotal_usd: o.subtotal.toFixed(2),
        discount_usd: o.discount.toFixed(2),
        shipping_usd: o.shipping.toFixed(2),
        total_usd: o.total.toFixed(2),
        coupon: o.couponCode ?? '',
        payment_method: o.paymentMethod,
        tracking_number: o.trackingNumber ?? '',
        demo: 'yes',
      })),
    );
    downloadFile(`kitchenscaleco-demo-orders-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    toast.success(`Exported ${filtered.length} demo orders.`);
  };

  const columns: Column<Order>[] = [
    {
      key: 'number',
      header: 'Order',
      cell: (o) => (
        <Link to={`/admin/orders/${o.id}`} onClick={(e) => e.stopPropagation()} className="font-semibold whitespace-nowrap text-primary hover:underline">
          {o.orderNumber}
        </Link>
      ),
    },
    { key: 'date', header: 'Date', hideBelow: 'md', cell: (o) => <span className="whitespace-nowrap text-muted" title={formatDateTime(o.createdAt)}>{formatDate(o.createdAt)}</span> },
    {
      key: 'customer',
      header: 'Customer',
      cell: (o) => (
        <div className="min-w-0">
          <p className="max-w-[200px] truncate font-medium">{o.customer.fullName}</p>
          <p className="hidden max-w-[200px] truncate text-xs text-muted sm:block">{o.customer.email}</p>
        </div>
      ),
    },
    { key: 'country', header: 'Country', hideBelow: 'xl', cell: (o) => <span className="whitespace-nowrap text-muted">{countryName(o.customer.country)}</span> },
    { key: 'items', header: 'Items', hideBelow: 'lg', align: 'right', cell: (o) => <span className="tabular-nums">{o.items.reduce((n, i) => n + i.quantity, 0)}</span> },
    { key: 'status', header: 'Status', hideBelow: 'sm', cell: (o) => <StatusBadge status={o.status} /> },
    { key: 'total', header: 'Total', align: 'right', cell: (o) => <span className="font-medium whitespace-nowrap tabular-nums">{usd(o.total)}</span> },
  ];

  return (
    <>
      <PageTitle
        title="Orders"
        description="Demo orders placed through the storefront checkout or seeded as samples."
        demo
        actions={
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={loading} leftIcon={<Download className="h-4 w-4" />}>
            Export CSV
          </Button>
        }
      />
      <DemoNotice className="mb-5">No payments are collected yet. Amounts are in USD (the base currency).</DemoNotice>
      {error ? (
        <AdminCard>
          <ErrorState onRetry={reload} />
        </AdminCard>
      ) : (
        <AdminCard padded={false}>
          <FilterBar>
            <SearchInput value={q} onChange={setQ} placeholder="Order number, name or email…" label="Search orders" />
            <FilterSelect<StatusFilter>
              label="Status"
              value={status}
              onChange={setStatus}
              options={[
                { value: 'all', label: 'All statuses' },
                ...(Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]).map((s) => ({ value: s, label: ORDER_STATUS_LABEL[s] })),
              ]}
            />
            <FilterSelect
              label="Sort"
              value={sort}
              onChange={setSort}
              options={[
                { value: 'newest', label: 'Newest first' },
                { value: 'oldest', label: 'Oldest first' },
              ]}
            />
          </FilterBar>
          <DataTable
            columns={columns}
            rows={pageRows}
            loading={loading}
            rowKey={(o) => o.id}
            onRowClick={(o) => navigate(`/admin/orders/${o.id}`)}
            caption="Orders"
            empty={q || status !== 'all' ? 'No orders match your filters.' : 'No orders yet. Place one through the storefront checkout.'}
          />
          {!loading && <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onChange={setPage} />}
        </AdminCard>
      )}
    </>
  );
}
