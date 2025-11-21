// input.js - Input handling

import { gameState, GAME_PHASES, PLAY_PHASES } from './globals.js';
import { 
  selectRaceCombo, 
  deployToken, 
  undoLastDeployment, 
  putRaceIntoDecline, 
  endPlayerTurn 
} from './game_logic.js';

export function handleKeyPressed(p) {
  const key = p.key;
  const keyCode = p.keyCode;
  
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase transitions (handled in main game.js)
  // ENTER, R, ESC are handled separately
  
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    if (gameState.currentPlayer !== 0) return; // Only handle human input
    
    // Arrow keys for navigation
    if (keyCode === 37 || keyCode === 38 || keyCode === 39 || keyCode === 40) {
      handleArrowKeys(p, keyCode);
    }
    
    // Space for confirm
    if (keyCode === 32) {
      handleSpaceKey(p);
    }
    
    // Z for undo
    if (keyCode === 90) {
      handleZKey(p);
    }
    
    // Shift for decline
    if (keyCode === 16) {
      handleShiftKey(p);
    }
  }
}

function handleArrowKeys(p, keyCode) {
  if (gameState.playPhase === PLAY_PHASES.SELECT_RACE) {
    // Navigate race combos
    const maxIndex = gameState.availableRaceCombos.length - 1;
    
    if (gameState.selectedRaceCombo === null) {
      gameState.selectedRaceCombo = 0;
    } else {
      if (keyCode === 38) { // Up
        gameState.selectedRaceCombo = Math.max(0, gameState.selectedRaceCombo - 1);
      } else if (keyCode === 40) { // Down
        gameState.selectedRaceCombo = Math.min(maxIndex, gameState.selectedRaceCombo + 1);
      }
    }
  } else if (gameState.playPhase === PLAY_PHASES.DEPLOY_TOKENS) {
    // Navigate territories
    const territories = gameState.territories;
    
    if (gameState.selectedTerritory === null) {
      gameState.selectedTerritory = territories[0];
    } else {
      const currentIndex = territories.indexOf(gameState.selectedTerritory);
      let newIndex = currentIndex;
      
      // Simple grid navigation
      if (keyCode === 37) newIndex = Math.max(0, currentIndex - 1); // Left
      if (keyCode === 39) newIndex = Math.min(territories.length - 1, currentIndex + 1); // Right
      if (keyCode === 38) newIndex = Math.max(0, currentIndex - 5); // Up
      if (keyCode === 40) newIndex = Math.min(territories.length - 1, currentIndex + 5); // Down
      
      gameState.selectedTerritory = territories[newIndex];
    }
  }
}

function handleSpaceKey(p) {
  if (gameState.playPhase === PLAY_PHASES.SELECT_RACE) {
    // Confirm race selection
    if (gameState.selectedRaceCombo !== null) {
      selectRaceCombo(p, gameState.selectedRaceCombo);
      gameState.selectedRaceCombo = null;
    }
  } else if (gameState.playPhase === PLAY_PHASES.DEPLOY_TOKENS) {
    // Try to deploy to selected territory
    if (gameState.selectedTerritory) {
      const success = deployToken(p, gameState.selectedTerritory);
      
      // If no tokens left, end turn
      if (gameState.tokensToPlace === 0) {
        gameState.currentMessage = "Turn complete! Press Space to end turn.";
      }
      
      // Second space press ends turn
      if (gameState.tokensToPlace === 0 && gameState.deploymentHistory.length > 0) {
        endPlayerTurn(p);
      }
    } else {
      // No territory selected, end turn
      if (gameState.deploymentHistory.length > 0) {
        endPlayerTurn(p);
      }
    }
  }
}

function handleZKey(p) {
  if (gameState.playPhase === PLAY_PHASES.DEPLOY_TOKENS) {
    undoLastDeployment(p);
  }
}

function handleShiftKey(p) {
  if (gameState.playPhase === PLAY_PHASES.DEPLOY_TOKENS) {
    putRaceIntoDecline(p);
  }
}

export function updateHoveredTerritory(p) {
  // This would be for mouse support, but we're keyboard only
  // Keep for potential future enhancement
  gameState.hoveredTerritory = null;
}