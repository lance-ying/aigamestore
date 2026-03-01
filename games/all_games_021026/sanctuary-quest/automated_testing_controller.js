import { gameState, GAME_PHASES, SCREEN_MODES } from './globals.js';

function getTestWinAction(gameState) {
  const state = gameState.testingState;
  
  // State machine for optimal win strategy
  if (state.waitFrames > 0) {
    state.waitFrames--;
    return null;
  }
  
  switch (state.phase) {
    case "INIT":
      if (gameState.gamePhase === GAME_PHASES.START) {
        state.phase = "WAIT_START";
        state.waitFrames = 30;
        return null;
      }
      break;
      
    case "WAIT_START":
      state.phase = "SETUP_BASE";
      return null;
      
    case "SETUP_BASE":
      if (gameState.screenMode !== SCREEN_MODES.BASE) {
        return null;
      }
      
      // Allocate workers efficiently
      if (gameState.workers.food < 5) {
        gameState.menuSelection = 0;
        state.waitFrames = 5;
        return 32; // Space
      }
      
      // Wait for resources
      if (gameState.resources.food < 80 || gameState.resources.materials < 40) {
        state.waitFrames = 120;
        return null;
      }
      
      // Recruit heroes
      if (gameState.heroes.length < 4) {
        gameState.menuSelection = 1;
        state.waitFrames = 10;
        return 32; // Space
      }
      
      state.phase = "FORM_PARTY";
      return null;
      
    case "FORM_PARTY":
      if (gameState.party.length < gameState.heroes.length && gameState.party.length < 4) {
        gameState.menuSelection = 2;
        state.waitFrames = 5;
        return 32; // View heroes
      }
      
      if (gameState.screenMode === SCREEN_MODES.HEROES) {
        if (gameState.party.length < gameState.heroes.length && gameState.party.length < 4) {
          state.waitFrames = 5;
          return 32; // Add to party
        } else {
          state.waitFrames = 10;
          return 66; // B to go back
        }
      }
      
      if (gameState.party.length >= 2) {
        state.phase = "ENTER_DUNGEON";
      }
      return null;
      
    case "ENTER_DUNGEON":
      if (gameState.screenMode === SCREEN_MODES.BASE) {
        gameState.menuSelection = 3;
        state.waitFrames = 10;
        return 32; // Enter dungeon
      }
      
      if (gameState.screenMode === SCREEN_MODES.DUNGEON) {
        state.phase = "EXPLORE_DUNGEON";
      }
      return null;
      
    case "EXPLORE_DUNGEON":
      if (gameState.inCombat) {
        state.phase = "COMBAT";
        return null;
      }
      
      // Smart navigation toward exit/arena
      const map = gameState.dungeonMap;
      const targetX = map[0].length - 1;
      const targetY = map.length - 1;
      
      // Try to move toward target
      if (gameState.playerX < targetX) {
        const nextCell = map[gameState.playerY][gameState.playerX + 1];
        if (nextCell.type !== "wall") {
          state.waitFrames = 8;
          return 39; // Right
        }
      }
      
      if (gameState.playerY < targetY) {
        const nextCell = map[gameState.playerY + 1][gameState.playerX];
        if (nextCell.type !== "wall") {
          state.waitFrames = 8;
          return 40; // Down
        }
      }
      
      // Alternative paths
      if (gameState.playerY > 0) {
        const nextCell = map[gameState.playerY - 1][gameState.playerX];
        if (nextCell.type !== "wall") {
          state.waitFrames = 8;
          return 38; // Up
        }
      }
      
      if (gameState.playerX > 0) {
        const nextCell = map[gameState.playerY][gameState.playerX - 1];
        if (nextCell.type !== "wall") {
          state.waitFrames = 8;
          return 37; // Left
        }
      }
      
      // Check if reached goal
      if (gameState.screenMode === SCREEN_MODES.BASE) {
        state.phase = "SETUP_BASE";
      }
      
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
        state.phase = "COMPLETE";
      }
      
      return null;
      
    case "COMBAT":
      if (!gameState.inCombat) {
        state.phase = "EXPLORE_DUNGEON";
        state.waitFrames = 10;
        return null;
      }
      
      // Find hero with ability ready
      const readyHero = gameState.party.findIndex(h => h.canUseAbility());
      if (readyHero >= 0 && readyHero !== gameState.selectedPartyMember) {
        // Switch to hero with ability
        if (readyHero > gameState.selectedPartyMember) {
          return 39; // Right
        } else {
          return 37; // Left
        }
      }
      
      // Use ability if ready
      if (gameState.party[gameState.selectedPartyMember]?.canUseAbility()) {
        state.waitFrames = 15;
        return 90; // Z
      }
      
      // Otherwise attack
      state.waitFrames = 10;
      return 32; // Space
      
    case "COMPLETE":
      return null;
  }
  
  return null;
}

function getBasicTestAction(gameState) {
  const state = gameState.testingState;
  
  if (state.waitFrames > 0) {
    state.waitFrames--;
    return null;
  }
  
  switch (state.phase) {
    case "INIT":
      if (gameState.gamePhase === GAME_PHASES.START) {
        state.phase = "NAVIGATE_MENUS";
        state.waitFrames = 30;
      }
      return null;
      
    case "NAVIGATE_MENUS":
      if (gameState.screenMode === SCREEN_MODES.BASE) {
        if (Math.random() < 0.3) {
          state.waitFrames = 20;
          return 40; // Down
        } else if (Math.random() < 0.2) {
          state.waitFrames = 20;
          return 32; // Space
        }
      }
      
      if (gameState.screenMode === SCREEN_MODES.HEROES) {
        state.waitFrames = 30;
        return 66; // B to go back
      }
      
      if (gameState.screenMode === SCREEN_MODES.DUNGEON && !gameState.inCombat) {
        const directions = [37, 38, 39, 40];
        state.waitFrames = 15;
        return directions[Math.floor(Math.random() * directions.length)];
      }
      
      if (gameState.inCombat) {
        const actions = [32, 90];
        state.waitFrames = 20;
        return actions[Math.floor(Math.random() * actions.length)];
      }
      
      return null;
  }
  
  return null;
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return null;
  }
}

if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;