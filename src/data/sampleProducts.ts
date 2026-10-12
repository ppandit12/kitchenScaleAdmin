import type { Product, ProductVariant } from '@/types';

/**
 * Seed catalogue. Prices are DEMONSTRATION values in USD until the client supplies real pricing.
 * Specifications marked "supplier-listed" come from the client's existing store listing and
 * must be verified before launch — the UI shows `specsNote` beneath them.
 */

export const COLOR_SWATCHES: Record<string, string> = {
  Black: '#2b2f2c',
  White: '#f1eee8',
  Pink: '#e7b7b4',
};

const BASE_PRICE = 18.99;
const TWIN_PRICE = 33.99;

const stockTable: Record<string, number> = {
  'Black/Single': 42,
  'Black/Twin Pack': 18,
  'White/Single': 27,
  'White/Twin Pack': 4,
  'Pink/Single': 6,
  'Pink/Twin Pack': 0,
};

function buildVariants(): ProductVariant[] {
  const colors = ['Black', 'White', 'Pink'];
  const packs = ['Single', 'Twin Pack'];
  const variants: ProductVariant[] = [];
  for (const color of colors) {
    for (const pack of packs) {
      const twin = pack === 'Twin Pack';
      variants.push({
        id: `var-mss-${color.toLowerCase()}-${twin ? 'twin' : 'single'}`,
        sku: `KSC-MSS-${color.slice(0, 3).toUpperCase()}-${twin ? '2' : '1'}`,
        title: `${color} / ${pack}`,
        options: { Color: color, Pack: pack },
        price: twin ? TWIN_PRICE : BASE_PRICE,
        compareAtPrice: twin ? BASE_PRICE * 2 : undefined,
        stock: stockTable[`${color}/${pack}`],
        weightGrams: twin ? 260 : 120,
        colorHex: COLOR_SWATCHES[color],
        units: twin ? 2 : 1,
      });
    }
  }
  return variants;
}

export const sampleProducts: Product[] = [
  {
    id: 'prod-mini-spoon-scale',
    slug: 'mini-spoon-scale',
    name: 'Mini Spoon Scale',
    tagline: 'Precision in Every Scoop',
    category: 'Kitchen Accessories',
    shortDescription:
      'A measuring spoon with a built-in digital display — scoop, read, and add to your recipe without reaching for a separate scale.',
    description:
      'The KitchenScaleCo Mini Spoon Scale combines a measuring spoon with a compact digital scale, so you can weigh small amounts of ingredients right as you scoop them. It is designed for everyday cooking, baking, coffee and meal prep — wherever small quantities matter. The spoon head detaches for cleaning, and the slim handle stores easily in a drawer.',
    features: [
      'Measure ingredients as you scoop them',
      'Clear digital readout on the handle',
      'Detachable spoon head for easier cleaning',
      'Slim, lightweight handle that fits in a drawer',
      'Multiple display units',
    ],
    specifications: [
      { label: 'Capacity (supplier-listed)', value: 'Up to 500 g' },
      { label: 'Display increments (supplier-listed)', value: '0.1 g' },
      { label: 'Units (supplier-listed)', value: 'g, oz, gn, ct' },
      { label: 'Display', value: 'Digital LCD' },
      { label: 'Spoon head', value: 'Detachable, hand-washable' },
      { label: 'Power', value: 'Battery-powered — battery type to be confirmed' },
      { label: 'Colours', value: 'Black, White, Pink' },
    ],
    specsNote:
      'Specifications marked "supplier-listed" are taken from the existing product listing and are pending independent verification. Final specifications will be confirmed before launch.',
    options: [
      { name: 'Color', values: ['Black', 'White', 'Pink'] },
      { name: 'Pack', values: ['Single', 'Twin Pack'] },
    ],
    variants: buildVariants(),
    images: [
      { id: 'img-hero', view: 'hero', alt: 'Mini Spoon Scale on a linen background' },
      { id: 'img-angle', view: 'angle', alt: 'Mini Spoon Scale shown at an angle' },
      { id: 'img-display', view: 'display', alt: 'Close-up of the digital display on the handle' },
      { id: 'img-detail', view: 'detail', alt: 'Detachable spoon head separated from the handle' },
      { id: 'img-lifestyle', view: 'lifestyle', alt: 'Mini Spoon Scale measuring spice on a wooden board' },
      { id: 'img-pack', view: 'pack', alt: 'Two Mini Spoon Scales side by side' },
    ],
    status: 'active',
    createdAt: '2026-08-01T09:00:00.000Z',
    updatedAt: '2026-09-20T09:00:00.000Z',
  },
];

