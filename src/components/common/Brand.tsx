import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Info, Link2, Mail, X, XCircle } from "lucide-react";
import { useSettingsStore } from "@/store/settingsStore";
import { useToastStore } from "@/store/toastStore";
import type { SocialLinks } from "@/types";
import { cn } from "@/utils";

/* ---------------------------------- Logo --------------------------------- */

/** Logo mark: a spoon bowl + handle forming a balanced scale beam. */
export function LogoMark({
  className,
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  const fg = tone === "dark" ? "var(--color-primary)" : "var(--color-cream)";
  return (
    <svg viewBox="0 0 48 48" className={cn("h-9 w-9", className)} aria-hidden>
      <rect width="48" height="48" rx="14" fill={fg} />
      <ellipse
        cx="16"
        cy="25"
        rx="8.5"
        ry="7"
        fill={tone === "dark" ? "#FFF9F2" : "#342016"}
      />
      <ellipse
        cx="16"
        cy="25.6"
        rx="5.6"
        ry="4.3"
        fill="#FF9068"
        opacity="0.9"
      />
      <rect
        x="23.5"
        y="21.5"
        width="17"
        height="7"
        rx="3.5"
        fill={tone === "dark" ? "#FFF9F2" : "#342016"}
      />
      <circle cx="37" cy="25" r="1.4" fill="#FF9068" />
      <path
        d="M12 14.5h24"
        stroke="#FF9068"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M24 11v3.5"
        stroke="#FF9068"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({
  className,
  tone = "dark",
  to = "/",
  compact,
}: {
  className?: string;
  tone?: "dark" | "light";
  to?: string;
  compact?: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "client-logo client-logo-image",
        compact && "client-logo-compact",
        tone === "light" && "client-logo-light",
        className,
      )}
      aria-label="KitchenScaleCo — home"
    >
      <span className="client-brand-stacked" aria-hidden="true">
        <svg
          className="client-brand-image"
          viewBox="60 40 510 295"
          xmlns="http://www.w3.org/2000/svg"
        >
          <image href="/images/client/kitchenscaleco-logo.png" width="626" height="417" />
        </svg>
        <span className="client-brand-motto">MEASURE BETTER. COOK BETTER.</span>
      </span>
    </Link>
  );
}

/* ------------------------------ Social icons ----------------------------- */

const SOCIAL_PATHS: Record<keyof SocialLinks, string> = {
  instagram:
    "M12 7.3a4.7 4.7 0 1 0 0 9.4 4.7 4.7 0 0 0 0-9.4Zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm6-7.9a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0ZM12 3.6c2.7 0 3 0 4.1.1 2.7.1 4 1.4 4.1 4.1.1 1.1.1 1.4.1 4.1s0 3-.1 4.1c-.1 2.7-1.4 4-4.1 4.1-1.1.1-1.4.1-4.1.1s-3 0-4.1-.1c-2.7-.1-4-1.4-4.1-4.1C3.6 15 3.6 14.7 3.6 12s0-3 .1-4.1C3.8 5.2 5.1 3.9 7.8 3.8 8.9 3.7 9.3 3.6 12 3.6ZM12 2C9.3 2 8.9 2 7.9 2.1 4.2 2.2 2.2 4.3 2.1 7.9 2 8.9 2 9.3 2 12s0 3.1.1 4.1c.1 3.7 2.2 5.7 5.8 5.8 1 .1 1.4.1 4.1.1s3.1 0 4.1-.1c3.6-.1 5.7-2.2 5.8-5.8.1-1 .1-1.4.1-4.1s0-3.1-.1-4.1c-.1-3.6-2.2-5.7-5.8-5.8C15.1 2 14.7 2 12 2Z",
  facebook:
    "M13.5 21.9v-7.6h2.6l.4-3h-3V9.4c0-.9.3-1.5 1.5-1.5h1.6V5.2c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.6v7.6C5.6 21.2 2 17 2 12 2 6.5 6.5 2 12 2s10 4.5 10 10c0 5-3.6 9.2-8.5 9.9Z",
  pinterest:
    "M12 2a10 10 0 0 0-3.6 19.3c-.1-.8-.2-2 0-2.9l1.2-5s-.3-.6-.3-1.5c0-1.4.8-2.4 1.8-2.4.9 0 1.3.6 1.3 1.4 0 .9-.5 2.1-.8 3.3-.2 1 .5 1.8 1.5 1.8 1.8 0 3.1-1.9 3.1-4.6 0-2.4-1.7-4.1-4.2-4.1-2.9 0-4.6 2.2-4.6 4.4 0 .9.3 1.8.8 2.3.1.1.1.2.1.3l-.3 1.2c0 .2-.2.3-.4.2-1.3-.6-2.1-2.5-2.1-4 0-3.3 2.4-6.3 6.9-6.3 3.6 0 6.4 2.6 6.4 6 0 3.6-2.3 6.5-5.4 6.5-1.1 0-2.1-.6-2.4-1.2l-.7 2.5c-.2.9-.9 2.1-1.3 2.8A10 10 0 1 0 12 2Z",
  tiktok:
    "M16.6 2h-3.3v13.2a2.8 2.8 0 1 1-2.8-2.8c.3 0 .6 0 .8.1V9.1a6.2 6.2 0 1 0 5.3 6.1V8.6a8 8 0 0 0 4.4 1.3V6.6a4.5 4.5 0 0 1-4.4-4.6Z",
  youtube:
    "M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8ZM10 15V9l5.2 3L10 15Z",
};

export function SocialIcon({
  network,
  className,
}: {
  network: keyof SocialLinks;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-5 w-5", className)}
      fill="currentColor"
      aria-hidden
    >
      <path d={SOCIAL_PATHS[network]} />
    </svg>
  );
}

/** Social profile links from Admin â†’ Settings. Links with an empty URL are hidden. */
export function SocialLinksRow({
  className,
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  const { t } = useTranslation();
  const social = useSettingsStore((s) => s.settings.social);
  const entries = (Object.keys(social) as (keyof SocialLinks)[]).filter(
    (k) => social[k],
  );
  return (
    <ul className={cn("flex flex-wrap items-center gap-2", className)}>
      {entries.map((network) => (
        <li key={network}>
          <a
            href={social[network]}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t(`social.${network}`)}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-200 hover:-translate-y-0.5",
              tone === "dark"
                ? "border-line text-primary hover:border-primary hover:bg-primary hover:text-cream"
                : "border-cream/20 text-cream/90 hover:border-accent hover:bg-accent hover:text-primary-700",
            )}
          >
            <SocialIcon network={network} className="h-[18px] w-[18px]" />
          </a>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------ Share buttons ---------------------------- */

/** Share the current (or given) URL. Uses the Web Share API on supported devices. */
export function ShareButtons({
  url,
  title,
  className,
}: {
  url?: string;
  title: string;
  className?: string;
}) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const href = url ?? window.location.href;
  const enc = encodeURIComponent;
  const links = [
    {
      key: "facebook",
      label: t("share.facebook"),
      href: `https://www.facebook.com/sharer/sharer.php?u=${enc(href)}`,
      icon: <SocialIcon network="facebook" className="h-4 w-4" />,
    },
    {
      key: "x",
      label: t("share.x"),
      href: `https://twitter.com/intent/tweet?url=${enc(href)}&text=${enc(title)}`,
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="currentColor"
          aria-hidden
        >
          <path d="M17.8 3h3.1l-6.8 7.7 8 10.3h-6.2l-4.9-6.3L5.4 21H2.3l7.2-8.3L1.8 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z" />
        </svg>
      ),
    },
    {
      key: "pinterest",
      label: t("share.pinterest"),
      href: `https://pinterest.com/pin/create/button/?url=${enc(href)}&description=${enc(title)}`,
      icon: <SocialIcon network="pinterest" className="h-4 w-4" />,
    },
    {
      key: "email",
      label: t("share.email"),
      href: `mailto:?subject=${enc(title)}&body=${enc(href)}`,
      icon: <Mail className="h-4 w-4" />,
    },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="mr-1 text-sm font-medium text-muted">
        {t("share.title")}
      </span>
      {links.map((l) => (
        <a
          key={l.key}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={l.label}
          title={l.label}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-primary transition hover:border-primary hover:bg-primary hover:text-cream"
        >
          {l.icon}
        </a>
      ))}
      <button
        type="button"
        onClick={copy}
        aria-label={t("actions.copyLink")}
        title={copied ? t("actions.linkCopied") : t("actions.copyLink")}
        className="flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-sm text-primary transition hover:border-primary"
      >
        {copied ? (
          <CheckCircle2 className="h-4 w-4 text-success" />
        ) : (
          <Link2 className="h-4 w-4" />
        )}
        <span className="sr-only sm:not-sr-only">
          {copied ? t("actions.linkCopied") : t("actions.copyLink")}
        </span>
      </button>
    </div>
  );
}

/* --------------------------------- Toaster -------------------------------- */

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:left-auto sm:right-6 sm:items-end"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-sm shadow-lift"
            role="status"
          >
            {toast.tone === "success" ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
            ) : toast.tone === "error" ? (
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
            ) : (
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            )}
            <p className="flex-1 leading-snug text-ink">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss"
              className="-mr-1 rounded-full p-1 text-muted hover:bg-sand"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
