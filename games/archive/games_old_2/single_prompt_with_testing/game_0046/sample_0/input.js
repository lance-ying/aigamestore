import { gameState, GAME_PHASES, ACTION_TYPES, STORY_FLAGS } from './globals.js';
import { ITEMS } from './scenes_data.js';

export function handleKeyPressed(p, keyCode, scenes) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  // Game phase controls
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase },
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
        data: { phase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }

  if (keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      resetGame(scenes);
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase, action: "restart" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }

  // Gameplay controls
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;

  if (gameState.dialogueActive) {
    handleDialogueInput(keyCode);
  } else if (gameState.showInventory) {
    handleInventoryInput(keyCode);
  } else if (gameState.actionMenuVisible) {
    handleActionMenuInput(keyCode, scenes);
  } else {
    handleGameplayInput(keyCode, scenes);
  }
}

function handleDialogueInput(keyCode) {
  if (keyCode === 38) { // UP
    gameState.selectedDialogueIndex = Math.max(0, gameState.selectedDialogueIndex - 1);
  } else if (keyCode === 40) { // DOWN
    gameState.selectedDialogueIndex = Math.min(
      gameState.dialogueOptions.length - 1, 
      gameState.selectedDialogueIndex + 1
    );
  } else if (keyCode === 90) { // Z
    const selected = gameState.dialogueOptions[gameState.selectedDialogueIndex];
    if (selected.flag) {
      gameState.storyFlags[selected.flag] = true;
      if (selected.flag === STORY_FLAGS.TALKED_TO_MECHANIC) {
        gameState.score += 100;
      }
      if (selected.flag === STORY_FLAGS.TALKED_TO_BOSS) {
        gameState.score += 150;
      }
    }
    gameState.dialogueActive = false;
    gameState.selectedDialogueIndex = 0;
  }
}

function handleInventoryInput(keyCode) {
  const cols = 5;
  const currentIndex = gameState.inventory.indexOf(gameState.selectedItem);
  let newIndex = currentIndex >= 0 ? currentIndex : 0;

  if (keyCode === 37) { // LEFT
    newIndex = Math.max(0, newIndex - 1);
  } else if (keyCode === 39) { // RIGHT
    newIndex = Math.min(gameState.inventory.length - 1, newIndex + 1);
  } else if (keyCode === 38) { // UP
    newIndex = Math.max(0, newIndex - cols);
  } else if (keyCode === 40) { // DOWN
    newIndex = Math.min(gameState.inventory.length - 1, newIndex + cols);
  } else if (keyCode === 90) { // Z - Select/combine
    if (gameState.selectedItem && currentIndex >= 0) {
      const item = gameState.inventory[newIndex];
      if (item !== gameState.selectedItem && gameState.selectedItem.combinable.includes(item.id)) {
        // Combine items
        if (gameState.selectedItem.id === "photo" && item.id === "document") {
          gameState.inventory = gameState.inventory.filter(i => i.id !== "photo" && i.id !== "document");
          gameState.inventory.push(ITEMS.EVIDENCE);
          gameState.storyFlags[STORY_FLAGS.COMBINED_EVIDENCE] = true;
          gameState.puzzlesSolved++;
          gameState.score += 200;
          gameState.selectedItem = ITEMS.EVIDENCE;
          showMessage("You combined the photo and document into damning evidence!");
        } else if (gameState.selectedItem.id === "document" && item.id === "photo") {
          gameState.inventory = gameState.inventory.filter(i => i.id !== "photo" && i.id !== "document");
          gameState.inventory.push(ITEMS.EVIDENCE);
          gameState.storyFlags[STORY_FLAGS.COMBINED_EVIDENCE] = true;
          gameState.puzzlesSolved++;
          gameState.score += 200;
          gameState.selectedItem = ITEMS.EVIDENCE;
          showMessage("You combined the photo and document into damning evidence!");
        }
      }
    } else if (newIndex >= 0 && newIndex < gameState.inventory.length) {
      gameState.selectedItem = gameState.inventory[newIndex];
    }
  } else if (keyCode === 32) { // SPACE - Close inventory
    gameState.showInventory = false;
  }

  if (newIndex >= 0 && newIndex < gameState.inventory.length && keyCode !== 90) {
    gameState.selectedItem = gameState.inventory[newIndex];
  }
}

function handleActionMenuInput(keyCode, scenes) {
  if (keyCode === 38) { // UP
    gameState.selectedActionIndex = Math.max(0, gameState.selectedActionIndex - 1);
  } else if (keyCode === 40) { // DOWN
    gameState.selectedActionIndex = Math.min(
      gameState.actionMenuOptions.length - 1, 
      gameState.selectedActionIndex + 1
    );
  } else if (keyCode === 90) { // Z - Confirm action
    const action = gameState.actionMenuOptions[gameState.selectedActionIndex];
    executeHotspotAction(action, scenes);
    gameState.actionMenuVisible = false;
  }
}

