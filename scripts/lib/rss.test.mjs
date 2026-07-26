/**
 * Run with: npm test
 *
 * The fixture mirrors the shape Medium actually serves: CDATA everywhere, the
 * full post in <content:encoded>, a leading <figure> for the header image, and
 * tracking params on the link.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFeed, stripTags, tagText } from './rss.mjs';

const FEED = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
<channel>
  <title><![CDATA[Stories by Tarsha de Souza on Medium]]></title>
  <item>
    <title><![CDATA[Fixing CI with an agent &amp; a checkbox]]></title>
    <link>https://medium.com/@tarshadesouza/fixing-ci-abc123?source=rss-1234</link>
    <pubDate>Mon, 20 Jul 2026 09:15:00 GMT</pubDate>
    <category><![CDATA[CI/CD]]></category>
    <category><![CDATA[Swift]]></category>
    <category><![CDATA[Open Source]]></category>
    <category><![CDATA[Testing]]></category>
    <category><![CDATA[Ignored Fifth]]></category>
    <content:encoded><![CDATA[<figure><img src="https://cdn-images.medium.com/x.png" /></figure><p>A red build is a <strong>tax</strong> on everyone.</p><p>${'word '.repeat(430)}</p>]]></content:encoded>
  </item>
  <item>
    <title>A plain title</title>
    <link>https://medium.com/@tarshadesouza/plain-def456</link>
    <pubDate>Tue, 04 Mar 2025 11:00:00 GMT</pubDate>
    <content:encoded><![CDATA[<p>Short one.</p>]]></content:encoded>
  </item>
</channel>
</rss>`;

test('parses every item in the feed', () => {
  assert.equal(parseFeed(FEED).length, 2);
});

test('respects the item limit', () => {
  assert.equal(parseFeed(FEED, 1).length, 1);
});

test('decodes entities and CDATA in titles', () => {
  assert.equal(parseFeed(FEED)[0].title, 'Fixing CI with an agent & a checkbox');
  assert.equal(parseFeed(FEED)[1].title, 'A plain title');
});

test('strips Medium tracking params from the link', () => {
  assert.equal(
    parseFeed(FEED)[0].url,
    'https://medium.com/@tarshadesouza/fixing-ci-abc123',
  );
});

test('normalises the date to ISO', () => {
  assert.equal(parseFeed(FEED)[0].publishedAt, '2026-07-20T09:15:00.000Z');
});

test('builds an excerpt from the body, without the header image or markup', () => {
  const [post] = parseFeed(FEED);
  assert.ok(post.excerpt.startsWith('A red build is a tax on everyone.'));
  assert.ok(!post.excerpt.includes('<'));
  assert.ok(!post.excerpt.includes('cdn-images'));
  assert.ok(post.excerpt.endsWith('…'), 'long posts are truncated with an ellipsis');
});

test('short posts are not truncated', () => {
  assert.equal(parseFeed(FEED)[1].excerpt, 'Short one.');
});

test('caps tags at four', () => {
  assert.deepEqual(parseFeed(FEED)[0].tags, ['CI/CD', 'Swift', 'Open Source', 'Testing']);
});

test('estimates reading time and never returns zero', () => {
  assert.equal(parseFeed(FEED)[0].readingMinutes, 2);
  assert.equal(parseFeed(FEED)[1].readingMinutes, 1);
});

test('an empty or malformed feed yields no posts rather than throwing', () => {
  assert.deepEqual(parseFeed(''), []);
  assert.deepEqual(parseFeed('<rss><channel></channel></rss>'), []);
});

test('stripTags handles numeric and hex entities', () => {
  assert.equal(stripTags('<p>caf&#233; &#x2014; done</p>'), 'café — done');
});

test('tagText returns an empty string for a missing tag', () => {
  assert.equal(tagText('<item></item>', 'title'), '');
});
