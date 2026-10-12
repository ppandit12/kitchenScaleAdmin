import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Ban, CreditCard, Mail, MapPin, Phone, Truck, User, WandSparkles } from 'lucide-react';
import {
  Button,
  ConfirmDialog,
  DemoBadge,
  DemoNotice,
  EmptyState,
  ErrorState,
  LoadingState,
  ProductArt,
  Select,
  Textarea,
} from '@/components/common';
import { AdminCard, KeyValue, ORDER_STATUS_LABEL, PageTitle, StatusBadge, useUsd } from '@/components/admin';
import { countryName } from '@/data/shipping';
import { useAsync, useDocumentTitle } from '@/hooks';
import { orderService } from '@/services';
import { toast, useSettingsStore } from '@/store';
import type { Order, OrderStatus, PaymentMethodId } from '@/types';
import { ORDER_STATUS_FLOW } from '@/types';
import { cn, formatDateTime } from '@/utils';
import { formatMoney } from '@/utils/currency';

const PAYMENT_LABEL: Record<PaymentMethodId, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  upi: 'UPI',
  netbanking: 'Net banking',
};

const ALL_STATUSES: OrderStatus[] = [...ORDER_STATUS_FLOW, 'cancelled'];

export default function AdminOrderDetailsPage() {
  const { id = '' } = useParams();
  const { data, loading, error, reload, setData } = useAsync(() => orderService.get(id), [id]);
  useDocumentTitle(data ? `${data.orderNumber} · Admin` : 'Order · Admin');

  if (loading) return <LoadingState className="min-h-[50vh]" />;
  if (error) return <ErrorState onRetry={reload} />;
  if (!data)
    return (
      <EmptyState
        title="Order not found"
        text="It may have been removed when demo data was reset."
        action={
          <Link to="/admin/orders" className="font-medium text-primary underline">
            Back to orders
          </Link>
        }
      />
    );
  return <OrderDetails order={data} onChange={(o) => setData(o)} />;
}

