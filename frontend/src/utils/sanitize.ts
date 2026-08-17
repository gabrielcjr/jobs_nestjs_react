import DOMPurify from 'dompurify';

/**
 * Decodes HTML entities (e.g. &lt;div&gt;, &quot;, &amp;)
 * Handles single and double entity encoding from ATS APIs like Greenhouse, Lever, Ashby.
 */
export function decodeHtmlEntities(str: string): string {
  if (!str) return '';

  // Check if string contains escaped entities
  if (!/&[a-z0-9#]+;/i.test(str)) {
    return str;
  }

  try {
    if (typeof window !== 'undefined' && typeof DOMParser !== 'undefined') {
      const parser = new DOMParser();
      let decoded = str;
      // Up to 2 passes to decode double-escaped entities safely
      for (let i = 0; i < 2; i++) {
        if (/&[a-z0-9#]+;/i.test(decoded)) {
          const doc = parser.parseFromString(decoded, 'text/html');
          const text = doc.documentElement.textContent;
          if (text) {
            decoded = text;
          } else {
            break;
          }
        } else {
          break;
        }
      }
      return decoded;
    }
  } catch (e) {
    // Fallback if DOMParser is unavailable
  }

  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ');
}

/**
 * Sanitizes dirty HTML strings using DOMPurify after decoding any escaped entity markup.
 */
export function sanitizeHtml(dirtyHtml: string): string {
  if (!dirtyHtml) return '';

  // Step 1: Decode entities so tags like &lt;p&gt; become <p>
  const unescaped = decodeHtmlEntities(dirtyHtml);

  // Step 2: Sanitize to prevent XSS while preserving rich typography tags
  return DOMPurify.sanitize(unescaped, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'b', 'i', 'em', 'strong', 'a',
      'ul', 'ol', 'li', 'br', 'hr', 'blockquote',
      'code', 'pre', 'span', 'div', 'table', 'thead',
      'tbody', 'tr', 'th', 'td', 'section', 'article',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'id', 'title'],
    ADD_ATTR: ['target'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form'],
  });
}
