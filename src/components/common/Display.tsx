import { useId, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, ChevronDown, Info, Inbox, LoaderCircle, Minus, Plus, Star } from 'lucide-react';
import { useMoney } from '@/hooks/useMoney';
import { useSettingsStore } from '@/store/settingsStore';
import { cn, stockState } from '@/utils';
import { Button } from './Button';

/* --------------------------------- Badge --------------------------------- */

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'accent' | 'info';

const badgeTones: Record<BadgeTone, string> = {
  neutral: 'bg-sand text-muted',
  primary: 'bg-primary text-cream',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/12 text-warning',
  danger: 'bg-danger/10 text-danger',
  accent: 'bg-accent-100 text-[#8a6a3e]',
  info: 'bg-secondary-100 text-primary',
};

export function Badge({ tone = 'neutral', children, className }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Small "Demo" pill used next to sample prices, reviews and figures. */
export function DemoBadge({ label, className }: { label?: string; className?: string }) {
  const { t } = useTranslation();
  return (
    <Badge tone="accent" className={cn('uppercase tracking-wider text-[10px]', className)}>
      {label ?? t('demo.badge')}
    </Badge>
  );
}

/* ------------------------------ DemoNotice ------------------------------- */

/** Inline notice explaining a demo limitation. */
export function DemoNotice({ children, className, tone = 'accent' }: { children: ReactNode; className?: string; tone?: 'accent' | 'info' }) {
  return (
    <div
      role="note"
      className={cn(
        'flex items-start gap-3 rounded-xl border px-4 py-3 text-sm',
        tone === 'accent' ? 'border-accent/40 bg-accent-100/60 text-[#6f5532]' : 'border-secondary bg-secondary-100/60 text-primary',
        className,
      )}
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}

/** "Prices in EUR are estimates…" — only renders when a non-base currency is selected. */
export function CurrencyNotice({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { currency, isBase } = useMoney();
  if (isBase) return null;
  return <p className={cn('text-xs text-muted', className)}>{t('demo.currencyEstimate', { currency })}</p>;
}

/* --------------------------------- Price --------------------------------- */

/** Formats a USD base amount in the shopper's currency. */
export function Price({ amount, compareAt, className, size = 'md' }: { amount: number; compareAt?: number; className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const { format } = useMoney();
  const sizes = { sm: 'text-sm', md: 'text-lg', lg: 'text-3xl' };
  return (
    <span className={cn('inline-flex items-baseline gap-2', className)}>
      <span className={cn('font-semibold tabular-nums text-ink', sizes[size])}>{format(amount)}</span>
      {compareAt && compareAt > amount && (
        <s className="text-sm tabular-nums text-muted">{format(compareAt)}</s>
      )}
    </span>
  );
}

/* ------------------------------ StockBadge ------------------------------- */

export function StockBadge({ stock, className }: { stock: number; className?: string }) {
  const { t } = useTranslation();
  const threshold = useSettingsStore((s) => s.settings.lowStockThreshold);
  const state = stockState(stock, threshold);
  const tone = state === 'in_stock' ? 'success' : state === 'low_stock' ? 'warning' : 'danger';
  return (
    <Badge tone={tone} className={className}>
      <span className={cn('h-1.5 w-1.5 rounded-full', state === 'in_stock' ? 'bg-success' : state === 'low_stock' ? 'bg-warning' : 'bg-danger')} />
      {t(`stock.${state}`, { count: stock })}
    </Badge>
  );
}

/* ------------------------------ StarRating ------------------------------- */

export function StarRating({ value, size = 16, className, label }: { value: number; size?: number; className?: string; label?: string }) {
  const { t } = useTranslation();
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} role="img" aria-label={label ?? t('reviews.outOf', { rating: value })}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)));
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star className="absolute inset-0 text-line" style={{ width: size, height: size }} fill="currentColor" strokeWidth={0} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className="text-primary" style={{ width: size, height: size }} fill="currentColor" strokeWidth={0} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

/** Interactive rating input (radio group semantics). */
export function StarRatingInput({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const [hover, setHover] = useState(0);
  const name = useId();
  return (
    <fieldset>
      <legend className="field-label">{label}</legend>
      <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <label key={i} className="cursor-pointer" onMouseEnter={() => setHover(i)}>
            <input type="radio" name={name} value={i} checked={value === i} onChange={() => onChange(i)} className="peer sr-only" />
            <span className="sr-only">{i} / 5</span>
            <Star
              className={cn('h-8 w-8 transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-primary', (hover || value) >= i ? 'text-primary' : 'text-line')}
              fill="currentColor"
              strokeWidth={0}
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/* --------------------------- QuantitySelector ---------------------------- */

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  size = 'md',
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const h = size === 'sm' ? 'h-9' : 'h-12';
  const w = size === 'sm' ? 'w-9' : 'w-11';
  return (
    <div className={cn('inline-flex items-center rounded-full border border-line bg-surface', h, disabled && 'opacity-50')}>
      <button
        type="button"
        aria-label={t('actions.decrease')}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        className={cn('flex h-full items-center justify-center rounded-l-full text-ink transition hover:bg-sand disabled:opacity-40', w)}
      >
        <Minus className="h-4 w-4" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        aria-label={t('actions.quantity')}
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (!Number.isNaN(n)) onChange(Math.max(min, Math.min(max, Math.floor(n))));
        }}
        className="h-full w-10 border-0 bg-transparent text-center text-[15px] font-medium tabular-nums [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        aria-label={t('actions.increase')}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        className={cn('flex h-full items-center justify-center rounded-r-full text-ink transition hover:bg-sand disabled:opacity-40', w)}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ------------------------------- Accordion ------------------------------- */

export interface AccordionItem {
  id: string;
  title: ReactNode;
  content: ReactNode;
}

export function Accordion({ items, defaultOpen, className }: { items: AccordionItem[]; defaultOpen?: string; className?: string }) {
  const [open, setOpen] = useState<string | null>(defaultOpen ?? null);
  const baseId = useId();
  return (
    <div className={cn('divide-y divide-line border-y border-line', className)}>
      {items.map((item) => {
        const isOpen = open === item.id;
        const btnId = `${baseId}-${item.id}-btn`;
        const panelId = `${baseId}-${item.id}-panel`;
        return (
          <div key={item.id}>
            <h3 className="font-sans">
              <button
                id={btnId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : item.id)}
                className="flex w-full items-center justify-between gap-6 py-5 text-left text-base font-medium text-ink transition hover:text-primary sm:text-lg"
              >
                <span>{item.title}</span>
                <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line transition-all duration-300', isOpen && 'rotate-180 border-primary bg-primary text-cream')}>
                  <ChevronDown className="h-4 w-4" />
                </span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={btnId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  className="overflow-hidden"
                >
                  <div className="max-w-3xl pb-6 pr-12 leading-relaxed text-muted">{item.content}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

/* --------------------------- Loading / empty / error --------------------- */

export function Spinner({ className }: { className?: string }) {
  return <LoaderCircle className={cn('h-6 w-6 animate-spin text-primary', className)} aria-hidden />;
}

export function LoadingState({ label, className }: { label?: string; className?: string }) {
  const { t } = useTranslation();
  return (
    <div role="status" className={cn('flex flex-col items-center justify-center gap-3 py-16 text-muted', className)}>
      <Spinner />
      <span className="text-sm">{label ?? t('states.loading')}</span>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-sand', className)} aria-hidden />;
}

export function EmptyState({
  icon,
  title,
  text,
  action,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  text?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-16 text-center', className)}>
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-secondary-100 text-primary">
        {icon ?? <Inbox className="h-7 w-7" />}
      </div>
      <h3 className="text-xl font-semibold">{title}</h3>
      {text && <p className="mt-2 max-w-sm text-muted">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({ onRetry, title, text, className }: { onRetry?: () => void; title?: string; text?: string; className?: string }) {
  const { t } = useTranslation();
  return (
    <div role="alert" className={cn('flex flex-col items-center justify-center px-6 py-16 text-center', className)}>
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-danger/10 text-danger">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h3 className="text-xl font-semibold">{title ?? t('states.error')}</h3>
      <p className="mt-2 max-w-sm text-muted">{text ?? t('states.errorText')}</p>
      {onRetry && (
        <Button variant="outline" className="mt-6" onClick={onRetry}>
          {t('actions.retry')}
        </Button>
      )}
    </div>
  );
}
