// globals.js - Game constants and state management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

// Game state object
export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  
  // Game-specific state
  currentPosition: 0,
  boardPath: [],
  knowledge: 0,
  wealth: 0,
  happiness: 0,
  
  // Turn management
  spinning: false,
  spinResult: 0,
  moving: false,
  moveProgress: 0,
  targetPosition: 0,
  
  // Event handling
  currentEvent: null,
  showingEvent: false,
  eventChoices: [],
  selectedChoice: 0,
  
  // Progression
  turn: 0,
  eventsCompleted: [],
  unlockedCosmetics: [],
  
  // Animation
  wheelAngle: 0,
  wheelSpinning: false,
  wheelSpeed: 0,
  
  // Input debouncing
  lastActionFrame: 0,
  actionCooldown: 15
};

// Board space types
export const SPACE_TYPES = {
  START: "START",
  NORMAL: "NORMAL",
  EDUCATION: "EDUCATION",
  CAREER: "CAREER",
  RELATIONSHIP: "RELATIONSHIP",
  PROPERTY: "PROPERTY",
  EVENT: "EVENT",
  CROSSROAD: "CROSSROAD",
  PAYDAY: "PAYDAY",
  RETIREMENT: "RETIREMENT"
};

// Event definitions
export const EVENTS = {
  EDUCATION: [
    {
      title: "University Opportunity",
      description: "Pursue higher education?",
      choices: [
        { text: "Enroll in University", knowledge: 30, wealth: -10, happiness: 10 },
        { text: "Skip for now", knowledge: 0, wealth: 5, happiness: 5 }
      ]
    },
    {
      title: "Professional Certification",
      description: "Take a certification course?",
      choices: [
        { text: "Get Certified", knowledge: 20, wealth: -5, happiness: 5 },
        { text: "Self-Study", knowledge: 10, wealth: 0, happiness: 10 }
      ]
    }
  ],
  CAREER: [
    {
      title: "Job Offer",
      description: "Choose your career path",
      choices: [
        { text: "Corporate Job", knowledge: 10, wealth: 30, happiness: 10 },
        { text: "Creative Field", knowledge: 15, wealth: 15, happiness: 20 },
        { text: "Entrepreneurship", knowledge: 20, wealth: 25, happiness: 15 }
      ]
    },
    {
      title: "Promotion Opportunity",
      description: "Work overtime for promotion?",
      choices: [
        { text: "Accept Promotion", knowledge: 5, wealth: 25, happiness: -5 },
        { text: "Maintain Balance", knowledge: 5, wealth: 10, happiness: 15 }
      ]
    }
  ],
  RELATIONSHIP: [
    {
      title: "Marriage Proposal",
      description: "Get married?",
      choices: [
        { text: "Say Yes!", knowledge: 5, wealth: 0, happiness: 30 },
        { text: "Not Yet", knowledge: 5, wealth: 5, happiness: 10 }
      ]
    },
    {
      title: "Family Time",
      description: "Spend quality time with loved ones?",
      choices: [
        { text: "Take Vacation", knowledge: 0, wealth: -10, happiness: 25 },
        { text: "Quick Visit", knowledge: 0, wealth: 0, happiness: 15 }
      ]
    }
  ],
  PROPERTY: [
    {
      title: "Real Estate",
      description: "Buy property?",
      choices: [
        { text: "Buy House", knowledge: 5, wealth: 40, happiness: 20 },
        { text: "Keep Renting", knowledge: 0, wealth: 5, happiness: 5 }
      ]
    },
    {
      title: "Investment Opportunity",
      description: "Invest in stocks?",
      choices: [
        { text: "Invest Heavily", knowledge: 10, wealth: 35, happiness: 0 },
        { text: "Small Investment", knowledge: 5, wealth: 15, happiness: 5 }
      ]
    }
  ],
  RANDOM: [
    {
      title: "Lucky Break!",
      description: "You found money on the street!",
      choices: [
        { text: "Keep It", knowledge: 0, wealth: 15, happiness: 10 }
      ]
    },
    {
      title: "Unexpected Bill",
      description: "Emergency expense!",
      choices: [
        { text: "Pay It", knowledge: 0, wealth: -15, happiness: -5 }
      ]
    },
    {
      title: "New Hobby",
      description: "Discover a new passion!",
      choices: [
        { text: "Pursue It", knowledge: 15, wealth: -5, happiness: 20 }
      ]
    }
  ]
};

// Expose gameState globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}