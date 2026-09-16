'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import {
  ArrowRight,
  ArrowUp,
  Check,
  ChevronRight,
  CircleHelp,
  Flag,
  Footprints,
  Gem,
  Lightbulb,
  Map,
  Mountain,
  Play,
  RotateCcw,
  Route,
  Sparkles,
  Sprout,
  Square,
  Star,
  Trophy,
  Undo2,
  X,
  CornerUpLeft,
  CornerUpRight,
  Apple,
  Trash2,
} from 'lucide-react'
import { AdventureArt } from '@/components/game-art'
import { GameBoard } from '@/components/game-board'
import { Stars } from '@/components/game-stars'
import {
  finishRun,
  generateLevel,
  getStars,
  initialRunState,
  stepRun,
  type Command,
  type Difficulty,
  type Level,
  type Mode,
  type Point,
  type RunState,
} from '@/lib/game-engine'
import {
  awardStars,
  completedLevels,
  parseProgress,
  PROGRESS_KEY,
  totalStars,
  type Progress,
} from '@/lib/game-progress'

const MODES = [
  {
    id: 'explore' as const,
    name: 'Trail explorer',
    description: 'Find your way to the flag',
    icon: Flag,
    tag: 'Start here',
    color: 'green',
    mission: 'Get your little car to the flag.',
    collection: '',
  },
  {
    id: 'collect' as const,
    name: 'Fruit pickup',
    description: 'A tasty little treasure hunt',
    icon: Apple,
    tag: '',
    color: 'peach',
    mission: 'Pick up every apple on the map.',
    collection: 'apples',
  },
  {
    id: 'obstacles' as const,
    name: 'Rocky roads',
    description: 'Think around the obstacles',
    icon: Mountain,
    tag: '',
    color: 'blue',
    mission: 'Reach the flag. Watch out for rocks!',
    collection: '',
  },
  {
    id: 'treasure' as const,
    name: 'Treasure quest',
    description: 'Collect, explore, and discover',
    icon: Gem,
    tag: '',
    color: 'purple',
    mission: 'Collect every gem, then reach the flag.',
    collection: 'gems',
  },
]
const DIFFICULTIES = [
  {
    id: 'easy' as const,
    name: 'Easy',
    description: 'Little steps',
    icon: Sprout,
  },
  {
    id: 'medium' as const,
    name: 'Medium',
    description: 'Growing skills',
    icon: Footprints,
  },
  {
    id: 'hard' as const,
    name: 'Hard',
    description: 'Big adventures',
    icon: Mountain,
  },
]
const COMMANDS = {
  forward: { name: 'Forward', detail: 'Move 1 tile', icon: ArrowUp },
  left: { name: 'Turn left', detail: 'Stay & turn', icon: CornerUpLeft },
  right: { name: 'Turn right', detail: 'Stay & turn', icon: CornerUpRight },
}
const DIRECTIONS = ['up', 'right', 'down', 'left']
const STAGES = 6

