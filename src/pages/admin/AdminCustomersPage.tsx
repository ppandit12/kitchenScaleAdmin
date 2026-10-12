import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';
import { Badge, Button, ErrorState } from '@/components/common';
import { AdminCard, Avatar, DataTable, FilterBar, FilterSelect, PageTitle, SearchInput, useUsd, type Column } from '@/components/admin';
import { countryName } from '@/data/shipping';
import { useAsync, useDocumentTitle } from '@/hooks';
import { customerService, orderService } from '@/services';
import { toast } from '@/store';
import type { Customer, Order } from '@/types';
import { downloadFile, formatDate, round2, toCsv } from '@/utils';

interface Row extends Customer {
  orders: number;
  spent: number;
}

export function ordersForCustomer(orders: Order[], c: Pick<Customer, 'id' | 'email'>) {
  return orders.filter((o) => o.customerId === c.id || o.customer.email.toLowerCase() === c.email.toLowerCase());
}

export default function AdminCustomersPage() {
  useDocumentTitle('Customers · Admin');
  const usd = useUsd();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useAsync(
    () => Promise.all([customerService.list(), orderService.list()]).then(([customers, orders]) => ({ customers, orders })),
    [],
  );
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<'newest' | 'spent' | 'name'>('newest');

  const rows = useMemo<Row[]>(() => {
    if (!data) return [];
    const term = q.trim().toLowerCase();
    return data.customers
      .map((c) => {
        const os = ordersForCustomer(data.orders, c);
        return {
          ...c,
          orders: os.length,
          spent: round2(os.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0)),
        };
      })
      .filter((c) => !term || c.fullName.toLowerCase().includes(term) || c.email.toLowerCase().includes(term))
      .sort((a, b) =>
        sort === 'spent' ? b.spent - a.spent : sort === 'name' ? a.fullName.localeCompare(b.fullName) : b.createdAt.localeCompare(a.createdAt),
      );
  }, [data, q, sort]);

  const exportCsv = () => {
    if (!rows.length) return toast.info('No customers to export.');
    downloadFile(
      `kitchenscaleco-demo-customers-${new Date().toISOString().slice(0, 10)}.csv`,
      toCsv(
        rows.map((r) => ({
          name: r.fullName,
          email: r.email,
          country: r.country,
          orders: r.orders,
          total_spent_usd: r.spent.toFixed(2),
          marketing_opt_in: r.marketingOptIn ? 'yes' : 'no',
          joined: r.createdAt,
        })),
      ),
    );
    toast.success(`Exported ${rows.length} demo customers.`);
  };

  const columns: Column<Row>[] = [
    {
      key: 'name',
      header: 'Customer',
      cell: (c) => (
        <div className="flex items-center gap-3">
          <Avatar name={c.fullName} />
          <div className="min-w-0">
            <Link to={`/admin/customers/${c.id}`} onClick={(e) => e.stopPropagation()} className="block max-w-[200px] truncate font-medium hover:text-primary">
              {c.fullName}
            </Link>
            <span className="block max-w-[200px] truncate text-xs text-muted md:hidden">{c.email}</span>
          </div>
        </div>
      ),
    },
    { key: 'email', header: 'Email', hideBelow: 'md', cell: (c) => <span className="text-muted">{c.email}</span> },
    { key: 'country', header: 'Country', hideBelow: 'lg', cell: (c) => <span className="whitespace-nowrap">{countryName(c.country)}</span> },
    { key: 'orders', header: 'Orders', align: 'right', cell: (c) => <span className="tabular-nums">{c.orders}</span> },
    { key: 'spent', header: 'Spent', align: 'right', hideBelow: 'sm', cell: (c) => <span className="font-medium whitespace-nowrap tabular-nums">{usd(c.spent)}</span> },
    {
      key: 'marketing',
      header: 'Marketing',
      hideBelow: 'xl',
      cell: (c) => <Badge tone={c.marketingOptIn ? 'success' : 'neutral'}>{c.marketingOptIn ? 'Opted in' : 'No'}</Badge>,
    },
    { key: 'joined', header: 'Joined', hideBelow: 'lg', cell: (c) => <span className="whitespace-nowrap text-muted">{formatDate(c.createdAt)}</span> },
  ];

  return (
    <>
      <PageTitle
        title="Customers"
        description="Accounts created through the storefront plus sample demo customers."
        demo
        actions={
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={loading} leftIcon={<Download className="h-4 w-4" />}>
            Export CSV
          </Button>
        }
      />
      {error ? (
        <AdminCard>
          <ErrorState onRetry={reload} />
        </AdminCard>
      ) : (
        <AdminCard padded={false}>
          <FilterBar>
            <SearchInput value={q} onChange={setQ} placeholder="Name or email…" label="Search customers" />
            <FilterSelect
              label="Sort"
              value={sort}
              onChange={setSort}
              options={[
                { value: 'newest', label: 'Newest' },
                { value: 'spent', label: 'Top spenders' },
                { value: 'name', label: 'Name A–Z' },
              ]}
            />
            <p className="text-sm text-muted sm:ml-auto">{loading ? '…' : `${rows.length} customer${rows.length === 1 ? '' : 's'}`}</p>
          </FilterBar>
          <DataTable
            columns={columns}
            rows={rows}
            loading={loading}
            rowKey={(c) => c.id}
            onRowClick={(c) => navigate(`/admin/customers/${c.id}`)}
            caption="Customers"
            empty={q ? 'No customers match your search.' : 'No customers yet.'}
          />
        </AdminCard>
      )}
    </>
  );
}
