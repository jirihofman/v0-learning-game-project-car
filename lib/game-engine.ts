export type Command = 'forward' | 'left' | 'right'
export type Mode = 'explore' | 'collect' | 'obstacles' | 'treasure'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type Point = { x: number; y: number }

export type Level = {
  id: string
  mode: Mode
  difficulty: Difficulty
  stage: number
  size: number
  start: Point
  /** Clockwise: north = 0, east = 1, south = 2, west = 3. */
  direction: number
  goal: Point
  obstacles: Point[]
  collectibles: Point[]
  solution: Command[]
  maxCommands: number
}

export type RunState = {
  position: Point
  direction: number
  collected: number[]
  status: 'ready' | 'running' | 'success' | 'edge' | 'obstacle' | 'incomplete'
}

const DIRECTIONS: Point[] = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
]

export function samePoint(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y
}

export function isLevelId(value: string): boolean {
  return /^(explore|collect|obstacles|treasure)-(easy|medium|hard)-[1-6]$/.test(
    value,
  )
}

function objectiveComplete(level: Level, state: RunState): boolean {
  const hasEverything = level.collectibles.every((_, index) =>
    state.collected.includes(index),
  )
  if (level.mode === 'collect') return hasEverything
  if (level.mode === 'treasure')
    return hasEverything && samePoint(state.position, level.goal)
  return samePoint(state.position, level.goal)
}

export function initialRunState(level: Level): RunState {
  return {
    position: { ...level.start },
    direction: level.direction,
    collected: [],
    status: 'ready',
  }
}

/** A failed movement stays on the last safe square. Finished runs are immutable. */
export function stepRun(
  level: Level,
  state: RunState,
  command: Command,
): RunState {
  if (state.status !== 'ready' && state.status !== 'running') return state

  let position = state.position
  let direction = state.direction
  if (command === 'left') direction = (direction + 3) % 4
  if (command === 'right') direction = (direction + 1) % 4
  if (command === 'forward') {
    const delta = DIRECTIONS[direction]
    const next = { x: position.x + delta.x, y: position.y + delta.y }
    if (
      next.x < 0 ||
      next.y < 0 ||
      next.x >= level.size ||
      next.y >= level.size
    ) {
      return { ...state, status: 'edge' }
    }
    if (level.obstacles.some((obstacle) => samePoint(obstacle, next))) {
      return { ...state, status: 'obstacle' }
    }
    position = next
  }

  const collected = [...state.collected]
  level.collectibles.forEach((item, index) => {
    if (samePoint(item, position) && !collected.includes(index))
      collected.push(index)
  })
  const next: RunState = { position, direction, collected, status: 'running' }
  return objectiveComplete(level, next) ? { ...next, status: 'success' } : next
}

export function finishRun(level: Level, state: RunState): RunState {
  if (state.status !== 'ready' && state.status !== 'running') return state
  return {
    ...state,
    status: objectiveComplete(level, state) ? 'success' : 'incomplete',
  }
}

/** Every completed adventure earns a star; an efficient unassisted route earns three. */
export function getStars(
  commandCount: number,
  optimalCount: number,
  usedHint: boolean,
): number {
  const optimal = Math.max(1, optimalCount)
  const stars =
    commandCount <= optimal
      ? 3
      : commandCount <= Math.ceil(optimal * 1.5)
        ? 2
        : 1
  return usedHint ? Math.min(stars, 2) : stars
}

type Coordinate = readonly [number, number]
const point = ([x, y]: Coordinate): Point => ({ x, y })

// Each trail introduces one new idea: straight lines, turns, then visiting branches.
const EXPLORE_GOALS: Record<Difficulty, Coordinate[]> = {
  easy: [
    [0, 2],
    [0, 1],
    [1, 1],
    [2, 1],
    [2, 0],
    [3, 0],
  ],
  medium: [
    [2, 2],
    [3, 2],
    [3, 1],
    [4, 1],
    [3, 0],
    [4, 0],
  ],
  hard: [
    [3, 2],
    [4, 2],
    [4, 1],
    [5, 1],
    [4, 0],
    [5, 0],
  ],
}

const FRUIT_TRAILS: Record<Difficulty, Coordinate[][]> = {
  easy: [
    [[0, 2]],
    [
      [0, 1],
      [2, 1],
    ],
    [
      [2, 3],
      [2, 1],
    ],
    [
      [0, 0],
      [2, 0],
      [2, 2],
    ],
    [
      [0, 1],
      [3, 1],
      [3, 3],
    ],
    [
      [0, 0],
      [3, 0],
      [3, 2],
      [1, 2],
    ],
  ],
  medium: [
    [
      [0, 1],
      [3, 1],
    ],
    [
      [2, 3],
      [2, 0],
      [4, 0],
    ],
    [
      [0, 0],
      [4, 0],
      [4, 3],
    ],
    [
      [3, 4],
      [3, 1],
      [1, 1],
    ],
    [
      [0, 0],
      [4, 0],
      [4, 3],
      [2, 3],
    ],
    [
      [3, 4],
      [3, 0],
      [0, 0],
      [0, 2],
    ],
  ],
  hard: [
    [
      [0, 1],
      [4, 1],
      [4, 4],
    ],
    [
      [4, 5],
      [4, 1],
      [1, 1],
    ],
    [
      [0, 0],
      [5, 0],
      [5, 4],
      [2, 2],
    ],
    [
      [3, 5],
      [3, 1],
      [0, 1],
      [0, 3],
    ],
    [
      [0, 0],
      [5, 0],
      [5, 4],
      [2, 4],
    ],
    [
      [4, 5],
      [4, 0],
      [0, 0],
      [0, 3],
    ],
  ],
}

