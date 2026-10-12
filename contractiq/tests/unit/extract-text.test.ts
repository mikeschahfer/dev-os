// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { extractPdfText } from '@/lib/pdf/extract-text';
import { findPageOf, splitPages } from '@/lib/pdf/page-markers';

const fixture = (name: string) => readFileSync(join(process.cwd(), 'tests', 'fixtures', 'pdfs', name));

describe('extractPdfText', () => {
  it('extracts text with [PAGE N] markers', async () => {
    const r = await extractPdfText(fixture('nda-sample.pdf'));
    expect(r.pageCount).toBe(3);
    expect(splitPages(r.text).map((p) => p.page)).toEqual([1, 2, 3]);
    expect(r.wordCount).toBeGreaterThan(100);
    expect(findPageOf(r.text, 'This Agreement shall be governed by the laws of the State of Delaware.')).toBe(3);
  });

  it('counts pages for long documents and words for near-empty ones', async () => {
    expect((await extractPdfText(fixture("21-pages.pdf"))).pageCount).toBe(21);
    expect((await extractPdfText(fixture("21-pages.pdf"), { maxPages: 20 })).text).toBe("");
    expect((await extractPdfText(fixture("small-nda.pdf"))).pageCount).toBe(1);
    expect((await extractPdfText(fixture('scanned.pdf'))).wordCount).toBeLessThan(100);
  });

  it('rejects non-PDF bytes as unreadable', async () => {
    await expect(extractPdfText(fixture('not-a-pdf.pdf'))).rejects.toMatchObject({ code: 'PDF_UNREADABLE' });
  });
});
