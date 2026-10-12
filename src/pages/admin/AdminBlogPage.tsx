import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input, Textarea, Select, LoadingState } from '@/components/common';
import { PageTitle } from '@/components/admin';
import { toast } from '@/store';
import { blogService, type BlogPost } from '@/services/contentService';
import { storefrontUrl } from '@/config/storefront';

const empty = (): BlogPost => ({ id: '', slug: '', title: '', intro: '', body: '', image: '', imageAlt: '', category: 'kitchen', time: 1, status: 'draft' });
export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [draft, setDraft] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [remove, setRemove] = useState<BlogPost | null>(null);
  const load = async () => {
    setLoading(true); setError('');
    try { setPosts(await blogService.list(true)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not load posts.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const field = <K extends keyof BlogPost>(key: K, value: BlogPost[K]) => setDraft(d => d && ({ ...d, [key]: value }));
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); if (!draft) return;
    setBusy(true);
    try {
      const { id, ...data } = draft;
      await blogService.save(data, id || undefined);
      toast.success(data.status === 'published' ? 'Article published.' : 'Draft saved.');
      setDraft(null); await load();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not save article.'); }
    finally { setBusy(false); }
  };
  return <>
    <PageTitle title="Blog" description="Write kitchen stories, save drafts, and publish articles to your journal." />
    {draft ? <form onSubmit={save} className="rounded-2xl border border-line bg-surface p-6 space-y-5">
      <h2 className="text-2xl">{draft.id ? 'Edit article' : 'New article'}</h2>
      <Input label="Title" required maxLength={200} value={draft.title} onChange={e => field('title', e.target.value)} />
      <Input label="URL slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={draft.slug} onChange={e => field('slug', e.target.value)} placeholder="a-better-coffee-routine" />
      <Textarea label="Summary" rows={3} value={draft.intro} onChange={e => field('intro', e.target.value)} />
      <Textarea label="Article content" required rows={12} value={draft.body} onChange={e => field('body', e.target.value)} />
      <p className="text-sm text-muted">Separate paragraphs with a blank line. Articles are published in the language you write them in.</p>
      <Input label="Cover image URL" required value={draft.image} onChange={e => field('image', e.target.value)} placeholder="https://… or /images/blog/your-image.webp" />
      <Input label="Image description" value={draft.imageAlt} onChange={e => field('imageAlt', e.target.value)} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Select label="Category" value={draft.category} onChange={e => field('category', e.target.value)} options={['recipes', 'coffee', 'baking', 'nutrition', 'kitchen'].map(value => ({ value, label: value }))} />
        <Input label="Reading time (minutes)" type="number" min={1} max={120} required value={draft.time} onChange={e => field('time', Number(e.target.value))} />
        <Select label="Visibility" value={draft.status} onChange={e => field('status', e.target.value as BlogPost['status'])} options={[{ value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }]} />
      </div>
      <div className="flex gap-3"><Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save article'}</Button><Button type="button" variant="outline" disabled={busy} onClick={() => setDraft(null)}>Cancel</Button></div>
    </form> : <>
      <Button onClick={() => setDraft(empty())}>Add article</Button>
      {loading ? <LoadingState /> : error ? <div role="alert" className="my-6"><p>{error}</p><Button onClick={() => void load()}>Retry</Button></div> : <div className="mt-6 space-y-3">
        {!posts.length && <p>No articles yet. Add your first story.</p>}
        {posts.map(post => <div key={post.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-line bg-surface p-5">
          <div className="flex-1"><h2 className="text-xl">{post.title}</h2><p className="text-sm text-muted">{post.category} · {post.status}</p></div>
          {post.status === 'published' && <Link to={storefrontUrl(`/blog/${post.slug}`)} target="_blank" rel="noopener noreferrer">View</Link>}
          <Button variant="outline" onClick={() => setDraft({ ...post })}>Edit</Button><Button variant="outline" onClick={() => setRemove(post)}>Delete</Button>
        </div>)}
      </div>}
    </>}
    {remove && <div role="dialog" aria-modal="true" aria-label="Delete article" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="max-w-md rounded-2xl bg-surface p-6 space-y-4"><h2 className="text-xl">Delete “{remove.title}”?</h2><p>This removes the article from the journal.</p><div className="flex gap-3"><Button disabled={busy} onClick={async () => { setBusy(true); try { await blogService.remove(remove.id); setRemove(null); await load(); } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not delete.'); } finally { setBusy(false); } }}>Delete article</Button><Button variant="outline" disabled={busy} onClick={() => setRemove(null)}>Cancel</Button></div></div></div>}
  </>;
}