/** Additional sample listings for exercising search, sorting and combined filters. */
const sampleListings = [
  { slug: 'coffee-scoop-scale', name: 'Coffee Scoop Scale', category: 'Coffee Tools', tagline: 'A measured start to every morning', price: 22.99, colors: ['Black', 'White'], stock: 24, units: 1, image: 'scale-coffee-studio.jpg', ingredient: 'coffee grounds' },
  { slug: 'baking-spoon-scale', name: 'Baking Spoon Scale', category: 'Baking Essentials', tagline: 'Small measures for your favorite bakes', price: 24.99, colors: ['White', 'Pink'], stock: 16, units: 1, image: 'scale-flour.jpg', ingredient: 'flour, yeast and baking powder' },
  { slug: 'spice-scoop-scale', name: 'Spice Scoop Scale', category: 'Spice Tools', tagline: 'Bring balance to every blend', price: 16.99, colors: ['White', 'Black'], stock: 30, units: 1, image: 'scale-spices.jpg', ingredient: 'spices and dried herbs' },
  { slug: 'meal-prep-spoon-scale', name: 'Meal Prep Spoon Scale', category: 'Meal Prep', tagline: 'Make everyday portions easier', price: 27.99, colors: ['Pink', 'Black'], stock: 8, units: 1, image: 'scale-ingredients.jpg', ingredient: 'small ingredient portions' },
  { slug: 'coffee-spoon-scale-duo', name: 'Coffee Spoon Scale Duo', category: 'Coffee Tools', tagline: 'One for home, one for your coffee corner', price: 39.99, colors: ['Black', 'White'], stock: 12, units: 2, image: 'scale-coffee-studio.jpg', ingredient: 'coffee grounds' },
  { slug: 'baking-spoon-scale-trio', name: 'Baking Spoon Scale Trio', category: 'Baking Essentials', tagline: 'Three scoops for busy baking days', price: 54.99, colors: ['White', 'Pink'], stock: 6, units: 3, image: 'scale-baking.jpg', ingredient: 'baking ingredients' },
  { slug: 'spice-spoon-scale-duo', name: 'Spice Spoon Scale Duo', category: 'Spice Tools', tagline: 'Keep sweet and savory scoops separate', price: 31.99, colors: ['Pink', 'White'], stock: 0, units: 2, image: 'scale-spices.jpg', ingredient: 'spices and seasoning blends' },
  { slug: 'family-spoon-scale-set', name: 'Family Spoon Scale Set', category: 'Kitchen Accessories', tagline: 'A scoop for every kitchen station', price: 79.99, colors: ['Black', 'White', 'Pink'], stock: 10, units: 4, image: 'scale-ingredients.jpg', ingredient: 'coffee, spices and baking ingredients' },
];

sampleProducts.push(...sampleListings.map((listing): Product => ({
  id: `prod-${listing.slug}`,
  slug: listing.slug,
  name: listing.name,
  tagline: listing.tagline,
  category: listing.category,
  shortDescription: `${listing.units === 1 ? 'A digital spoon scale' : `A set of ${listing.units} digital spoon scales`} for measuring ${listing.ingredient}.`,
  description: `Measure ${listing.ingredient} as you scoop. This sample listing includes ${listing.units} spoon ${listing.units === 1 ? 'scale' : 'scales'} in your selected color, with a digital display and detachable spoon head for everyday kitchen use.`,
  features: ['Digital display on the handle', 'Detachable spoon head', 'Compact drawer storage', `${listing.units} spoon ${listing.units === 1 ? 'scale' : 'scales'} included`],
  specifications: [{ label: 'Pack quantity', value: String(listing.units) }, { label: 'Colors', value: listing.colors.join(', ') }],
  specsNote: 'Sample catalog listing for testing. Pricing and final product details are demonstration values.',
  options: [{ name: 'Color', values: listing.colors }, { name: 'Pack', values: [listing.units === 1 ? 'Single' : `${listing.units}-Pack`] }],
  variants: listing.colors.map((color, index) => ({
    id: `var-${listing.slug}-${color.toLowerCase()}`,
    sku: `KSC-${listing.slug.toUpperCase()}-${color.slice(0, 3).toUpperCase()}`,
    title: `${color} / ${listing.units === 1 ? 'Single' : `${listing.units}-Pack`}`,
    options: { Color: color, Pack: listing.units === 1 ? 'Single' : `${listing.units}-Pack` },
    price: listing.price + index * 2,
    stock: listing.stock === 0 ? 0 : Math.max(0, listing.stock - index * 8),
    weightGrams: listing.units * 120,
    colorHex: COLOR_SWATCHES[color],
    units: listing.units,
  })),
  images: [{ id: `img-${listing.slug}`, view: 'lifestyle', alt: `${listing.name} shown measuring ingredients`, src: `/images/client/${listing.image}` }],
  status: 'active',
  createdAt: '2026-10-09T09:00:00.000Z',
  updatedAt: '2026-10-09T09:00:00.000Z',
})));

