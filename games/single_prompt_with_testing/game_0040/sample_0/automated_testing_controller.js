// automated_testing_controller.js - Automated testing AI
import { gameState, HAT_TYPE } from './globals.js';

let testState = {
  moveHistory: [],
  stuckCounter: 0,
  currentTarget: null,
  lastAction: null,
  pathIndex: 0
};

function getTestWinAction(gameState) {
  const player = gameState.player;
  if (!player) return getIdleAction();

  // Priority: Collect yarn -> unlock hats -> collect time pieces
  
  // First, collect yarn to unlock hats
  if (gameState.yarnCollected < 9) {
    const nearestYarn = findNearestCollectible(player, gameState.yarn);
    if (nearestYarn) {
      return moveToTarget(player, nearestYarn, gameState);
    }
  }

  // Switch to appropriate hat
  if (gameState.yarnCollected >= 3 && gameState.currentHat !== HAT_TYPE.SPRINT) {
    // Sprint hat for faster movement
    return { ...getIdleAction(), hatSwitch: HAT_TYPE.SPRINT };
  }

  // Look for time pieces
  const nearestTimePiece = findNearestCollectible(player, gameState.timePieces);
  if (nearestTimePiece) {
    // Check if we need dimension hat for hidden time piece
    if (nearestTimePiece.hidden && gameState.currentHat !== HAT_TYPE.DIMENSION) {
      if (gameState.unlockedHats.includes(HAT_TYPE.DIMENSION)) {
        return { ...getIdleAction(), hatSwitch: HAT_TYPE.DIMENSION, ability: true };
      }
    }

    // Check if there's a destructible block in the way
    const blockingBlock = findBlockingDestructible(player, nearestTimePiece, gameState);
    if (blockingBlock) {
      if (gameState.currentHat !== HAT_TYPE.BREWING && gameState.unlockedHats.includes(HAT_TYPE.BREWING)) {
        return { ...getIdleAction(), hatSwitch: HAT_TYPE.BREWING };
      }
      // Move close to block and use explosion
      const distToBlock = Math.abs(player.x - blockingBlock.x);
      if (distToBlock < 80) {
        return { ...getIdleAction(), ability: true };
      }
      return moveToTarget(player, blockingBlock, gameState);
    }

    return moveToTarget(player, nearestTimePiece, gameState);
  }

  return getIdleAction();
}

function findNearestCollectible(player, collectibles) {
  let nearest = null;
  let minDist = Infinity;

  for (let item of collectibles) {
    if (item.collected) continue;
    if (item.hidden && !gameState.dimensionActive && gameState.currentHat !== HAT_TYPE.DIMENSION) continue;

    const dist = Math.sqrt(
      Math.pow(player.x - item.x, 2) + 
      Math.pow(player.y - item.y, 2)
    );

    if (dist < minDist) {
      minDist = dist;
      nearest = item;
    }
  }

  return nearest;
}

function findBlockingDestructible(player, target, gameState) {
  for (let block of gameState.destructibleBlocks || []) {
    if (block.destroyed) continue;
    
    // Check if block is between player and target
    const blockX = block.x + block.width / 2;
    const isBlocking = 
      Math.abs(blockX - target.x) < 50 && 
      Math.abs(block.y - target.y) < 50;
    
    if (isBlocking) return block;
  }
  return null;
}

