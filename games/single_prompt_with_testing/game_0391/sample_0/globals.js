export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  
  // TIS-100 specific state
  nodes: [],
  selectedNode: null,
  selectedInstructionIndex: 0,
  editMode: false,
  
  currentPuzzle: 0,
  puzzles: [],
  
  cycleCount: 0,
  executionSpeed: 10, // frames per step
  framesSinceLastStep: 0,
  
  inputQueue: [],
  outputQueue: [],
  expectedOutputs: [],
  outputIndex: 0,
  
  puzzleComplete: false,
  totalCycles: 0
};

// Available instructions
export const INSTRUCTIONS = {
  MOV: 'MOV',
  ADD: 'ADD',
  SUB: 'SUB',
  JMP: 'JMP',
  JEZ: 'JEZ',
  JNZ: 'JNZ',
  JGZ: 'JGZ',
  JLZ: 'JLZ',
  NOP: 'NOP',
  SAV: 'SAV',
  SWP: 'SWP'
};

export const NODE_TYPES = {
  COMPUTE: 'COMPUTE',
  INPUT: 'INPUT',
  OUTPUT: 'OUTPUT',
  DAMAGED: 'DAMAGED'
};

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;