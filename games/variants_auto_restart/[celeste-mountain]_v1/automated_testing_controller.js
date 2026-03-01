// automated_testing_controller.js - Automated testing implementation

import { gameState, GAME_PHASES } from './globals.js';
import { LEVELS, getLevelData, isSolidTile, isSpikeTile } from './levels.js';

class TestHistory {
  constructor() {
    this.positions = [];
    this.maxHistory = 60;
    this.stuckCounter = 0;
  }

  addPosition(x, y) {
    this.positions.push({ x, y });
    if (this.positions.length > this.maxHistory) {
      this.positions.shift();
    }
  }

  isStuck() {
    if (this.positions.length < this.maxHistory) return false;
    
    const recent = this.positions.slice(-30);
    const avgX = recent.reduce((sum, p) => sum + p.x, 0) / recent.length;
    const avgY = recent.reduce((sum, p) => sum + p.y, 0) / recent.length;
    const variance = recent.reduce((sum, p) => sum + Math.pow(p.x - avgX, 2) + Math.pow(p.y - avgY, 2), 0) / recent.length;
    
    if (variance < 100) {
      this.stuckCounter++;
      return this.stuckCounter > 3;
    }
    this.stuckCounter = 0;
    return false;
  }

  reset() {
    this.positions = [];
    this.stuckCounter = 0;
  }
}

const testHistory = new TestHistory();

// Basic movement test
function getBasicTestAction(gameState) {
  const action = { left: false, right: false, up: false, down: false, jump: false, dash: false };
  
  if (!gameState.player) return action;
  
  const level = getLevelData(gameState.currentLevel);
  if (!level) return action;
  
  // Simple strategy: move right, jump over gaps
  action.right = true;
  
  // Jump if near a gap or obstacle
  if (gameState.player.onGround && Math.random() < 0.3) {
    action.jump = true;
  }
  
  return action;
}

// Win strategy - optimal play
function getTestWinAction(gameState) {
  const action = { left: false, right: false, up: false, down: false, jump: false, dash: false };
  
  if (!gameState.player) return action;
  
  testHistory.addPosition(gameState.player.x, gameState.player.y);
  
  const level = getLevelData(gameState.currentLevel);
  if (!level) return action;
  
  // Find goal position
  let goalX = -1, goalY = -1;
  for (let row = 0; row < level.tiles.length; row++) {
    for (let col = 0; col < level.tiles[row].length; col++) {
      if (level.tiles[row][col] === 3) {
        goalX = col * 20 + 10;
        goalY = row * 20 + 10;
        break;
      }
    }
    if (goalX > 0) break;
  }
  
  const dx = goalX - gameState.player.x;
  const dy = goalY - gameState.player.y;
  
  // Basic navigation toward goal
  if (Math.abs(dx) > 10) {
    if (dx > 0) {
      action.right = true;
    } else {
      action.left = true;
    }
  }
  
  // Jump logic
  if (gameState.player.onGround) {
    // Jump if we need to go up or if stuck
    if (dy < -20 || testHistory.isStuck()) {
      action.jump = true;
      testHistory.reset();
    }
    
    // Jump over gaps
    const aheadX = gameState.player.x + (dx > 0 ? 30 : -30);
    const checkY = gameState.player.y + 20;
    const tileAhead = getTileAtPosition(level, aheadX, checkY);
    if (!isSolidTile(tileAhead)) {
      action.jump = true;
    }
  }
  
  // Use dash for long gaps
  if (!gameState.player.onGround && gameState.player.dashesRemaining > 0 && Math.abs(dx) > 80) {
    action.dash = true;
    action.right = dx > 0;
    action.left = dx < 0;
  }
  
  // Climb walls if needed
  if (gameState.player.onWall !== 0 && dy < 0) {
    action.up = true;
    if (Math.abs(dx) > 20) {
      action.jump = true; // Wall jump
    }
  }
  
  return action;
}

