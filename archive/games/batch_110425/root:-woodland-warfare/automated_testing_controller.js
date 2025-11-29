// automated_testing_controller.js - Automated testing
import { gameState, GAME_PHASES } from './globals.js';

function getTestBasicAction(state) {
  // Test basic navigation and actions
  const actions = [37, 38, 39, 40, 32]; // Arrow keys + Space
  
  if (state.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  // Simple pattern: navigate and confirm
  const framePattern = Math.floor(state.gameTime / 30) % actions.length;
  return actions[framePattern];
}

function getTestWinAction(state) {
  // Optimal strategy to win as Marquise
  if (state.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  const playerFaction = state.factions[state.currentFactionIndex];
  if (!playerFaction || !playerFaction.isPlayer) {
    return null;
  }
  
  // Strategy: Build workshops to gain VP
  if (!state.selectedClearing) {
    // Select a clearing we control
    const controlledClearing = state.clearings.find(c => 
      c.ruler === playerFaction.name && c.getBuildingCount() < c.slots
    );
    
    if (controlledClearing) {
      // Navigate to it
      const targetId = controlledClearing.id;
      const currentId = state.selectedClearing ? state.selectedClearing.id : 0;
      
      if (targetId > currentId) {
        return 39; // RIGHT
      } else if (targetId < currentId) {
        return 37; // LEFT
      }
    }
    
    return 39; // Default navigate
  }
  
  // If we have a clearing selected
  const clearing = state.selectedClearing;
  
  // Try to build
  if (clearing.ruler === playerFaction.name && 
      clearing.getBuildingCount() < clearing.slots &&
      !state.actionMode) {
    return 16; // Shift to toggle to BUILD mode
  }
  
  if (state.actionMode === "BUILD") {
    return 32; // Space to confirm build
  }
  
  // Try to recruit
  if (clearing.ruler === playerFaction.name && !state.actionMode) {
    return 16; // Shift to RECRUIT
  }
  
  if (state.actionMode === "RECRUIT") {
    return 32; // Space to recruit
  }
  
  // Move units around
  if (!state.actionMode) {
    return 32; // Space to move
  }
  
  // Default: navigate
  const actions = [37, 38, 39, 40];
  return actions[Math.floor(Math.random() * actions.length)];
}

function getTestCombatAction(state) {
  // Test combat by moving into enemy territories
  if (state.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  const playerFaction = state.factions[state.currentFactionIndex];
  if (!playerFaction || !playerFaction.isPlayer) {
    return null;
  }
  
  // Look for clearings with enemy units
  const enemyClearings = state.clearings.filter(c => 
    c.ruler && c.ruler !== playerFaction.name
  );
  
  if (enemyClearings.length > 0 && !state.selectedClearing) {
    // Navigate towards enemy
    return 39;
  }
  
  if (state.selectedClearing && !state.actionMode) {
    return 32; // Move to trigger combat
  }
  
  return 37; // Navigate
}

function getRandomAction(state) {
  if (state.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  const actions = [37, 38, 39, 40, 32, 16, 90]; // All gameplay keys
  return actions[Math.floor(Math.random() * actions.length)];
}

export function get_automated_testing_action(state) {
  switch (state.controlMode) {
    case "TEST_1":
      return getTestBasicAction(state);
    case "TEST_2":
      return getTestWinAction(state);
    case "TEST_3":
      return getTestCombatAction(state);
    default:
      return null;
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;