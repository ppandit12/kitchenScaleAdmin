import type { NewReviewInput, Review, ReviewStatus } from '@/types';
import { enc, http } from './http';

export const reviewService = {
  /** Approved reviews (public). */
  listApproved: (productId?: string) => http.get<Review[]>(`/reviews${productId ? `?productId=${enc(productId)}` : ''}`),
  /** Admin: all reviews incl. pending/rejected. */
  list: () => http.get<Review[]>('/reviews/all'),
  /** New submissions go to the moderation queue (status: pending). */
  create: (input: NewReviewInput) => http.post<Review>('/reviews', input),
  setStatus: (id: string, status: ReviewStatus) => http.patch<Review>(`/reviews/${enc(id)}/status`, { status }),
  remove: (id: string) => http.delete(`/reviews/${enc(id)}`),
};
