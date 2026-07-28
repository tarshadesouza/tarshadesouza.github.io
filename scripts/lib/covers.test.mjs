/**
 * The cover fetcher reads the reading list out of profile.ts with a regex,
 * which will silently return nothing if that file is reformatted — and a
 * silent nothing looks exactly like "no books configured". These tests make
 * that failure loud.
 *
 * The slug is shared with Reading.astro, which looks covers up by it. If the
 * two implementations ever disagree, every thumbnail quietly disappears.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseBooks, slugify } from '../fetch-covers.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('reads every book out of the real profile.ts', async () => {
  const source = await readFile(resolve(ROOT, 'src/data/profile.ts'), 'utf8');
  const books = parseBooks(source);

  assert.ok(books.length > 0, 'parsed no books — the regex has drifted from the file');
  for (const book of books) {
    assert.ok(book.title.length > 0);
    assert.ok(book.author.length > 0);
  }
});

test('parses titles and authors in order', () => {
  const source = `
export const reading = {
  intro: 'x',
  books: [
    { title: 'Flow', author: 'Mihaly Csikszentmihalyi', subject: 'Psychology', note: '' },
    { title: 'Outliers', author: 'Malcolm Gladwell', subject: 'Behaviour', note: '' },
  ],
};
`;
  assert.deepEqual(parseBooks(source), [
    { title: 'Flow', author: 'Mihaly Csikszentmihalyi' },
    { title: 'Outliers', author: 'Malcolm Gladwell' },
  ]);
});

test('returns nothing when the reading block is absent', () => {
  assert.deepEqual(parseBooks('export const projects = [];'), []);
});

test('slugs are filename-safe and stable', () => {
  assert.equal(slugify('The Pragmatic Programmer'), 'the-pragmatic-programmer');
  assert.equal(slugify('Brief Answers to the Big Questions'), 'brief-answers-to-the-big-questions');
  // Curly and straight apostrophes both drop out, so the slug can't fork.
  assert.equal(slugify('Ender’s Game'), slugify("Ender's Game"));
  assert.equal(slugify('  Spaced  Out  '), 'spaced-out');
});

test('the slug matches the one Reading.astro uses', async () => {
  const component = await readFile(resolve(ROOT, 'src/components/Reading.astro'), 'utf8');
  // Both implementations are small; compare the transformation chain itself so
  // an edit to one without the other fails here rather than in production.
  const chain = component.match(/const slugify[\s\S]*?\.replace\(\/\^-\|-\$\/g, ''\);/);
  assert.ok(chain, 'Reading.astro no longer defines a slugify matching this shape');
  for (const source of ['.toLowerCase()', "replace(/['’]/g, '')", "replace(/[^a-z0-9]+/g, '-')"]) {
    assert.ok(chain[0].includes(source), `component slugify is missing ${source}`);
  }
});
