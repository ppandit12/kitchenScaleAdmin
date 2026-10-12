import { useEffect, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle, Color } from '@tiptap/extension-text-style';
import { articleHtml } from '@/utils/articleHtml';

export function ArticleEditor({ value, format, onChange }: { value: string; format?: string; onChange: (html: string) => void }) {
  const [source, setSource] = useState(false);
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3, 4] } }), TextStyle, Color],
    content: articleHtml(value, format),
    editorProps: { attributes: { class: 'article-rich-content min-h-72 p-4 outline-none', role: 'textbox', 'aria-label': 'Article content', 'aria-multiline': 'true' } },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });
  useEffect(() => {
    if (!editor || source || editor.isFocused) return;
    const html = articleHtml(value, format);
    if (editor.getHTML() !== html) editor.commands.setContent(html, { emitUpdate: false });
  }, [editor, value, format, source]);
  const control = 'rounded-lg border border-line bg-surface px-3 py-1.5 text-sm hover:bg-sand focus-visible:outline-2 focus-visible:outline-primary';
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2"><span className="field-label">Article content <span className="text-danger">*</span></span>
        <div className="flex gap-2">
          <button type="button" className={control} aria-pressed={!source} onClick={() => {
            setSource(false);
            const html = articleHtml(value, format); editor?.commands.setContent(html, { emitUpdate: false });
            onChange(editor?.getHTML() ?? html);
          }}>Visual editor</button>
          <button type="button" className={control} aria-pressed={source} onClick={() => {
            if (format !== 'html') onChange(articleHtml(value, format));
            setSource(true);
          }}>HTML code</button>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        {!source && <div role="toolbar" aria-label="Article formatting" className="flex flex-wrap items-center gap-2 border-b border-line bg-cream p-3">
          <select aria-label="Text format" className={control} defaultValue="p" onChange={event => {
            const level = Number(event.target.value);
            if (level) editor?.chain().focus().setHeading({ level: level as 2 | 3 | 4 }).run();
            else editor?.chain().focus().setParagraph().run();
          }}><option value="p">Paragraph</option><option value="2">Heading 2</option><option value="3">Heading 3</option><option value="4">Heading 4</option></select>
          <button type="button" className={control} onClick={() => editor?.chain().focus().toggleBold().run()}><strong>Bold</strong></button>
          <button type="button" className={control} onClick={() => editor?.chain().focus().toggleItalic().run()}><em>Italic</em></button>
          <button type="button" className={control} onClick={() => editor?.chain().focus().toggleUnderline().run()}><u>Underline</u></button>
          <button type="button" className={control} onClick={() => editor?.chain().focus().toggleBulletList().run()}>Bullet list</button>
          <button type="button" className={control} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>Numbered list</button>
          <button type="button" className={control} onClick={() => editor?.chain().focus().toggleBlockquote().run()}>Quote</button>
          <label className="flex items-center gap-2 text-sm">Text colour<input type="color" aria-label="Text colour" defaultValue="#333333" className="h-8 w-9 cursor-pointer" onChange={event => editor?.chain().focus().setColor(event.target.value).run()} /></label>
          <button type="button" className={control} onClick={() => editor?.chain().focus().unsetAllMarks().run()}>Clear style</button>
          <button type="button" className={control} onClick={() => editor?.chain().focus().undo().run()}>Undo</button>
          <button type="button" className={control} onClick={() => editor?.chain().focus().redo().run()}>Redo</button>
        </div>}
        {source ? <textarea aria-label="Article content" spellCheck={false} className="block min-h-80 w-full resize-y bg-[#1e242c] p-4 font-mono text-sm leading-relaxed text-[#edf2f7] outline-none" value={value} onChange={event => onChange(event.target.value)} /> : <EditorContent editor={editor} />}
      </div>
      <p className="text-xs text-muted">Select text to format it or choose a colour. Use HTML code to edit the markup directly.</p>
    </div>
  );
}
