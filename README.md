# Tiny Trails

A playful coding adventure for children ages 6 and up. Build a sequence of moves, send your explorer on a little journey, and learn by trying again. Clear visual feedback, gentle hints, and collectible stars make each step easy to understand.

## Choose an adventure

- **Explore:** Find a route to the flag.
- **Collect:** Pick up all the fruit.
- **Obstacles:** Reach the flag while avoiding rocks.
- **Treasure:** Collect every gem, then reach the flag.

Each mode has three difficulty levels with 4×4, 5×5, and 6×6 maps, and six stages per difficulty. There are no timers, lives, purchases, or accounts. Try any challenge at your own pace, use a hint when needed, and replay a stage to improve your stars.

Stars are saved in this browser on this device. Your best result for a stage is kept, so replaying never takes away earned stars. Clearing browser storage also clears this progress.

## How to play

1. Choose a mode, difficulty, and stage.
2. Add **forward**, **turn left**, and **turn right** instructions.
3. Run the sequence and watch the explorer follow your plan.
4. Adjust your instructions after a mistake or try the next stage after success.

Use the on-screen controls, or the keyboard: **↑** adds forward, **←** adds turn left, **→** adds turn right, **Enter** runs the sequence when no button or link is focused, **Backspace** removes the last instruction, and **Escape** stops a running sequence. Turns change the direction the explorer faces; forward moves one square in that direction.

## Development

Use Node.js 22.6 or newer. Install dependencies with `pnpm install --frozen-lockfile`, then start the development server with `pnpm dev`. npm scripts below work with pnpm too.

- `npm run typecheck` checks TypeScript.
- `npm test` checks the game rules, generated levels, and saved-progress handling.
- `npx playwright install chromium` installs the browser for the first test run.
- `npm run test:e2e` checks full play sessions, retries, stopping, saved stars, keyboard focus, and mobile touch controls.
- `npm run build` creates a production build.
- `npm start` serves the production build.

Built with Next.js, React, and TypeScript.

## Deployment

[Open the Vercel project](https://vercel.com/jirihofmans-projects/v0-learning-game-project-ss)

[Original v0 project](https://v0.app/chat/420jwC35xMZ)