// Test hazard interaction
function getTestHazardAction(gameState) {
  const action = { left: false, right: false, up: false, down: false, jump: false, dash: false };
  
  if (!gameState.player) return action;
  
  const level = getLevelData(gameState.currentLevel);
  if (!level) return action;
  
  // Find spikes and intentionally move toward them
  let spikeX = -1, spikeY = -1;
  for (let row = 0; row < level.tiles.length; row++) {
    for (let col = 0; col < level.tiles[row].length; col++) {
      if (isSpikeTile(level.tiles[row][col])) {
        spikeX = col * 20 + 10;
        spikeY = row * 20 + 10;
        break;
      }
    }
    if (spikeX > 0) break;
  }
  
  if (spikeX > 0) {
    const dx = spikeX - gameState.player.x;
    action.right = dx > 0;
    action.left = dx < 0;
  } else {
    // If no spikes nearby, just fall off the edge
    action.right = true;
  }
  
  return action;
}

// Test dash and wall climb mechanics
function getTestMechanicsAction(gameState) {
  const action = { left: false, right: false, up: false, down: false, jump: false, dash: false };
  
  if (!gameState.player) return action;
  
  // Alternate between testing dash and wall climbing
  const testPhase = Math.floor(gameState.player.x / 100) % 2;
  
  if (testPhase === 0) {
    // Test dashing
    action.right = true;
    if (!gameState.player.onGround && gameState.player.dashesRemaining > 0) {
      action.dash = true;
    }
    if (gameState.player.onGround) {
      action.jump = true;
    }
  } else {
    // Test wall climbing
    if (gameState.player.onWall !== 0) {
      action.up = true;
    } else {
      action.right = true;
      if (gameState.player.onGround) {
        action.jump = true;
      }
    }
  }
  
  return action;
}

// Test strawberry collection
function getTestCollectionAction(gameState) {
  const action = { left: false, right: false, up: false, down: false, jump: false, dash: false };
  
  if (!gameState.player) return action;
  
  const level = getLevelData(gameState.currentLevel);
  if (!level) return action;
  
  // Find nearest uncollected strawberry
  let nearestDist = Infinity;
  let targetX = -1, targetY = -1;
  
  for (let row = 0; row < level.tiles.length; row++) {
    for (let col = 0; col < level.tiles[row].length; col++) {
      if (level.tiles[row][col] === 4) {
        const key = `${gameState.currentLevel}-${row}-${col}`;
        if (!gameState.collectedStrawberries.has(key)) {
          const sx = col * 20 + 10;
          const sy = row * 20 + 10;
          const dist = Math.sqrt(Math.pow(sx - gameState.player.x, 2) + Math.pow(sy - gameState.player.y, 2));
          if (dist < nearestDist) {
            nearestDist = dist;
            targetX = sx;
            targetY = sy;
          }
        }
      }
    }
  }
  
  if (targetX > 0) {
    const dx = targetX - gameState.player.x;
    const dy = targetY - gameState.player.y;
    
    action.right = dx > 10;
    action.left = dx < -10;
    
    if (gameState.player.onGround && (dy < -20 || nearestDist > 100)) {
      action.jump = true;
    }
    
    if (!gameState.player.onGround && gameState.player.dashesRemaining > 0 && nearestDist < 100) {
      action.dash = true;
    }
  } else {
    // No strawberries left, go for goal
    return getTestWinAction(gameState);
  }
  
  return action;
}

function getTileAtPosition(level, x, y) {
  const col = Math.floor(x / 20);
  const row = Math.floor(y / 20);
  
  if (row < 0 || row >= level.tiles.length || col < 0 || col >= level.tiles[0].length) {
    return 0;
  }
  
  return level.tiles[row][col];
}

function getRandomAction(gameState) {
  const action = {
    left: Math.random() < 0.3,
    right: Math.random() < 0.3,
    up: Math.random() < 0.2,
    down: Math.random() < 0.2,
    jump: Math.random() < 0.2,
    dash: Math.random() < 0.1
  };
  return action;
}

export function get_automated_testing_action(gameState) {
  // Don't provide actions during non-playing phases
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return { left: false, right: false, up: false, down: false, jump: false, dash: false };
  }
  
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestHazardAction(gameState);
    case "TEST_4":
      return getTestMechanicsAction(gameState);
    case "TEST_5":
      return getTestCollectionAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;