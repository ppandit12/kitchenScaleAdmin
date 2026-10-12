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

New products start as drafts, which are hidden from the customer shop. Click **Publish** in the Products list, or select **Active** in the editor and save. Published products with zero stock still appear in the shop as sold out. Enter your actual available quantity in the variant's Stock field to enable purchasing. The shop refreshes its catalog when you return to its tab.
- **Blog:** write articles, edit existing stories, save drafts, publish, and delete. Separate paragraphs with a blank line.
- **Page content:** choose Home, About, FAQ, Policies, Contact, or Header/footer/journal, then choose a language. Edit text and save. Keep placeholders such as `{{count}}` intact.
- **Policies:** enter a custom policy title and body to replace the existing draft policy. An empty custom body uses the original page.
- **Settings:** edit social links, contact details, announcement, brand colours, currencies, languages, and shipping settings.
- **Orders, Customers, Coupons, Reviews, Messages, Marketing, Analytics:** use the existing management screens.

Products support direct JPG, PNG, and WebP uploads (up to 8 MB each), hosted URLs, and existing `/images/` paths. The Product photos section is at the top of the editor. The first photo becomes the main product image; use the arrows to reorder photos. Save the product after uploading. Blog images still use URLs or existing paths. Blog articles appear in the language in which they are written.

Uploaded files are served by the shared backend at `/api/media/`. For deployment, use a persistent backend upload directory (`UPLOAD_DIR`); its default is `kitchenScaleBackend/uploads`. Include that directory in file backups.

## Configuration and deployment

Copy `.env.example` to `.env` if changing local URLs. `VITE_STOREFRONT_URL` controls links that open the customer website, including product and blog previews. `VITE_API_PROXY` controls the local backend proxy.

Run `npm run build` to create this app's own `dist` folder. For deployment, set `VITE_STOREFRONT_URL` to the public storefront URL and serve the CMS with SPA fallback. Proxy `/api` to the backend, or set `VITE_API_URL` to the backend API URL and include both frontend origins in backend `CLIENT_ORIGIN`. Serve same-site HTTPS origins so the existing session cookie works with the API.

Admin accounts use the backend's existing authentication. Payments, email delivery, and courier integrations still require their providers to be connected.

## Checks

`npm run build` checks TypeScript and produces an independent CMS build.

`npm test -- --workers=1` verifies CMS editing, draft/published articles, policy content, mobile layout, login redirects, and storefront separation. The tests mock API responses and do not change store data; they start both frontend apps if needed.
