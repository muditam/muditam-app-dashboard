import test from 'node:test';
import assert from 'node:assert/strict';
import { widgetDateRangeParams } from './widgetDateRange.js';

test('same-day IST selection includes the final millisecond and excludes the next day', () => {
  const previous = process.env.TZ;
  process.env.TZ = 'Asia/Kolkata';
  try {
    const day = new Date(2026, 9, 16);
    const original = day.getTime();
    const range = widgetDateRangeParams({ from: day, to: day });
    assert.deepEqual(range, {
      from: '2026-10-15T18:30:00.000Z',
      to: '2026-10-16T18:29:59.999Z',
    });
    const included = (value) => value >= new Date(range.from) && value <= new Date(range.to);
    assert.ok(included(new Date('2026-10-16T12:00:00+05:30')));
    assert.ok(included(new Date('2026-10-16T23:59:59.999+05:30')));
    assert.equal(included(new Date('2026-10-17T00:00:00+05:30')), false);
    assert.equal(day.getTime(), original);
    assert.equal(widgetDateRangeParams({ from: day, to: new Date(2026, 9, 18) }).to, '2026-10-18T18:29:59.999Z');
  } finally {
    if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous;
  }
});

test('clearing dates leaves the API unfiltered', () => {
  assert.deepEqual(widgetDateRangeParams(undefined), { from: undefined, to: undefined });
});
