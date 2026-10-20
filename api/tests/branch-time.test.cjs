const assert = require('node:assert/strict');
const { localDate, localWeekday, rangeStart, startOfLocalDayUtc, nextDay } = require('../dist/utils/branchTime');

const instant = new Date('2026-10-20T02:30:00.000Z');
assert.equal(localDate('America/Argentina/Buenos_Aires', instant), '2026-10-19');
assert.equal(localDate('Europe/Madrid', instant), '2026-10-20');
assert.equal(localWeekday('America/Argentina/Buenos_Aires', instant), 'monday');
assert.equal(rangeStart('2026-10-20', 'semana'), '2026-10-19');
assert.equal(rangeStart('2026-10-20', 'mes'), '2026-10-01');
assert.equal(nextDay('2026-12-31'), '2027-01-01');
assert.equal(startOfLocalDayUtc('2026-10-20', 'America/Argentina/Buenos_Aires').toISOString(), '2026-10-20T03:00:00.000Z');
assert.equal(startOfLocalDayUtc('2026-03-08', 'America/New_York').toISOString(), '2026-03-08T05:00:00.000Z');
assert.equal(startOfLocalDayUtc('2026-03-09', 'America/New_York').toISOString(), '2026-03-09T04:00:00.000Z');
console.log('branch time: PASS');
