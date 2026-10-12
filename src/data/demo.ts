/**
 * Small demo constants used by the UI. The catalogue, orders, customers and reviews
 * themselves now live in MongoDB (seeded by `npm run seed` in /backend).
 */

/** Sample coupon codes created by the backend seed — shown as hints in the cart. */
export const DEMO_COUPON_HINTS = ['DEMO10', 'SCOOP5'];

/** Seeded demo customer (password `demo1234`, development only). */
export const DEMO_CUSTOMER_EMAIL = 'demo@kitchenscaleco.test';
export const DEMO_CUSTOMER_PASSWORD = 'demo1234';

/** Swatch colours for the Mini Spoon Scale variants (decorative UI only). */
export const COLOR_SWATCHES: Record<string, string> = {
  Black: '#2b2f2c',
  White: '#f1eee8',
  Pink: '#e7b7b4',
};
