// input.js - Input handling

import { gameState, GAME_PHASES } from './globals.js';
import { handleHotspotInteraction, handleInventoryCombination } from './game_logic.js';

export function handleKeyPressed(p, keyCode, key, scenes) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase control keys
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { phase: "PAUSED" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      const { resetGameState } = await import('./globals.js');
      resetGameState();
      gameState.gamePhase = GAME_PHASES.START;
      p.logs.game_info.push({
        data: { phase: "START" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  // Gameplay keys
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  // Inventory toggle
  if (keyCode === 90) { // Z
    gameState.inventoryOpen = !gameState.inventoryOpen;
    if (!gameState.inventoryOpen) {
      gameState.selectedInventoryIndex = -1;
    } else if (gameState.inventory.length > 0 && gameState.selectedInventoryIndex < 0) {
      gameState.selectedInventoryIndex = 0;
    }
    return;
  }
  
  // Inventory navigation
  if (gameState.inventoryOpen) {
    if (keyCode === 37) { // LEFT
      if (gameState.selectedInventoryIndex > 0) {
        gameState.selectedInventoryIndex--;
      }
    } else if (keyCode === 39) { // RIGHT
      if (gameState.selectedInventoryIndex < gameState.inventory.length - 1) {
        gameState.selectedInventoryIndex++;
      }
    } else if (keyCode === 38) { // UP
      gameState.selectedInventoryIndex = Math.max(0, gameState.selectedInventoryIndex - 5);
    } else if (keyCode === 40) { // DOWN
      gameState.selectedInventoryIndex = Math.min(gameState.inventory.length - 1, gameState.selectedInventoryIndex + 5);
    } else if (keyCode === 16) { // SHIFT - Examine item
      if (gameState.selectedInventoryIndex >= 0) {
        const item = gameState.inventory[gameState.selectedInventoryIndex];
        const { showDialogue } = await import('./game_logic.js');
        showDialogue(item.description, p);
      }
    } else if (keyCode === 32) { // SPACE - Try to combine items
      if (gameState.selectedInventoryIndex >= 0) {
        // Simple combination: try with next item
        const nextIndex = (gameState.selectedInventoryIndex + 1) % gameState.inventory.length;
        if (nextIndex !== gameState.selectedInventoryIndex && gameState.inventory.length > 1) {
          handleInventoryCombination(gameState.selectedInventoryIndex, nextIndex, p);
        }
      }
    }
    return;
  }
  
  // Movement and interaction
  const currentSceneObj = scenes[gameState.currentScene];
  
  if (keyCode === 37) { // LEFT
    gameState.player.setTarget(gameState.player.x - 50);
  } else if (keyCode === 39) { // RIGHT
    gameState.player.setTarget(gameState.player.x + 50);
  } else if (keyCode === 32) { // SPACE - Interact
    const nearbyHotspot = currentSceneObj.getNearbyHotspot(gameState.player);
    if (nearbyHotspot) {
      handleHotspotInteraction(nearbyHotspot, p);
    }
  }
}

export function processAutomatedInput(p, scenes) {
  if (gameState.controlMode === "HUMAN") return;
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  try {
    const action = window.get_automated_testing_action(gameState);
    if (action && action.keyCode) {
      handleKeyPressed(p, action.keyCode, action.key, scenes);
    }
  } catch (error) {
    console.error("Automated testing error:", error);
  }
}