function moveToTarget(player, target, gameState) {
  const action = getIdleAction();
  const dx = target.x - player.x;
  const dy = target.y - player.y;

  // Horizontal movement
  if (Math.abs(dx) > 20) {
    action.right = dx > 0;
    action.left = dx < 0;
    action.sprint = gameState.currentHat === HAT_TYPE.SPRINT;
  }

  // Check if we need to climb
  const nearLadder = gameState.ladders.find(ladder => 
    Math.abs(player.x - ladder.x) < 30 &&
    player.y < ladder.y + ladder.height &&
    player.y + player.height > ladder.y
  );

  if (nearLadder && Math.abs(dy) > 30) {
    if (dy < 0) {
      action.up = true;
    } else if (dy > 0 && player.y < target.y - 50) {
      action.down = true;
    }
  }

  // Jump for platforms or gaps
  if (!player.onGround && !player.climbing) {
    // In air, continue direction
  } else if (Math.abs(dx) > 50 && Math.abs(dy) > 40 && !nearLadder) {
    action.jump = true;
  }

  // Check if stuck
  testState.moveHistory.push({ x: player.x, y: player.y });
  if (testState.moveHistory.length > 60) {
    testState.moveHistory.shift();
    
    const recent = testState.moveHistory.slice(-30);
    const avgX = recent.reduce((sum, pos) => sum + pos.x, 0) / recent.length;
    const variance = recent.reduce((sum, pos) => sum + Math.pow(pos.x - avgX, 2), 0) / recent.length;
    
    if (variance < 100) {
      testState.stuckCounter++;
      if (testState.stuckCounter > 30) {
        action.jump = true;
        testState.stuckCounter = 0;
      }
    } else {
      testState.stuckCounter = 0;
    }
  }

  return action;
}

function getTestBasicMovementAction(gameState) {
  const player = gameState.player;
  if (!player) return getIdleAction();

  const action = getIdleAction();
  const phase = Math.floor(gameState.frameCount / 60) % 10;

  switch (phase) {
    case 0:
    case 1:
      action.right = true;
      break;
    case 2:
      action.jump = true;
      action.right = true;
      break;
    case 3:
    case 4:
      action.left = true;
      break;
    case 5:
      action.jump = true;
      break;
    case 6:
      action.up = true;
      break;
    case 7:
      action.down = true;
      break;
    case 8:
      action.right = true;
      action.sprint = true;
      break;
    case 9:
      action.jump = true;
      action.jump = true;
      break;
  }

  return action;
}

function getTestHazardAction(gameState) {
  const player = gameState.player;
  if (!player) return getIdleAction();

  // Deliberately walk into hazards
  const action = getIdleAction();
  
  if (gameState.spikes.length > 0) {
    const nearestSpike = gameState.spikes[0];
    if (player.x < nearestSpike.x - 50) {
      action.right = true;
    }
  }

  return action;
}

function getTestHatAbilitiesAction(gameState) {
  const player = gameState.player;
  if (!player) return getIdleAction();

  const action = getIdleAction();

  // Collect yarn first
  if (gameState.yarnCollected < 9) {
    const nearestYarn = findNearestCollectible(player, gameState.yarn);
    if (nearestYarn) {
      return moveToTarget(player, nearestYarn, gameState);
    }
  }

  // Test hat switching
  const phase = Math.floor(gameState.frameCount / 120) % 4;
  const hats = [HAT_TYPE.NONE, HAT_TYPE.SPRINT, HAT_TYPE.BREWING, HAT_TYPE.DIMENSION];
  
  if (gameState.unlockedHats.includes(hats[phase]) && gameState.currentHat !== hats[phase]) {
    action.hatSwitch = hats[phase];
  }

  // Test abilities
  if (phase === 2 && gameState.currentHat === HAT_TYPE.BREWING) {
    action.ability = true;
  } else if (phase === 3 && gameState.currentHat === HAT_TYPE.DIMENSION) {
    action.ability = true;
  }

  action.right = true;
  return action;
}

function getRandomAction(gameState) {
  const action = getIdleAction();
  const rand = Math.random();

  if (rand < 0.3) action.right = true;
  else if (rand < 0.5) action.left = true;
  
  if (rand > 0.7) action.jump = true;
  if (rand > 0.85) action.ability = true;

  return action;
}

function getIdleAction() {
  return {
    left: false,
    right: false,
    jump: false,
    up: false,
    down: false,
    sprint: false,
    ability: false,
    hatSwitch: null
  };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicMovementAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestHazardAction(gameState);
    case "TEST_4":
      return getTestHatAbilitiesAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;