function handleGameplayInput(keyCode, scenes) {
  const currentScene = scenes[gameState.currentScene];

  if (keyCode === 32) { // SPACE - Open inventory
    gameState.showInventory = !gameState.showInventory;
    if (gameState.showInventory && gameState.inventory.length > 0) {
      gameState.selectedItem = gameState.inventory[0];
    }
  } else if (keyCode === 16) { // SHIFT - Cycle action
    const actions = [ACTION_TYPES.LOOK, ACTION_TYPES.TALK, ACTION_TYPES.USE, ACTION_TYPES.TAKE];
    const currentIndex = actions.indexOf(gameState.currentAction);
    gameState.currentAction = actions[(currentIndex + 1) % actions.length];
  } else if (keyCode === 90) { // Z - Interact with highlighted hotspot
    if (gameState.highlightedHotspot) {
      const hotspot = gameState.highlightedHotspot;
      if (hotspot.actions.includes(gameState.currentAction)) {
        executeHotspotAction(gameState.currentAction, scenes);
      } else {
        showMessage("Can't do that with this object.");
      }
    }
  } else if (keyCode === 37) { // LEFT
    const leftConn = currentScene.connections.find(c => c.direction === "left");
    if (leftConn && canNavigate()) {
      gameState.currentScene = leftConn.sceneId;
      gameState.highlightedHotspot = null;
    }
  } else if (keyCode === 39) { // RIGHT
    const rightConn = currentScene.connections.find(c => c.direction === "right");
    if (rightConn && canNavigate()) {
      gameState.currentScene = rightConn.sceneId;
      gameState.highlightedHotspot = null;
    }
  } else if (keyCode === 38) { // UP
    const upConn = currentScene.connections.find(c => c.direction === "up");
    if (upConn && canNavigate()) {
      gameState.currentScene = upConn.sceneId;
      gameState.highlightedHotspot = null;
    }
  } else if (keyCode === 40) { // DOWN
    const downConn = currentScene.connections.find(c => c.direction === "down");
    if (downConn && canNavigate()) {
      gameState.currentScene = downConn.sceneId;
      gameState.highlightedHotspot = null;
    }
  }
}

function canNavigate() {
  // Check if certain conditions need to be met
  if (gameState.currentScene === 2 && !gameState.storyFlags[STORY_FLAGS.FIXED_BIKE]) {
    showMessage("Better fix your bike before heading out.");
    return false;
  }
  return true;
}

function executeHotspotAction(action, scenes) {
  const hotspot = gameState.highlightedHotspot;
  if (!hotspot) return;

  const result = hotspot.onInteract(action, gameState);
  if (result) {
    showMessage(result);
  }
  
  // Log player action
  logPlayerInfo();
}

function showMessage(text) {
  gameState.messageText = text;
  gameState.messageTimer = 120; // Show for 2 seconds at 60fps
}

function logPlayerInfo() {
  if (gameState.player) {
    p.logs.player_info.push({
      screen_x: gameState.player.x,
      screen_y: gameState.player.y,
      game_x: gameState.player.x,
      game_y: gameState.player.y,
      framecount: gameState.p.frameCount
    });
  }
}

function resetGame(scenes) {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.currentScene = 0;
  gameState.score = 0;
  gameState.inventory = [];
  gameState.selectedItem = null;
  gameState.showInventory = false;
  gameState.currentAction = ACTION_TYPES.LOOK;
  gameState.highlightedHotspot = null;
  gameState.dialogueActive = false;
  gameState.dialogueOptions = [];
  gameState.selectedDialogueIndex = 0;
  gameState.storyFlags = {};
  gameState.puzzlesSolved = 0;
  gameState.actionMenuVisible = false;
  gameState.messageText = "";
  gameState.messageTimer = 0;
}

export function updateHotspotHighlight(scenes) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  if (gameState.showInventory || gameState.dialogueActive) return;

  const currentScene = scenes[gameState.currentScene];
  
  // Simple cycling through hotspots with Z key focus
  // In a point-and-click, we'd typically click, but here we cycle with arrow keys
  // For now, auto-highlight first available hotspot
  const availableHotspots = currentScene.hotspots.filter(h => !h.hidden);
  
  if (availableHotspots.length > 0) {
    if (!gameState.highlightedHotspot || !availableHotspots.includes(gameState.highlightedHotspot)) {
      gameState.highlightedHotspot = availableHotspots[0];
    }
    
    // Cycle through hotspots with left/right when not navigating
    // This is a simplified implementation
  }
}