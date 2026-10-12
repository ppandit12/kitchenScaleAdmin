import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { LoadingState, Toaster } from '@/components/common';
import { useAuthStore, useSettingsStore } from '@/store';
import { UNAUTHORIZED_EVENT } from '@/services/http';
import { contentService, applyContent } from '@/services/contentService';

const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout'));
const AdminLoginPage = lazy(() => import('@/pages/admin/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const AdminProductsPage = lazy(() => import('@/pages/admin/AdminProductsPage'));
const AdminProductEditPage = lazy(() => import('@/pages/admin/AdminProductEditPage'));
const AdminOrdersPage = lazy(() => import('@/pages/admin/AdminOrdersPage'));
const AdminOrderDetailsPage = lazy(() => import('@/pages/admin/AdminOrderDetailsPage'));
const AdminCustomersPage = lazy(() => import('@/pages/admin/AdminCustomersPage'));
const AdminCustomerDetailsPage = lazy(() => import('@/pages/admin/AdminCustomerDetailsPage'));
const AdminCouponsPage = lazy(() => import('@/pages/admin/AdminCouponsPage'));
const AdminReviewsPage = lazy(() => import('@/pages/admin/AdminReviewsPage'));
const AdminMessagesPage = lazy(() => import('@/pages/admin/AdminMessagesPage'));
const AdminMarketingPage = lazy(() => import('@/pages/admin/AdminMarketingPage'));
const AdminAnalyticsPage = lazy(() => import('@/pages/admin/AdminAnalyticsPage'));
const AdminSettingsPage = lazy(() => import('@/pages/admin/AdminSettingsPage'));
const AdminBlogPage = lazy(() => import('@/pages/admin/AdminBlogPage'));
const AdminContentPage = lazy(() => import('@/pages/admin/AdminContentPage'));

export default function App() {
  const colors = useSettingsStore(s => s.settings.brandColors);
  useEffect(() => {
    const style = document.documentElement.style;
    for (const [key, value] of Object.entries(colors)) style.setProperty(`--brand-${key}`, value);
  }, [colors]);
  useEffect(() => {
    void useSettingsStore.getState().hydrate();
    void useAuthStore.getState().sync();
    void contentService.list().then(applyContent).catch(() => {});
    const sync = () => void useAuthStore.getState().sync();
    window.addEventListener(UNAUTHORIZED_EVENT, sync);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, sync);
  }, []);
  return <MotionConfig reducedMotion="user"><BrowserRouter>
    <Suspense fallback={<LoadingState className="min-h-screen" />}><Routes>
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="products/new" element={<AdminProductEditPage />} />
        <Route path="products/:id" element={<AdminProductEditPage />} />
        <Route path="blog" element={<AdminBlogPage />} />
        <Route path="content" element={<AdminContentPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="orders/:id" element={<AdminOrderDetailsPage />} />
        <Route path="customers" element={<AdminCustomersPage />} />
        <Route path="customers/:id" element={<AdminCustomerDetailsPage />} />
        <Route path="coupons" element={<AdminCouponsPage />} />
        <Route path="reviews" element={<AdminReviewsPage />} />
        <Route path="messages" element={<AdminMessagesPage />} />
        <Route path="marketing" element={<AdminMarketingPage />} />
        <Route path="analytics" element={<AdminAnalyticsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="*" element={<div><h1>Page not found</h1><a href="/admin">Return to dashboard</a></div>} />
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes></Suspense><Toaster />
  </BrowserRouter></MotionConfig>;
}
