// globals.js - Global state and constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: "START", // "START", "PLAYING", "PAUSED", "GAME_OVER_WIN", "GAME_OVER_LOSE"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2"
  
  // Puzzle-specific state
  currentLevel: 1,
  currentPuzzleIndex: 0,
  puzzleSolved: false,
  hintUsedCount: 0,
  showHint: false,
  selectedObjectIndex: 0,
  
  // Transition state
  transitionTimer: 0,
  transitionDuration: 120, // 2 seconds at 60fps
  showTransition: false,
  transitionMessage: "",
  
  // Interactive elements for current puzzle
  interactiveElements: [],
  
  // High score
  highScore: 0
};

// Puzzle definitions
export const PUZZLES = [
  // Level 1: Introduction
  {
    level: 1,
    id: 0,
    hint: "Try tapping the green circle!",
    instruction: "Find and tap the correct shape",
    winCondition: "tapGreen",
    elements: [
      { type: "circle", x: 150, y: 200, radius: 40, color: [255, 100, 100], interactive: true, id: "redCircle" },
      { type: "circle", x: 300, y: 200, radius: 40, color: [100, 255, 100], interactive: true, id: "greenCircle" },
      { type: "circle", x: 450, y: 200, radius: 40, color: [100, 100, 255], interactive: true, id: "blueCircle" }
    ]
  },
  {
    level: 1,
    id: 1,
    hint: "Drag the box to the right side of the screen",
    instruction: "Move the box to reveal the hidden star",
    winCondition: "dragBoxRight",
    elements: [
      { type: "rect", x: 300, y: 200, width: 100, height: 100, color: [200, 150, 100], interactive: true, id: "box", draggable: true },
      { type: "star", x: 300, y: 200, size: 30, color: [255, 215, 0], interactive: false, id: "hiddenStar", hidden: true }
    ]
  },
  {
    level: 1,
    id: 2,
    hint: "Swipe the apple down to make it fall",
    instruction: "Help the apple fall from the tree",
    winCondition: "swipeAppleDown",
    elements: [
      { type: "circle", x: 300, y: 100, radius: 25, color: [255, 50, 50], interactive: true, id: "apple", draggable: true },
      { type: "rect", x: 290, y: 60, width: 20, height: 40, color: [139, 69, 19], interactive: false, id: "branch" },
      { type: "rect", x: 250, y: 350, width: 100, height: 30, color: [101, 67, 33], interactive: false, id: "ground" }
    ]
  },
  
  // Level 2: Combining interactions
  {
    level: 2,
    id: 3,
    hint: "First tap the key, then drag it to the lock",
    instruction: "Unlock the treasure chest",
    winCondition: "unlockChest",
    elements: [
      { type: "rect", x: 400, y: 200, width: 80, height: 60, color: [139, 69, 19], interactive: false, id: "chest" },
      { type: "circle", x: 420, y: 190, radius: 8, color: [50, 50, 50], interactive: false, id: "lock" },
      { type: "key", x: 150, y: 300, size: 30, color: [218, 165, 32], interactive: true, id: "key", draggable: true, pickedUp: false }
    ]
  },
  {
    level: 2,
    id: 4,
    hint: "Tap the cloud to make it rain, then the flower will grow",
    instruction: "Make the flower bloom",
    winCondition: "bloomFlower",
    elements: [
      { type: "cloud", x: 300, y: 100, width: 80, height: 40, color: [200, 200, 220], interactive: true, id: "cloud", raining: false },
      { type: "flower", x: 300, y: 320, stemHeight: 60, petalSize: 20, color: [255, 100, 150], interactive: false, id: "flower", bloomed: false }
    ]
  },
  {
    level: 2,
    id: 5,
    hint: "Stack the boxes by dragging them on top of each other to reach the star",
    instruction: "Stack boxes to reach the star",
    winCondition: "stackBoxes",
    elements: [
      { type: "rect", x: 200, y: 350, width: 60, height: 60, color: [180, 120, 80], interactive: true, id: "box1", draggable: true },
      { type: "rect", x: 300, y: 350, width: 60, height: 60, color: [180, 120, 80], interactive: true, id: "box2", draggable: true },
      { type: "rect", x: 400, y: 350, width: 60, height: 60, color: [180, 120, 80], interactive: true, id: "box3", draggable: true },
      { type: "star", x: 300, y: 80, size: 25, color: [255, 215, 0], interactive: false, id: "star" }
    ]
  },
  
  // Level 3: Advanced logic
  {
    level: 3,
    id: 6,
    hint: "The sun is hiding! Try dragging the entire sky down",
    instruction: "Find the missing sun",
    winCondition: "revealSun",
    elements: [
      { type: "background", x: 300, y: 200, width: 600, height: 400, color: [135, 206, 235], interactive: true, id: "sky", draggable: true, offsetY: 0 },
      { type: "circle", x: 300, y: -50, radius: 40, color: [255, 255, 0], interactive: false, id: "sun" }
    ]
  },
  {
    level: 3,
    id: 7,
    hint: "The answer might be outside the usual area. Try moving objects to the edges",
    instruction: "Find the hidden button",
    winCondition: "findHiddenButton",
    elements: [
      { type: "rect", x: 300, y: 200, width: 400, height: 300, color: [200, 200, 200], interactive: false, id: "wall" },
      { type: "rect", x: 250, y: 200, width: 80, height: 80, color: [150, 100, 200], interactive: true, id: "movableBlock", draggable: true },
      { type: "circle", x: 570, y: 200, radius: 15, color: [255, 0, 0], interactive: true, id: "hiddenButton", visible: false }
    ]
  },
  {
    level: 3,
    id: 8,
    hint: "The dots need to be arranged in order: red, yellow, green (like a traffic light)",
    instruction: "Arrange the colored dots correctly",
    winCondition: "arrangeColors",
    elements: [
      { type: "circle", x: 200, y: 200, radius: 30, color: [255, 255, 0], interactive: true, id: "yellowDot", draggable: true, targetY: 200 },
      { type: "circle", x: 300, y: 200, radius: 30, color: [0, 255, 0], interactive: true, id: "greenDot", draggable: true, targetY: 280 },
      { type: "circle", x: 400, y: 200, radius: 30, color: [255, 0, 0], interactive: true, id: "redDot", draggable: true, targetY: 120 },
      { type: "rect", x: 300, y: 200, width: 80, height: 200, color: [100, 100, 100], interactive: false, id: "pole" }
    ]
  }
];

export function getGameState() {
  return gameState;
}

// Attach to window
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}