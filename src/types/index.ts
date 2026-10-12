/**
 * Domain types shared by the UI and the service layer.
 * They are shaped so a future Express/MongoDB API can return the same objects.
 * All money values are stored in the BASE currency (USD) and converted for display.
 */

export type CurrencyCode = 'USD' | 'CAD' | 'EUR' | 'GBP';
export type LanguageCode = 'en' | 'fr' | 'de' | 'es';

/* ----------------------------- Catalogue ----------------------------- */

/** Illustration views rendered by <ProductArt />. Used when no real photo (`src`) exists. */
export type ProductView = 'hero' | 'front' | 'angle' | 'display' | 'detail' | 'pack' | 'lifestyle';

export interface ProductImage {
  id: string;
  view: ProductView;
  alt: string;
  /** Optional real image URL. When absent the original SVG illustration is shown. */
  src?: string;
}

export interface ProductOption {
  /** e.g. "Color", "Pack" */
  name: string;
  values: string[];
}

export interface ProductVariant {
  id: string;
  sku: string;
  /** Human title, e.g. "Sage Black / Single" */
  title: string;
  /** Option name → value, e.g. { Color: 'Black', Pack: 'Single' } */
  options: Record<string, string>;
  /** Price in base currency (USD). DEMO value. */
  price: number;
  compareAtPrice?: number;
  stock: number;
  weightGrams: number;
  /** Body colour used by the illustration + swatch. */
  colorHex: string;
  /** Number of units in this variant (drives the "pack" illustration). */
  units: number;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export type ProductStatus = 'active' | 'draft';

export interface Product {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  category: string;
  shortDescription: string;
  description: string;
  features: string[];
  specifications: ProductSpec[];
  /** Disclaimer shown under the specification table. */
  specsNote?: string;
  options: ProductOption[];
  variants: ProductVariant[];
  images: ProductImage[];
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export type StockState = 'in_stock' | 'low_stock' | 'out_of_stock';

/* ------------------------------- Cart -------------------------------- */

export interface CartItem {
  /** Equals variantId — one line per variant. */
  id: string;
  productId: string;
  slug: string;
  name: string;
  variantId: string;
  variantTitle: string;
  sku: string;
  /** Unit price in USD at time of adding. */
  price: number;
  quantity: number;
  colorHex: string;
  units: number;
  weightGrams: number;
  maxQuantity: number;
}

/* ------------------------------ Coupons ------------------------------ */

export type CouponType = 'percent' | 'fixed';

export interface Coupon {
  id: string;
  code: string;
  description: string;
  type: CouponType;
  /** Percent (0–100) for 'percent', USD amount for 'fixed'. */
  value: number;
  /** Minimum subtotal in USD. 0 = none. */
  minSubtotal: number;
  active: boolean;
  expiresAt?: string;
  usageCount: number;
  createdAt: string;
}

export interface CouponValidation {
  valid: boolean;
  coupon?: Coupon;
  /** Discount in USD */
  discount: number;
  /** i18n-friendly reason key when invalid: 'notFound' | 'inactive' | 'expired' | 'minSubtotal' */
  reason?: 'notFound' | 'inactive' | 'expired' | 'minSubtotal';
}

/* ------------------------------ Shipping ----------------------------- */

export type ShippingZoneId = 'north_america' | 'europe';

export interface Country {
  code: string;
  name: string;
  zone: ShippingZoneId;
  /** Label for state/province field */
  regionLabel: 'state' | 'province' | 'county' | 'region';
}

export interface ShippingRate {
  id: string;
  name: string;
  /** Estimated business days, e.g. [5, 9]. DEMO estimate only. */
  etaDays: [number, number];
  /** Base price USD */
  base: number;
  /** Additional USD per 100 g */
  per100g: number;
}

export interface ShippingZone {
  id: ShippingZoneId;
  name: string;
  countries: string[];
  rates: ShippingRate[];
  enabled: boolean;
}

export interface ShippingQuote {
  id: string;
  name: string;
  etaDays: [number, number];
  /** USD */
  price: number;
}

/* ------------------------------ Customers ---------------------------- */

export interface Address {
  id: string;
  label: string;
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefault: boolean;
}

export interface Customer {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  country: string;
  addresses: Address[];
  marketingOptIn: boolean;
  createdAt: string;
}

/** Simulated session. NEVER contains a password or token. */
export interface CustomerSession {
  customerId: string;
  email: string;
  fullName: string;
  signedInAt: string;
}

/* ------------------------------- Orders ------------------------------ */

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  'placed',
  'confirmed',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
];

export type PaymentMethodId = 'visa' | 'mastercard' | 'upi' | 'netbanking';

export interface OrderItem {
  productId: string;
  variantId: string;
  name: string;
  variantTitle: string;
  sku: string;
  /** USD */
  price: number;
  quantity: number;
  colorHex: string;
  units: number;
}

export interface OrderTimelineEntry {
  status: OrderStatus;
  date: string;
  note?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  customer: {
    fullName: string;
    email: string;
    phone: string;
    country: string;
  };
  shippingAddress: Omit<Address, 'id' | 'label' | 'isDefault'>;
  items: OrderItem[];
  /** All USD */
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  couponCode?: string;
  shippingMethod: { id: string; name: string; etaDays: [number, number] };
  paymentMethod: PaymentMethodId;
  /** Currency the shopper viewed at checkout + the demo rate snapshot. */
  displayCurrency: CurrencyCode;
  exchangeRate: number;
  status: OrderStatus;
  timeline: OrderTimelineEntry[];
  trackingNumber?: string;
  createdAt: string;
  /** Always true in this frontend build. */
  isDemo: true;
}

/** Payload the checkout sends to orderService.create(). */
export type NewOrderInput = Omit<
  Order,
  'id' | 'orderNumber' | 'status' | 'timeline' | 'createdAt' | 'isDemo' | 'trackingNumber'
>;

/* ------------------------------- Reviews ----------------------------- */

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface Review {
  id: string;
  productId: string;
  author: string;
  location?: string;
  rating: number;
  title: string;
  body: string;
  status: ReviewStatus;
  createdAt: string;
  /** Seeded sample content — must be labelled as a demonstration in the UI. */
  isDemo: boolean;
}

export type NewReviewInput = Pick<Review, 'productId' | 'author' | 'location' | 'rating' | 'title' | 'body'>;

/* ------------------------------ Marketing ---------------------------- */

export interface Subscriber {
  id: string;
  email: string;
  consent: boolean;
  source: 'footer' | 'home' | 'checkout' | 'admin';
  createdAt: string;
  status: 'subscribed' | 'unsubscribed';
}

export type CampaignStatus = 'draft' | 'scheduled' | 'sent';

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  previewText: string;
  body: string;
  audience: 'all' | 'customers' | 'subscribers';
  status: CampaignStatus;
  scheduledAt?: string;
  sentAt?: string;
  /** DEMO metrics */
  metrics: { recipients: number; opens: number; clicks: number };
  createdAt: string;
}

