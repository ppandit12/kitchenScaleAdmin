import { test, expect } from '@playwright/test';

test('CMS publishes articles, saves page content, and renders changes after reload', async ({ page }) => {
  const admin = { id: 'adm-test', name: 'Store Admin', email: 'admin@example.com' };
  let posts: Record<string, unknown>[] = [];
  const content: Record<string, unknown>[] = [];
  await page.addInitScript(admin => {
    localStorage.setItem('ksc:auth', JSON.stringify({ state: { admin, customer: null }, version: 2 }));
    localStorage.setItem('ksc:lang', 'en');
  }, admin);
  await page.route('**/api/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    let result: unknown = [];
    if (url.pathname === '/api/auth/me') result = { admin, customer: null };
    if (url.pathname === '/api/content') {
      if (request.method() === 'PUT') {
        const data = request.postDataJSON();
        const index = content.findIndex(d => d.language === data.language && d.namespace === data.namespace);
        if (index < 0) content.push(data); else content[index] = data;
        result = data;
      } else result = content;
    }
    if (url.pathname.startsWith('/api/articles')) {
      if (request.method() === 'POST') {
        const data = { ...request.postDataJSON(), id: 'post-123456789abc' };
        posts.push(data); result = data;
      } else if (request.method() === 'PUT') {
        const id = url.pathname.split('/').pop();
        const data = { ...request.postDataJSON(), id };
        posts = posts.map(p => p.id === id ? data : p); result = data;
      } else result = url.searchParams.has('includeDrafts') ? posts : posts.filter(p => p.status === 'published');
    }
    await route.fulfill({ json: result });
  });
  await page.goto('/admin/blog');
  await page.getByRole('button', { name: 'Add article', exact: true }).click();
  await page.getByRole('textbox', { name: 'Title', exact: true }).fill('A story from the CMS');
  await page.getByLabel('URL slug').fill('a-story-from-the-cms');
  await page.getByLabel('Summary').fill('A managed kitchen story.');
  await page.getByLabel('Article content').fill('First paragraph.\n\nSecond paragraph.');
  await page.getByLabel('Cover image URL').fill('/images/blog/coffee-ritual.webp');
  await page.getByRole('button', { name: 'Save article', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A story from the CMS' })).toBeVisible();
  await page.goto('http://127.0.0.1:5173/blog');
  await expect(page.locator('.journal-card')).toHaveCount(6);
  await expect(page.locator('.journal-grid')).not.toContainText('A story from the CMS');
  await page.goto('/admin/blog');
  await page.locator('div.rounded-xl').filter({ has: page.getByRole('heading', { name: 'A story from the CMS' }) }).getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Visibility').selectOption('published');
  await page.getByRole('button', { name: 'Save article', exact: true }).click();
  await page.goto('http://127.0.0.1:5173/blog/a-story-from-the-cms');
  await expect(page.locator('h1')).toHaveText('A story from the CMS');
  await expect(page.locator('.journal-article-body p')).toHaveCount(2);
  await page.reload();
  await expect(page.locator('h1')).toHaveText('A story from the CMS');
  await page.goto('/admin/content');
  await page.getByLabel('Page', { exact: true }).selectOption('about');
  await page.getByLabel('about › hero › text', { exact: true }).fill('Our story is managed in the CMS.');
  await page.getByRole('button', { name: 'Save page content', exact: true }).first().click();
  await expect(page.getByText('All changes saved', { exact: true })).toBeVisible();
  await page.goto('http://127.0.0.1:5173/about');
  await expect(page.getByText('Our story is managed in the CMS.', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Our story is managed in the CMS.', { exact: true })).toBeVisible();
  await page.goto('/admin/content');
  await page.getByLabel('Page', { exact: true }).selectOption('policies');
  await page.getByLabel('legal › custom › privacy › title', { exact: true }).fill('Our privacy policy');
  await page.getByLabel('legal › custom › privacy › body', { exact: true }).fill('We respect your privacy.\n\nContact us with questions.');
  await page.getByRole('button', { name: 'Save page content', exact: true }).first().click();
  await expect(page.getByText('All changes saved', { exact: true })).toBeVisible();
  await page.goto('http://127.0.0.1:5173/privacy-policy');
  await expect(page.locator('h1')).toHaveText('Our privacy policy');
  await expect(page.getByText('We respect your privacy.', { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/admin/content');
  await expect(page.getByRole('heading', { name: 'Page content', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await expect(page.getByRole('link', { name: 'View storefront', includeHidden: true })).toHaveAttribute('href', 'http://localhost:5173/');
  await page.goto('http://127.0.0.1:5173/admin');
  await expect(page.getByRole('heading', { name: 'Admin dashboard', exact: true })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Page content', exact: true })).toHaveCount(0);
});

test('CMS routes send signed-out users to admin login', async ({ page }) => {
  await page.route('**/api/**', route => route.fulfill({ json: { admin: null, customer: null } }));
  await page.goto('/admin/content');
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.getByRole('heading', { name: 'Admin dashboard' })).toBeVisible();
});
