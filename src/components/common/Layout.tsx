import { useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useDismiss } from '@/hooks';
import { cn } from '@/utils';

/* -------------------------------- Reveal --------------------------------- */

const revealVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

/**
 * Fades + lifts children in when scrolled into view.
 * Respects prefers-reduced-motion through the app-level <MotionConfig reducedMotion="user">.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as = 'div',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'article';
}) {
  const M = motion[as];
  return (
    <M
      className={className}
      variants={revealVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </M>
  );
}

/* ----------------------------- SectionHeading ---------------------------- */

export function SectionHeading({
  eyebrow,
  title,
  text,
  align = 'center',
  className,
  action,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  text?: ReactNode;
  align?: 'center' | 'left';
  className?: string;
  action?: ReactNode;
}) {
  return (
    <Reveal
      className={cn(
        'mb-10 sm:mb-14',
        align === 'center' ? 'mx-auto max-w-2xl text-center' : 'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className={align === 'left' ? 'max-w-2xl' : undefined}>
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h2 className="text-3xl leading-[1.1] sm:text-4xl lg:text-5xl">{title}</h2>
        {text && <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">{text}</p>}
      </div>
      {action && <div className={align === 'center' ? 'mt-6' : undefined}>{action}</div>}
    </Reveal>
  );
}

/* ------------------------------- PageHeader ------------------------------ */

/** Editorial header used at the top of inner pages (About, FAQ, policies, account …). */
export function PageHeader({
  eyebrow,
  title,
  text,
  breadcrumbs,
  children,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  text?: ReactNode;
  breadcrumbs?: Crumb[];
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('relative overflow-hidden border-b border-line/70 bg-sand/60', className)}>
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-secondary/30 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 left-10 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
      <div className="container-page relative py-12 sm:py-16 lg:py-20">
        {breadcrumbs && <Breadcrumbs items={breadcrumbs} className="mb-6" />}
        <Reveal>
          {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
          <h1 className="max-w-3xl text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">{title}</h1>
          {text && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">{text}</p>}
          {children && <div className="mt-6">{children}</div>}
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------ Breadcrumbs ------------------------------ */

export interface Crumb {
  label: ReactNode;
  to?: string;
}

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
        {items.map((c, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden />}
            {c.to ? (
              <Link to={c.to} className="transition hover:text-primary">
                {c.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-ink">
                {c.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* -------------------------------- Dropdown ------------------------------- */

/**
 * Accessible menu button. Items are rendered as menuitemradio when `selected` is provided.
 */
export function Dropdown<T extends string>({
  label,
  buttonContent,
  items,
  selected,
  onSelect,
  align = 'right',
  buttonClassName,
  direction = 'down',
}: {
  label: string;
  buttonContent: ReactNode;
  items: { value: T; label: ReactNode }[];
  selected?: T;
  onSelect: (value: T) => void;
  align?: 'left' | 'right';
  buttonClassName?: string;
  direction?: 'up' | 'down';
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, () => setOpen(false), open);

  const onMenuKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const els = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('[role^="menuitem"]'));
    const idx = els.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      els[(idx + 1) % els.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      els[(idx - 1 + els.length) % els.length]?.focus();
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          // Colour is inherited from the parent so the same control works on light and dark backgrounds.
          'inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition',
          buttonClassName ?? 'hover:bg-primary/5',
        )}
      >
        {buttonContent}
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            aria-label={label}
            onKeyDown={onMenuKey}
            initial={{ opacity: 0, y: direction === 'down' ? -6 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: direction === 'down' ? -6 : 6 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 min-w-[180px] overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-lift',
              align === 'right' ? 'right-0' : 'left-0',
              direction === 'down' ? 'top-full mt-2' : 'bottom-full mb-2',
            )}
          >
            {items.map((item) => (
              <button
                key={item.value}
                type="button"
                role={selected !== undefined ? 'menuitemradio' : 'menuitem'}
                aria-checked={selected !== undefined ? selected === item.value : undefined}
                onClick={() => {
                  onSelect(item.value);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-sand focus:bg-sand focus:outline-none',
                  selected === item.value && 'font-semibold text-primary',
                )}
              >
                {item.label}
                {selected === item.value && <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------------------------------- Tabs --------------------------------- */

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { value: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div role="tablist" className={cn('scrollbar-none flex gap-1 overflow-x-auto rounded-full bg-sand p-1', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          role="tab"
          type="button"
          aria-selected={value === tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'relative whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition',
            value === tab.value ? 'text-cream' : 'text-muted hover:text-ink',
          )}
        >
          {value === tab.value && (
            <motion.span layoutId={`tab-pill-${tabs.map((t) => t.value).join('')}`} className="absolute inset-0 rounded-full bg-primary" transition={{ type: 'spring', damping: 30, stiffness: 380 }} />
          )}
          <span className="relative">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
