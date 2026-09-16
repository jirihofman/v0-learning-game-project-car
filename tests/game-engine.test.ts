import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  finishRun,
  generateLevel,
  getStars,
  initialRunState,
  isLevelId,
  samePoint,
  stepRun,
  type Command,
  type Difficulty,
  type Level,
  type Mode,
} from '../lib/game-engine.ts'

const modes: Mode[] = ['explore', 'collect', 'obstacles', 'treasure']
const difficulties: Difficulty[] = ['easy', 'medium', 'hard']

function run(level: Level, commands: Command[]) {
  return finishRun(
    level,
    commands.reduce(
      (state, command) => stepRun(level, state, command),
      initialRunState(level),
    ),
  )
}

function fixture(overrides: Partial<Level> = {}): Level {
  return {
    id: 'test',
    mode: 'explore',
    difficulty: 'easy',
    stage: 1,
    size: 4,
    start: { x: 0, y: 3 },
    direction: 0,
    goal: { x: 3, y: 0 },
    obstacles: [],
    collectibles: [],
    solution: [],
    maxCommands: 60,
    ...overrides,
  }
}

test('all 72 adventures are reproducible, in bounds, and solvable within the command budget', () => {
  const ids = new Set<string>()
  for (const mode of modes) {
    for (const difficulty of difficulties) {
      const layouts = new Set<string>()
      for (let stage = 1; stage <= 6; stage++) {
        const level = generateLevel(mode, difficulty, stage)
        ids.add(level.id)
        assert.ok(isLevelId(level.id))
        layouts.add(
          JSON.stringify([level.goal, level.obstacles, level.collectibles]),
        )
        assert.deepEqual(
          level,
          generateLevel(mode, difficulty, stage),
          level.id,
        )
        assert.deepEqual(level.start, { x: 0, y: level.size - 1 })
        assert.equal(level.direction, 0)
        assert.equal(level.maxCommands, 60)
        assert.ok(
          level.solution.length > 0 &&
            level.solution.length <= level.maxCommands,
          level.id,
        )
        for (const position of [
          level.start,
          level.goal,
          ...level.obstacles,
          ...level.collectibles,
        ]) {
          assert.ok(
            position.x >= 0 &&
              position.x < level.size &&
              position.y >= 0 &&
              position.y < level.size,
            level.id,
          )
        }
        for (const position of [
          level.start,
          level.goal,
          ...level.collectibles,
        ]) {
          assert.ok(
            !level.obstacles.some((obstacle) => samePoint(obstacle, position)),
            level.id,
          )
        }
        assert.equal(
          new Set(level.collectibles.map(({ x, y }) => `${x},${y}`)).size,
          level.collectibles.length,
        )
        const outcome = run(level, level.solution)
        assert.equal(outcome.status, 'success', level.id)
        if (mode === 'collect' || mode === 'treasure')
          assert.equal(
            outcome.collected.length,
            level.collectibles.length,
            level.id,
          )
        if (mode !== 'collect')
          assert.deepEqual(outcome.position, level.goal, level.id)
        // A shortest solution cannot already have won before its final instruction.
        assert.equal(
          run(level, level.solution.slice(0, -1)).status,
          'incomplete',
          level.id,
        )
      }
      assert.equal(
        layouts.size,
        6,
        `${mode}/${difficulty} has six distinct layouts`,
      )
    }
  }
  assert.equal(ids.size, 72)
})

test('the first easy adventure teaches a short straight route in each mode', () => {
  for (const mode of modes) {
    const level = generateLevel(mode, 'easy', 1)
    assert.ok(level.solution.length <= 2, mode)
    assert.ok(
      level.solution.every((command) => command === 'forward'),
      mode,
    )
  }
})

test('larger difficulties require more planning on average in every mode', () => {
  for (const mode of modes) {
    const totals = difficulties.map((difficulty) => {
      let total = 0
      for (let stage = 1; stage <= 6; stage++) {
        const level = generateLevel(mode, difficulty, stage)
        assert.equal(level.size, { easy: 4, medium: 5, hard: 6 }[difficulty])
        total += level.solution.length
      }
      return total
    })
    assert.ok(
      totals[0] < totals[1] && totals[1] < totals[2],
      `${mode}: ${totals}`,
    )
  }
})

test('turns rotate the car without moving, using clockwise compass directions', () => {
  const level = fixture()
  const right = stepRun(level, initialRunState(level), 'right')
  assert.equal(right.direction, 1)
  assert.deepEqual(right.position, level.start)
  assert.deepEqual(stepRun(level, right, 'forward').position, { x: 1, y: 3 })
  const left = stepRun(level, initialRunState(level), 'left')
  assert.equal(left.direction, 3)
  assert.equal(stepRun(level, left, 'right').direction, 0)
})

