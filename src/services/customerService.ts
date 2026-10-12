import type { Address, Customer } from '@/types';
import { enc, http, orUndefined } from './http';

export const customerService = {
  /** Admin only. */
  list: () => http.get<Customer[]>('/customers'),
  /** The signed-in customer (own id) or an admin. */
  get: (id: string) => orUndefined(http.get<Customer>(`/customers/${enc(id)}`)),
  update: (id: string, patch: Partial<Customer>) => http.patch<Customer>(`/customers/${enc(id)}`, pickProfile(patch)),

  saveAddress: (customerId: string, address: Omit<Address, 'id'> & { id?: string }) =>
    http.post<Customer>(`/customers/${enc(customerId)}/addresses`, address),

  removeAddress: (customerId: string, addressId: string) =>
    http.delete<Customer>(`/customers/${enc(customerId)}/addresses/${enc(addressId)}`),
};

/** Only profile fields are editable through this endpoint. */
function pickProfile(p: Partial<Customer>) {
  const { fullName, email, phone, country, marketingOptIn } = p;
  return Object.fromEntries(
    Object.entries({ fullName, email, phone, country, marketingOptIn }).filter(([, v]) => v !== undefined),
  );
}
