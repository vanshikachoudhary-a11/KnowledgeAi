import test from 'node:test';
import assert from 'node:assert/strict';
import { chunkText } from '../src/utils/chunkText.js';

test('chunkText returns overlapping chunks without losing content', () => {
  const input = 'First sentence. Second sentence. Third sentence. Fourth sentence.';
  const parts = chunkText(input, { chunkSize: 30, overlap: 8 });
  assert.ok(parts.length > 1);
  assert.equal(parts[0].startsWith('First sentence'), true);
  assert.equal(parts.at(-1).includes('Fourth sentence'), true);
});