/** Walls have a safe opening. Alternating openings teach planning around barriers. */
function mazeLayout(difficulty: Difficulty, stage: number, size: number) {
  const obstacles: Point[] = []
  let walls: { y: number; gap: number }[]
  if (difficulty === 'easy') {
    walls = [{ y: 2, gap: [0, 0, 1, 2, 1, 2][stage - 1] }]
  } else if (difficulty === 'medium') {
    const gaps = [[0], [1, 3], [2, 0], [3, 1], [4, 0], [4, 1]][stage - 1]
    walls = gaps.map((gap, index) => ({ y: 3 - index * 2, gap }))
  } else {
    const gaps = [
      [1, 4],
      [3, 1],
      [4, 0],
      [4, 1],
      [5, 0],
      [5, 1],
    ][stage - 1]
    walls = gaps.map((gap, index) => ({ y: 4 - index * 2, gap }))
  }
  for (const { y, gap } of walls) {
    for (let x = 0; x < size; x++) {
      if (x !== gap) obstacles.push({ x, y })
    }
  }
  const easyGoals: Coordinate[] = [
    [0, 1],
    [2, 1],
    [3, 0],
    [3, 0],
    [0, 0],
    [0, 0],
  ]
  const goal =
    difficulty === 'easy'
      ? point(easyGoals[stage - 1])
      : { x: stage === 6 ? 0 : size - 1, y: 0 }

  // A guaranteed traversable trail, also used to place keys away from the chest.
  const trail: Point[] = []
  let cursor = { x: 0, y: size - 1 }
  const walkTo = (target: Point) => {
    while (cursor.x !== target.x || cursor.y !== target.y) {
      cursor =
        cursor.x !== target.x
          ? { x: cursor.x + Math.sign(target.x - cursor.x), y: cursor.y }
          : { x: cursor.x, y: cursor.y + Math.sign(target.y - cursor.y) }
      trail.push(cursor)
    }
  }
  for (const wall of walls) {
    walkTo({ x: wall.gap, y: wall.y + 1 })
    walkTo({ x: wall.gap, y: wall.y - 1 })
  }
  walkTo(goal)
  return { obstacles, goal, trail }
}

function stateKey(state: RunState): string {
  const mask = state.collected.reduce((bits, index) => bits | (1 << index), 0)
  return `${state.position.x},${state.position.y},${state.direction},${mask}`
}

/** Breadth-first search makes the hint and three-star target the true shortest program. */
function shortestSolution(level: Level): Command[] {
  const start = initialRunState(level)
  const queue: { state: RunState; parent: number; command?: Command }[] = [
    { state: start, parent: -1 },
  ]
  const seen = new Set([stateKey(start)])
  for (let index = 0; index < queue.length; index++) {
    for (const command of ['forward', 'right', 'left'] as const) {
      const next = stepRun(level, queue[index].state, command)
      if (next.status === 'edge' || next.status === 'obstacle') continue
      if (next.status === 'success') {
        const solution: Command[] = [command]
        let cursor = index
        while (queue[cursor].parent !== -1) {
          solution.push(queue[cursor].command!)
          cursor = queue[cursor].parent
        }
        return solution.reverse()
      }
      const key = stateKey(next)
      if (!seen.has(key)) {
        seen.add(key)
        queue.push({ state: next, parent: index, command })
      }
    }
  }
  throw new Error(`The adventure ${level.id} has no safe route.`)
}

/** Stages are one-based. Every mode has six reproducible, solvable adventures. */
export function generateLevel(
  mode: Mode,
  difficulty: Difficulty,
  requestedStage: number,
): Level {
  const stage = Number.isFinite(requestedStage)
    ? Math.min(6, Math.max(1, Math.floor(requestedStage)))
    : 1
  const size = { easy: 4, medium: 5, hard: 6 }[difficulty]
  const level: Level = {
    id: `${mode}-${difficulty}-${stage}`,
    mode,
    difficulty,
    stage,
    size,
    start: { x: 0, y: size - 1 },
    direction: 0,
    goal: point(EXPLORE_GOALS[difficulty][stage - 1]),
    obstacles: [],
    collectibles: [],
    solution: [],
    maxCommands: 60,
  }

  if (mode === 'collect') {
    level.collectibles = FRUIT_TRAILS[difficulty][stage - 1].map(point)
    level.goal = { ...level.collectibles[level.collectibles.length - 1] }
  }
  if (mode === 'obstacles' || mode === 'treasure') {
    const maze = mazeLayout(difficulty, stage, size)
    level.obstacles = maze.obstacles
    level.goal = maze.goal
    if (mode === 'treasure') {
      const candidates = maze.trail.filter(
        (position) => !samePoint(position, maze.goal),
      )
      const count = Math.min(
        candidates.length,
        { easy: 1, medium: 2, hard: 3 }[difficulty] + (stage > 3 ? 1 : 0),
      )
      level.collectibles = Array.from({ length: count }, (_, index) => ({
        ...candidates[Math.floor((index * candidates.length) / count)],
      }))
    }
  }

  level.solution = shortestSolution(level)
  return level
}