test('the board edge stops the run at the last safe square', () => {
  const level = fixture()
  const initial = initialRunState(level)
  const turned = stepRun(level, initial, 'left')
  const failed = stepRun(level, turned, 'forward')
  assert.equal(failed.status, 'edge')
  assert.deepEqual(failed.position, level.start)
  assert.equal(failed.direction, 3)
  assert.equal(stepRun(level, failed, 'right'), failed)
  assert.equal(finishRun(level, failed), failed)
  assert.equal(initial.status, 'ready')
})

test('obstacles stop the run without moving onto or collecting a blocked cell', () => {
  const level = fixture({
    obstacles: [{ x: 0, y: 2 }],
    collectibles: [{ x: 0, y: 2 }],
  })
  const failed = stepRun(level, initialRunState(level), 'forward')
  assert.equal(failed.status, 'obstacle')
  assert.deepEqual(failed.position, level.start)
  assert.deepEqual(failed.collected, [])
})

test('collection requires every item, regardless of the flag, and resets fully on replay', () => {
  const level = fixture({
    mode: 'collect',
    goal: { x: 0, y: 2 },
    collectibles: [
      { x: 0, y: 2 },
      { x: 1, y: 2 },
    ],
  })
  const initial = initialRunState(level)
  const first = stepRun(level, initial, 'forward')
  assert.equal(first.status, 'running')
  assert.deepEqual(first.collected, [0])
  assert.equal(finishRun(level, first).status, 'incomplete')
  const turned = stepRun(level, first, 'right')
  assert.deepEqual(
    turned.collected,
    [0],
    'rotating on fruit does not collect it twice',
  )
  const won = stepRun(level, turned, 'forward')
  assert.equal(won.status, 'success')
  assert.ok(
    !samePoint(won.position, level.goal),
    'fruit collection does not require returning to a flag',
  )
  assert.deepEqual(won.collected, [0, 1])
  assert.deepEqual(initialRunState(level), initial)
  assert.deepEqual(
    initial.collected,
    [],
    'running a program never mutates its input state',
  )
})

test('treasure requires both all keys and reaching the chest', () => {
  const level = fixture({
    mode: 'treasure',
    goal: { x: 0, y: 2 },
    collectibles: [{ x: 1, y: 2 }],
  })
  const atChest = stepRun(level, initialRunState(level), 'forward')
  assert.equal(
    atChest.status,
    'running',
    'the chest cannot open without every key',
  )
  const atKey = stepRun(level, stepRun(level, atChest, 'right'), 'forward')
  assert.equal(
    atKey.status,
    'running',
    'collecting the last key does not open a remote chest',
  )
  assert.deepEqual(atKey.collected, [0])
  const facingChest = stepRun(level, stepRun(level, atKey, 'right'), 'right')
  const won = stepRun(level, facingChest, 'forward')
  assert.equal(won.status, 'success')
  assert.deepEqual(won.position, level.goal)
  assert.equal(
    stepRun(level, won, 'forward'),
    won,
    'extra commands cannot undo a win',
  )
})

test('explore and obstacles win on the destination; an exhausted route gives clear incomplete feedback', () => {
  for (const mode of ['explore', 'obstacles'] as const) {
    const level = fixture({ mode, goal: { x: 0, y: 2 } })
    assert.equal(finishRun(level, initialRunState(level)).status, 'incomplete')
    assert.equal(run(level, ['right']).status, 'incomplete')
    assert.equal(run(level, ['forward']).status, 'success')
  }
})

test('scores reward efficient routes and cap guided completions at two stars', () => {
  assert.equal(getStars(8, 8, false), 3)
  assert.equal(getStars(7, 8, false), 3)
  assert.equal(getStars(9, 8, false), 2)
  assert.equal(getStars(12, 8, false), 2)
  assert.equal(getStars(13, 8, false), 1)
  assert.equal(getStars(8, 8, true), 2)
  assert.equal(getStars(13, 8, true), 1)
})

test('invalid stage numbers resolve to a playable stage', () => {
  assert.equal(generateLevel('explore', 'easy', 0).stage, 1)
  assert.equal(generateLevel('explore', 'easy', 100).stage, 6)
  assert.equal(generateLevel('explore', 'easy', 2.9).stage, 2)
  assert.equal(generateLevel('explore', 'easy', Number.NaN).stage, 1)
})

test('saved level IDs only accept the 72 canonical adventures', () => {
  for (const invalid of [
    '',
    'collect-easy-0',
    'collect-easy-7',
    'collect-easy-01',
    'other-easy-1',
    'explore-extreme-1',
    'explore-easy-1-extra',
  ]) {
    assert.equal(isLevelId(invalid), false, invalid)
  }
})