/* ------------------------------- Settings ---------------------------- */

export interface SocialLinks {
  instagram: string;
  facebook: string;
  pinterest: string;
  tiktok: string;
  youtube: string;
}

export interface BrandColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  accent: string;
}

export interface NotificationPrefs {
  newOrder: boolean;
  lowStock: boolean;
  newReview: boolean;
  newSubscriber: boolean;
}

export interface StoreSettings {
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  businessAddress: string;
  announcement: { enabled: boolean; text: string };
  brandColors: BrandColors;
  languages: LanguageCode[];
  defaultLanguage: LanguageCode;
  currencies: CurrencyCode[];
  defaultCurrency: CurrencyCode;
  /** DEMO exchange rates relative to USD. */
  exchangeRates: Record<CurrencyCode, number>;
  shippingZones: ShippingZone[];
  social: SocialLinks;
  notifications: NotificationPrefs;
  lowStockThreshold: number;
}

/* ------------------------------ Contact / chat ----------------------- */

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  orderNumber?: string;
  message: string;
  /** Set by the API; new submissions start as 'new'. */
  status?: 'new' | 'read' | 'closed';
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  from: 'user' | 'bot';
  text: string;
  createdAt: string;
}

/* ------------------------------- Analytics --------------------------- */

export interface AnalyticsEventParams {
  [key: string]: string | number | boolean | undefined;
}

/* -------------------------------- Admin ------------------------------ */

export interface AdminSession {
  name: string;
  email: string;
  role: 'admin';
  signedInAt: string;
}

export interface AdminNotification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  link?: string;
}
