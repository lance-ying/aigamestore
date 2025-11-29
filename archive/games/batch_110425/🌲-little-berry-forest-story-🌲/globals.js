// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const CONTROL_MODES = {
  HUMAN: "HUMAN",
  TEST_1: "TEST_1",
  TEST_2: "TEST_2",
  TEST_3: "TEST_3",
  TEST_4: "TEST_4"
};

// Game state object
export const gameState = {
  player: null,
  entities: [],
  characters: [],
  ingredients: [],
  berries: [],
  cookingStation: null,
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: CONTROL_MODES.HUMAN,
  inventory: {
    strawberry: 0,
    blueberry: 0,
    mushroom: 0,
    honey: 0,
    flour: 0
  },
  recipes: [],
  unlockedRecipes: [],
  cookedDishes: [],
  characterInteractions: {},
  showCookingMenu: false,
  miniGameActive: false,
  miniGameType: null,
  miniGameData: null,
  totalCharacters: 0,
  interactedCharacters: 0,
  frameCount: 0,
  testingPath: [],
  testingStep: 0
};

// Recipe definitions
export const RECIPES = [
  { 
    id: "berry_tart", 
    name: "Berry Tart", 
    ingredients: { strawberry: 2, blueberry: 2, flour: 1 },
    unlockedBy: "rabbit"
  },
  { 
    id: "honey_cake", 
    name: "Honey Cake", 
    ingredients: { honey: 2, flour: 2 },
    unlockedBy: "bear"
  },
  { 
    id: "mushroom_soup", 
    name: "Mushroom Soup", 
    ingredients: { mushroom: 3, flour: 1 },
    unlockedBy: "fox"
  },
  { 
    id: "berry_smoothie", 
    name: "Berry Smoothie", 
    ingredients: { strawberry: 1, blueberry: 1, honey: 1 },
    unlockedBy: "deer"
  },
  { 
    id: "forest_stew", 
    name: "Forest Stew", 
    ingredients: { mushroom: 2, strawberry: 1, blueberry: 1 },
    unlockedBy: "owl"
  },
  { 
    id: "sweet_bread", 
    name: "Sweet Bread", 
    ingredients: { flour: 2, honey: 1, strawberry: 1 },
    unlockedBy: "squirrel"
  }
];

// Character definitions
export const CHARACTER_DEFS = [
  { id: "rabbit", name: "Berry Rabbit", x: 150, y: 150, color: [255, 182, 193], story: "A cheerful rabbit who loves berries!" },
  { id: "bear", name: "Honey Bear", x: 450, y: 150, color: [210, 180, 140], story: "A gentle bear with a sweet tooth." },
  { id: "fox", name: "Wise Fox", x: 150, y: 300, color: [255, 140, 0], story: "A clever fox who knows the forest." },
  { id: "deer", name: "Forest Deer", x: 450, y: 300, color: [189, 154, 122], story: "An elegant deer who guards the grove." },
  { id: "owl", name: "Night Owl", x: 300, y: 100, color: [138, 118, 99], story: "A wise owl who watches over everyone." },
  { id: "squirrel", name: "Busy Squirrel", x: 300, y: 350, color: [160, 82, 45], story: "An energetic squirrel always collecting." }
];

export const PLAYER_SPEED = 2;
export const PLAYER_SPRINT_SPEED = 3.5;
export const PLAYER_SIZE = 20;
export const CHARACTER_SIZE = 30;
export const ITEM_SIZE = 12;
export const INTERACTION_DISTANCE = 40;
export const COOKING_STATION_SIZE = 40;

// Win condition
export const DISHES_TO_WIN = 5;
export const ALL_CHARACTERS_NEEDED = true;