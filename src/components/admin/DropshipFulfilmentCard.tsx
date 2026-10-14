import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, PackageCheck, RefreshCw, Send } from 'lucide-react';
import { Badge, Button, ConfirmDialog, type BadgeTone } from '@/components/common';
import { useAsync } from '@/hooks';
import { ApiError, dropshipService } from '@/services';
import { toast } from '@/store';
import type { DropshipStatus, Order } from '@/types';
import { formatDateTime } from '@/utils';
import { AdminCard, useUsd } from './ui';

const STATUS: Record<DropshipStatus, { label: string; tone: BadgeTone }> = {
  placed: { label: 'Sent', tone: 'info' },
  awaiting_payment: { label: 'Awaiting payment', tone: 'warning' },
  processing: { label: 'Supplier processing', tone: 'info' },
  shipped: { label: 'Shipped', tone: 'primary' },
  completed: { label: 'Completed', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
  failed: { label: 'Failed', tone: 'danger' },
};

/** AliExpress fulfilment for an order. Renders nothing when no item is linked to a supplier product. */
export function DropshipFulfilmentCard({ order, onChange }: { order: Order; onChange: (o: Order) => void }) {
  const usd = useUsd();
  const { data } = useAsync(() => dropshipService.orderFulfilment(order.id).catch(() => undefined), [order.id]);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const linked = data?.items.filter((i) => i.linked) ?? [];
  if (!linked.length) return null;

  const ds = order.dropship;
  const sent = Boolean(ds?.supplierOrderIds?.length);
  const cost = linked.reduce((n, i) => n + (i.cost ?? 0) * i.quantity, 0);
  const revenue = linked.reduce((n, i) => n + i.price * i.quantity, 0);

  const run = async (action: () => Promise<Order>, success: string, fallback: string) => {
    setBusy(true);
    try {
      onChange(await action());
      toast.success(success);
      setConfirm(false);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : fallback);
      // A failed placement is recorded on the order; reload it so the error shows.
      if (!sent) void dropshipService.orderFulfilment(order.id).then((f) => f.dropship && onChange({ ...order, dropship: f.dropship }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminCard
      title={
        <span className="flex items-center gap-2">
          <PackageCheck className="h-4 w-4 text-muted" aria-hidden /> AliExpress fulfilment
          {ds?.status && <Badge tone={STATUS[ds.status].tone}>{STATUS[ds.status].label}</Badge>}
        </span>
      }
    >
      <ul className="space-y-1.5 text-sm">
        {linked.map((i) => (
          <li key={i.variantId} className="flex justify-between gap-3">
            <a href={i.supplierUrl} target="_blank" rel="noreferrer" className="truncate hover:text-primary hover:underline">
              {i.quantity} × {i.name} <span className="text-muted">({i.variantTitle})</span>
            </a>
            <span className="shrink-0 text-muted tabular-nums">{usd((i.cost ?? 0) * i.quantity)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted">
        Supplier cost {usd(cost)} · your price {usd(revenue)} · margin before shipping {usd(revenue - cost)}
        {linked.length < (data?.items.length ?? 0) && <> · other items ship from your own stock</>}
      </p>

      {ds?.error && <p className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{ds.error}</p>}

      {sent ? (
        <div className="mt-3 space-y-2 border-t border-line/60 pt-3 text-sm">
          {ds!.supplierOrderIds!.map((id) => (
            <a
              key={id}
              href={`https://www.aliexpress.com/p/order/detail.html?orderId=${encodeURIComponent(id)}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 font-mono text-xs text-primary hover:underline"
            >
              AliExpress order {id} <ExternalLink className="h-3 w-3" />
            </a>
          ))}
          {ds!.trackingNumbers?.length ? (
            <p className="text-xs">
              Tracking: <span className="font-mono">{ds!.trackingNumbers.join(', ')}</span>
            </p>
          ) : null}
          {ds!.status === 'awaiting_payment' && (
            <p className="text-xs text-muted">Pay for this order in your AliExpress account (Orders → Awaiting payment) so the supplier ships it.</p>
          )}
          {ds!.lastSyncedAt && <p className="text-xs text-muted">Checked {formatDateTime(ds!.lastSyncedAt)} · refreshes every 30 minutes</p>}
          <Button
            size="sm"
            variant="outline"
            fullWidth
            loading={busy}
            leftIcon={<RefreshCw className="h-4 w-4" />}
            onClick={() => run(() => dropshipService.syncOrder(order.id), 'Supplier status updated.', 'Could not reach AliExpress.')}
          >
            Refresh status &amp; tracking
          </Button>
        </div>
      ) : (
        <div className="mt-3 space-y-2 border-t border-line/60 pt-3">
          <Button size="sm" fullWidth loading={busy} disabled={order.status === 'cancelled'} leftIcon={<Send className="h-4 w-4" />} onClick={() => setConfirm(true)}>
            Send to AliExpress
          </Button>
          <p className="text-xs text-muted">
            Creates the order on AliExpress with this shipping address. Settings live in{' '}
            <Link to="/admin/dropshipping" className="underline">
              Dropshipping
            </Link>
            .
          </p>
        </div>
      )}

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => run(() => dropshipService.placeOrder(order.id), 'Order created on AliExpress.', 'Could not place the AliExpress order.')}
        loading={busy}
        title={`Send ${order.orderNumber} to AliExpress?`}
        confirmLabel="Send order"
        message={
          <>
            {order.paymentStatus !== 'paid' && (
              <strong className="mb-2 block text-danger">This order is not marked as paid. Only send it once the customer has paid.</strong>
            )}
            An AliExpress order for {linked.length} item{linked.length === 1 ? '' : 's'} (≈ {usd(cost)} + supplier shipping) will be created for{' '}
            {order.shippingAddress.fullName}. You then pay for it in your AliExpress account.
          </>
        }
      />
    </AdminCard>
  );
}
