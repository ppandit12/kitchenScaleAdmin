import { useEffect, useState } from 'react';
import { Button, Input, Textarea, Select, LoadingState } from '@/components/common';
import { PageTitle } from '@/components/admin';
import { toast } from '@/store';
import i18n from '@/i18n';
import { contentService, applyContent, type PageContent } from '@/services/contentService';

const sections = [
  { value: 'home', label: 'Home', namespaces: ['home', 'design'], prefixes: ['hero.', 'benefits.', 'featured.', 'how.', 'showcase.', 'faq.', 'newsletter.', 'trust.', 'product.', 'gallery.', 'everyday.', 'uses.', 'reviews.', 'cta.', 'carousel.', 'reference.'] },
  { value: 'about', label: 'About', namespaces: ['content', 'design'], prefixes: ['about.', 'pages.about', 'pages.ourStory', 'pages.storyAlt'] },
  { value: 'faq', label: 'FAQ', namespaces: ['faq'], prefixes: [] },
  { value: 'policies', label: 'Policies', namespaces: ['content'], prefixes: ['legal.'] },
  { value: 'contact', label: 'Contact', namespaces: ['content', 'design'], prefixes: ['contact.', 'pages.contact'] },
  { value: 'store', label: 'Header, footer & journal', namespaces: ['common', 'design'], prefixes: ['nav.', 'footer.', 'header.', 'blog.', 'pages.blog', 'pages.categories.'] },
];
function flatten(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  return Object.fromEntries(Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') return [[path, value]];
    return value && typeof value === 'object' ? Object.entries(flatten(value as Record<string, unknown>, path)) : [];
  }));
}
export default function AdminContentPage() {
  const [language, setLanguage] = useState('en');
  const [section, setSection] = useState('home');
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [docs, setDocs] = useState<PageContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const load = () => { setLoading(true); setError(''); contentService.list().then(data => { setDocs(data); applyContent(data); }).catch(e => setError(e.message)).finally(() => setLoading(false)); };
  useEffect(load, []);
  useEffect(() => {
    const next: Record<string, string> = {};
    for (const ns of sections.find(s => s.value === section)!.namespaces) {
      for (const [key, value] of Object.entries(flatten(i18n.getResourceBundle(language, ns) ?? {}))) next[`${ns}:${key}`] = value;
    }
    if (section === 'policies') {
      for (const policy of ['shipping', 'refund', 'privacy', 'terms']) {
        for (const field of ['title', 'body']) {
          const key = `legal.custom.${policy}.${field}`;
          next[`content:${key}`] = i18n.getResource(language, 'content', key) ?? '';
        }
      }
    }
    setDraft(next); setDirty(false);
  }, [language, section, docs]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const config = sections.find(s => s.value === section)!;
  const fields = Object.entries(draft).filter(([id, value]) => {
    const key = id.split(':')[1];
    return (!config.prefixes.length || config.prefixes.some(p => key.startsWith(p))) && `${key} ${value}`.toLowerCase().includes(search.toLowerCase());
  });
  const save = async () => {
    setBusy(true);
    try {
      // Save each namespace independently, preserving content from other pages.
      const updated = [...docs];
      for (const ns of config.namespaces) {
        const values = { ...(docs.find(d => d.language === language && d.namespace === ns)?.values ?? {}) };
        for (const [id, value] of Object.entries(draft)) {
          const [namespace, key] = id.split(':');
          if (namespace === ns && (!config.prefixes.length || config.prefixes.some(p => key.startsWith(p)))) values[key] = value;
        }
        const saved = await contentService.save({ language, namespace: ns, values });
        const index = updated.findIndex(d => d.language === language && d.namespace === ns);
        if (index < 0) updated.push(saved); else updated[index] = saved;
        applyContent([saved]);
      }
      setDocs(updated); setDirty(false); toast.success('Page content saved.');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not save content.'); }
    finally { setBusy(false); }
  };
  const switchTo = (change: () => void) => { if (!dirty || window.confirm('Discard your unsaved changes?')) change(); };
  return <>
    <PageTitle title="Page content" description="Edit storefront text for each language. Saved changes appear on the website." />
    <div className="rounded-2xl border border-line bg-surface p-6 space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Select label="Page" disabled={busy} value={section} options={sections} onChange={e => switchTo(() => setSection(e.target.value))} />
        <Select label="Language" disabled={busy} value={language} options={[{ value: 'en', label: 'English' }, { value: 'fr', label: 'French' }, { value: 'de', label: 'German' }, { value: 'es', label: 'Spanish' }]} onChange={e => switchTo(() => setLanguage(e.target.value))} />
        <Input label="Find a text field" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <p className="text-sm text-muted">Keep placeholders such as {'{{count}}'} unchanged. Use Products for catalog content, Blog for articles, and Settings for social links and store details.</p>
      {section === 'policies' && <p className="text-sm text-muted">Enter a custom policy body to replace the existing draft policy. Leave it empty to use the original page. Separate paragraphs with a blank line.</p>}
      {loading ? <LoadingState /> : error ? <div role="alert"><p>{error}</p><Button onClick={load}>Retry</Button></div> : <>
        <div className="flex items-center gap-4"><Button disabled={busy || !dirty} onClick={() => void save()}>{busy ? 'Saving…' : 'Save page content'}</Button><span className="text-sm text-muted">{dirty ? 'Unsaved changes' : 'All changes saved'}</span></div>
        {!fields.length && <p>No matching fields.</p>}
        {fields.map(([id, value]) => <Textarea key={id} label={id.split(':')[1].split('.').join(' › ')} rows={value.length > 180 ? 4 : 2} value={value} disabled={busy} onChange={e => { setDraft(d => ({ ...d, [id]: e.target.value })); setDirty(true); }} />)}
        <Button disabled={busy || !dirty} onClick={() => void save()}>Save page content</Button>
      </>}
    </div>
  </>;
}
