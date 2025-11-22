import { gameState, COMMAND_TYPES, DIRECTIONS } from './globals.js';
import { levels } from './levels.js';

function getTestWinAction(gameState) {
  // Strategy: Program optimal sequences for each level
  
  if (gameState.gamePhase !== "PLAYING") {
    return null;
  }
  
  // Wait for execution to finish
  if (gameState.isExecuting) {
    return null;
  }
  
  // If program is empty, create optimal program for current level
  if (gameState.currentProgram.length === 0) {
    const levelPrograms = getLevelProgram(gameState.currentLevel);
    if (levelPrograms && levelPrograms.length > 0) {
      // Add first command
      return { keyCode: 32, key: ' ' }; // SPACE to add command (but first select right command)
    }
  }
  
  // Build program step by step
  const targetProgram = getLevelProgram(gameState.currentLevel);
  if (targetProgram && gameState.currentProgram.length < targetProgram.length) {
    const nextCommand = targetProgram[gameState.currentProgram.length];
    const commandIndex = getCommandIndex(nextCommand);
    
    // Navigate to correct command
    if (gameState.selectedCommandIndex !== commandIndex) {
      if (gameState.selectedCommandIndex < commandIndex) {
        return { keyCode: 40, key: 'ArrowDown' }; // DOWN
      } else {
        return { keyCode: 38, key: 'ArrowUp' }; // UP
      }
    }
    
    // Add command
    return { keyCode: 32, key: ' ' }; // SPACE
  }
  
  // Program complete, execute it
  if (targetProgram && gameState.currentProgram.length === targetProgram.length) {
    return { keyCode: 90, key: 'z' }; // Z to execute
  }
  
  return null;
}

function getLevelProgram(levelIndex) {
  // Optimal programs for each level
  const programs = [
    // Level 0: Tutorial
    [
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.ATTACK
    ],
    // Level 1: Turning Challenge
    [
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.ATTACK,
      COMMAND_TYPES.TURN_RIGHT,
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.ATTACK
    ],
    // Level 2: Exit Strategy
    [
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.TURN_RIGHT,
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.TURN_RIGHT,
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.MOVE_FORWARD
    ],
    // Level 3: Tough Enemy
    [
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.ATTACK,
      COMMAND_TYPES.ATTACK
    ],
    // Level 4: Multi-Robot (simplified - would need per-robot programs)
    [
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.ATTACK,
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.ATTACK
    ]
  ];
  
  return programs[levelIndex] || null;
}

function getCommandIndex(commandType) {
  const commandOrder = [
    COMMAND_TYPES.MOVE_FORWARD,
    COMMAND_TYPES.TURN_LEFT,
    COMMAND_TYPES.TURN_RIGHT,
    COMMAND_TYPES.ATTACK,
    COMMAND_TYPES.WAIT
  ];
  return commandOrder.indexOf(commandType);
}

function getBasicTestAction(gameState) {
  // Simple test: add a few commands and execute
  if (gameState.gamePhase !== "PLAYING") {
    return null;
  }
  
  if (gameState.isExecuting) {
    return null;
  }
  
  // Build simple program
  if (gameState.currentProgram.length < 5) {
    // Select move forward
    if (gameState.selectedCommandIndex !== 0) {
      return { keyCode: 38, key: 'ArrowUp' };
    }
    return { keyCode: 32, key: ' ' }; // Add command
  }
  
  // Execute
  return { keyCode: 90, key: 'z' };
}

function getRandomAction(gameState) {
  if (gameState.gamePhase !== "PLAYING" || gameState.isExecuting) {
    return null;
  }
  
  const actions = [
    { keyCode: 38, key: 'ArrowUp' },
    { keyCode: 40, key: 'ArrowDown' },
    { keyCode: 32, key: ' ' },
    { keyCode: 90, key: 'z' }
  ];
  
  return actions[Math.floor(Math.random() * actions.length)];
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;