import { http } from './http';
export const uploadProductImage = (file: File) => {
  const form = new FormData();
  form.append('image', file);
  return http.post<{ src: string }>('/media', form);
};
export function mediaUrl(src: string) {
  const api = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
  return src.startsWith('/api/media/') && api ? `${api.replace(/\/api$/, '')}${src}` : src;
}
