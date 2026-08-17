import { describe, it, expect } from 'vitest';
import { sanitizeHtml, decodeHtmlEntities } from './sanitize';

describe('Sanitization & HTML Decoding Utilities', () => {
  describe('decodeHtmlEntities', () => {
    it('should unescape named and numeric HTML entities', () => {
      expect(decodeHtmlEntities('&lt;p&gt;Hello &amp; Welcome&lt;/p&gt;')).toBe('<p>Hello & Welcome</p>');
      expect(decodeHtmlEntities('&#39;Senior Engineer&#39;')).toBe("'Senior Engineer'");
    });
  });

  describe('sanitizeHtml', () => {
    it('should strip malicious script tags while preserving rich formatting tags', () => {
      const dirty = '<div><h3>About the Role</h3><script>alert("XSS")</script><p>We use <strong>Go</strong> and <em>React</em>.</p></div>';
      const clean = sanitizeHtml(dirty);

      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('alert("XSS")');
      expect(clean).toContain('<h3>About the Role</h3>');
      expect(clean).toContain('<strong>Go</strong>');
    });

    it('should handle unescaped HTML entities in dirty input', () => {
      const raw = '&lt;h2&gt;Responsibilities&lt;/h2&gt;&lt;p&gt;Build scalable microservices.&lt;/p&gt;';
      const clean = sanitizeHtml(raw);

      expect(clean).toContain('<h2>Responsibilities</h2>');
      expect(clean).toContain('<p>Build scalable microservices.</p>');
    });
  });
});
