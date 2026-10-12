/**
 * DEMONSTRATION analytics figures for dashboard previews.
 * These are NOT real traffic, revenue or conversion numbers.
 */

export const demoVisitorTrend = [
  { date: 'Sep 1', visitors: 320, sessions: 410, pageViews: 1180 },
  { date: 'Sep 5', visitors: 380, sessions: 470, pageViews: 1290 },
  { date: 'Sep 9', visitors: 350, sessions: 455, pageViews: 1240 },
  { date: 'Sep 13', visitors: 460, sessions: 590, pageViews: 1610 },
  { date: 'Sep 17', visitors: 520, sessions: 640, pageViews: 1830 },
  { date: 'Sep 21', visitors: 490, sessions: 615, pageViews: 1720 },
  { date: 'Sep 25', visitors: 610, sessions: 760, pageViews: 2140 },
  { date: 'Sep 29', visitors: 680, sessions: 830, pageViews: 2390 },
];

export const demoFunnel = [
  { stage: 'Sessions', value: 5000 },
  { stage: 'Product views', value: 2600 },
  { stage: 'Add to cart', value: 640 },
  { stage: 'Checkout started', value: 310 },
  { stage: 'Demo orders', value: 120 },
];

export const demoTrafficSources = [
  { source: 'Organic search', value: 38 },
  { source: 'Social', value: 27 },
  { source: 'Direct', value: 19 },
  { source: 'Email', value: 10 },
  { source: 'Referral', value: 6 },
];

export const demoDevices = [
  { device: 'Mobile', value: 64 },
  { device: 'Desktop', value: 29 },
  { device: 'Tablet', value: 7 },
];

export const demoTopPages = [
  { path: '/', views: 6120 },
  { path: '/products/mini-spoon-scale', views: 4380 },
  { path: '/shop', views: 1910 },
  { path: '/faq', views: 740 },
  { path: '/cart', views: 690 },
];
