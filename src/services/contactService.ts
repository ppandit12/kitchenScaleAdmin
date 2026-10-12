import type { ContactMessage } from '@/types';
import { enc, http } from './http';

/** Messages are saved on the server and read in Admin → Messages. No email is sent yet. */
export const contactService = {
  submit: (input: Omit<ContactMessage, 'id' | 'createdAt' | 'status'>) => http.post<ContactMessage>('/contact', input),
  /** Admin only. */
  list: () => http.get<ContactMessage[]>('/contact'),
  setStatus: (id: string, status: NonNullable<ContactMessage['status']>) =>
    http.patch<ContactMessage>(`/contact/${enc(id)}`, { status }),
  remove: (id: string) => http.delete(`/contact/${enc(id)}`),
};
