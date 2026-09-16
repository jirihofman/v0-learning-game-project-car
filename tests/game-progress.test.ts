import assert from 'node:assert/strict'
import test from 'node:test'
import {
  PROGRESS_KEY,
  awardStars,
  completedLevels,
  parseProgress,
  totalStars,
  type Progress,
} from '../lib/game-progress.ts'

test('storage has a versioned key', () => {
  assert.equal(PROGRESS_KEY, 'tiny-trails-progress-v1')
})

test('missing, broken, and non-object saves recover to empty progress', () => {
  for (const raw of [
    null,
    '',
    '{broken',
    'undefined',
    'null',
    '[]',
    '[1,2,3]',
    '42',
    'true',
    '"hello"',
  ]) {
    assert.deepEqual(
      parseProgress(raw),
      {},
      `Unexpected recovery for ${String(raw)}`,
    )
  }
})

test('all 72 canonical levels can preserve valid earned stars', () => {
  const expected: Progress = {}
  for (const mode of ['explore', 'collect', 'obstacles', 'treasure']) {
    for (const difficulty of ['easy', 'medium', 'hard']) {
      for (let stage = 1; stage <= 6; stage += 1) {
        expected[`${mode}-${difficulty}-${stage}`] = ((stage - 1) % 3) + 1
      }
    }
  }

  assert.equal(Object.keys(expected).length, 72)
  assert.deepEqual(parseProgress(JSON.stringify(expected)), expected)
  assert.equal(totalStars(parseProgress(JSON.stringify(expected))), 144)
})

test('malformed entries are discarded without losing neighboring valid results', () => {
  const raw = JSON.stringify({
    'explore-easy-1': 3,
    'explore-easy-2': '3',
    'explore-easy-3': 0,
    'explore-easy-4': 4,
    'explore-easy-5': -1,
    'explore-easy-6': 1.5,
    'collect-medium-1': null,
    'collect-medium-2': true,
    'collect-medium-3': [1],
    'collect-medium-4': { stars: 2 },
    'collect-medium-5': 1,
    'treasure-hard-6': 2,
    'future-mode-easy-1': 3,
    'explore-extreme-1': 3,
    'explore-easy-0': 3,
    'explore-easy-7': 3,
    'explore-easy-01': 3,
    'explore-easy-1-extra': 3,
    'explore-easy-1\n': 3,
    'Explore-easy-1': 3,
    constructor: 3,
    ['__proto__']: { polluted: true },
  })

  assert.deepEqual(parseProgress(raw), {
    'explore-easy-1': 3,
    'collect-medium-5': 1,
    'treasure-hard-6': 2,
  })
  assert.equal(Object.hasOwn(parseProgress(raw), '__proto__'), false)
})

test('earning stars is immutable and preserves unrelated stage results', () => {
  const original = Object.freeze({ 'explore-easy-1': 2, 'collect-medium-2': 1 })
  const improved = awardStars(original, 'explore-easy-1', 3)
  const added = awardStars(improved, 'treasure-hard-6', 1)

  assert.notEqual(improved, original)
  assert.deepEqual(original, { 'explore-easy-1': 2, 'collect-medium-2': 1 })
  assert.deepEqual(improved, { 'explore-easy-1': 3, 'collect-medium-2': 1 })
  assert.deepEqual(added, {
    'explore-easy-1': 3,
    'collect-medium-2': 1,
    'treasure-hard-6': 1,
  })
})

test('replays never downgrade a previously earned result', () => {
  for (let previous = 1; previous <= 3; previous += 1) {
    for (let earned = 1; earned <= 3; earned += 1) {
      const original = { 'obstacles-medium-3': previous }
      const replayed = awardStars(original, 'obstacles-medium-3', earned)
      assert.equal(replayed['obstacles-medium-3'], Math.max(previous, earned))
      assert.equal(original['obstacles-medium-3'], previous)
    }
  }
})

test('invalid awards cannot introduce impossible scores or unknown levels', () => {
  const progress = Object.freeze({ 'explore-easy-1': 2 })
  for (const stars of [-1, 0, 1.5, 4, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.deepEqual(awardStars(progress, 'explore-easy-1', stars), progress)
    assert.deepEqual(awardStars(progress, 'explore-easy-2', stars), progress)
  }
  for (const levelId of [
    '',
    'unknown',
    '__proto__',
    'explore-easy-0',
    'treasure-hard-7',
  ]) {
    assert.deepEqual(awardStars(progress, levelId, 3), progress)
  }
})

test('progress summaries count earned stars and completed stages independently', () => {
  assert.equal(totalStars({}), 0)
  assert.equal(completedLevels({}), 0)

  const progress = {
    'explore-easy-1': 1,
    'explore-easy-2': 2,
    'treasure-hard-6': 3,
  }
  assert.equal(totalStars(progress), 6)
  assert.equal(completedLevels(progress), 3)
})
