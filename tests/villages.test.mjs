import { test } from 'node:test';
import assert from 'node:assert/strict';
import { villages, tiers, tierMeta } from '../src/data/villages.js';

test('усі села мають обов\'язкові поля', () => {
  for (const v of villages) {
    assert.ok(v.id, `id у ${v.name}`);
    assert.ok(v.name, 'name');
    assert.ok(['Карпати', 'Закарпаття'].includes(v.region), `region у ${v.name}`);
    assert.ok(tiers.includes(v.tier), `tier у ${v.name}`);
    assert.equal(typeof v.lat, 'number');
    assert.equal(typeof v.lng, 'number');
    assert.ok(v.lat > 47 && v.lat < 49, `lat у ${v.name}`);
    assert.ok(v.lng > 22 && v.lng < 26, `lng у ${v.name}`);
  }
});

test('id унікальні', () => {
  const ids = villages.map(v => v.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('у кожному тирі є хоча б одне село', () => {
  for (const t of tiers) {
    assert.ok(villages.some(v => v.tier === t), `тир ${t} не порожній`);
  }
});

test('externalLinks генеруються коректно', () => {
  for (const v of villages) {
    assert.match(v.externalLinks.booking, /^https:\/\/www\.booking\.com\/searchresults/);
    assert.match(v.externalLinks.googleMaps, /^https:\/\/www\.google\.com\/maps/);
    assert.ok(v.externalLinks.booking.includes(String(v.lat)));
  }
});

test('tierMeta має метадані для всіх тирів', () => {
  for (const t of tiers) {
    assert.ok(tierMeta[t]);
    assert.ok(tierMeta[t].color);
    assert.ok(tierMeta[t].label);
  }
});
