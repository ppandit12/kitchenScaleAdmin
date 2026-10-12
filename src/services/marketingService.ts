import type { Campaign, Subscriber } from '@/types';
import { enc, http } from './http';

export const newsletterService = {
  subscribe: (email: string, consent: boolean, source: Subscriber['source']) =>
    http.post<{ alreadySubscribed: boolean }>('/newsletter/subscribe', { email, consent, source }),
  list: () => http.get<Subscriber[]>('/newsletter/subscribers'),
  update: (id: string, patch: Partial<Subscriber>) =>
    http.patch<Subscriber>(`/newsletter/subscribers/${enc(id)}`, { status: patch.status, consent: patch.consent }),
  remove: (id: string) => http.delete(`/newsletter/subscribers/${enc(id)}`),
};

/** Campaigns are stored on the server. "Send" records the audience size; no email provider is connected yet. */
export const campaignService = {
  list: () => http.get<Campaign[]>('/campaigns'),
  create: (c: Omit<Campaign, 'id' | 'createdAt' | 'metrics'>) => http.post<Campaign>('/campaigns', clean(c)),
  update: (id: string, patch: Partial<Campaign>) => http.patch<Campaign>(`/campaigns/${enc(id)}`, clean(patch)),
  remove: (id: string) => http.delete(`/campaigns/${enc(id)}`),
  simulateSend: (id: string) => http.post<Campaign>(`/campaigns/${enc(id)}/send`),
};

function clean(c: Partial<Campaign>) {
  const { name, subject, previewText, body, audience, status, scheduledAt } = c;
  return Object.fromEntries(
    Object.entries({ name, subject, previewText, body, audience, status, scheduledAt }).filter(([, v]) => v !== undefined),
  );
}
