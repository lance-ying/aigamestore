// globals.js - Global game state and constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const gameState = {
  player: null, // Not used in this game, but required by template
  entities: [], // Not used in this game, but required by template
  score: 0,
  gamePhase: "START", // "START", "PLAYING", "GAME_OVER_WIN", "GAME_OVER_LOSE", "PAUSED"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2"
  
  // Game-specific state
  currentLevel: 1,
  movesRemaining: 0,
  deckCards: [],
  activeCard: null,
  boardLayout: [],
  categoryCards: [],
  highlightedCategoryIndex: 0,
  levelData: null,
  animatingCard: null,
  animationProgress: 0,
  levelScore: 0,
  completedCategories: new Set(),
  
  // Testing state
  testingActions: [],
  testingActionIndex: 0,
  testingFrameDelay: 0
};

// Level definitions
export const LEVEL_DEFINITIONS = [
  {
    level: 1,
    moves: 20,
    categories: [
      { name: "Colors", x: 100, y: 150 },
      { name: "Shapes", x: 250, y: 150 },
      { name: "Animals", x: 400, y: 150 }
    ],
    words: [
      { word: "Red", category: "Colors" },
      { word: "Blue", category: "Colors" },
      { word: "Green", category: "Colors" },
      { word: "Circle", category: "Shapes" },
      { word: "Square", category: "Shapes" },
      { word: "Triangle", category: "Shapes" },
      { word: "Dog", category: "Animals" },
      { word: "Cat", category: "Animals" },
      { word: "Bird", category: "Animals" }
    ]
  },
  {
    level: 2,
    moves: 15,
    categories: [
      { name: "Emotions", x: 80, y: 120 },
      { name: "Weather", x: 220, y: 120 },
      { name: "Foods", x: 360, y: 120 },
      { name: "Sports", x: 500, y: 120 }
    ],
    words: [
      { word: "Joy", category: "Emotions" },
      { word: "Sadness", category: "Emotions" },
      { word: "Anger", category: "Emotions" },
      { word: "Sunny", category: "Weather" },
      { word: "Rainy", category: "Weather" },
      { word: "Cloudy", category: "Weather" },
      { word: "Apple", category: "Foods" },
      { word: "Bread", category: "Foods" },
      { word: "Cheese", category: "Foods" },
      { word: "Soccer", category: "Sports" },
      { word: "Tennis", category: "Sports" },
      { word: "Swimming", category: "Sports" }
    ]
  },
  {
    level: 3,
    moves: 12,
    categories: [
      { name: "Instruments", x: 60, y: 100 },
      { name: "Genres", x: 180, y: 100 },
      { name: "Vehicles", x: 300, y: 100 },
      { name: "Planets", x: 420, y: 100 },
      { name: "Elements", x: 540, y: 100 }
    ],
    words: [
      { word: "Guitar", category: "Instruments" },
      { word: "Piano", category: "Instruments" },
      { word: "Violin", category: "Instruments" },
      { word: "Rock", category: "Genres" },
      { word: "Jazz", category: "Genres" },
      { word: "Pop", category: "Genres" },
      { word: "Car", category: "Vehicles" },
      { word: "Bike", category: "Vehicles" },
      { word: "Boat", category: "Vehicles" },
      { word: "Mars", category: "Planets" },
      { word: "Venus", category: "Planets" },
      { word: "Jupiter", category: "Planets" },
      { word: "Fire", category: "Elements" },
      { word: "Water", category: "Elements" },
      { word: "Earth", category: "Elements" }
    ]
  }
];

export const CARD_WIDTH = 90;
export const CARD_HEIGHT = 120;
export const CATEGORY_CARD_WIDTH = 100;
export const CATEGORY_CARD_HEIGHT = 140;

export const DECK_X = 50;
export const DECK_Y = 300;
export const ACTIVE_CARD_X = 160;
export const ACTIVE_CARD_Y = 300;