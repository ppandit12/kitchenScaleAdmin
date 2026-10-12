import { http } from './http';
import i18n from '@/i18n';
import { articles } from '@/data/articles';

export interface BlogPost {
  bodyFormat?: 'plain' | 'html';
  id: string; slug: string; title: string; intro: string; body: string;
  image: string; imageAlt: string; category: string; time: number;
  status: 'published' | 'draft' | 'archived';
}
export interface PageContent { language: string; namespace: string; values: Record<string, string> }
export const contentService = {
  list: () => http.get<PageContent[]>('/content'),
  save: (data: PageContent) => http.put<PageContent>('/content', data),
};
export function applyContent(docs: PageContent[]) {
  for (const doc of docs) {
    for (const [key, value] of Object.entries(doc.values)) i18n.addResource(doc.language, doc.namespace, key, value);
  }
  i18n.emit('loaded', {});
}
export const blogService = {
  async list(admin = false): Promise<BlogPost[]> {
    const overrides = await http.get<BlogPost[]>(`/articles${admin ? '?includeDrafts=1' : ''}`);
    const base: BlogPost[] = articles.map(a => ({
      ...a, id: `legacy-${a.id}`, image: `/images/blog/${a.image}.webp`,
      title: i18n.t(`blog.articles.${a.id}.title`, { ns: 'design' }),
      intro: i18n.t(`blog.articles.${a.id}.intro`, { ns: 'design' }),
      body: i18n.t(`blog.articles.${a.id}.body`, { ns: 'design' }),
      imageAlt: i18n.t(`blog.imageAlts.${a.id}`, { ns: 'design' }), status: 'published',
    }));
    const map = new Map(base.map(a => [a.id, a]));
    for (const post of overrides) map.set(post.id, { ...map.get(post.id), ...post });
    const visible = [...map.values()].filter(a => admin ? a.status !== 'archived' : a.status === 'published');
    return [...visible.filter(a => !a.id.startsWith('legacy-')), ...visible.filter(a => a.id.startsWith('legacy-'))];
  },
  save: (post: Omit<BlogPost, 'id'>, id?: string) => id ? http.put<BlogPost>(`/articles/${id}`, post) : http.post<BlogPost>('/articles', post),
  remove: (id: string) => http.delete(`/articles/${id}`),
};