export default function CarGame() {
  const [mode, setMode] = useState<Mode>('explore')
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [stage, setStage] = useState(1)
  const course = useMemo(
    () =>
      Array.from({ length: STAGES }, (_, i) =>
        generateLevel(mode, difficulty, i + 1),
      ),
    [mode, difficulty],
  )
  const level = course[stage - 1]
  const [run, setRun] = useState<RunState>(() =>
    initialRunState(generateLevel('explore', 'easy', 1)),
  )
  const [commands, setCommands] = useState<Command[]>([])
  const [currentStep, setCurrentStep] = useState(-1)
  const [rotation, setRotation] = useState(0)
  const [visited, setVisited] = useState<Point[]>([])
  const [usedHint, setUsedHint] = useState(false)
  const [hintVisible, setHintVisible] = useState(false)
  const [progress, setProgress] = useState<Progress>({})
  const [loaded, setLoaded] = useState(false)
  const [storageAvailable, setStorageAvailable] = useState(true)
  const [dialog, setDialog] = useState<'help' | 'badges' | null>(null)
  const [notice, setNotice] = useState('')
  const queueRef = useRef<HTMLDivElement>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const feedbackRef = useRef<HTMLDivElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  const dialogOpener = useRef<HTMLElement | null>(null)
  const openDialog = (name: 'help' | 'badges', opener: HTMLElement) => {
    dialogOpener.current = opener
    setDialog(name)
  }
  const running = run.status === 'running'
  const won = run.status === 'success'
  const failed = ['edge', 'obstacle', 'incomplete'].includes(run.status)
  const selectedMode = MODES.find((item) => item.id === mode)!
  const selectedDifficulty = DIFFICULTIES.find(
    (item) => item.id === difficulty,
  )!
  const ModeIcon = selectedMode.icon
  const stars = totalStars(progress)
  const completed = completedLevels(progress)
  const stageStars = progress[level.id] || 0
  const earned = won
    ? getStars(commands.length, level.solution.length, usedHint)
    : 0
  const courseFinished = course.filter(
    (adventure) => progress[adventure.id],
  ).length

  useEffect(() => {
    try {
      setProgress(parseProgress(localStorage.getItem(PROGRESS_KEY)))
    } catch {
      setStorageAvailable(false)
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
    } catch {
      setStorageAvailable(false)
    }
  }, [progress, loaded])

  const resetRun = useCallback((nextLevel: Level, clear = false) => {
    setRun(initialRunState(nextLevel))
    setRotation(nextLevel.direction * 90)
    setCurrentStep(-1)
    setVisited([])
    setNotice('')
    if (clear) {
      setCommands([])
      setUsedHint(false)
      setHintVisible(false)
    }
  }, [])

  const changeAdventure = (
    nextMode: Mode,
    nextDifficulty: Difficulty,
    nextStage: number,
  ) => {
    if (
      running ||
      (nextMode === mode &&
        nextDifficulty === difficulty &&
        nextStage === stage)
    )
      return
    const nextLevel = generateLevel(nextMode, nextDifficulty, nextStage)
    if (
      window.matchMedia('(max-width: 640px)').matches &&
      boardRef.current &&
      boardRef.current.getBoundingClientRect().top < 0
    ) {
      boardRef.current.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'instant'
          : 'smooth',
        block: 'start',
      })
    }
    setMode(nextMode)
    setDifficulty(nextDifficulty)
    setStage(nextStage)
    resetRun(nextLevel, true)
  }

  const addCommand = useCallback(
    (command: Command) => {
      if (running || won || commands.length >= level.maxCommands) return
      if (failed) resetRun(level)
      setNotice('')
      setCommands((old) => [...old, command])
    },
    [running, won, commands.length, level, failed, resetRun],
  )

  const removeCommand = useCallback(
    (index: number) => {
      if (running || won) return
      resetRun(level)
      setCommands((old) => old.filter((_, i) => i !== index))
    },
    [running, won, resetRun, level],
  )

  const startRun = useCallback(() => {
    if (running || won || !commands.length) return
    setNotice('')
    setRotation(level.direction * 90)
    if (window.matchMedia('(max-width: 640px)').matches) {
      boardRef.current?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'instant'
          : 'smooth',
        block: 'start',
      })
    }
    setVisited([level.start])
    setCurrentStep(0)
    setRun({ ...initialRunState(level), status: 'running' })
  }, [running, won, commands.length, level])

  const stopRun = useCallback(() => {
    resetRun(level)
    setNotice('Stopped. Your plan is still here. Try it again!')
  }, [resetRun, level])

  useEffect(() => {
    if (!running || dialog) return
    const timer = window.setTimeout(() => {
      let next = stepRun(level, run, commands[currentStep])
      setVisited((old) => [...old, next.position])
      if (next.status === 'running' && currentStep + 1 >= commands.length)
        next = finishRun(level, next)
      setRun(next)
      if (commands[currentStep] === 'left') setRotation((old) => old - 90)
      if (commands[currentStep] === 'right') setRotation((old) => old + 90)
      if (next.status === 'success') {
        const reward = getStars(
          commands.length,
          level.solution.length,
          usedHint,
        )
        setProgress((old) => awardStars(old, level.id, reward))
      } else if (next.status === 'running') {
        setCurrentStep((old) => old + 1)
      }
    }, 650)
    return () => window.clearTimeout(timer)
  }, [running, run, currentStep, commands, level, usedHint, dialog])

  useEffect(() => {
    const target = running
      ? queueRef.current?.querySelector('[data-current="true"]')
      : queueRef.current?.lastElementChild
    if (target && queueRef.current) {
      const container = queueRef.current
      const element = target as HTMLElement
      container.scrollTop = Math.max(
        0,
        element.offsetTop -
          container.offsetTop -
          container.clientHeight +
          element.clientHeight +
          12,
      )
    }
  }, [commands.length, currentStep, running])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (
        dialog ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.repeat
      )
        return
      const target = event.target as HTMLElement
      if (target.closest('input, textarea, select, [contenteditable="true"]'))
        return
      const command = {
        ArrowUp: 'forward',
        ArrowLeft: 'left',
        ArrowRight: 'right',
      }[event.key] as Command | undefined
      if (command) {
        event.preventDefault()
        addCommand(command)
      } else if (event.key === 'Backspace') {
        event.preventDefault()
        removeCommand(commands.length - 1)
      } else if (event.key === 'Escape' && running) {
        event.preventDefault()
        stopRun()
      } else if (
        event.key === 'Enter' &&
        !target.closest('button, a, summary, [role="button"]')
      ) {
        event.preventDefault()
        startRun()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [
    dialog,
    addCommand,
    removeCommand,
    commands.length,
    running,
    stopRun,
    startRun,
  ])

  useEffect(() => {
    if (!won && !failed) return
    const timer = window.setTimeout(() => {
      if (won) nextRef.current?.focus({ preventScroll: true })
      if (window.matchMedia('(max-width: 640px)').matches) {
        feedbackRef.current?.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)')
            .matches
            ? 'instant'
            : 'smooth',
          block: 'center',
        })
      }
    }, 450)
    return () => window.clearTimeout(timer)
  }, [won, failed])

  const feedback = won
    ? {
        title: 'You found your way!',
        text:
          mode === 'collect'
            ? 'Every apple collected. What a brilliant plan!'
            : mode === 'treasure'
              ? 'All the gems and the flag. Amazing exploring!'
              : 'Look at you go! Your plan worked beautifully.',
      }
    : run.status === 'edge'
      ? {
          title: 'Oops, that’s the edge!',
          text: `Step ${currentStep + 1} goes off the map. Try a turn before moving forward.`,
        }
      : run.status === 'obstacle'
        ? {
            title: 'A rock is in the way!',
            text: `Step ${currentStep + 1} meets a rock. Let’s find a path around it.`,
          }
        : run.status === 'incomplete'
          ? {
              title: 'A few more steps to go!',
              text:
                level.collectibles.length > run.collected.length
                  ? `There are still ${selectedMode.collection} to collect. Edit your plan and try again.`
                  : 'Your car hasn’t reached the flag yet. Add a few more arrows!',
            }
          : {
              title: running
                ? `Following your plan… ${currentStep + 1} / ${commands.length}`
                : 'You’re in the driver’s seat',
              text: running
                ? 'Watch your car follow each arrow, one step at a time.'
                : 'Forward moves the car. Left and right turn it on the same tile.',
            }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="/" aria-label="Tiny Trails home">
          <span className="brand-icon">
            <Route size={25} strokeWidth={2.6} />
          </span>
          <span>
            tiny<span className="brand-accent">trails</span>
            <span className="brand-dot">.</span>
          </span>
        </a>
        <nav className="header-nav" aria-label="Main navigation">
          <span className="nav-active">
            <Map size={17} /> Let’s play
          </span>
          <button
            onClick={(event) => openDialog('badges', event.currentTarget)}
          >
            <Trophy size={17} /> My badges
          </button>
        </nav>
        <div className="header-actions">
          <span className="star-wallet" aria-label={`${stars} stars earned`}>
            <Star size={18} fill="currentColor" />
            <strong>{stars}</strong>
            <span>stars</span>
          </span>
          <button
            className="help-button"
            onClick={(event) => openDialog('help', event.currentTarget)}
            aria-label="How to play"
          >
            <CircleHelp size={22} />
          </button>
        </div>
      </header>

      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <span className="eyebrow">
              <span /> LITTLE EXPLORERS, BIG IDEAS
            </span>
            <h1 id="hero-title">
              Small steps.
              <br className="hero-title-break" /> <span>Big adventures.</span>
            </h1>
            <p>
              A little car. A clever plan. A world to explore.
              <br className="desktop-break" /> Where will your thinking take
              you?
            </p>
            <div className="hero-notes">
              <span>
                <Sprout size={16} /> Ages 6+
              </span>
              <span>
                <Sparkles size={16} /> Learn through play
              </span>
              <span>
                <Check size={16} /> Go at your pace
              </span>
            </div>
          </div>
          <div className="hero-art">
            <AdventureArt />
            <span className="adventure-sticker">
              <Sparkles size={15} /> Every try is a step forward!
            </span>
          </div>
        </section>

        <section
          className="adventure-section"
          aria-labelledby="adventure-heading"
        >
          <div className="section-heading">
            <h2 id="adventure-heading">
              <span className="step-circle">1</span> Pick your adventure
            </h2>
            <span className="quiet-label">Four ways to grow your thinking</span>
          </div>
          <div
            className="mode-options"
            role="group"
            aria-label="Adventure mode"
          >
            {MODES.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  className={`mode-card ${item.color} ${mode === item.id ? 'selected' : ''}`}
                  aria-pressed={mode === item.id}
                  disabled={running}
                  onClick={() => changeAdventure(item.id, difficulty, 1)}
                >
                  <span className="mode-icon">
                    <Icon size={25} strokeWidth={1.8} />
                  </span>
                  <span className="mode-copy">
                    <strong>{item.name}</strong>
                    <span>{item.description}</span>
                  </span>
                  <span
                    className={`mode-selector ${mode === item.id ? 'checked' : ''}`}
                    aria-hidden="true"
                  >
                    {mode === item.id && <Check size={12} strokeWidth={3} />}
                  </span>
                  {item.tag && <span className="mode-tag">{item.tag}</span>}
                </button>
              )
            })}
          </div>
        </section>

        <div className="game-settings">
          <div className="difficulty-label">
            <span className="step-circle">2</span>
            <strong>Choose your challenge</strong>
          </div>
          <div
            className="difficulty-options"
            role="group"
            aria-label="Difficulty"
          >
            {DIFFICULTIES.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  aria-pressed={difficulty === item.id}
                  disabled={running}
                  onClick={() => changeAdventure(mode, item.id, 1)}
                  className={difficulty === item.id ? 'selected' : ''}
                >
                  <Icon size={16} />
                  {item.name}
                  <span>{item.description}</span>
                </button>
              )
            })}
          </div>
          <span className="no-rush">
            <span /> No timer. Just you & your ideas.
          </span>
        </div>

        <section className="play-layout" aria-label="Play your adventure">
          <div className="board-panel" ref={boardRef}>
            <div className="panel-heading">
              <div>
                <span className="overline">
                  {selectedMode.name} <span> / </span> {selectedDifficulty.name}
                </span>
                <h2>
                  Adventure {String(stage).padStart(2, '0')}{' '}
                  <span className="level-chip">
                    {level.size} × {level.size} map
                  </span>
                </h2>
              </div>
              <Stars count={stageStars} size={21} />
            </div>
            <div className="mission">
              <span className={`mission-icon ${selectedMode.color}`}>
                <ModeIcon size={18} />
              </span>
              <span>{selectedMode.mission}</span>
              {level.collectibles.length > 0 && (
                <strong
                  aria-label={`${run.collected.length} of ${level.collectibles.length} ${selectedMode.collection} collected`}
                >
                  {run.collected.length} / {level.collectibles.length}
                </strong>
              )}
            </div>
            <GameBoard
              level={level}
              run={run}
              visited={visited}
              hint={hintVisible}
              rotation={rotation}
            />
            <div className="map-legend">
              <span>
                <i className="legend-car" /> Your car
              </span>
              {mode !== 'collect' && (
                <span>
                  <Flag size={14} /> Finish
                </span>
              )}
              {level.collectibles.length > 0 && (
                <span>
                  {mode === 'collect' ? <Apple size={14} /> : <Gem size={14} />}{' '}
                  Collect all
                </span>
              )}
              {level.obstacles.length > 0 && (
                <span>
                  <Mountain size={14} /> Go around
                </span>
              )}
              <span className="legend-direction">
                Facing {DIRECTIONS[run.direction]}{' '}
                <ArrowUp
                  size={14}
                  style={{ transform: `rotate(${run.direction * 90}deg)` }}
                />
              </span>
            </div>
            {running && (
              <div className="mobile-run-strip">
                <span>
                  Step {currentStep + 1} of {commands.length}
                </span>
                <button onClick={stopRun}>
                  <Square size={14} /> Stop & edit
                </button>
              </div>
            )}
          </div>

          <div className="plan-panel">
            <div className="plan-heading">
              <h2>
                <span className="step-circle">3</span> Make your plan
              </h2>
              <span className="small-tag">YOU’VE GOT THIS</span>
            </div>
            <p className="plan-description">
              Tap the arrows. Then let your adventure begin!
            </p>
            <div className="command-controls">
              {(['left', 'forward', 'right'] as Command[]).map((command) => {
                const { icon: Icon, name, detail } = COMMANDS[command]
                return (
                  <button
                    key={command}
                    className={`command-button command-${command}`}
                    onClick={() => addCommand(command)}
                    disabled={
                      running || won || commands.length >= level.maxCommands
                    }
                  >
                    <Icon size={29} strokeWidth={2.5} />
                    <strong>{name}</strong>
                    <span>{detail}</span>
                  </button>
                )
              })}
            </div>
            <div className="queue-heading">
              <h3>
                Your arrows{' '}
                <span>
                  {commands.length} / {level.maxCommands}
                </span>
              </h3>
              <div>
                <button
                  className="icon-button"
                  title="Undo last arrow"
                  aria-label="Undo last arrow"
                  disabled={!commands.length || running || won}
                  onClick={() => removeCommand(commands.length - 1)}
                >
                  <Undo2 size={17} />
                </button>
                <button
                  className="icon-button"
                  title="Clear plan"
                  aria-label="Clear plan"
                  disabled={!commands.length || running || won}
                  onClick={() => {
                    resetRun(level)
                    setCommands([])
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div
              className={`command-queue ${commands.length ? 'has-commands' : ''}`}
              ref={queueRef}
              aria-label="Your planned arrows"
            >
              {commands.length === 0 ? (
                <div className="queue-empty">
                  <div>
                    <span>
                      <CornerUpLeft size={20} />
                    </span>
                    <span>
                      <ArrowUp size={20} />
                    </span>
                    <span>
                      <CornerUpRight size={20} />
                    </span>
                  </div>
                  <p>Big adventures start with one arrow.</p>
                  <span>Tap a button above to add your first step.</span>
                </div>
              ) : (
                commands.map((command, i) => {
                  const Icon = COMMANDS[command].icon
                  return (
                    <button
                      key={i}
                      disabled={running || won}
                      data-current={i === currentStep}
                      className={`queued-command command-${command} ${i === currentStep ? (failed ? 'step-failed' : 'step-active') : ''} ${i < currentStep || (won && i === currentStep) ? 'step-done' : ''}`}
                      onClick={() => removeCommand(i)}
                      aria-label={`Step ${i + 1}: ${COMMANDS[command].name}. Click to remove.`}
                      aria-current={
                        running && i === currentStep ? 'step' : undefined
                      }
                    >
                      <small>{i + 1}</small>
                      <Icon size={23} />
                      <span className="remove-step">
                        <X size={10} />
                      </span>
                    </button>
                  )
                })
              )}
            </div>
            <div className="queue-tip">
              {commands.length >= level.maxCommands ? (
                'Your plan is full. Remove an arrow to make room.'
              ) : commands.length ? (
                'Changed your mind? Tap an arrow to remove it.'
              ) : (
                <>
                  <Lightbulb size={13} /> Little tip: your car starts facing up.
                </>
              )}
            </div>

            <div
              ref={feedbackRef}
              className={`feedback ${won ? 'feedback-success' : failed ? 'feedback-retry' : ''}`}
              role="status"
              aria-live={running ? 'off' : 'polite'}
              aria-atomic="true"
            >
              <div className="feedback-icon">
                {won ? (
                  <Trophy size={24} />
                ) : failed ? (
                  <RotateCcw size={22} />
                ) : (
                  <Lightbulb size={23} />
                )}
              </div>
              <div>
                <strong>{notice || feedback.title}</strong>
                <p>{feedback.text}</p>
                {won && <Stars count={earned} size={22} />}
              </div>
            </div>
            {won ? (
              <div className="success-actions">
                <button
                  ref={nextRef}
                  className="go-button"
                  onClick={() =>
                    stage < STAGES
                      ? changeAdventure(mode, difficulty, stage + 1)
                      : changeAdventure(
                          MODES[
                            (MODES.findIndex((m) => m.id === mode) + 1) %
                              MODES.length
                          ].id,
                          difficulty,
                          1,
                        )
                  }
                >
                  {stage < STAGES ? 'Next adventure' : 'Try another adventure'}
                  <ArrowRight size={20} />
                </button>
                <button
                  className="replay-button"
                  onClick={() => resetRun(level, true)}
                >
                  <RotateCcw size={15} /> Play again
                </button>
              </div>
            ) : (
              <button
                className={`go-button ${running ? 'stop-button' : ''}`}
                onClick={running ? stopRun : startRun}
                disabled={!running && !commands.length}
              >
                {running ? (
                  <Square size={18} fill="currentColor" />
                ) : (
                  <Play size={19} fill="currentColor" />
                )}
                {running
                  ? 'Stop & edit'
                  : failed
                    ? 'Let’s try again!'
                    : 'Let’s go!'}
                {!running && <ArrowRight className="go-arrow" size={19} />}
              </button>
            )}
            <button
              className="hint-button"
              disabled={running || won}
              aria-pressed={hintVisible}
              onClick={() => {
                setUsedHint(true)
                setHintVisible((old) => !old)
              }}
            >
              <Lightbulb size={16} />
              {hintVisible ? 'Hide the helping path' : 'A little help, please'}
              <ChevronRight size={14} />
            </button>
            {hintVisible && (
              <p className="hint-explanation">
                Follow the dotted tiles. Turn to face the next tile, then move
                forward. You can still earn 2 stars!
                <span className="hint-start">
                  Start with:{' '}
                  {level.solution
                    .slice(0, 4)
                    .map((command) => COMMANDS[command].name)
                    .join(' → ')}
                  {level.solution.length > 4 ? '…' : ''}
                </span>
              </p>
            )}
          </div>
        </section>

        <section className="journey-panel" aria-labelledby="journey-title">
          <div className="journey-intro">
            <span className="journey-icon">
              <Route size={23} />
            </span>
            <div>
              <h2 id="journey-title">Your little journey</h2>
              <p>
                {courseFinished} of {STAGES} adventures explored{' '}
                <span>
                  · {selectedMode.name} / {selectedDifficulty.name}
                </span>
              </p>
            </div>
          </div>
          <div
            className="journey-stages"
            role="group"
            aria-label="Choose adventure"
          >
            {Array.from({ length: STAGES }, (_, i) => {
              const n = i + 1
              const score = progress[course[i].id] || 0
              return (
                <button
                  key={n}
                  className={`journey-stage ${stage === n ? 'current' : ''} ${score ? 'completed' : ''}`}
                  disabled={running}
                  aria-label={`Adventure ${n}${score ? `, ${score} stars earned` : ', not completed'}`}
                  aria-pressed={stage === n}
                  onClick={() => changeAdventure(mode, difficulty, n)}
                >
                  <span>{score ? <Check size={19} strokeWidth={3} /> : n}</span>
                  <Stars count={score} size={9} />
                </button>
              )
            })}
          </div>
        </section>
        <footer className="site-footer">
          <span>
            <Sprout size={15} /> A little play. A little learning. A lot of
            possibility.
          </span>
          <span>
            {storageAvailable
              ? 'Your stars are saved on this device.'
              : 'Stars stay for this visit. Browser storage is unavailable.'}
          </span>
        </footer>
      </main>

      <Dialog.Root
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open) setDialog(null)
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content
            className="game-dialog"
            onCloseAutoFocus={(event) => {
              event.preventDefault()
              dialogOpener.current?.focus()
            }}
          >
            <Dialog.Close className="dialog-close" aria-label="Close dialog">
              <X size={20} />
            </Dialog.Close>
            {dialog === 'help' ? (
              <>
                <div className="dialog-symbol">
                  <Route size={30} />
                </div>
                <Dialog.Title>Little arrows. Big ideas.</Dialog.Title>
                <Dialog.Description>
                  Help your car explore, one step at a time.
                </Dialog.Description>
                <ol className="help-steps">
                  <li>
                    <span>1</span>
                    <div>
                      <strong>Look at your map</strong>
                      <p>
                        Find your car, the flag, and anything to collect. Your
                        car starts facing up.
                      </p>
                    </div>
                  </li>
                  <li>
                    <span>2</span>
                    <div>
                      <strong>Make a plan with arrows</strong>
                      <p>
                        Forward moves one tile. Left and right turn your car in
                        place. Think about which way your car is facing!
                      </p>
                    </div>
                  </li>
                  <li>
                    <span>3</span>
                    <div>
                      <strong>Press “Let’s go!”</strong>
                      <p>
                        Watch your plan come to life. If you meet a rock or the
                        edge, edit your arrows and try again. Every run starts
                        at the beginning.
                      </p>
                    </div>
                  </li>
                </ol>
                <div className="star-guide">
                  <Stars count={3} />
                  <p>
                    Finish to earn a star. A shorter plan earns more! A helping
                    path can earn up to 2 stars. Your best score always stays.
                  </p>
                </div>
                <p className="keyboard-help">
                  <strong>Keyboard explorers:</strong> ↑ forward · ← turn left ·
                  → turn right · Backspace undo · Enter run (when no button is
                  focused) · Esc stop
                </p>
                <Dialog.Close className="go-button">
                  Ready to explore <ArrowRight size={18} />
                </Dialog.Close>
              </>
            ) : (
              <>
                <div className="dialog-symbol gold">
                  <Trophy size={30} />
                </div>
                <Dialog.Title>Your explorer badges</Dialog.Title>
                <Dialog.Description>
                  Every little adventure helps you grow.
                </Dialog.Description>
                <div className="badge-totals">
                  <div>
                    <Star size={23} />
                    <strong>{stars}</strong>
                    <span>stars collected</span>
                  </div>
                  <div>
                    <Flag size={23} />
                    <strong>{completed} / 72</strong>
                    <span>adventures explored</span>
                  </div>
                </div>
                <div className="badge-grid">
                  {[
                    {
                      name: 'First steps',
                      detail: 'Finish your first adventure',
                      earned: completed >= 1,
                      icon: Sprout,
                    },
                    {
                      name: 'Star collector',
                      detail: 'Collect 12 stars',
                      earned: stars >= 12,
                      icon: Star,
                    },
                    {
                      name: 'Curious explorer',
                      detail: 'Finish a level in all 4 modes',
                      earned: MODES.every((m) =>
                        Object.keys(progress).some((id) =>
                          id.startsWith(`${m.id}-`),
                        ),
                      ),
                      icon: Map,
                    },
                    {
                      name: 'Trail champion',
                      detail: 'Finish 18 adventures',
                      earned: completed >= 18,
                      icon: Trophy,
                    },
                  ].map((badge) => (
                    <div
                      key={badge.name}
                      className={`explorer-badge ${badge.earned ? 'unlocked' : ''}`}
                    >
                      <badge.icon size={27} />
                      <strong>{badge.name}</strong>
                      <span>{badge.detail}</span>
                      <small>
                        {badge.earned ? 'Earned!' : 'Keep exploring'}
                      </small>
                    </div>
                  ))}
                </div>
                <p className="badge-note">
                  {storageAvailable
                    ? 'Saved in this browser. No account needed — just your curiosity.'
                    : 'Browser storage is unavailable. Keep this page open to keep your stars.'}
                </p>
                <Dialog.Close className="go-button">
                  Keep exploring <ArrowRight size={18} />
                </Dialog.Close>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
