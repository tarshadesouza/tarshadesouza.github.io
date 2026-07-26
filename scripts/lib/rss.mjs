/**
 * Just enough RSS to read a Medium feed — no dependencies.
 *
 * Medium's feed wraps most fields in CDATA and puts the whole post body in
 * <content:encoded>, so the excerpt has to be recovered from HTML. Covered by
 * scripts/lib/rss.test.mjs against a real-shaped feed.
 */

export function stripTags(html) {
  return html
    .replace(/<figure[\s\S]*?<\/figure>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tagText(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  if (!match) return '';
  return match[1].replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim();
}

const EXCERPT_LENGTH = 190;

export function parseFeed(xml, limit = 6) {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);

  return items.slice(0, limit).map((item) => {
    const body = stripTags(tagText(item, 'content:encoded'));
    const words = body ? body.split(' ').length : 0;
    const published = new Date(tagText(item, 'pubDate'));

    return {
      title: stripTags(tagText(item, 'title')),
      url: tagText(item, 'link').split('?')[0],
      publishedAt: Number.isNaN(published.getTime()) ? null : published.toISOString(),
      excerpt:
        body.slice(0, EXCERPT_LENGTH).trim() + (body.length > EXCERPT_LENGTH ? '…' : ''),
      tags: [...item.matchAll(/<category>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/category>/g)]
        .map((m) => m[1].trim())
        .filter(Boolean)
        .slice(0, 4),
      readingMinutes: Math.max(1, Math.round(words / 220)),
    };
  });
}
