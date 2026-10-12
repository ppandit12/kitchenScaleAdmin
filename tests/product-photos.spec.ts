import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';

test('product photos upload, preview, reorder, and persist with the product', async ({ page }) => {
  const admin = { id: 'adm-test', name: 'Store Admin', email: 'admin@example.com' };
  let saved: Record<string, any> | null = null;
  let uploads = 0;
  await page.addInitScript(admin => localStorage.setItem('ksc:auth', JSON.stringify({ state: { admin, customer: null }, version: 2 })), admin);
  await page.route('**/api/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path.startsWith('/api/media/') && request.method() === 'GET') {
      await route.fulfill({ path: resolve('public/images/client/shopify-coffee-hero.png'), contentType: 'image/png' }); return;
    }
    if (path === '/api/media') {
      expect(request.headers()['content-type']).toBe('image/png');
      expect(request.postDataBuffer()!.length).toBeGreaterThan(1000);
      uploads++;
      await route.fulfill({ status: 201, json: { src: `/api/media/00000000-0000-0000-0000-00000000000${uploads}.png` } }); return;
    }
    if (path === '/api/auth/me') { await route.fulfill({ json: { admin, customer: null } }); return; }
    if (path === '/api/products' && request.method() === 'POST') {
      saved = request.postDataJSON();
      await route.fulfill({ status: 201, json: saved }); return;
    }
    if (saved && path === `/api/products/${saved.id}`) { await route.fulfill({ json: saved }); return; }
    await route.fulfill({ json: [] });
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/admin/products/new');
  await expect(page.getByRole('heading', { name: 'Product photos', exact: true })).toBeInViewport({ timeout: 20000 });
  const upload = page.getByLabel('Upload product photos');
  await upload.setInputFiles({ name: 'bad.txt', mimeType: 'text/plain', buffer: Buffer.from('not an image') });
  await expect(page.getByRole('alert')).toContainText('Choose JPG, PNG, or WebP images.');
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Coffee measuring spoon');
  await upload.setInputFiles([resolve('public/images/client/shopify-coffee-hero.png'), resolve('public/images/client/shopify-coffee-hero.png')]);
  await expect(page.getByRole('status', { name: '' }).filter({ hasText: 'Uploading photos.' })).toHaveCount(0);
  await expect(page.getByRole('textbox', { name: 'Image URL', exact: true })).toHaveCount(2);
  await expect(page.getByRole('textbox', { name: 'Image URL', exact: true }).first()).toHaveValue('/api/media/00000000-0000-0000-0000-000000000001.png');
  await page.getByRole('button', { name: 'Move image up', exact: true }).nth(1).click();
  await expect(page.getByRole('textbox', { name: 'Image URL', exact: true }).first()).toHaveValue('/api/media/00000000-0000-0000-0000-000000000002.png');
  await page.getByLabel('Photo colour', { exact: true }).first().selectOption('Black');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'docs/previews/product-photos.png', fullPage: false });
  await page.getByRole('button', { name: 'Create product', exact: true }).first().click();
  await expect(page).toHaveURL(/\/admin\/products\/prod-[a-z0-9-]+$/);
  await page.reload();
  await expect(page.getByLabel('Photo colour', { exact: true }).first()).toHaveValue('Black');
  await expect(page.getByRole('textbox', { name: 'Image URL', exact: true }).first()).toHaveValue('/api/media/00000000-0000-0000-0000-000000000002.png');
  await expect(page.locator('img[src^="/api/media/"]').first()).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByLabel('Upload product photos')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await page.getByRole('button', { name: 'Remove image', exact: true }).first().click();
  await expect(page.getByRole('textbox', { name: 'Image URL', exact: true })).toHaveCount(1);
});
