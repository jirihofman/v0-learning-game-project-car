import { expect, test, type Page } from '@playwright/test'
import { generateLevel, type Command, type Difficulty, type Level, type Mode } from '../../lib/game-engine.ts'
import { PROGRESS_KEY } from '../../lib/game-progress.ts'

const MODE_NAMES: Record<Mode, string> = {
  explore: 'Trail explorer',
  collect: 'Fruit pickup',
  obstacles: 'Rocky roads',
  treasure: 'Treasure quest',
}
const COMMAND_NAMES: Record<Command, string> = {
  forward: 'Forward Move 1 tile',
  left: 'Turn left Stay & turn',
  right: 'Turn right Stay & turn',
}

async function chooseLevel(page: Page, mode: Mode, difficulty: Difficulty, stage = 1): Promise<Level> {
  await page.getByRole('group', { name: 'Adventure mode', exact: true })
    .getByRole('button', { name: new RegExp(`^${MODE_NAMES[mode]}`) }).click()
  await page.getByRole('group', { name: 'Difficulty', exact: true })
    .getByRole('button', { name: new RegExp(`^${difficulty}`, 'i') }).click()
  await page.getByRole('group', { name: 'Choose adventure', exact: true })
    .getByRole('button', { name: new RegExp(`^Adventure ${stage},`) }).click()

  const level = generateLevel(mode, difficulty, stage)
  await expect(page.getByRole('grid', { name: `${level.size} by ${level.size} adventure map` })).toBeVisible()
  return level
}

async function addPlan(page: Page, commands: Command[]): Promise<void> {
  for (const command of commands) {
    await page.getByRole('button', { name: COMMAND_NAMES[command], exact: true }).click()
  }
  await expect(page.getByRole('button', { name: /^Step \d+:/ })).toHaveCount(commands.length)
}

async function runToSuccess(page: Page, level: Level): Promise<void> {
  await addPlan(page, level.solution)
  await page.getByRole('button', { name: 'Let’s go!', exact: true }).click()
  // The browser runs every instruction at the real 650 ms teaching pace.
  await expect(page.getByRole('status')).toContainText('You found your way!', { timeout: 45_000 })
  await expect(page.getByRole('status').getByLabel('3 out of 3 stars', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: `Adventure ${level.stage}, 3 stars earned`, exact: true })).toBeVisible()

  if (level.collectibles.length > 0) {
    const collection = level.mode === 'collect' ? 'apples' : 'gems'
    await expect(page.getByLabel(`${level.collectibles.length} of ${level.collectibles.length} ${collection} collected`, { exact: true })).toBeVisible()
  }
  if (level.mode !== 'collect') {
    await expect(page.getByRole('gridcell', { name: /car facing.*finish flag/ })).toBeVisible()
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Pick your adventure' })).toBeVisible()
})

const adventures: { mode: Mode; difficulty: Difficulty; stage: number }[] = [
  { mode: 'explore', difficulty: 'easy', stage: 1 },
  { mode: 'collect', difficulty: 'medium', stage: 1 },
  { mode: 'obstacles', difficulty: 'easy', stage: 3 },
  { mode: 'treasure', difficulty: 'hard', stage: 1 },
]

for (const { mode, difficulty, stage } of adventures) {
  test(`${MODE_NAMES[mode]} can be completed on ${difficulty}`, async ({ page }) => {
    const level = await chooseLevel(page, mode, difficulty, stage)
    await runToSuccess(page, level)
    await expect(page.getByLabel('3 stars earned', { exact: true })).toBeVisible()

    if (mode === 'explore') {
      await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key) || '{}'), PROGRESS_KEY))
        .toEqual({ [level.id]: 3 })
      await page.reload()
      await expect(page.getByLabel('3 stars earned', { exact: true })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Adventure 1, 3 stars earned', exact: true })).toBeVisible()
      await expect(page.getByText('1 of 6 adventures explored', { exact: false })).toBeVisible()
    }
  })
}

test('stopping cancels movement, and an edge mistake can be corrected and retried', async ({ page }) => {
  const longerLevel = await chooseLevel(page, 'explore', 'easy', 2)
  await addPlan(page, longerLevel.solution)
  await page.getByRole('button', { name: 'Let’s go!', exact: true }).click()
  await page.getByRole('button', { name: 'Stop & edit', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Stopped. Your plan is still here.')
  await expect(page.getByRole('button', { name: /^Step \d+:/ })).toHaveCount(longerLevel.solution.length)
  // Wait past a pending 650 ms movement: cancelled runs must stay at the start.
  await page.waitForTimeout(900)
  await expect(page.getByRole('gridcell', { name: 'A4, car facing up, start', exact: true })).toBeVisible()
  await expect(page.getByLabel('0 stars earned', { exact: true })).toBeVisible()

  const level = await chooseLevel(page, 'explore', 'easy')
  await addPlan(page, ['left', 'forward'])
  await page.getByRole('button', { name: 'Let’s go!', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Oops, that’s the edge!')
  await expect(page.getByRole('status')).toContainText('Step 2 goes off the map')
  await expect(page.getByRole('button', { name: 'Let’s try again!', exact: true })).toBeEnabled()
  await expect(page.getByLabel('0 stars earned', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Clear plan', exact: true }).click()
  await runToSuccess(page, level)
})

test('corrupt saved progress recovers safely and closing help restores keyboard focus', async ({ page }) => {
  await page.evaluate(key => localStorage.setItem(key, '{this is not valid JSON'), PROGRESS_KEY)
  await page.reload()
  await expect(page.getByLabel('0 stars earned', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Adventure 1, not completed', exact: true })).toBeVisible()
  await expect.poll(() => page.evaluate(key => localStorage.getItem(key), PROGRESS_KEY)).toBe('{}')

  const help = page.getByRole('button', { name: 'How to play', exact: true })
  await help.click()
  const dialog = page.getByRole('dialog', { name: 'Little arrows. Big ideas.', exact: true })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Close dialog', exact: true }).click()
  await expect(dialog).toBeHidden()
  await expect(help).toBeFocused()
})

test.describe('mobile explorer', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

  test('fits a phone screen and completes an adventure with touch controls', async ({ page }) => {
    await expect(page.getByRole('grid', { name: '4 by 4 adventure map' })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.getByRole('button', { name: COMMAND_NAMES.forward, exact: true }).tap()
    await page.getByRole('button', { name: 'Let’s go!', exact: true }).tap()
    await expect(page.getByRole('status')).toContainText('You found your way!')
    await expect(page.getByLabel('3 stars earned', { exact: true })).toBeAttached()
    await expect(page.getByRole('button', { name: 'Next adventure', exact: true })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })
})
