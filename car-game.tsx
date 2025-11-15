"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { RotateCw, Play, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

// Direction enum (clockwise order)
enum Direction {
  North = 0,
  East = 1,
  South = 2,
  West = 3,
}

// Command types
type Command = "forward" | "left" | "right"

// Game mode types
type GameMode = "basic" | "pickFood" | "obstacles"

export default function CarGame() {
  // Board size
  const BOARD_SIZE = 5
  const CELL_SIZE = 64 // Size of each cell in pixels

  // Game state
  const [gameMode, setGameMode] = useState<GameMode>("basic")
  const [startPosition, setStartPosition] = useState<[number, number]>([0, 0])
  const [endPosition, setEndPosition] = useState<[number, number]>([4, 4])
  const [carPosition, setCarPosition] = useState<[number, number]>([0, 0])
  const [carDirection, setCarDirection] = useState<Direction>(Direction.North)
  const [commands, setCommands] = useState<Command[]>([])
  const [isExecuting, setIsExecuting] = useState(false)
  const [hasWon, setHasWon] = useState(false)
  const [hasFailed, setHasFailed] = useState(false)
  const [currentCommandIndex, setCurrentCommandIndex] = useState(-1)
  const [foodPositions, setFoodPositions] = useState<[number, number][]>([])
  const [collectedFood, setCollectedFood] = useState<number[]>([])
  const [obstacles, setObstacles] = useState<[number, number][]>([])

  // Use refs for direct DOM manipulation without re-renders
  const triangleRef = useRef<HTMLDivElement>(null)
  const currentRotationRef = useRef(0) // Start facing North (0 degrees)
  const boardRef = useRef<HTMLDivElement>(null)

  // Initialize the game
  useEffect(() => {
    resetGame()
  }, [])

  // Reset game when mode changes
  useEffect(() => {
    if (gameMode) {
      resetGame()
    }
  }, [gameMode])

  // Change game mode
  const changeGameMode = (mode: GameMode) => {
    if (!isExecuting) {
      setGameMode(mode)
    }
  }

  // Reset the game with a new random board
  const resetGame = () => {
    let start: [number, number] = [Math.floor(Math.random() * BOARD_SIZE), Math.floor(Math.random() * BOARD_SIZE)]
    let end: [number, number] = [0, 0]
    let foods: [number, number][] = []
    let obs: [number, number][] = []

    if (gameMode === "basic") {
      // Generate random start and end positions
      // Make sure end position is different from start
      do {
        end = [Math.floor(Math.random() * BOARD_SIZE), Math.floor(Math.random() * BOARD_SIZE)]
      } while (end[0] === start[0] && end[1] === start[1])
    } else if (gameMode === "pickFood") {
      // For pick food mode, no start/end, place car at center and generate 2 food positions
      start = [Math.floor(BOARD_SIZE / 2), Math.floor(BOARD_SIZE / 2)]
      
      // Generate 2 random food positions (different from start)
      const foodEmojis = ["🍎", "🍌"]
      for (let i = 0; i < 2; i++) {
        let foodPos: [number, number]
        do {
          foodPos = [Math.floor(Math.random() * BOARD_SIZE), Math.floor(Math.random() * BOARD_SIZE)]
        } while (
          (foodPos[0] === start[0] && foodPos[1] === start[1]) ||
          foods.some(f => f[0] === foodPos[0] && f[1] === foodPos[1])
        )
        foods.push(foodPos)
      }
    } else if (gameMode === "obstacles") {
      // Generate random start and end positions
      do {
        end = [Math.floor(Math.random() * BOARD_SIZE), Math.floor(Math.random() * BOARD_SIZE)]
      } while (end[0] === start[0] && end[1] === start[1])

      // Generate 2-4 random obstacle positions
      const numObstacles = 2 + Math.floor(Math.random() * 3) // 2-4 obstacles
      for (let i = 0; i < numObstacles; i++) {
        let obstaclePos: [number, number]
        do {
          obstaclePos = [Math.floor(Math.random() * BOARD_SIZE), Math.floor(Math.random() * BOARD_SIZE)]
        } while (
          (obstaclePos[0] === start[0] && obstaclePos[1] === start[1]) ||
          (obstaclePos[0] === end[0] && obstaclePos[1] === end[1]) ||
          obs.some(o => o[0] === obstaclePos[0] && o[1] === obstaclePos[1])
        )
        obs.push(obstaclePos)
      }
    }

    setStartPosition(start)
    setEndPosition(end)
    setCarPosition(start)
    setCarDirection(Direction.North)
    setFoodPositions(foods)
    setCollectedFood([])
    setObstacles(obs)

    // Reset rotation and position
    currentRotationRef.current = 0
    if (triangleRef.current) {
      triangleRef.current.style.transform = `translate(-50%, -50%) rotate(0deg)`
      updateTrianglePosition(start[0], start[1], false)
    }

    setCommands([])
    setIsExecuting(false)
    setHasWon(false)
    setHasFailed(false)
    setCurrentCommandIndex(-1)
  }

  // Add a command to the sequence
  const addCommand = (command: Command) => {
    if (!isExecuting && !hasWon) {
      setCommands([...commands, command])
    }
  }

  // Clear all commands
  const clearCommands = () => {
    if (!isExecuting) {
      setCommands([])
      setCarPosition(startPosition)
      setCarDirection(Direction.North)

      // Reset rotation and position
      currentRotationRef.current = 0
      if (triangleRef.current) {
        triangleRef.current.style.transform = `translate(-50%, -50%) rotate(0deg)`
        updateTrianglePosition(startPosition[0], startPosition[1], false)
      }

      setHasWon(false)
      setHasFailed(false)
    }
  }

  // Update triangle position with animation option
  const updateTrianglePosition = (x: number, y: number, animate = true) => {
    if (triangleRef.current) {
      if (!animate) {
        // Instant position update (no animation)
        triangleRef.current.style.transition = "transform 0.5s ease-in-out"
        triangleRef.current.style.left = `${x * CELL_SIZE + CELL_SIZE / 2}px`
        triangleRef.current.style.top = `${y * CELL_SIZE + CELL_SIZE / 2}px`
      } else {
        // Animated position update
        triangleRef.current.style.transition = "left 0.5s ease-in-out, top 0.5s ease-in-out, transform 0.5s ease-in-out"
        triangleRef.current.style.left = `${x * CELL_SIZE + CELL_SIZE / 2}px`
        triangleRef.current.style.top = `${y * CELL_SIZE + CELL_SIZE / 2}px`
      }
    }
  }

  // Rotate the triangle smoothly
  const rotateTriangle = (degrees: number) => {
    if (triangleRef.current) {
      // Update the rotation reference
      currentRotationRef.current = degrees

      // Apply the rotation directly to the DOM element, include visual offset
      triangleRef.current.style.transform = `translate(-50%, -50%) rotate(${degrees}deg)`
    }
  }

  // Execute the commands
  const executeCommands = async () => {
    if (commands.length === 0 || isExecuting || hasWon) return

    setIsExecuting(true)
    setHasWon(false)
    setHasFailed(false)

    // Start from initial position
    let currentX = startPosition[0]
    let currentY = startPosition[1]
    let currentDirection = Direction.North

    // Reset rotation to North
    currentRotationRef.current = 0
    rotateTriangle(0)

    // Update the initial state
    setCarPosition(startPosition)
    setCarDirection(Direction.North)
    updateTrianglePosition(startPosition[0], startPosition[1], false)

    // Execute each command one by one
    for (let i = 0; i < commands.length; i++) {
      setCurrentCommandIndex(i)

      // Wait for animation
      await new Promise((resolve) => setTimeout(resolve, 500))

      const command = commands[i]

      if (command === "forward") {
        let newX = currentX
        let newY = currentY

        // Move based on direction
        switch (currentDirection) {
          case Direction.North:
            newY = Math.max(0, currentY - 1)
            break
          case Direction.East:
            newX = Math.min(BOARD_SIZE - 1, currentX + 1)
            break
          case Direction.South:
            newY = Math.min(BOARD_SIZE - 1, currentY + 1)
            break
          case Direction.West:
            newX = Math.max(0, currentX - 1)
            break
        }

        // Check if we hit a boundary
        if (
          newX === currentX &&
          newY === currentY &&
          ((currentDirection === Direction.North && currentY === 0) ||
            (currentDirection === Direction.East && currentX === BOARD_SIZE - 1) ||
            (currentDirection === Direction.South && currentY === BOARD_SIZE - 1) ||
            (currentDirection === Direction.West && currentX === 0))
        ) {
          // Update state before breaking
          setCarPosition([currentX, currentY])
          setCarDirection(currentDirection)
          setHasFailed(true)
          break
        }

        // Update current position
        currentX = newX
        currentY = newY

        // Check for obstacle collision
        if (gameMode === "obstacles") {
          const hitObstacle = obstacles.some(obs => obs[0] === currentX && obs[1] === currentY)
          if (hitObstacle) {
            updateTrianglePosition(currentX, currentY, true)
            setCarPosition([currentX, currentY])
            setHasFailed(true)
            break
          }
        }

        // Update the UI with animation
        updateTrianglePosition(currentX, currentY, true)
        setCarPosition([currentX, currentY])

        // Check for food collection
        if (gameMode === "pickFood") {
          const foodIndex = foodPositions.findIndex(food => food[0] === currentX && food[1] === currentY)
          if (foodIndex !== -1 && !collectedFood.includes(foodIndex)) {
            setCollectedFood(prev => [...prev, foodIndex])
            // Check if all food collected
            if (collectedFood.length + 1 === foodPositions.length) {
              setHasWon(true)
              break
            }
          }
        }

        // Check if we reached the end (for basic and obstacles mode)
        if ((gameMode === "basic" || gameMode === "obstacles") && currentX === endPosition[0] && currentY === endPosition[1]) {
          setHasWon(true)
          break
        }
      } else if (command === "left") {
        // Turn left (counter-clockwise)
        currentDirection = (currentDirection + 3) % 4

        // Update rotation - subtract 90 degrees for left turn
        const newRotation = currentRotationRef.current - 90
        rotateTriangle(newRotation)

        setCarDirection(currentDirection)
      } else if (command === "right") {
        // Turn right (clockwise)
        currentDirection = (currentDirection + 1) % 4

        // Update rotation - add 90 degrees for right turn
        const newRotation = currentRotationRef.current + 90
        rotateTriangle(newRotation)

        setCarDirection(currentDirection)
      }

      // Wait for animation to complete
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    setCurrentCommandIndex(-1)
    setIsExecuting(false)

    // Final check for win condition (using the updated position)
    if (currentX === endPosition[0] && currentY === endPosition[1]) {
      setHasWon(true)
    }
  }

  // Get command icon based on command type
  const getCommandIcon = (command: Command) => {
    switch (command) {
      case "forward":
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 20L12 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M8 8L12 4L16 8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        )
      case "left":
        // Custom SVG for 90-degree left turn starting from bottom with larger arrow
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 20L12 12L4 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M8 7L4 12L8 17"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        )
      case "right":
        // Custom SVG for 90-degree right turn starting from bottom with larger arrow
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 20L12 12L20 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M16 7L20 12L16 17"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        )
    }
  }

  // Render the board
  const renderBoard = () => {
    const board = []

    for (let y = 0; y < BOARD_SIZE; y++) {
      const row = []
      for (let x = 0; x < BOARD_SIZE; x++) {
        const isStart = gameMode !== "pickFood" && startPosition[0] === x && startPosition[1] === y
        const isEnd = (gameMode === "basic" || gameMode === "obstacles") && endPosition[0] === x && endPosition[1] === y
        const isCar = carPosition[0] === x && carPosition[1] === y
        const foodIndex = foodPositions.findIndex(food => food[0] === x && food[1] === y)
        const isFood = foodIndex !== -1
        const isFoodCollected = isFood && collectedFood.includes(foodIndex)
        const isObstacle = obstacles.some(obs => obs[0] === x && obs[1] === y)

        let cellClass = `w-[${CELL_SIZE}px] h-[${CELL_SIZE}px] border flex items-center justify-center relative`

        if (isStart) {
          cellClass += " bg-blue-100"
        } else if (isEnd) {
          cellClass += " bg-green-100"
        } else if (isObstacle) {
          cellClass += " bg-gray-100"
        } else {
          cellClass += " bg-white"
        }

        const foodEmojis = ["🍎", "🍌"]

        row.push(
          <div key={`${x}-${y}`} className={cellClass} style={{ width: CELL_SIZE, height: CELL_SIZE }}>
            {isStart && <Badge variant="outline">Start</Badge>}
            {isEnd && (
              <Badge variant="outline" className="bg-green-50">
                End
              </Badge>
            )}
            {isFood && !isFoodCollected && (
              <span className="text-3xl" style={{ position: "relative", zIndex: 5 }}>
                {foodEmojis[foodIndex]}
              </span>
            )}
            {isFood && isFoodCollected && (
              <span className="text-3xl opacity-30" style={{ position: "relative", zIndex: 5 }}>
                ✨
              </span>
            )}
            {isObstacle && (
              <span className="text-3xl" style={{ position: "relative", zIndex: 5 }}>
                🪨
              </span>
            )}
          </div>,
        )
      }
      board.push(
        <div key={y} className="flex">
          {row}
        </div>,
      )
    }

    return board
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 gap-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row gap-8 w-full">
        {/* Game board */}
        <div className="flex-1">
          <Card className="p-4 flex flex-col items-center">
            <div className="border-2 border-gray-200 rounded-md overflow-hidden relative" ref={boardRef}>
              {renderBoard()}
              {/* The triangle is positioned absolutely over the board */}
              <div
                ref={triangleRef}
                className="absolute transition-all duration-500 ease-in-out z-10"
                style={{
                  left: `${carPosition[0] * CELL_SIZE + CELL_SIZE / 2}px`,
                  top: `${carPosition[1] * CELL_SIZE + CELL_SIZE / 2}px`,
                  transform: `translate(-50%, -50%) rotate(${currentRotationRef.current}deg)`,
                }}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={`${hasWon ? "text-green-500" : hasFailed ? "text-red-500" : "text-blue-500"}`}
                >
                  {/* Top-down car view with pointed front and flat back */}
                  {/* Main car body with tapered front */}
                  <polygon points="12,2 15,6 15,18 9,18 9,6" fill="currentColor" />
                  {/* Front windshield */}
                  <polygon points="11,7 13,7 13,10 11,10" fill="currentColor" opacity="0.4" />
                  {/* Rear window */}
                  <polygon points="11,13 13,13 13,16 11,16" fill="currentColor" opacity="0.3" />
                  {/* Left mirror */}
                  <circle cx="7.5" cy="8" r="0.8" fill="currentColor" opacity="0.6" />
                  {/* Right mirror */}
                  <circle cx="16.5" cy="8" r="0.8" fill="currentColor" opacity="0.6" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex-1">
          <Card className="p-4">
            {/* Game Mode buttons */}
            <div className="mb-6">
              <p className="text-sm font-medium mb-2">Game Mode:</p>
              <div className="flex gap-2">
                <Button
                  onClick={() => changeGameMode("basic")}
                  disabled={isExecuting}
                  variant={gameMode === "basic" ? "default" : "outline"}
                  className="flex-1"
                >
                  🚗 Basic
                </Button>
                <Button
                  onClick={() => changeGameMode("pickFood")}
                  disabled={isExecuting}
                  variant={gameMode === "pickFood" ? "default" : "outline"}
                  className="flex-1"
                >
                  🍎 Pick Food
                </Button>
                <Button
                  onClick={() => changeGameMode("obstacles")}
                  disabled={isExecuting}
                  variant={gameMode === "obstacles" ? "default" : "outline"}
                  className="flex-1"
                >
                  🪨 Obstacles
                </Button>
              </div>
            </div>

            {/* Command buttons */}
            <div className="flex gap-2 mb-6">
              <Button onClick={() => addCommand("forward")} disabled={isExecuting || hasWon} className="flex-1">
                {getCommandIcon("forward")}
                <span className="ml-1">Forward</span>
              </Button>
              <Button onClick={() => addCommand("left")} disabled={isExecuting || hasWon} className="flex-1">
                {getCommandIcon("left")}
                <span className="ml-1">Left</span>
              </Button>
              <Button onClick={() => addCommand("right")} disabled={isExecuting || hasWon} className="flex-1">
                {getCommandIcon("right")}
                <span className="ml-1">Right</span>
              </Button>
            </div>

            {/* Command sequence */}
            <div className="mb-4">
              <div className="border rounded-md p-2 min-h-[100px] bg-gray-50">
                {commands.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Add commands to create your program</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {commands.map((cmd, index) => (
                      <Badge
                        key={index}
                        variant={currentCommandIndex === index ? "default" : "outline"}
                        className={`${currentCommandIndex === index ? "bg-primary" : ""} p-2`}
                      >
                        {getCommandIcon(cmd)}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button
                onClick={executeCommands}
                disabled={commands.length === 0 || isExecuting || hasWon}
                className="flex-1"
                variant="default"
              >
                <Play className="mr-1 h-4 w-4" />
                Go
              </Button>
              <Button
                onClick={clearCommands}
                disabled={commands.length === 0 || isExecuting}
                className="flex-1"
                variant="outline"
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Forget
              </Button>
              <Button onClick={resetGame} disabled={isExecuting} className="flex-1" variant="outline">
                <RotateCw className="mr-1 h-4 w-4" />
                New Board
              </Button>
            </div>

            {/* Status message */}
            {hasWon && (
              <div className="mt-4 p-2 bg-green-100 text-green-800 rounded-md text-center">
                {gameMode === "pickFood" 
                  ? "Success! You collected all the food! 🎉"
                  : "Success! The car reached the destination! 🎉"}
              </div>
            )}
            {hasFailed && (
              <div className="mt-4 p-2 bg-red-100 text-red-800 rounded-md text-center">
                {gameMode === "obstacles"
                  ? "Oops! The car hit an obstacle! Try again! 💥"
                  : "The car couldn't complete all commands. Try again!"}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
