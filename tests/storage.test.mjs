import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isSaved, toggleSaved } from '../src/utils/storage.js';

test('isSaved → true тільки якщо id у списку', () => {
  assert.equal(isSaved(['a', 'b'], 'b'), true);
  assert.equal(isSaved(['a', 'b'], 'c'), false);
  assert.equal(isSaved(null, 'a'), false);
  assert.equal(isSaved(undefined, 'a'), false);
});

test('toggleSaved → додає якщо немає, прибирає якщо є', () => {
  assert.deepEqual(toggleSaved([], 'a'), ['a']);
  assert.deepEqual(toggleSaved(['a'], 'b'), ['a', 'b']);
  assert.deepEqual(toggleSaved(['a', 'b'], 'a'), ['b']);
});

test('toggleSaved → ініціалізує масив при невалідному вході', () => {
  assert.deepEqual(toggleSaved(null, 'x'), ['x']);
  assert.deepEqual(toggleSaved(undefined, 'x'), ['x']);
});
