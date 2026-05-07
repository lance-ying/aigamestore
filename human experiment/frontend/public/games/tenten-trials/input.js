// input.js - Input handling
import { gameState, GAME_PHASES, KEY_BINDINGS, HIT_ZONE, SYMBOL_TYPES } from './globals.js';

export function handleSymbolMatch(p, keyCode) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  const symbolType = KEY_BINDINGS[keyCode];
  if (!symbolType) return;
  
  // Find symbols in hit zone
  let matched = false;
  
  for (let i = gameState.entities.length - 1; i >= 0; i--) {
    const symbol = gameState.entities[i];
    
    if (symbol.active && symbol.isInHitZone(HIT_ZONE)) {
      if (symbol.type === symbolType) {
        // Correct match!
        matched = true;
        symbol.active = false;
        gameState.entities.splice(i, 1);
        gameState.correctMatches++;
        gameState.combo++;
        
        // Calculate score with combo bonus
        let points = 50;
        if (gameState.combo >= 5) {
          points = 100;
        } else if (gameState.combo >= 3) {
          points = 75;
        }
        gameState.score += points;
        
        // Feedback effect
        gameState.feedbackEffect = { type: 'correct', timer: 15 };
        
        break; // Only match one symbol per key press
      }
    }
  }
  
  if (!matched) {
    // Check if there's ANY symbol in hit zone (wrong key pressed)
    const anyInZone = gameState.entities.some(s => s.active && s.isInHitZone(HIT_ZONE));
    
    if (anyInZone) {
      // Wrong key while symbol in zone = miss
      gameState.misses++;
      gameState.combo = 0;
      gameState.feedbackEffect = { type: 'miss', timer: 15 };
    }
  }
}

export function checkMissedSymbols() {
  for (let i = gameState.entities.length - 1; i >= 0; i--) {
    const symbol = gameState.entities[i];
    
    if (symbol.active && symbol.hasPassed(HIT_ZONE)) {
      // Symbol passed without being matched
      if (symbol.type !== SYMBOL_TYPES.DECOY) {
        gameState.misses++;
        gameState.combo = 0;
        gameState.feedbackEffect = { type: 'miss', timer: 15 };
      }
      // Remove the symbol
      symbol.active = false;
      gameState.entities.splice(i, 1);
    }
  }
}