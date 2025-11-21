// Global constants and game state
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Key codes
export const KEY_ENTER = 13;
export const KEY_ESC = 27;
export const KEY_R = 82;
export const KEY_ARROW_UP = 38;
export const KEY_ARROW_DOWN = 40;
export const KEY_SPACE = 32;

// Game configuration
export const ROUND_TIME = 60; // 60 seconds per round
export const MIN_SCORE_TO_WIN = 15; // Need at least 15 correct to win

// Game state object
export const gameState = {
  player: null,
  entities: [],
  score: 0,
  skips: 0,
  currentCard: null,
  cards: [],
  timeRemaining: ROUND_TIME,
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  framesSinceLastAction: 0,
  totalCardsShown: 0,
  cardChangeAnimation: 0,
  lastActionTime: 0
};

// Card data
export const CHARACTERS = [
  "a singer", "a dancer", "a chef", "a teacher", "a doctor",
  "a firefighter", "an astronaut", "a pirate", "a ninja", "a wizard",
  "a robot", "a superhero", "a cowboy", "a knight", "a detective",
  "a clown", "a vampire", "a zombie", "a ghost", "an alien",
  "a prince", "a princess", "a king", "a queen", "a jester",
  "a farmer", "a pilot", "a sailor", "a soldier", "a spy",
  "a scientist", "an artist", "a musician", "a writer", "a photographer",
  "a magician", "a acrobat", "a juggler", "a mime", "a puppeteer",
  "a librarian", "a cashier", "a waiter", "a barista", "a mechanic",
  "a plumber", "an electrician", "a carpenter", "a painter", "a gardener"
];

export const ACTIONS = [
  "lighting a fire", "dancing wildly", "cooking pasta", "reading a book", "singing opera",
  "juggling balls", "riding a bicycle", "swimming", "climbing a tree", "flying a kite",
  "playing guitar", "painting a picture", "writing poetry", "taking photos", "doing magic",
  "eating pizza", "drinking coffee", "brushing teeth", "combing hair", "tying shoes",
  "washing dishes", "vacuuming floor", "mowing lawn", "planting flowers", "watering plants",
  "walking dog", "feeding cat", "riding horse", "milking cow", "collecting eggs",
  "baking bread", "making smoothie", "chopping wood", "building sandcastle", "flying plane",
  "driving car", "riding motorcycle", "sailing boat", "rowing canoe", "skiing downhill",
  "skating ice", "surfing waves", "rock climbing", "skydiving", "bungee jumping",
  "doing yoga", "lifting weights", "running marathon", "playing chess", "solving puzzle",
  "knitting sweater", "sewing button", "ironing clothes", "folding laundry", "washing car",
  "fixing computer", "changing tire", "hammering nail", "sawing wood", "drilling hole"
];