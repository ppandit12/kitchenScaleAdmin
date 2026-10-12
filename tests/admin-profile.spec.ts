import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';

test('admin uploads, saves, reloads and removes a profile photo', async ({ page }) => {
  let admin = { name: 'Store Admin', email: 'admin@example.com', role: 'admin', avatarUrl: '' };
  await page.addInitScript(admin => {
    localStorage.setItem('ksc:lang', 'en');
    if (!localStorage.getItem('ksc:auth')) localStorage.setItem('ksc:auth', JSON.stringify({ state: { admin, customer: null }, version: 2 }));
  }, admin);
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path.startsWith('/api/media/')) { await route.fulfill({ path: resolve('public/images/client/shopify-coffee-hero.png'), contentType: 'image/png' }); return; }
    if (path === '/api/media') { await route.fulfill({ status: 201, json: { src: '/api/media/00000000-0000-0000-0000-000000000001.png' } }); return; }
    if (path === '/api/auth/admin/profile') { admin = { ...admin, ...route.request().postDataJSON() }; await route.fulfill({ json: { admin } }); return; }
    await route.fulfill({ json: path === '/api/auth/me' ? { admin, customer: null } : [] });
  });
  await page.goto('/admin/settings');
  await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible();
  await expect(page.getByLabel('Upload profile photo')).toHaveCount(0);
  await page.getByRole('button', { name: 'Admin profile menu' }).click();
  await page.getByRole('menuitem', { name: 'Profile', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/profile$/);
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: 'Upload picture', exact: true }).click(),
  ]);
  await chooser.setFiles(resolve('public/images/client/shopify-coffee-hero.png'));
  await expect(page.getByAltText('Profile photo preview')).toBeVisible();
  await page.getByRole('textbox', { name: 'Your name', exact: true }).fill('Franklyn Yiadom');
  await page.getByRole('button', { name: 'Save profile', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Admin profile menu' })).toContainText('Franklyn Yiadom');
  await expect(page.getByRole('button', { name: 'Admin profile menu' }).locator('img')).toBeVisible();
  await page.reload();
  await expect(page.getByAltText('Profile photo preview')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await page.getByRole('button', { name: 'Remove photo', exact: true }).click();
  await page.getByRole('button', { name: 'Save profile', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Admin profile menu' }).locator('img')).toHaveCount(0);
  await page.reload();
  await expect(page.getByAltText('Profile photo preview')).toHaveCount(0);
  await page.getByRole('button', { name: 'Admin profile menu' }).click();
  await page.getByRole('menuitem', { name: 'Settings', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/settings$/);
  await expect(page.getByLabel('Upload profile photo')).toHaveCount(0);
});
