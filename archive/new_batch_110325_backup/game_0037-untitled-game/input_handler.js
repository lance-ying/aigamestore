// input_handler.js - Handle keyboard inputs

import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, KEY_ENTER, KEY_ESC, KEY_R, KEY_SPACE, KEY_SHIFT, KEY_Z, KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_DOWN, CATALOG_X, CATALOG_Y } from './globals.js';
import { initializeGame, purchaseItem, dismissCurrentLetter } from './game_logic.js';

export function handleKeyPressed(p, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase transition keys
  if (keyCode === KEY_ENTER && gameState.gamePhase === PHASE_START) {
    gameState.gamePhase = PHASE_PLAYING;
    initializeGame();
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, message: "Game Started" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  if (keyCode === KEY_ESC) {
    if (gameState.gamePhase === PHASE_PLAYING) {
      gameState.gamePhase = PHASE_PAUSED;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase, message: "Game Paused" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      gameState.gamePhase = PHASE_PLAYING;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase, message: "Game Resumed" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === KEY_R && (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE)) {
    gameState.gamePhase = PHASE_START;
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, message: "Game Restarted" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  // Gameplay keys (only in PLAYING phase)
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  // Dismiss letter
  if (gameState.currentLetter && !gameState.currentLetter.dismissed) {
    dismissCurrentLetter();
    return;
  }
  
  // Toggle catalog
  if (keyCode === KEY_Z) {
    gameState.catalogOpen = !gameState.catalogOpen;
    if (gameState.catalogOpen) {
      gameState.selectedItemIndex = 0;
    }
    return;
  }
  
  // Catalog navigation
  if (gameState.catalogOpen) {
    const currentCatalog = gameState.catalogs[gameState.currentCatalogIndex];
    
    if (keyCode === KEY_UP) {
      gameState.selectedItemIndex = Math.max(0, gameState.selectedItemIndex - 1);
    } else if (keyCode === KEY_DOWN) {
      gameState.selectedItemIndex = Math.min(currentCatalog.items.length - 1, gameState.selectedItemIndex + 1);
    } else if (keyCode === KEY_LEFT) {
      // Previous catalog
      let prev = gameState.currentCatalogIndex - 1;
      while (prev >= 0 && !gameState.catalogs[prev].unlocked) {
        prev--;
      }
      if (prev >= 0) {
        gameState.currentCatalogIndex = prev;
        gameState.selectedItemIndex = 0;
      }
    } else if (keyCode === KEY_RIGHT) {
      // Next catalog
      let next = gameState.currentCatalogIndex + 1;
      while (next < gameState.catalogs.length && !gameState.catalogs[next].unlocked) {
        next++;
      }
      if (next < gameState.catalogs.length) {
        gameState.currentCatalogIndex = next;
        gameState.selectedItemIndex = 0;
      }
    } else if (keyCode === KEY_SPACE) {
      // Purchase item
      const selectedItem = currentCatalog.items[gameState.selectedItemIndex];
      if (selectedItem) {
        purchaseItem(selectedItem);
      }
    }
  }
}

export function handleKeyHeld(p) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  // Grab/drag item with SHIFT
  if (p.keyIsDown(KEY_SHIFT)) {
    if (!gameState.grabbedItem) {
      // Try to grab an item from inventory
      for (let item of gameState.inventory) {
        if (!item.isBurning && !item.isDragging) {
          gameState.grabbedItem = item;
          item.isDragging = true;
          break;
        }
      }
    } else {
      // Move grabbed item towards fireplace center (simplified dragging)
      const targetX = 200; // Center of fireplace
      const targetY = 290;
      const speed = 3;
      
      const dx = targetX - gameState.grabbedItem.x;
      const dy = targetY - gameState.grabbedItem.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > speed) {
        gameState.grabbedItem.x += (dx / dist) * speed;
        gameState.grabbedItem.y += (dy / dist) * speed;
      } else {
        gameState.grabbedItem.x = targetX;
        gameState.grabbedItem.y = targetY;
      }
    }
  } else {
    // Release grabbed item
    if (gameState.grabbedItem) {
      gameState.grabbedItem.isDragging = false;
      
      // Check if item is in fireplace
      if (gameState.grabbedItem.isInFireplace()) {
        gameState.grabbedItem.startBurning();
        gameState.burningItems.push(gameState.grabbedItem);
        gameState.inventory = gameState.inventory.filter(item => item !== gameState.grabbedItem);
      }
      
      gameState.grabbedItem = null;
    }
  }
}

export function logPlayerInfo(p) {
  if (gameState.gamePhase === PHASE_PLAYING) {
    p.logs.player_info.push({
      screen_x: 0,
      screen_y: 0,
      game_x: 0,
      game_y: 0,
      framecount: p.frameCount
    });
  }
}