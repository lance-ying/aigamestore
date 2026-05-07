// testing.js - Automated testing controllers
import { gameState, GAME_PHASES, KEY_BINDINGS, HIT_ZONE, SYMBOL_TYPES } from './globals.js';

export function getTestingAction(p) {
  if (gameState.controlMode === 'TEST_1') {
    return getTest1Action(p);
  } else if (gameState.controlMode === 'TEST_2') {
    return getTest2Action(p);
  }
  return null;
}

// TEST_1: Basic testing - press keys when symbols are in hit zone
function getTest1Action(p) {
  if (gameState.gamePhase === GAME_PHASES.START) {
    return { keyCode: 13 }; // ENTER
  }
  
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    // Find symbol in hit zone and press corresponding key
    for (const symbol of gameState.entities) {
      if (symbol.active && symbol.isInHitZone(HIT_ZONE)) {
        if (symbol.type === SYMBOL_TYPES.DECOY) {
          // Don't press anything for decoy
          continue;
        }
        
        // Find the key for this symbol
        for (const [key, type] of Object.entries(KEY_BINDINGS)) {
          if (type === symbol.type) {
            return { keyCode: parseInt(key) };
          }
        }
      }
    }
  }
  
  return null;
}

// TEST_2: Win the game - perfect play
function getTest2Action(p) {
  if (gameState.gamePhase === GAME_PHASES.START) {
    return { keyCode: 13 }; // ENTER
  }
  
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    // Find symbol closest to center of hit zone
    let bestSymbol = null;
    let bestDistance = Infinity;
    const hitZoneCenter = HIT_ZONE.y + HIT_ZONE.height / 2;
    
    for (const symbol of gameState.entities) {
      if (symbol.active && symbol.isInHitZone(HIT_ZONE)) {
        if (symbol.type === SYMBOL_TYPES.DECOY) {
          continue;
        }
        
        const distance = Math.abs(symbol.y - hitZoneCenter);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestSymbol = symbol;
        }
      }
    }
    
    if (bestSymbol) {
      // Find the key for this symbol
      for (const [key, type] of Object.entries(KEY_BINDINGS)) {
        if (type === bestSymbol.type) {
          return { keyCode: parseInt(key) };
        }
      }
    }
  }
  
  return null;
}