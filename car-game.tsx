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

export default function CarGame() {
  // Board size
  const BOARD_SIZE = 5
  const CELL_SIZE = 64 // Size of each cell in pixels

  // Game state
  const [startPosition, setStartPosition] = useState<[number, number]>([0, 0])
  const [endPosition, setEndPosition] = useState<[number, number]>([4, 4])
  const [carPosition, setCarPosition] = useState<[number, number]>([0, 0])
  const [carDirection, setCarDirection] = useState<Direction>(Direction.North)
  const [commands, setCommands] = useState<Command[]>([])
  const [isExecuting, setIsExecuting] = useState(false)
  const [hasWon, setHasWon] = useState(false)
  const [hasFailed, setHasFailed] = useState(false)
  const [currentCommandIndex, setCurrentCommandIndex] = useState(-1)

  // Use refs for direct DOM manipulation without re-renders
  const triangleRef = useRef<HTMLDivElement>(null)
  const currentRotationRef = useRef(0) // Start facing North (0 degrees)
  const boardRef = useRef<HTMLDivElement>(null)

  // Initialize the game
  useEffect(() => {
    resetGame()
  }, [])

  // Reset the game with a new random board
  const resetGame = () => {
    // Generate random start and end positions
    const start: [number, number] = [Math.floor(Math.random() * BOARD_SIZE), Math.floor(Math.random() * BOARD_SIZE)]

    // Make sure end position is different from start
    let end: [number, number]
    do {
      end = [Math.floor(Math.random() * BOARD_SIZE), Math.floor(Math.random() * BOARD_SIZE)]
    } while (end[0] === start[0] && end[1] === start[1])

    setStartPosition(start)
    setEndPosition(end)
    setCarPosition(start)
    setCarDirection(Direction.North)

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

      // Apply the rotation directly to the DOM element
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

        // Update the UI with animation
        updateTrianglePosition(currentX, currentY, true)
        setCarPosition([currentX, currentY])

        // Check if we reached the end
        if (currentX === endPosition[0] && currentY === endPosition[1]) {
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
        const isStart = startPosition[0] === x && startPosition[1] === y
        const isEnd = endPosition[0] === x && endPosition[1] === y
        const isCar = carPosition[0] === x && carPosition[1] === y

        let cellClass = `w-[${CELL_SIZE}px] h-[${CELL_SIZE}px] border flex items-center justify-center`

        if (isStart) {
          cellClass += " bg-blue-100"
        } else if (isEnd) {
          cellClass += " bg-green-100"
        } else {
          cellClass += " bg-white"
        }

        row.push(
          <div key={`${x}-${y}`} className={cellClass} style={{ width: CELL_SIZE, height: CELL_SIZE }}>
            {isStart && <Badge variant="outline">Start</Badge>}
            {isEnd && (
              <Badge variant="outline" className="bg-green-50">
                End
              </Badge>
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
                className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-in-out z-10"
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
                  <polygon points="12,2 22,20 2,20" fill="currentColor" stroke="currentColor" strokeWidth="1" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex-1">
          <Card className="p-4">

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
                Success! The triangle reached the destination.
              </div>
            )}
            {hasFailed && (
              <div className="mt-4 p-2 bg-red-100 text-red-800 rounded-md text-center">
                The triangle couldn't complete all commands. Try again!
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
