// automated_testing_controller.js - Automated testing

import { gameState, GAME_PHASES } from './globals.js';

let testState = {
  currentObjective: "explore",
  targetCrystalIndex: 0,
  stuckCounter: 0,
  lastPosition: { x: 0, y: 0 },
  movementHistory: []
};

function getTestWinAction(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return { keyCode: null };
  }
  
  const player = gameState.player;
  if (!player) return { keyCode: null };
  
  // Check if stuck
  const dist = Math.hypot(player.x - testState.lastPosition.x, 
                          player.y - testState.lastPosition.y);
  if (dist < 1) {
    testState.stuckCounter++;
    if (testState.stuckCounter > 30) {
      // Try random movement to unstuck
      const randomDir = Math.floor(Math.random() * 4);
      testState.stuckCounter = 0;
      return { keyCode: 37 + randomDir };
    }
  } else {
    testState.stuckCounter = 0;
  }
  testState.lastPosition = { x: player.x, y: player.y };
  
  // Strategy: Collect crystals in order, handle combat, win card battles
  
  // If in card battle, play cards
  if (gameState.cardBattleActive && gameState.battleTurn === "player") {
    // Select highest power card
    let maxPower = -1;
    let maxIndex = 0;
    gameState.playerCards.forEach((card, i) => {
      if (card.power > maxPower) {
        maxPower = card.power;
        maxIndex = i;
      }
    });
    
    if (gameState.selectedCardIndex !== maxIndex) {
      return { keyCode: gameState.selectedCardIndex < maxIndex ? 39 : 37 };
    } else {
      return { keyCode: 32 }; // Play card
    }
  }
  
  // Find next uncollected crystal
  let targetCrystal = null;
  for (let crystal of gameState.collectibles) {
    if (!crystal.collected) {
      targetCrystal = crystal;
      break;
    }
  }
  
  // If all crystals collected, go to portal
  if (!targetCrystal) {
    if (gameState.portals.length > 0) {
      const portal = gameState.portals[0];
      return navigateToTarget(player, portal.x, portal.y);
    }
  } else {
    // Navigate to crystal
    const action = navigateToTarget(player, targetCrystal.x, targetCrystal.y);
    
    // Shoot at nearby enemies
    for (let enemy of gameState.enemies) {
      if (enemy.active && Math.hypot(enemy.x - player.x, enemy.y - player.y) < 150) {
        if (Math.random() < 0.3) {
          return { keyCode: 32 }; // Shoot
        }
      }
    }
    
    // Interact with NPCs for card battles
    for (let npc of gameState.npcs) {
      if (npc.type === "card_battle" && 
          Math.hypot(npc.x - player.x, npc.y - player.y) < 50) {
        return { keyCode: 32 }; // Interact
      }
    }
    
    return action;
  }
  
  return { keyCode: null };
}

function getBasicTestAction(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return { keyCode: null };
  }
  
  const player = gameState.player;
  if (!player) return { keyCode: null };
  
  // Simple movement test - move in a pattern
  const frame = gameState.frameCount;
  const pattern = Math.floor(frame / 30) % 4;
  
  return { keyCode: 37 + pattern }; // Cycle through arrow keys
}

function getRandomAction(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return { keyCode: null };
  }
  
  const actions = [37, 38, 39, 40, 32, 90];
  const randomIndex = Math.floor(Math.random() * actions.length);
  return { keyCode: actions[randomIndex] };
}

function navigateToTarget(player, targetX, targetY) {
  const dx = targetX - player.x;
  const dy = targetY - player.y;
  const dist = Math.hypot(dx, dy);
  
  if (dist < 20) {
    return { keyCode: 32 }; // Interact
  }
  
  // Choose primary direction
  if (Math.abs(dx) > Math.abs(dy)) {
    return { keyCode: dx > 0 ? 39 : 37 }; // Right or Left
  } else {
    return { keyCode: dy > 0 ? 40 : 38 }; // Down or Up
  }
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      // Combat test - move toward enemies and shoot
      if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.enemies.length > 0) {
        const player = gameState.player;
        const activeEnemies = gameState.enemies.filter(e => e.active);
        if (activeEnemies.length > 0 && player) {
          const enemy = activeEnemies[0];
          const action = navigateToTarget(player, enemy.x, enemy.y);
          if (Math.random() < 0.5) {
            return { keyCode: 32 }; // Shoot
          }
          return action;
        }
      }
      return getRandomAction(gameState);
    case "TEST_4":
      // Card battle test
      if (gameState.cardBattleActive) {
        return { keyCode: Math.random() < 0.5 ? 39 : 32 };
      }
      return getRandomAction(gameState);
    case "TEST_5":
      // Puzzle test - navigate to switches
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        const player = gameState.player;
        const unactivatedSwitches = gameState.switches.filter(s => !s.activated);
        if (unactivatedSwitches.length > 0 && player) {
          const sw = unactivatedSwitches[0];
          return navigateToTarget(player, sw.x, sw.y);
        }
      }
      return getRandomAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;