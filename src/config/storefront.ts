export const STOREFRONT_URL = (import.meta.env.VITE_STOREFRONT_URL || 'http://localhost:5173').replace(/\/$/, '');
export const storefrontUrl = (path = '/') => `${STOREFRONT_URL}${path.startsWith('/') ? path : `/${path}`}`;
