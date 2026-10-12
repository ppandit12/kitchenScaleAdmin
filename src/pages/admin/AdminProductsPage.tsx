import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Badge, Button, ButtonLink, ConfirmDialog, ErrorState, ProductImageView } from '@/components/common';
import { AdminCard, DataTable, FilterBar, FilterSelect, IconAction, PageTitle, SearchInput, useUsd, type Column } from '@/components/admin';
import { useAsync, useDocumentTitle } from '@/hooks';
import { productService } from '@/services';
import { toast, useSettingsStore } from '@/store';
import type { Product } from '@/types';
import { formatDate, stockState, totalStock } from '@/utils';

type StatusFilter = 'all' | 'active' | 'draft';

export default function AdminProductsPage() {
  useDocumentTitle('Products · Admin');
  const usd = useUsd();
  const navigate = useNavigate();
  const threshold = useSettingsStore((s) => s.settings.lowStockThreshold);
  const { data, loading, error, reload, setData } = useAsync(() => productService.list({ includeDrafts: true }), []);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [publishing, setPublishing] = useState<string | null>(null);
  const publish = async (product: Product) => {
    setPublishing(product.id);
    try {
      const updated = await productService.setStatus(product.id, 'active');
      setData(prev => (prev ?? []).map(p => p.id === updated.id ? updated : p));
      toast.success(`${product.name} is now visible in the shop.${totalStock(product) === 0 ? ' It is currently sold out.' : ''}`);
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not publish this product.'); }
    finally { setPublishing(null); }
  };

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data ?? [])
      .filter((p) => status === 'all' || p.status === status)
      .filter(
        (p) =>
          !term ||
          p.name.toLowerCase().includes(term) ||
          p.slug.includes(term) ||
          p.variants.some((v) => v.sku.toLowerCase().includes(term)),
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [data, q, status]);

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await productService.remove(toDelete.id);
      setData((prev) => (prev ?? []).filter((p) => p.id !== toDelete.id));
      toast.success(`“${toDelete.name}” deleted.`);
      setToDelete(null);
    } catch {
      toast.error('Could not delete the product.');
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<Product>[] = [
    {
      key: 'product',
      header: 'Product',
      cell: (p) => (
        <div className="flex items-center gap-3">
          <span className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-line/60">
            <ProductImageView image={p.images[0] ?? { id: 'empty', view: 'front', alt: p.name }} color={p.variants[0]?.colorHex ?? '#2b2f2c'} />
          </span>
          <span className="min-w-0">
            <Link
              to={`/admin/products/${p.id}`}
              onClick={(e) => e.stopPropagation()}
              className="block max-w-[220px] truncate font-semibold text-ink hover:text-primary"
            >
              {p.name}
            </Link>
            <span className="block max-w-[220px] truncate text-xs text-muted">{p.category}</span>
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (p) => <div><Badge tone={p.status === 'active' ? 'success' : 'neutral'}>{p.status === 'active' ? 'Published' : 'Draft'}</Badge>{p.status === 'draft' && <p className="mt-1 text-xs text-muted">Hidden from shop</p>}</div>,
    },
    { key: 'variants', header: 'Variants', hideBelow: 'md', align: 'right', cell: (p) => <span className="tabular-nums">{p.variants.length}</span> },
    {
      key: 'stock',
      header: 'Stock',
      hideBelow: 'sm',
      cell: (p) => {
        const total = totalStock(p);
        const lowest = Math.min(...p.variants.map((v) => v.stock));
        const state = p.variants.length === 0 ? 'out_of_stock' : stockState(lowest, threshold);
        return (
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="tabular-nums">{total}</span>
            {state !== 'in_stock' && (
              <Badge tone={state === 'low_stock' ? 'warning' : 'danger'}>{state === 'low_stock' ? 'Low variant' : 'Variant out'}</Badge>
            )}
          </div>
        );
      },
    },
    {
      key: 'price',
      header: 'Price',
      hideBelow: 'lg',
      cell: (p) => {
        if (!p.variants.length) return <span className="text-muted">—</span>;
        const prices = p.variants.map((v) => v.price);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        return <span className="whitespace-nowrap tabular-nums">{min === max ? usd(min) : `${usd(min)} – ${usd(max)}`}</span>;
      },
    },
    { key: 'updated', header: 'Updated', hideBelow: 'lg', cell: (p) => <span className="whitespace-nowrap text-muted">{formatDate(p.updatedAt)}</span> },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      stopClick: true,
      cell: (p) => (
        <div className="flex justify-end gap-1">
          {p.status === 'draft' && <Button size="sm" disabled={publishing !== null} loading={publishing === p.id} onClick={() => void publish(p)} aria-label={`Publish ${p.name}`}>Publish</Button>}
          <IconAction label={`Edit ${p.name}`} onClick={() => navigate(`/admin/products/${p.id}`)}>
            <Pencil className="h-4 w-4" />
          </IconAction>
          <IconAction label={`Delete ${p.name}`} tone="danger" onClick={() => setToDelete(p)}>
            <Trash2 className="h-4 w-4" />
          </IconAction>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageTitle
        title="Products"
        description="Manage products, photos, prices, stock, and shop visibility."
        actions={
          <ButtonLink to="/admin/products/new" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
            Add product
          </ButtonLink>
        }
      />
      <p className="mb-5 rounded-xl border border-line bg-surface p-4 text-sm text-muted">Draft products are hidden from the shop. Click Publish to make them visible. Products with zero stock appear as sold out.</p>
      {error ? (
        <AdminCard>
          <ErrorState onRetry={reload} />
        </AdminCard>
      ) : (
        <AdminCard padded={false}>
          <FilterBar>
            <SearchInput value={q} onChange={setQ} placeholder="Search name, slug or SKU…" label="Search products" />
            <FilterSelect
              label="Status"
              value={status}
              onChange={setStatus}
              options={[
                { value: 'all', label: 'All' },
                { value: 'active', label: 'Active' },
                { value: 'draft', label: 'Draft' },
              ]}
            />
            <p className="text-sm text-muted sm:ml-auto">{loading ? '…' : `${rows.length} product${rows.length === 1 ? '' : 's'}`}</p>
          </FilterBar>
          <DataTable
            columns={columns}
            rows={rows}
            loading={loading}
            rowKey={(p) => p.id}
            onRowClick={(p) => navigate(`/admin/products/${p.id}`)}
            caption="Products"
            empty={
              q || status !== 'all' ? (
                'No products match your filters.'
              ) : (
                <span>
                  No products yet.{' '}
                  <Link to="/admin/products/new" className="font-medium text-primary underline">
                    Add the first one
                  </Link>
                </span>
              )
            }
          />
        </AdminCard>
      )}

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete product?"
        message={
          <>
            <strong className="text-ink">{toDelete?.name}</strong> and all of its variants will be permanently removed from the
            catalogue. Existing orders keep their line items.
          </>
        }
      />
    </>
  );
}
