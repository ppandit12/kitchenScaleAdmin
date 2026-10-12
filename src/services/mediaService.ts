import { http } from './http';
export const uploadProductImage = (file: File) => http.post<{ src: string }>('/media', file);
export function mediaUrl(src: string) {
  const api = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
  return src.startsWith('/api/media/') && api ? `${api.replace(/\/api$/, '')}${src}` : src;
}
