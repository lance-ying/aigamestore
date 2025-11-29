// input_handler.js - Input handling

import { 
  gameState, 
  PHASE_START, 
  PHASE_PLAYING, 
  PHASE_PAUSED, 
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  KEY_ENTER, 
  KEY_ESC, 
  KEY_SPACE, 
  KEY_SHIFT,
  KEY_LEFT, 
  KEY_RIGHT,
  KEY_UP,
  KEY_DOWN,
  KEY_Z,
  KEY_R,
  CONTROL_HUMAN
} from './globals.js';
import { 
  handleHotspotInteraction, 
  handleInventoryUse,
  handleInventoryCombine,
  navigateHotspots,
  navigateInventory
} from './game_logic.js';
import { resetGame } from './game.js';

export function handleKeyPressed(p, keyCode, locations) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase transitions
  if (keyCode === KEY_ENTER && gameState.gamePhase === PHASE_START) {
    gameState.gamePhase = PHASE_PLAYING;
    p.logs.game_info.push({
      data: { gamePhase: PHASE_PLAYING },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  if (keyCode === KEY_ESC && gameState.gamePhase === PHASE_PLAYING) {
    gameState.gamePhase = PHASE_PAUSED;
    p.logs.game_info.push({
      data: { gamePhase: PHASE_PAUSED },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  if (keyCode === KEY_ESC && gameState.gamePhase === PHASE_PAUSED) {
    gameState.gamePhase = PHASE_PLAYING;
    p.logs.game_info.push({
      data: { gamePhase: PHASE_PLAYING },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  if (keyCode === KEY_R && (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE)) {
    resetGame(locations);
    p.logs.game_info.push({
      data: { gamePhase: PHASE_START, action: "restart" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  // Gameplay inputs
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  if (gameState.inventoryOpen) {
    handleInventoryInput(p, keyCode, locations);
  } else {
    handleGameplayInput(p, keyCode, locations);
  }
}

function handleGameplayInput(p, keyCode, locations) {
  if (keyCode === KEY_LEFT || keyCode === KEY_UP) {
    navigateHotspots('prev', locations);
  } else if (keyCode === KEY_RIGHT || keyCode === KEY_DOWN) {
    navigateHotspots('next', locations);
  } else if (keyCode === KEY_SPACE) {
    handleHotspotInteraction(p, locations);
  } else if (keyCode === KEY_Z) {
    if (gameState.inventory.length > 0) {
      gameState.inventoryOpen = true;
      gameState.selectedInventoryItem = 0;
    }
  }
}

function handleInventoryInput(p, keyCode, locations) {
  if (keyCode === KEY_Z) {
    gameState.inventoryOpen = false;
    gameState.selectedInventoryItem = -1;
  } else if (keyCode === KEY_LEFT || keyCode === KEY_UP) {
    navigateInventory('prev');
  } else if (keyCode === KEY_RIGHT || keyCode === KEY_DOWN) {
    navigateInventory('next');
  } else if (keyCode === KEY_SPACE) {
    handleInventoryUse(locations);
  } else if (keyCode === KEY_SHIFT) {
    handleInventoryCombine();
  }
}

export function processAutomatedInput(p, action, locations) {
  if (!action) return;
  
  // Log automated input
  p.logs.inputs.push({
    input_type: "automated",
    data: { action: action },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  handleKeyPressed(p, action, locations);
}