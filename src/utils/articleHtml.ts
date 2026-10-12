import DOMPurify from 'dompurify';

export function articleHtml(body: string, format?: string): string {
  if (format !== 'html') {
    const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    return body.split(/\n\s*\n/).map(p => `<p>${escape(p).replace(/\n/g, '<br>')}</p>`).join('');
  }
  const clean = DOMPurify.sanitize(body, {
    ALLOWED_TAGS: ['p', 'div', 'br', 'h2', 'h3', 'h4', 'strong', 'b', 'em', 'i', 'u', 's', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'a', 'span', 'hr'],
    ALLOWED_ATTR: ['href', 'title', 'style'], ALLOW_DATA_ATTR: false, ALLOW_ARIA_ATTR: false,
  });
  const template = document.createElement('template'); template.innerHTML = clean;
  template.content.querySelectorAll<HTMLElement>('[style]').forEach(node => {
    const color = node.style.color;
    node.removeAttribute('style');
    if (color && /^(#[\da-f]{3,8}|[a-z]+|rgba?\([\d\s.,%]+\)|hsla?\([\d\s.,%]+\))$/i.test(color)) node.style.color = color;
  });
  template.content.querySelectorAll('a').forEach(node => {
    const href = node.getAttribute('href') ?? '';
    if (!/^(https?:\/\/|mailto:|\/[^/]|#)/i.test(href)) node.removeAttribute('href');
  });
  return template.innerHTML;
}
