import { isLevelId } from './game-engine.ts'

export const PROGRESS_KEY = 'tiny-trails-progress-v1'

export type Progress = Record<string, number>

function isStarCount(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 3
  )
}

/** Recover valid earned stars even if an older or edited save contains bad entries. */
export function parseProgress(raw: string | null): Progress {
  if (raw === null) return {}

  try {
    const parsed: unknown = JSON.parse(raw)
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed))
      return {}

    const progress: Progress = {}
    for (const [levelId, stars] of Object.entries(parsed)) {
      if (isLevelId(levelId) && isStarCount(stars)) progress[levelId] = stars
    }
    return progress
  } catch {
    return {}
  }
}

/** A replay may improve a result, but can never remove a child's earned stars. */
export function awardStars(
  progress: Progress,
  levelId: string,
  stars: number,
): Progress {
  const next = { ...progress }
  if (!isLevelId(levelId) || !isStarCount(stars)) return next

  const previous = isStarCount(progress[levelId]) ? progress[levelId] : 0
  next[levelId] = Math.max(previous, stars)
  return next
}

export function totalStars(progress: Progress): number {
  return Object.values(progress).reduce((total, stars) => total + stars, 0)
}

export function completedLevels(progress: Progress): number {
  return Object.keys(progress).length
}
