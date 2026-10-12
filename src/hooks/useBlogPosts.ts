import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { blogService, type BlogPost } from '@/services/contentService';
export function useBlogPosts() {
  const { i18n } = useTranslation();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const refresh = () => setRetry(n => n + 1);
    i18n.on('loaded', refresh);
    return () => { i18n.off('loaded', refresh); };
  }, [i18n]);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    blogService.list().then(data => { if (active) setPosts(data); })
      .catch(() => { if (active) setError('Could not load articles. Please try again.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [i18n.language, retry]);
  return { posts, loading, error, reload: () => setRetry(n => n + 1) };
}
