import { test, expect } from '@playwright/test';

test('publishing a draft makes it visible in an open shop, including prices above $100', async ({ context, page }) => {
  const admin = { id: 'adm-test', name: 'Store Admin', email: 'admin@example.com' };
  const product = {
    id: 'prod-publish', name: 'New kitchen scale', slug: 'new-kitchen-scale', category: 'Kitchen Accessories',
    tagline: '', shortDescription: '', description: '', features: [], specifications: [],
    options: [{ name: 'Color', values: ['Black'] }, { name: 'Pack', values: ['Single'] }],
    variants: [{ id: 'var-publish', sku: 'NEW-SCALE', title: 'Black / Single', options: { Color: 'Black', Pack: 'Single' }, price: 249, stock: 0, weightGrams: 120, colorHex: '#222222', units: 1 }],
    images: [{ id: 'img-publish', view: 'hero', alt: 'New kitchen scale', src: '/images/client/shopify-coffee-hero.png' }],
    status: 'draft', createdAt: '2026-10-12T06:00:00.000Z', updatedAt: '2026-10-12T06:00:00.000Z',
  };
  await context.addInitScript(admin => {
    localStorage.setItem('ksc:auth', JSON.stringify({ state: { admin, customer: null }, version: 2 }));
    localStorage.setItem('ksc:lang', 'en');
  }, admin);
  await context.route('**/api/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === '/api/auth/me') { await route.fulfill({ json: { admin, customer: null } }); return; }
    if (url.pathname === '/api/products/prod-publish/status') {
      expect(request.method()).toBe('PATCH');
      expect(request.postDataJSON()).toEqual({ status: 'active' });
      product.status = 'active';
      await route.fulfill({ json: product }); return;
    }
    if (url.pathname === '/api/products') {
      await route.fulfill({ json: url.searchParams.has('includeDrafts') || product.status === 'active' ? [product] : [] }); return;
    }
    await route.fulfill({ json: [] });
  });
  const shop = await context.newPage();
  await shop.goto('http://127.0.0.1:5173/shop');
  await expect(shop.locator('.shop-product-grid')).not.toContainText(product.name);
  await page.goto('/admin/products');
  await expect(page.getByText('Hidden from shop', { exact: true })).toBeVisible();
  await expect(page.locator('img[src="/images/client/shopify-coffee-hero.png"]')).toBeVisible();
  await page.getByRole('button', { name: 'Publish New kitchen scale', exact: true }).click();
  await expect(page.getByText('Published', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Publish New kitchen scale', exact: true })).toHaveCount(0);
  await shop.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(shop.locator('.shop-product-grid')).toContainText(product.name);
  await expect(shop.getByRole('slider')).toHaveValue('250');
  await shop.getByRole('slider').fill('100');
  await expect(shop.locator('.shop-product-grid article')).toHaveCount(0);
  await shop.getByRole('slider').fill('250');
  await expect(shop.locator('.shop-product-grid article')).toHaveCount(1);
  await shop.reload();
  await expect(shop.locator('.shop-product-grid')).toContainText(product.name);
});
