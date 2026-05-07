// testing.js - Automated testing controllers
import { gameState, GAME_PHASES } from './globals.js';

export function getTestAction(p) {
  if (gameState.controlMode === "TEST_1") {
    return getBasicTestAction(p);
  } else if (gameState.controlMode === "TEST_2") {
    return getWinTestAction(p);
  }
  return null;
}

function getBasicTestAction(p) {
  // Basic test: Move and shoot
  if (gameState.gamePhase === GAME_PHASES.START) {
    return { keyCode: 13 }; // ENTER to start
  }
  
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    // Shoot continuously
    if (p.frameCount % 15 === 0) {
      return { keyCode: 32 }; // SPACE to shoot
    }
    
    // Move to collect blocks
    if (gameState.blocks.length > 0) {
      const block = gameState.blocks[0];
      if (gameState.towerX < block.x - 20) {
        return { keyCode: 39 }; // RIGHT
      } else if (gameState.towerX > block.x + 20) {
        return { keyCode: 37 }; // LEFT
      }
    }
  }
  
  if (gameState.gamePhase === GAME_PHASES.LEVEL_COMPLETE) {
    // Buy upgrades randomly
    if (p.frameCount % 60 === 0) {
      const upgradeKey = 49 + Math.floor(Math.random() * 3); // 1-3
      return { keyCode: upgradeKey };
    }
    if (p.frameCount % 60 === 30) {
      return { keyCode: 13 }; // ENTER to continue
    }
  }
  
  return null;
}

function getWinTestAction(p) {
  // Aggressive test to win the game quickly
  if (gameState.gamePhase === GAME_PHASES.START) {
    return { keyCode: 13 }; // ENTER to start
  }
  
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    // Shoot very frequently
    if (p.frameCount % 5 === 0) {
      return { keyCode: 32 }; // SPACE to shoot
    }
    
    // Track closest zombie and move towards it for better aim
    if (gameState.zombies.length > 0) {
      const closestZombie = gameState.zombies.reduce((closest, zombie) => {
        return zombie.x < closest.x ? zombie : closest;
      });
      
      if (gameState.towerX < closestZombie.x - 50) {
        return { keyCode: 39 }; // RIGHT
      } else if (gameState.towerX > closestZombie.x + 50) {
        return { keyCode: 37 }; // LEFT
      }
    }
    
    // Collect blocks
    if (gameState.blocks.length > 0) {
      const block = gameState.blocks[0];
      if (Math.abs(gameState.towerX - block.x) < 100) {
        if (gameState.towerX < block.x - 10) {
          return { keyCode: 39 }; // RIGHT
        } else if (gameState.towerX > block.x + 10) {
          return { keyCode: 37 }; // LEFT
        }
      }
    }
  }
  
  if (gameState.gamePhase === GAME_PHASES.LEVEL_COMPLETE) {
    // Buy weapon upgrades first
    if (gameState.blocksCollected >= 15 && p.frameCount % 30 === 0) {
      return { keyCode: 50 }; // 2 for weapon damage
    }
    if (gameState.blocksCollected >= 20 && p.frameCount % 30 === 10) {
      return { keyCode: 51 }; // 3 for fire rate
    }
    if (p.frameCount % 30 === 20) {
      return { keyCode: 13 }; // ENTER to continue
    }
  }
  
  return null;
}

export function applyTestAction(p, action) {
  if (!action) return;
  
  // Simulate key press
  p.keyCode = action.keyCode;
  p.key = String.fromCharCode(action.keyCode);
  
  // Log the test input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: p.keyCode, testMode: gameState.controlMode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}