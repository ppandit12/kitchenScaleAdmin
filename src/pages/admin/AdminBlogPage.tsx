import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input, Textarea, Select, LoadingState } from '@/components/common';
import { PageTitle } from '@/components/admin';
import { toast } from '@/store';
import { blogService, type BlogPost } from '@/services/contentService';
import { storefrontUrl } from '@/config/storefront';
import { mediaUrl, uploadProductImage } from '@/services/mediaService';
import { ArticleEditor } from '@/components/admin/ArticleEditor';
import { articleHtml } from '@/utils/articleHtml';

function CoverPreview({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <div className="flex aspect-[3/2] items-center justify-center bg-sand p-6 text-center text-sm text-muted" role="status">{failed ? 'Cover image could not load. Check the URL or upload a picture.' : 'Upload a cover image or enter its URL to preview it here.'}</div>;
  return <img src={mediaUrl(src)} alt={alt || 'Blog cover preview'} className="aspect-[3/2] w-full object-cover" onError={() => setFailed(true)} />;
}

const empty = (): BlogPost => ({ id: '', slug: '', title: '', intro: '', body: '', image: '', imageAlt: '', category: 'kitchen', time: 1, status: 'draft' });
export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [draft, setDraft] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
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
    const content = document.createElement('div'); content.innerHTML = articleHtml(draft.body, draft.bodyFormat);
    if (!content.textContent?.trim()) { toast.error('Enter article content before saving.'); return; }
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
    {draft ? <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]"><form onSubmit={save} className="min-w-0 rounded-2xl border border-line bg-surface p-6 space-y-5">
      <h2 className="text-2xl">{draft.id ? 'Edit article' : 'New article'}</h2>
      <Input label="Title" required maxLength={200} value={draft.title} onChange={e => field('title', e.target.value)} />
      <Input label="URL slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={draft.slug} onChange={e => field('slug', e.target.value)} placeholder="a-better-coffee-routine" />
      <Textarea label="Summary" rows={3} value={draft.intro} onChange={e => field('intro', e.target.value)} />
      <ArticleEditor value={draft.body} format={draft.bodyFormat} onChange={body => setDraft(d => d && ({ ...d, body, bodyFormat: 'html' }))} />
      <Input label="Cover image URL" required value={draft.image} onChange={e => field('image', e.target.value)} placeholder="https://… or /images/blog/your-image.webp" />
      <div className="space-y-2">
        <label htmlFor="blog-cover-upload" className="field-label">Upload cover image</label>
        <input id="blog-cover-upload" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy || uploading} className="block w-full min-w-0 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-white" onChange={async event => {
          const file = event.currentTarget.files?.[0]; event.currentTarget.value = '';
          if (!file) return;
          if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) { toast.error('Choose a JPG, PNG, or WebP image up to 8 MB.'); return; }
          setUploading(true);
          try { field('image', (await uploadProductImage(file)).src); }
          catch (error) { toast.error(error instanceof Error ? error.message : 'Could not upload cover image.'); }
          finally { setUploading(false); }
        }} />
        <p role="status" className="text-xs text-muted">{uploading ? 'Uploading cover image...' : 'JPG, PNG or WebP, up to 8 MB. Your cover appears in the preview.'}</p>
      </div>
      <Input label="Image description" value={draft.imageAlt} onChange={e => field('imageAlt', e.target.value)} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Select label="Category" value={draft.category} onChange={e => field('category', e.target.value)} options={['recipes', 'coffee', 'baking', 'nutrition', 'kitchen'].map(value => ({ value, label: value }))} />
        <Input label="Reading time (minutes)" type="number" min={1} max={120} required value={draft.time} onChange={e => field('time', Number(e.target.value))} />
        <Select label="Visibility" value={draft.status} onChange={e => field('status', e.target.value as BlogPost['status'])} options={[{ value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }]} />
      </div>
      <div className="flex gap-3"><Button type="submit" disabled={busy || uploading}>{busy ? 'Saving…' : 'Save article'}</Button><Button type="button" variant="outline" disabled={busy || uploading} onClick={() => setDraft(null)}>Cancel</Button></div>
    </form>
    <aside aria-label="Blog preview" className="min-w-0 overflow-hidden rounded-2xl border border-line bg-surface xl:sticky xl:top-24">
      <div className="border-b border-line p-5"><h2 className="text-xl">Blog preview</h2><p className="mt-1 text-xs text-muted">Updates as you edit. Save your article to keep the changes.</p></div>
      <CoverPreview key={draft.image} src={draft.image} alt={draft.imageAlt} />
      <article className="space-y-4 break-words p-5">
        <p className="text-xs text-muted">{draft.category} · {draft.time} min read · {draft.status === 'published' ? 'Published' : 'Draft'}</p>
        <h3 className="text-2xl font-medium">{draft.title || 'Your article title'}</h3>
        {draft.intro && <p className="text-sm text-muted whitespace-pre-wrap">{draft.intro}</p>}
        <div className="article-rich-content max-h-[480px] overflow-y-auto text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: draft.body ? articleHtml(draft.body, draft.bodyFormat) : '<p>Your article content will appear here.</p>' }} />
      </article>
    </aside></div> : <>
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
