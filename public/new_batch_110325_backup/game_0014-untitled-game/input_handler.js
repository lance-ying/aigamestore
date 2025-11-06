// input_handler.js - Input handling

import { gameState, GAME_PHASES } from './globals.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

let keysPressed = {};

export function setupInputHandlers(p) {
  // Track key states
  p.keyPressed = function() {
    keysPressed[p.keyCode] = true;
    
    // Log input
    p.logs.inputs.push({
      input_type: 'keyPressed',
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    handleGamePhaseKeys(p);
    
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      handleGameplayKeys(p);
    }
  };
  
  p.keyReleased = function() {
    keysPressed[p.keyCode] = false;
  };
}

export function handleGamePhaseKeys(p) {
  // ENTER - Start game
  if (p.keyCode === 13 && gameState.gamePhase === GAME_PHASES.START) {
    gameState.gamePhase = GAME_PHASES.PLAYING;
    p.logs.game_info.push({
      data: { phase: 'PLAYING', message: 'Game started' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // ESC - Pause/Unpause
  if (p.keyCode === 27) {
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { phase: 'PAUSED' },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: 'PLAYING', message: 'Game resumed' },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  // R - Restart
  if (p.keyCode === 82) {
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      resetGame();
      p.logs.game_info.push({
        data: { phase: 'START', message: 'Game restarted' },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
}

export function handleGameplayKeys(p) {
  // Arrow keys - Navigate hotspots
  if (p.keyCode === 37) { // LEFT
    navigateHotspots(-1);
  } else if (p.keyCode === 39) { // RIGHT
    navigateHotspots(1);
  } else if (p.keyCode === 38) { // UP
    navigateHotspots(-2);
  } else if (p.keyCode === 40) { // DOWN
    navigateHotspots(2);
  }
  
  // SPACE - Interact
  if (p.keyCode === 32) {
    interactWithSelected();
  }
  
  // Z - Cycle inventory
  if (p.keyCode === 90) {
    cycleInventory();
  }
  
  // SHIFT - Examine inventory
  if (p.keyCode === 16) {
    examineInventory();
  }
}

function navigateHotspots(direction) {
  if (gameState.currentHotspots.length === 0) return;
  
  gameState.selectedHotspotIndex += direction;
  
  if (gameState.selectedHotspotIndex < 0) {
    gameState.selectedHotspotIndex = gameState.currentHotspots.length - 1;
  } else if (gameState.selectedHotspotIndex >= gameState.currentHotspots.length) {
    gameState.selectedHotspotIndex = 0;
  }
}

function interactWithSelected() {
  if (gameState.currentHotspots.length === 0) return;
  
  const hotspot = gameState.currentHotspots[gameState.selectedHotspotIndex];
  if (!hotspot || !hotspot.visible) return;
  
  const currentInventoryItem = gameState.inventory[gameState.selectedInventoryIndex];
  const result = hotspot.interact(currentInventoryItem);
  
  if (result.addToInventory) {
    gameState.inventory.push(result.addToInventory);
    gameState.score += 10;
  }
  
  // Record interaction for puzzle solving
  if (!gameState.puzzleProgress[gameState.currentLevel]) {
    gameState.puzzleProgress[gameState.currentLevel] = [];
  }
  gameState.puzzleProgress[gameState.currentLevel].push(hotspot.id);
}

function cycleInventory() {
  if (gameState.inventory.length === 0) return;
  
  gameState.selectedInventoryIndex++;
  if (gameState.selectedInventoryIndex >= gameState.inventory.length) {
    gameState.selectedInventoryIndex = 0;
  }
}

function examineInventory() {
  if (gameState.inventory.length === 0) return;
  // Could show detailed view - for now just logs
  const item = gameState.inventory[gameState.selectedInventoryIndex];
  console.log(`Examining: ${item}`);
}

export function processAutomatedInput(p) {
  if (gameState.controlMode === 'HUMAN') return;
  
  const action = get_automated_testing_action(gameState);
  if (!action) return;
  
  // Simulate key press
  if (action.keyCode) {
    p.keyCode = action.keyCode;
    p.key = action.key;
    
    // Handle the automated action
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      handleGameplayKeys(p);
    }
  }
}

function resetGame() {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.currentLevel = 0;
  gameState.completedLevels = 0;
  gameState.inventory = [];
  gameState.selectedInventoryIndex = 0;
  gameState.selectedHotspotIndex = 0;
  gameState.score = 0;
  gameState.secretsFound = 0;
  gameState.puzzleProgress = {};
  gameState.familyTreeUnlocked = [];
  gameState.currentHotspots = [];
}