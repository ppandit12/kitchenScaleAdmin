import type { ProductImage } from '@/types';
const whitePhotos = ['scale-coffee-studio.jpg', 'scale-baking.jpg', 'scale-flour.jpg', 'scale-spices.jpg', 'scale-ingredients.jpg'];
export function imageColor(image: ProductImage): string | undefined {
  if (image.color !== undefined) return image.color || undefined;
  return whitePhotos.some(name => image.src === `/images/client/${name}`) ? 'White' : undefined;
}
