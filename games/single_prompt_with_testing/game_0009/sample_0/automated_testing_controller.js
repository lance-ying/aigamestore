// automated_testing_controller.js - Automated testing logic

import { gameState, KEY_SPACE, KEY_SHIFT, KEY_LEFT, KEY_RIGHT, PLAYER_SPAWN_X_MIN, PLAYER_SPAWN_X_MAX, BASIC_UNIT_COST, STRONG_UNIT_COST } from './globals.js';

let testState = {
  framesSinceLastSpawn: 0,
  targetPosition: PLAYER_SPAWN_X_MIN,
  spawnPattern: 0
};

function getTestBasicAction(gameState) {
  testState.framesSinceLastSpawn++;
  
  const action = { keyPressed: null, continuous: [] };
  
  // Move cursor back and forth
  if (gameState.cursorX < PLAYER_SPAWN_X_MIN + 20) {
    testState.targetPosition = PLAYER_SPAWN_X_MAX - 20;
  } else if (gameState.cursorX > PLAYER_SPAWN_X_MAX - 20) {
    testState.targetPosition = PLAYER_SPAWN_X_MIN + 20;
  }
  
  if (gameState.cursorX < testState.targetPosition) {
    action.continuous.push(KEY_RIGHT);
  } else if (gameState.cursorX > testState.targetPosition) {
    action.continuous.push(KEY_LEFT);
  }
  
  // Spawn units periodically
  if (testState.framesSinceLastSpawn > 40) {
    if (gameState.points >= BASIC_UNIT_COST) {
      action.keyPressed = KEY_SPACE;
      testState.framesSinceLastSpawn = 0;
    }
  }
  
  return action;
}

function getTestWinAction(gameState) {
  testState.framesSinceLastSpawn++;
  
  const action = { keyPressed: null, continuous: [] };
  
  // Strategic positioning - spread units evenly
  const positions = [
    PLAYER_SPAWN_X_MIN + 20,
    PLAYER_SPAWN_X_MIN + 60,
    PLAYER_SPAWN_X_MIN + 100,
    PLAYER_SPAWN_X_MIN + 140
  ];
  
  const currentTarget = positions[testState.spawnPattern % positions.length];
  
  // Move to target position
  if (Math.abs(gameState.cursorX - currentTarget) > 5) {
    if (gameState.cursorX < currentTarget) {
      action.continuous.push(KEY_RIGHT);
    } else {
      action.continuous.push(KEY_LEFT);
    }
  }
  
  // Spawn strategy: prioritize strong units when affordable, otherwise basic
  const playerUnits = gameState.entities.filter(e => e.team === 'player' && e.alive).length;
  const enemyUnits = gameState.entities.filter(e => e.team === 'enemy' && e.alive).length;
  
  // Spawn more aggressively when outnumbered
  const spawnDelay = enemyUnits > playerUnits ? 20 : 30;
  
  if (testState.framesSinceLastSpawn > spawnDelay && Math.abs(gameState.cursorX - currentTarget) < 10) {
    if (gameState.points >= STRONG_UNIT_COST && Math.random() < 0.4) {
      action.keyPressed = KEY_SHIFT;
      testState.framesSinceLastSpawn = 0;
      testState.spawnPattern++;
    } else if (gameState.points >= BASIC_UNIT_COST) {
      action.keyPressed = KEY_SPACE;
      testState.framesSinceLastSpawn = 0;
      testState.spawnPattern++;
    }
  }
  
  return action;
}

function getRandomAction(gameState) {
  const action = { keyPressed: null, continuous: [] };
  
  if (Math.random() < 0.05) {
    const randomKey = [KEY_SPACE, KEY_SHIFT][Math.floor(Math.random() * 2)];
    action.keyPressed = randomKey;
  }
  
  if (Math.random() < 0.1) {
    action.continuous.push(Math.random() < 0.5 ? KEY_LEFT : KEY_RIGHT);
  }
  
  return action;
}

export function get_automated_testing_action(gameState) {
  if (gameState.gamePhase !== "PLAYING") {
    return null;
  }
  
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;