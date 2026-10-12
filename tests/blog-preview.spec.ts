import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';

test('blog cover upload and live article preview', async ({ page }) => {
  const admin = { name: 'Store Admin', email: 'admin@example.com', role: 'admin' };
  await page.addInitScript(admin => localStorage.setItem('ksc:auth', JSON.stringify({ state: { admin, customer: null }, version: 2 })), admin);
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path.startsWith('/api/media/')) { await route.fulfill({ path: resolve('public/images/client/shopify-coffee-hero.png'), contentType: 'image/png' }); return; }
    if (path === '/api/media') { await route.fulfill({ status: 201, json: { src: '/api/media/00000000-0000-0000-0000-000000000001.png' } }); return; }
    await route.fulfill({ json: path === '/api/auth/me' ? { admin, customer: null } : [] });
  });
  await page.goto('/admin/blog');
  await page.getByRole('button', { name: 'Add article', exact: true }).click();
  const preview = page.getByRole('complementary', { name: 'Blog preview' });
  await page.getByRole('textbox', { name: 'Title', exact: true }).fill('A better coffee routine');
  await page.getByLabel('Article content').fill('First paragraph.\n\nSecond paragraph.');
  await expect(preview).toContainText('A better coffee routine');
  await expect(preview).toContainText('Second paragraph.');
  const content = page.getByRole('textbox', { name: 'Article content', exact: true });
  await content.focus();
  await page.keyboard.press('Control+a');
  await page.getByRole('button', { name: 'Bold', exact: true }).click();
  await expect(preview.locator('strong').first()).toContainText('First paragraph.');
  await page.getByLabel('Text colour', { exact: true }).fill('#0066cc');
  await expect(preview.locator('span').filter({ hasText: 'First paragraph.' }).first()).toHaveCSS('color', 'rgb(0, 102, 204)');
  await page.getByLabel('Upload cover image').setInputFiles(resolve('public/images/client/shopify-coffee-hero.png'));
  await expect(preview.locator('img')).toBeVisible();
  expect(await preview.locator('img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBeTruthy();
  await expect(page.getByRole('textbox', { name: 'Cover image URL' })).toHaveValue('/api/media/00000000-0000-0000-0000-000000000001.png');
  await page.getByRole('textbox', { name: 'Cover image URL' }).fill('/missing-cover.png');
  await expect(preview).toContainText('Cover image could not load.');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});

test('HTML formatting, colours and safe rendering persist into the published article', async ({ page }) => {
  const admin = { name: 'Store Admin', email: 'admin@example.com', role: 'admin' };
  let saved: Record<string, any> | null = null;
  await page.addInitScript(admin => localStorage.setItem('ksc:auth', JSON.stringify({ state: { admin, customer: null }, version: 2 })), admin);
  await page.route('**/api/**', async route => {
    const request = route.request(); const path = new URL(request.url()).pathname;
    if (path === '/api/articles' && request.method() === 'POST') { saved = { ...request.postDataJSON(), id: 'post-123456789abc' }; await route.fulfill({ status: 201, json: saved }); return; }
    await route.fulfill({ json: path === '/api/auth/me' ? { admin, customer: null } : path === '/api/articles' ? saved ? [saved] : [] : [] });
  });
  await page.goto('/admin/blog');
  await page.getByRole('button', { name: 'Add article', exact: true }).click();
  await page.getByRole('textbox', { name: 'Title', exact: true }).fill('Colourful kitchen story');
  await page.getByLabel('URL slug').fill('colourful-kitchen-story');
  await page.getByRole('button', { name: 'HTML code', exact: true }).click();
  await page.getByLabel('Article content').fill('<h2>A heading</h2><p><strong>Bold words</strong> <span style="color: #ff0000; position: fixed">Red text</span></p><ul><li>A list item</li></ul><script>window.articleAttack=true</script><a href="javascript:alert(1)">Bad link</a>');
  const preview = page.getByRole('complementary', { name: 'Blog preview' });
  await expect(preview.getByRole('heading', { name: 'A heading' })).toBeVisible();
  await expect(preview.locator('strong')).toHaveText('Bold words');
  await expect(preview.locator('span').filter({ hasText: 'Red text' })).toHaveCSS('color', 'rgb(255, 0, 0)');
  await expect(preview.locator('script')).toHaveCount(0);
  expect(await preview.locator('span').filter({ hasText: 'Red text' }).evaluate(e => (e as HTMLElement).style.position)).toBe('');
  await page.getByRole('button', { name: 'Visual editor', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Article content', exact: true }).locator('h2')).toHaveText('A heading');
  const editorTypography = await page.getByRole('textbox', { name: 'Article content', exact: true }).evaluate(element => {
    const style = getComputedStyle(element);
    return { fontFamily: style.fontFamily, fontSize: style.fontSize, lineHeight: style.lineHeight, color: style.color };
  });
  await page.getByRole('textbox', { name: 'Cover image URL' }).fill('/images/blog/coffee-ritual.webp');
  await page.getByLabel('Visibility').selectOption('published');
  await page.getByRole('button', { name: 'Save article', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Colourful kitchen story' })).toBeVisible();
  expect(saved?.bodyFormat).toBe('html');
  await page.goto('http://127.0.0.1:5173/blog/colourful-kitchen-story');
  await expect(page.getByRole('heading', { name: 'A heading' })).toBeVisible();
  await expect(page.locator('.article-rich-content strong')).toHaveText('Bold words');
  await expect(page.locator('.article-rich-content span').filter({ hasText: 'Red text' })).toHaveCSS('color', 'rgb(255, 0, 0)');
  await expect(page.locator('.article-rich-content ul li')).toHaveText('A list item');
  for (const [property, value] of Object.entries(editorTypography)) {
    const cssProperty = property.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
    await expect(page.locator('.article-rich-content')).toHaveCSS(cssProperty, value);
  }
  await expect(page.locator('.journal-article-card')).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).articleAttack)).toBeUndefined();
});
