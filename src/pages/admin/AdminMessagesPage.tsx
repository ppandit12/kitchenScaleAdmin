import { useMemo, useState } from 'react';
import { Archive, Mail, MailOpen, Trash2 } from 'lucide-react';
import { Badge, ConfirmDialog, EmptyState, ErrorState, LoadingState } from '@/components/common';
import { FilterBar, FilterSelect, IconAction, PageTitle, SearchInput } from '@/components/admin';
import { useAsync } from '@/hooks';
import { contactService } from '@/services';
import { toast } from '@/store';
import type { ContactMessage } from '@/types';
import { cn, formatDateTime } from '@/utils';

type Status = NonNullable<ContactMessage['status']>;
type Filter = 'all' | Status;

const STATUS_TONE: Record<Status, 'warning' | 'info' | 'neutral'> = { new: 'warning', read: 'info', closed: 'neutral' };

/** Contact-form inbox. Replies go out from your own email client (no email provider is connected yet). */
export default function AdminMessagesPage() {
  const result = useAsync(() => contactService.list(), []);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [toDelete, setToDelete] = useState<ContactMessage | null>(null);
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (result.data ?? []).filter(
      (m) =>
        (filter === 'all' || (m.status ?? 'new') === filter) &&
        (!q || [m.name, m.email, m.subject, m.message, m.orderNumber ?? ''].some((v) => v.toLowerCase().includes(q))),
    );
  }, [result.data, query, filter]);

  const unread = (result.data ?? []).filter((m) => (m.status ?? 'new') === 'new').length;

  const setStatus = async (m: ContactMessage, status: Status) => {
    result.setData((prev) => (prev ?? []).map((x) => (x.id === m.id ? { ...x, status } : x)));
    try {
      await contactService.setStatus(m.id, status);
    } catch {
      toast.error('Could not update the message.');
      result.reload();
    }
  };

  const remove = async () => {
    if (!toDelete) return;
    setBusy(true);
    try {
      await contactService.remove(toDelete.id);
      result.setData((prev) => (prev ?? []).filter((x) => x.id !== toDelete.id));
      toast.success('Message deleted.');
      setToDelete(null);
    } catch {
      toast.error('Could not delete the message.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageTitle
        title="Messages"
        description={`Contact-form submissions from the storefront${unread ? ` · ${unread} new` : ''}. Reply from your own email — automatic emails aren’t connected yet.`}
      />

      <FilterBar className="mb-5">
        <SearchInput value={query} onChange={setQuery} placeholder="Search name, email, subject or order…" label="Search messages" />
        <FilterSelect<Filter>
          label="Status"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'All' },
            { value: 'new', label: 'New' },
            { value: 'read', label: 'Read' },
            { value: 'closed', label: 'Closed' },
          ]}
        />
      </FilterBar>

      {result.loading && !result.data ? (
        <LoadingState />
      ) : result.error ? (
        <ErrorState onRetry={result.reload} />
      ) : rows.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Mail className="h-7 w-7" />}
            title={query || filter !== 'all' ? 'No messages match your filters' : 'No messages yet'}
            text="Messages sent from the Contact page appear here."
          />
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((m) => {
            const status = m.status ?? 'new';
            const subject = encodeURIComponent(`Re: ${m.subject}`);
            return (
              <li key={m.id} className={cn('card min-w-0 p-5', status === 'new' && 'border-l-4 border-l-primary')}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-sans text-base font-semibold">{m.subject}</h2>
                      <Badge tone={STATUS_TONE[status]} className="capitalize">
                        {status}
                      </Badge>
                    </div>
                    <p className="mt-1 break-words text-sm text-muted">
                      {m.name} ·{' '}
                      <a href={`mailto:${m.email}?subject=${subject}`} className="text-primary hover:underline">
                        {m.email}
                      </a>{' '}
                      · {formatDateTime(m.createdAt)}
                      {m.orderNumber && (
                        <>
                          {' '}
                          · Order{' '}
                          <span className="font-medium text-ink">{m.orderNumber}</span>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {status === 'new' ? (
                      <IconAction label="Mark as read" onClick={() => void setStatus(m, 'read')}>
                        <MailOpen className="h-4 w-4" />
                      </IconAction>
                    ) : (
                      <IconAction label="Mark as new" onClick={() => void setStatus(m, 'new')}>
                        <Mail className="h-4 w-4" />
                      </IconAction>
                    )}
                    {status !== 'closed' && (
                      <IconAction label="Close" onClick={() => void setStatus(m, 'closed')}>
                        <Archive className="h-4 w-4" />
                      </IconAction>
                    )}
                    <IconAction label="Delete" tone="danger" onClick={() => setToDelete(m)}>
                      <Trash2 className="h-4 w-4" />
                    </IconAction>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-line break-words text-[15px] leading-relaxed text-ink">{m.message}</p>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => void remove()}
        loading={busy}
        title="Delete message?"
        message={<>The message from <strong className="text-ink">{toDelete?.name}</strong> will be permanently deleted.</>}
      />
    </>
  );
}
