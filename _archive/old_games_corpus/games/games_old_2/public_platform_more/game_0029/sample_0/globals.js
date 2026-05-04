// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Control modes
export const MODE_HUMAN = "HUMAN";
export const MODE_TEST_1 = "TEST_1";
export const MODE_TEST_2 = "TEST_2";

// Key codes
export const KEY_ENTER = 13;
export const KEY_ESC = 27;
export const KEY_R = 82;
export const KEY_SPACE = 32;
export const KEY_SHIFT = 16;
export const KEY_LEFT = 37;
export const KEY_UP = 38;
export const KEY_RIGHT = 39;
export const KEY_DOWN = 40;

// Game state object
export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: PHASE_START,
  controlMode: MODE_HUMAN,
  
  // Menu state
  menuSelection: 0, // 0 = 3 rounds, 1 = 4 rounds, 2 = 5 rounds
  
  // Round management
  totalRounds: 3,
  currentRound: 0,
  roundTimeLimit: 60, // seconds
  roundStartTime: 0,
  roundTimeRemaining: 60,
  
  // Card management
  currentCardIndex: 0,
  cardsCompleted: 0,
  cardsSkipped: 0,
  cardsIncorrect: 0,
  
  // Animation states
  feedbackMessage: "",
  feedbackTimer: 0,
  cardTransition: 0,
  
  // Card deck
  allCards: [],
  currentCard: null,
  
  // Score tracking
  correctPoints: 0,
  incorrectPenalty: 0,
  roundScores: []
};

// Word cards database
export const WORD_CARDS = [
  { target: "COFFEE", taboo: ["DRINK", "CAFFEINE", "BEAN", "HOT", "CUP"] },
  { target: "PIZZA", taboo: ["CHEESE", "ITALIAN", "SLICE", "FOOD", "DELIVERY"] },
  { target: "OCEAN", taboo: ["WATER", "SEA", "BLUE", "WAVE", "BEACH"] },
  { target: "GUITAR", taboo: ["MUSIC", "STRING", "INSTRUMENT", "PLAY", "ROCK"] },
  { target: "RAINBOW", taboo: ["COLOR", "SKY", "RAIN", "ARC", "SPECTRUM"] },
  { target: "BICYCLE", taboo: ["RIDE", "WHEEL", "PEDAL", "BIKE", "CYCLE"] },
  { target: "CHOCOLATE", taboo: ["SWEET", "CANDY", "BROWN", "DESSERT", "COCOA"] },
  { target: "MOUNTAIN", taboo: ["HILL", "CLIMB", "PEAK", "HIGH", "SUMMIT"] },
  { target: "COMPUTER", taboo: ["KEYBOARD", "SCREEN", "MOUSE", "LAPTOP", "TECH"] },
  { target: "BASKETBALL", taboo: ["SPORT", "HOOP", "BALL", "COURT", "DRIBBLE"] },
  { target: "CAMERA", taboo: ["PHOTO", "PICTURE", "LENS", "CLICK", "SNAP"] },
  { target: "AIRPLANE", taboo: ["FLY", "PILOT", "WING", "SKY", "AIRPORT"] },
  { target: "TELEPHONE", taboo: ["CALL", "RING", "DIAL", "MOBILE", "TALK"] },
  { target: "LIBRARY", taboo: ["BOOK", "READ", "QUIET", "SHELF", "BORROW"] },
  { target: "ELEPHANT", taboo: ["ANIMAL", "TRUNK", "GRAY", "BIG", "TUSKS"] },
  { target: "FIREWORK", taboo: ["EXPLOSION", "LIGHT", "CELEBRATE", "SPARK", "NIGHT"] },
  { target: "SANDWICH", taboo: ["BREAD", "MEAT", "LUNCH", "EAT", "CHEESE"] },
  { target: "THUNDERSTORM", taboo: ["RAIN", "LIGHTNING", "LOUD", "WEATHER", "CLOUD"] },
  { target: "SUNGLASSES", taboo: ["SHADE", "EYES", "COOL", "BRIGHT", "WEAR"] },
  { target: "VACATION", taboo: ["HOLIDAY", "TRAVEL", "RELAX", "TRIP", "BREAK"] },
  { target: "DIAMOND", taboo: ["JEWEL", "RING", "SPARKLE", "EXPENSIVE", "GEM"] },
  { target: "POPCORN", taboo: ["MOVIE", "CORN", "BUTTER", "SNACK", "POP"] },
  { target: "TELESCOPE", taboo: ["STAR", "SPACE", "LOOK", "LENS", "ASTRONOMER"] },
  { target: "REFRIGERATOR", taboo: ["COLD", "FOOD", "KITCHEN", "FREEZE", "APPLIANCE"] },
  { target: "MUSEUM", taboo: ["ART", "EXHIBIT", "HISTORY", "GALLERY", "TOUR"] },
  { target: "KANGAROO", taboo: ["AUSTRALIA", "HOP", "POUCH", "ANIMAL", "JUMP"] },
  { target: "VOLCANO", taboo: ["LAVA", "ERUPT", "MOUNTAIN", "HOT", "MAGMA"] },
  { target: "NEWSPAPER", taboo: ["NEWS", "READ", "PAPER", "ARTICLE", "DAILY"] },
  { target: "PENGUIN", taboo: ["BIRD", "ANTARCTICA", "WADDLE", "BLACK", "WHITE"] },
  { target: "CARNIVAL", taboo: ["RIDE", "FUN", "FAIR", "GAME", "CIRCUS"] }
];