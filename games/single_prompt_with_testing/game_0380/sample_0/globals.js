// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const PLAY_PHASES = {
  NIGHT: "NIGHT",
  DAY_DISCUSSION: "DAY_DISCUSSION",
  DAY_VOTING: "DAY_VOTING",
  TRIAL_DEFENSE: "TRIAL_DEFENSE",
  TRIAL_JUDGMENT: "TRIAL_JUDGMENT",
  TRIAL_RESULT: "TRIAL_RESULT",
  NIGHT_RESULT: "NIGHT_RESULT"
};

export const ROLES = {
  TOWNIE: "TOWNIE",
  DOCTOR: "DOCTOR",
  SHERIFF: "SHERIFF",
  KILLER: "KILLER"
};

export const ROLE_INFO = {
  TOWNIE: {
    name: "Townie",
    description: "A regular citizen trying to find the Killer",
    ability: "Vote during the day",
    alignment: "TOWN"
  },
  DOCTOR: {
    name: "Doctor",
    description: "Heal one player each night",
    ability: "Save a player from death",
    alignment: "TOWN"
  },
  SHERIFF: {
    name: "Sheriff",
    description: "Investigate one player each night",
    ability: "Learn if someone is the Killer",
    alignment: "TOWN"
  },
  KILLER: {
    name: "Killer",
    description: "Eliminate Town members at night",
    ability: "Kill one player each night",
    alignment: "EVIL"
  }
};

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  playPhase: null,
  controlMode: "HUMAN",
  
  // Game-specific state
  players: [],
  playerIndex: 0, // Player's index
  currentDay: 0,
  aliveCount: 0,
  townCount: 0,
  killerCount: 0,
  
  // Phase tracking
  phaseTimer: 0,
  phaseDuration: 180, // 3 seconds per phase
  
  // Night actions
  nightTarget: -1,
  killerTarget: -1,
  doctorTarget: -1,
  sheriffTarget: -1,
  
  // Day voting
  votingTarget: -1,
  votes: {},
  onTrial: -1,
  trialVotes: { guilty: 0, innocent: 0, abstain: 0 },
  hasVoted: false,
  
  // UI state
  selectedOption: 0,
  showRoleCard: false,
  menuOptions: [],
  
  // Investigation results
  investigationResults: [],
  
  // History for testing
  positionHistory: [],
  actionHistory: []
};

// Export for window access
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}