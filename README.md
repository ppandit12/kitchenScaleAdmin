# KitchenScaleCo CMS

This is a separate admin application. It contains admin pages and reusable supporting code, without customer-facing pages. It can be installed, built, and deployed independently of the storefront.

## Run locally

```powershell
cd kitchenScaleCMS
npm ci
npm run dev
```

Open **http://localhost:5174** and sign in with your existing admin account. The root URL opens `/admin`. The storefront runs separately at http://localhost:5173 and the shared backend runs at http://localhost:5000.

Both apps use the same backend and MongoDB data. Admin changes appear on the storefront; no database reset or migration is required. Keep the backend running while using the CMS.

## Manage content

- **Products:** add and edit descriptions, images, variants, prices, SKUs, stock, and active/draft status.
- **Blog:** write articles, edit existing stories, save drafts, publish, and delete. Separate paragraphs with a blank line.
- **Page content:** choose Home, About, FAQ, Policies, Contact, or Header/footer/journal, then choose a language. Edit text and save. Keep placeholders such as `{{count}}` intact.
- **Policies:** enter a custom policy title and body to replace the existing draft policy. An empty custom body uses the original page.
- **Settings:** edit social links, contact details, announcement, brand colours, currencies, languages, and shipping settings.
- **Orders, Customers, Coupons, Reviews, Messages, Marketing, Analytics:** use the existing management screens.

Images use hosted URLs or existing `/images/` paths. Page layout and image uploads are not managed by the text editor. Blog articles appear in the language in which they are written.

## Configuration and deployment

Copy `.env.example` to `.env` if changing local URLs. `VITE_STOREFRONT_URL` controls links that open the customer website, including product and blog previews. `VITE_API_PROXY` controls the local backend proxy.

Run `npm run build` to create this app's own `dist` folder. For deployment, set `VITE_STOREFRONT_URL` to the public storefront URL and serve the CMS with SPA fallback. Proxy `/api` to the backend, or set `VITE_API_URL` to the backend API URL and include both frontend origins in backend `CLIENT_ORIGIN`. Serve same-site HTTPS origins so the existing session cookie works with the API.

Admin accounts use the backend's existing authentication. Payments, email delivery, and courier integrations still require their providers to be connected.

## Checks

`npm run build` checks TypeScript and produces an independent CMS build.

`npm test -- --workers=1` verifies CMS editing, draft/published articles, policy content, mobile layout, login redirects, and storefront separation. The tests mock API responses and do not change store data; they start both frontend apps if needed.