function OrderDetails({ order, onChange }: { order: Order; onChange: (o: Order) => void }) {
  const usd = useUsd();
  const rates = useSettingsStore((s) => s.settings.exchangeRates);
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [note, setNote] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [tracking, setTracking] = useState(order.trackingNumber ?? '');
  const [savingTracking, setSavingTracking] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    setStatus(order.status);
    setTracking(order.trackingNumber ?? '');
  }, [order.status, order.trackingNumber]);

  const updateStatus = async () => {
    if (status === order.status && !note.trim()) {
      toast.info('Choose a different status or add a note.');
      return;
    }
    setSavingStatus(true);
    try {
      const updated = await orderService.updateStatus(order.id, status, note.trim() || undefined);
      onChange(updated);
      setNote('');
      toast.success(`Status updated to “${ORDER_STATUS_LABEL[status]}”.`);
    } catch {
      toast.error('Could not update the status.');
    } finally {
      setSavingStatus(false);
    }
  };

  const saveTracking = async () => {
    setSavingTracking(true);
    try {
      const updated = await orderService.setTrackingNumber(order.id, tracking.trim());
      onChange(updated);
      toast.success(tracking.trim() ? 'Demo tracking number saved.' : 'Tracking number cleared.');
    } catch {
      toast.error('Could not save the tracking number.');
    } finally {
      setSavingTracking(false);
    }
  };

  const cancelOrder = async () => {
    setCancelling(true);
    try {
      const updated = await orderService.updateStatus(order.id, 'cancelled', 'Cancelled by admin (demo).');
      onChange(updated);
      toast.success(`${order.orderNumber} cancelled.`);
      setConfirmCancel(false);
    } catch {
      toast.error('Could not cancel the order.');
    } finally {
      setCancelling(false);
    }
  };

  const itemCount = order.items.reduce((n, i) => n + i.quantity, 0);
  const snapshotRate = order.exchangeRate !== 1 || order.displayCurrency === 'USD';
  const rate = snapshotRate ? order.exchangeRate : rates[order.displayCurrency] ?? 1;
  const timeline = [...order.timeline].sort((a, b) => b.date.localeCompare(a.date));
  const a = order.shippingAddress;

  return (
    <>
      <PageTitle
        back={{ to: '/admin/orders', label: 'Orders' }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {order.orderNumber}
            <StatusBadge status={order.status} />
          </span>
        }
        demo
        description={`Placed ${formatDateTime(order.createdAt)} · ${itemCount} item${itemCount === 1 ? '' : 's'}`}
        actions={
          order.status !== 'cancelled' && order.status !== 'delivered' ? (
            <Button variant="ghost" size="sm" className="text-danger" leftIcon={<Ban className="h-4 w-4" />} onClick={() => setConfirmCancel(true)}>
              Cancel order
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-5">
          {/* Items */}
          <AdminCard title="Items" padded={false}>
            <ul className="divide-y divide-line/60">
              {order.items.map((i) => (
                <li key={i.variantId} className="flex items-center gap-4 px-5 py-4">
                  <span className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-line/60">
                    <ProductArt view={i.units > 1 ? 'pack' : 'front'} color={i.colorHex} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{i.name}</p>
                    <p className="truncate text-sm text-muted">
                      {i.variantTitle} · <span className="font-mono text-xs">{i.sku}</span>
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-muted tabular-nums">
                      {i.quantity} × {usd(i.price)}
                    </p>
                    <p className="font-semibold tabular-nums">{usd(i.price * i.quantity)}</p>
                  </div>
                </li>
              ))}
            </ul>
            <dl className="border-t border-line/70 bg-cream/40 px-5 py-3">
              <KeyValue label="Subtotal">{usd(order.subtotal)}</KeyValue>
              {order.discount > 0 && (
                <KeyValue label={`Discount${order.couponCode ? ` (${order.couponCode})` : ''}`}>−{usd(order.discount)}</KeyValue>
              )}
              <KeyValue label={`Shipping · ${order.shippingMethod.name}`}>{usd(order.shipping)}</KeyValue>
              <div className="mt-1 flex items-center justify-between border-t border-line/70 pt-3">
                <dt className="font-semibold">Total (USD)</dt>
                <dd className="text-lg font-semibold tabular-nums">{usd(order.total)}</dd>
              </div>
            </dl>
            <p className="border-t border-line/70 px-5 py-3 text-xs text-muted">
              Shopper’s display currency: <strong>{order.displayCurrency}</strong>
              {order.displayCurrency !== 'USD' && (
                <>
                  {' '}
                  ≈ {formatMoney(order.total * rate, order.displayCurrency)} using {snapshotRate ? 'the demo rate snapshot' : 'the current demo rate'} (
                  {rate}). Exchange rates are demonstration values; the order is recorded in USD.
                </>
              )}
            </p>
          </AdminCard>

          {/* Timeline */}
          <AdminCard title="Timeline" description="Demo fulfilment history (newest first)">
            <ol className="relative space-y-5 pl-6 before:absolute before:top-1.5 before:bottom-1.5 before:left-[7px] before:w-px before:bg-line">
              {timeline.map((t, idx) => (
                <li key={`${t.status}-${t.date}-${idx}`} className="relative">
                  <span
                    className={cn(
                      'absolute top-1 -left-6 h-[15px] w-[15px] rounded-full border-2 border-surface ring-1',
                      idx === 0 ? (t.status === 'cancelled' ? 'bg-danger ring-danger/40' : 'bg-primary ring-primary/30') : 'bg-secondary ring-line',
                    )}
                    aria-hidden
                  />
                  <p className="text-sm font-semibold">{ORDER_STATUS_LABEL[t.status]}</p>
                  <p className="text-xs text-muted">{formatDateTime(t.date)}</p>
                  {t.note && <p className="mt-1 text-sm text-muted">{t.note}</p>}
                </li>
              ))}
            </ol>
          </AdminCard>
        </div>

        <aside className="space-y-5">
          {/* Status */}
          <AdminCard title="Update status">
            <div className="space-y-3">
              <Select
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                className="py-2.5 text-sm"
                options={ALL_STATUSES.map((s) => ({ value: s, label: ORDER_STATUS_LABEL[s] }))}
              />
              <Textarea
                label="Note (optional)"
                rows={2}
                value={note}
                maxLength={300}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Packed and handed to carrier"
                className="text-sm"
              />
              <Button fullWidth size="sm" loading={savingStatus} onClick={updateStatus}>
                Update status
              </Button>
              <p className="text-xs text-muted">Moving forward fills in skipped steps so the customer timeline stays continuous.</p>
            </div>
          </AdminCard>

          {/* Tracking */}
          <AdminCard
            title={
              <span className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted" aria-hidden /> Tracking <DemoBadge />
              </span>
            }
          >
            <label htmlFor="tracking" className="field-label">
              Demo tracking number
            </label>
            <div className="flex gap-2">
              <input
                id="tracking"
                value={tracking}
                maxLength={60}
                onChange={(e) => setTracking(e.target.value)}
                placeholder="DEMO-TRK-…"
                className="field-input py-2.5 font-mono text-sm"
              />
              <Button size="sm" className="h-auto" loading={savingTracking} onClick={saveTracking} disabled={tracking.trim() === (order.trackingNumber ?? '')}>
                Save
              </Button>
            </div>
            <button
              type="button"
              onClick={() => setTracking(`DEMO-TRK-${order.orderNumber.replace(/\D/g, '')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`)}
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <WandSparkles className="h-3.5 w-3.5" /> Generate demo number
            </button>
            <p className="mt-2 text-xs text-muted">Not linked to a real carrier. Customers see it on the track-order page.</p>
          </AdminCard>

          {/* Customer */}
          <AdminCard title="Customer">
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-2.5">
                <User className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                {order.customerId ? (
                  <Link to={`/admin/customers/${order.customerId}`} className="font-medium text-primary hover:underline">
                    {order.customer.fullName}
                  </Link>
                ) : (
                  <span className="font-medium">{order.customer.fullName} <span className="text-xs text-muted">(guest)</span></span>
                )}
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                <a href={`mailto:${order.customer.email}`} className="truncate hover:text-primary">
                  {order.customer.email}
                </a>
              </li>
              {order.customer.phone && (
                <li className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                  {order.customer.phone}
                </li>
              )}
            </ul>
          </AdminCard>

          <AdminCard title="Shipping address">
            <div className="flex gap-2.5 text-sm">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden />
              <address className="not-italic leading-relaxed">
                {a.fullName}
                <br />
                {a.line1}
                {a.line2 && (
                  <>
                    <br />
                    {a.line2}
                  </>
                )}
                <br />
                {a.city}, {a.state} {a.postalCode}
                <br />
                {countryName(a.country)}
                {a.phone && (
                  <>
                    <br />
                    {a.phone}
                  </>
                )}
              </address>
            </div>
            <p className="mt-3 border-t border-line/60 pt-3 text-xs text-muted">
              {order.shippingMethod.name} · est. {order.shippingMethod.etaDays[0]}–{order.shippingMethod.etaDays[1]} business days (demo estimate)
            </p>
          </AdminCard>

          <AdminCard title="Payment">
            <div className="flex items-center gap-2.5 text-sm">
              <CreditCard className="h-4 w-4 text-muted" aria-hidden />
              <span className="font-medium">{PAYMENT_LABEL[order.paymentMethod]}</span>
            </div>
            <DemoNotice className="mt-3">Demo — no payment collected. No card or bank details are stored.</DemoNotice>
          </AdminCard>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={cancelOrder}
        loading={cancelling}
        title={`Cancel ${order.orderNumber}?`}
        confirmLabel="Cancel order"
        message="The order will be marked as cancelled and excluded from revenue. Stock is not restored automatically in this demo."
      />
    </>
  );
}
