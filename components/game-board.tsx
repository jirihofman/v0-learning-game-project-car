import type { CSSProperties } from 'react'
import { ArrowUp, Check } from 'lucide-react'
import {
  CarArt,
  FlagArt,
  FruitArt,
  GemArt,
  RockArt,
  TreeArt,
} from '@/components/game-art'
import {
  initialRunState,
  samePoint,
  stepRun,
  type Level,
  type Point,
  type RunState,
} from '@/lib/game-engine'

const DIRECTIONS = ['up', 'right', 'down', 'left']

export function GameBoard({
  level,
  run,
  visited,
  hint,
  rotation,
}: {
  level: Level
  run: RunState
  visited: Point[]
  hint: boolean
  rotation: number
}) {
  let preview = initialRunState(level)
  const hintPoints: Point[] = []
  if (hint) {
    for (const command of level.solution) {
      preview = stepRun(level, preview, command)
      if (!hintPoints.some((p) => samePoint(p, preview.position)))
        hintPoints.push(preview.position)
    }
  }
  return (
    <div
      className={`map-scene ${run.status === 'success' ? 'map-success' : ''}`}
    >
      <div className="scene-tree tree-one">
        <TreeArt />
      </div>
      <div className="scene-tree tree-two">
        <TreeArt />
      </div>
      <div className="scene-tree tree-three">
        <TreeArt />
      </div>
      <span className="map-compass" aria-hidden="true">
        <ArrowUp size={15} /> N
      </span>
      <div
        className="board-wrap"
        style={{ '--board-size': level.size } as CSSProperties}
      >
        <div className="column-labels" aria-hidden="true">
          {Array.from({ length: level.size }, (_, x) => (
            <span key={x}>{String.fromCharCode(65 + x)}</span>
          ))}
        </div>
        <div className="row-labels" aria-hidden="true">
          {Array.from({ length: level.size }, (_, y) => (
            <span key={y}>{y + 1}</span>
          ))}
        </div>
        <div
          className="map-grid"
          role="grid"
          aria-label={`${level.size} by ${level.size} adventure map`}
          aria-rowcount={level.size}
          aria-colcount={level.size}
        >
          {Array.from({ length: level.size }, (_, y) => (
            <div className="map-row" role="row" key={y}>
              {Array.from({ length: level.size }, (_, x) => {
                const p = { x, y }
                const obstacle = level.obstacles.some((o) => samePoint(o, p))
                const item = level.collectibles.findIndex((o) =>
                  samePoint(o, p),
                )
                const collected = run.collected.includes(item)
                const goal =
                  level.mode !== 'collect' && samePoint(level.goal, p)
                const start = samePoint(level.start, p)
                const car = samePoint(run.position, p)
                const trail = visited.some((o) => samePoint(o, p))
                const hinted = hintPoints.some((o) => samePoint(o, p))
                const label = `${String.fromCharCode(65 + x)}${y + 1}${car ? `, car facing ${DIRECTIONS[run.direction]}` : ''}${start ? ', start' : ''}${goal ? ', finish flag' : ''}${obstacle ? ', rock' : ''}${item >= 0 ? (collected ? ', collected' : level.mode === 'collect' ? ', apple' : ', gem') : ''}`
                return (
                  <div
                    key={x}
                    role="gridcell"
                    aria-label={label}
                    className={`map-cell ${goal ? 'goal-cell' : ''} ${start ? 'start-cell' : ''} ${obstacle ? 'rock-cell' : ''} ${trail ? 'visited-cell' : ''} ${hinted ? 'hint-cell' : ''}`}
                  >
                    {obstacle && <RockArt />}
                    {goal && <FlagArt />}
                    {item >= 0 &&
                      !collected &&
                      (level.mode === 'collect' ? <FruitArt /> : <GemArt />)}
                    {item >= 0 && collected && (
                      <Check className="collected-check" size={22} />
                    )}
                    {trail && !start && !goal && item === -1 && (
                      <span className="trail-dot" />
                    )}
                    {start && <span className="cell-label">START</span>}
                  </div>
                )
              })}
            </div>
          ))}
          <div
            className={`little-car ${run.status === 'edge' || run.status === 'obstacle' ? 'car-oops' : ''}`}
            aria-hidden="true"
            style={{
              width: `${100 / level.size}%`,
              height: `${100 / level.size}%`,
              left: `${(run.position.x * 100) / level.size}%`,
              top: `${(run.position.y * 100) / level.size}%`,
            }}
          >
            <div
              className="car-rotation"
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              <CarArt />
            </div>
          </div>
        </div>
      </div>
      <div className="scene-caption">
        <span /> A little thinking goes a long way.
      </div>
    </div>
  )
}
