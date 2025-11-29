// input.js - Input handling

import { gameState, KEY_LEFT, KEY_UP, KEY_RIGHT, KEY_DOWN, KEY_SPACE, KEY_SHIFT, KEY_Z, KEY_ENTER, KEY_ESC, KEY_R, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';
import { purchaseEvolution, getAvailableEvolutions } from './evolution.js';
import { resetGame } from './game.js';

const keys = {};

export function handleKeyPress(p) {
  keys[p.keyCode] = true;
  
  // Log input
  if (p.logs && p.logs.inputs) {
    p.logs.inputs.push({
      input_type: 'keyPressed',
      data: { key: p.key, keyCode: p.keyCode },
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Phase controls
  if (p.keyCode === KEY_ENTER) {
    if (gameState.gamePhase === PHASE_START) {
      gameState.gamePhase = PHASE_PLAYING;
      if (p.logs && p.logs.game_info) {
        p.logs.game_info.push({
          data: { gamePhase: PHASE_PLAYING },
          framecount: gameState.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }
  
  if (p.keyCode === KEY_ESC) {
    if (gameState.gamePhase === PHASE_PLAYING) {
      gameState.gamePhase = PHASE_PAUSED;
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      gameState.gamePhase = PHASE_PLAYING;
    }
  }
  
  if (p.keyCode === KEY_R) {
    if (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
        gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      resetGame(p);
      gameState.gamePhase = PHASE_START;
    }
  }
  
  // Gameplay controls
  if (gameState.gamePhase === PHASE_PLAYING) {
    if (p.keyCode === KEY_Z) {
      if (gameState.evolutionMenuOpen) {
        gameState.evolutionMenuOpen = false;
      } else {
        gameState.evolutionMenuOpen = true;
        gameState.evolutionMenuIndex = 0;
      }
    }
    
    // Evolution menu navigation
    if (gameState.evolutionMenuOpen) {
      const categories = ['transmission', 'symptoms', 'abilities'];
      
      if (p.keyCode === KEY_LEFT) {
        const currentIndex = categories.indexOf(gameState.evolutionCategory);
        gameState.evolutionCategory = categories[(currentIndex - 1 + categories.length) % categories.length];
        gameState.evolutionMenuIndex = 0;
      }
      
      if (p.keyCode === KEY_RIGHT) {
        const currentIndex = categories.indexOf(gameState.evolutionCategory);
        gameState.evolutionCategory = categories[(currentIndex + 1) % categories.length];
        gameState.evolutionMenuIndex = 0;
      }
      
      if (p.keyCode === KEY_UP) {
        const available = getAvailableEvolutions(gameState.evolutionCategory);
        if (available.length > 0) {
          gameState.evolutionMenuIndex = (gameState.evolutionMenuIndex - 1 + available.length) % available.length;
        }
      }
      
      if (p.keyCode === KEY_DOWN) {
        const available = getAvailableEvolutions(gameState.evolutionCategory);
        if (available.length > 0) {
          gameState.evolutionMenuIndex = (gameState.evolutionMenuIndex + 1) % available.length;
        }
      }
      
      if (p.keyCode === KEY_SPACE) {
        const available = getAvailableEvolutions(gameState.evolutionCategory);
        if (available.length > 0 && gameState.evolutionMenuIndex < available.length) {
          const evolution = available[gameState.evolutionMenuIndex];
          purchaseEvolution(gameState.evolutionCategory, evolution.id);
        }
      }
    } else {
      // Country selection
      if (p.keyCode === KEY_LEFT || p.keyCode === KEY_RIGHT || 
          p.keyCode === KEY_UP || p.keyCode === KEY_DOWN) {
        gameState.showInfoPanel = true;
        
        if (p.keyCode === KEY_LEFT) {
          gameState.selectedCountryIndex = (gameState.selectedCountryIndex - 1 + gameState.countries.length) % gameState.countries.length;
        }
        if (p.keyCode === KEY_RIGHT) {
          gameState.selectedCountryIndex = (gameState.selectedCountryIndex + 1) % gameState.countries.length;
        }
        if (p.keyCode === KEY_UP) {
          gameState.selectedCountryIndex = Math.max(0, gameState.selectedCountryIndex - 1);
        }
        if (p.keyCode === KEY_DOWN) {
          gameState.selectedCountryIndex = Math.min(gameState.countries.length - 1, gameState.selectedCountryIndex + 1);
        }
      }
      
      // Collect DNA bubble
      if (p.keyCode === KEY_SPACE) {
        collectNearbyDNABubble();
      }
    }
  }
}

export function handleKeyRelease(p) {
  keys[p.keyCode] = false;
  
  // Log input
  if (p.logs && p.logs.inputs) {
    p.logs.inputs.push({
      input_type: 'keyReleased',
      data: { key: p.key, keyCode: p.keyCode },
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
}

export function isKeyPressed(keyCode) {
  return keys[keyCode] === true;
}

function collectNearbyDNABubble() {
  const country = gameState.countries[gameState.selectedCountryIndex];
  if (!country) return;
  
  for (let i = gameState.dnaBubbles.length - 1; i >= 0; i--) {
    const bubble = gameState.dnaBubbles[i];
    const dx = bubble.x - country.x;
    const dy = bubble.y - country.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 50) {
      gameState.dnaPoints += bubble.value;
      gameState.dnaBubbles.splice(i, 1);
      return;
    }
  }
}

export { keys };