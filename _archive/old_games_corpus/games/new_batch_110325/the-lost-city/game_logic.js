// game_logic.js - Game logic and interactions

import { gameState, SCENES, GAME_PHASES, ITEMS } from './globals.js';

export function handleInteraction(p) {
  const scene = SCENES[gameState.currentScene];
  
  if (gameState.showInventory) {
    handleInventoryInteraction(p);
    return;
  }
  
  if (gameState.selectedHotspot !== null) {
    const hotspot = scene.hotspots[gameState.selectedHotspot];
    if (hotspot) {
      interactWithHotspot(p, hotspot);
    }
  }
}

function handleInventoryInteraction(p) {
  if (gameState.selectedInventoryItem !== null && gameState.inventory.length > 0) {
    const itemId = gameState.inventory[gameState.selectedInventoryItem];
    gameState.showInventory = false;
    
    // Try to use item on current scene
    attemptItemUse(p, itemId);
  }
}

function interactWithHotspot(p, hotspot) {
  // Collect item
  if (hotspot.item && !gameState.inventory.includes(hotspot.item)) {
    const isAccessible = !hotspot.requires || gameState.puzzlesSolved.includes(hotspot.requires);
    if (isAccessible) {
      gameState.player.addItem(hotspot.item);
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.player.x,
        game_y: gameState.player.y,
        action: "collected_item",
        item: hotspot.item,
        framecount: p.frameCount
      });
      return;
    }
  }
  
  // Examine hotspot
  if (hotspot.examine) {
    if (hotspot.clue) {
      gameState.player.addJournalEntry(hotspot.clue);
      if (hotspot.id === "gate_runes") {
        gameState.puzzlesSolved.push("read_runes");
      }
    }
  }
}

function attemptItemUse(p, itemId) {
  const scene = SCENES[gameState.currentScene];
  
  // Check hotspots that can use this item
  scene.hotspots.forEach((hotspot) => {
    if (hotspot.useItem === itemId) {
      executeItemUse(p, hotspot, itemId);
    }
  });
  
  // Special combinations
  if (gameState.currentScene === "tower") {
    checkArtifactCombination(p);
  }
}

function executeItemUse(p, hotspot, itemId) {
  switch (hotspot.result) {
    case "unlock_temple":
      gameState.puzzlesSolved.push("fountain_unlocked");
      gameState.puzzlesSolved.push("unlock_temple");
      gameState.score += 50;
      gameState.player.addJournalEntry("The fountain activated! The temple path is open.");
      break;
    
    case "statue_blessing":
      gameState.puzzlesSolved.push("statue_blessed");
      gameState.score += 30;
      // Give silver key
      if (!gameState.inventory.includes("silver_key")) {
        gameState.inventory.push("silver_key");
        gameState.player.addJournalEntry("The statue blessed you with a silver key!");
      }
      break;
    
    case "unlock_chest":
      gameState.puzzlesSolved.push("chest_unlocked");
      gameState.puzzlesSolved.push("unlock_tower");
      gameState.score += 40;
      gameState.player.addJournalEntry("The chest opened! The tower is now accessible.");
      break;
    
    case "win_game":
      if (gameState.artifacts >= 3) {
        winGame(p);
      }
      break;
  }
  
  p.logs.player_info.push({
    screen_x: gameState.player.x,
    screen_y: gameState.player.y,
    game_x: gameState.player.x,
    game_y: gameState.player.y,
    action: "used_item",
    item: itemId,
    result: hotspot.result,
    framecount: p.frameCount
  });
}

function checkArtifactCombination(p) {
  const hasAllArtifacts = 
    gameState.inventory.includes("sun_medallion") &&
    gameState.inventory.includes("moon_stone") &&
    gameState.inventory.includes("star_gem");
  
  if (hasAllArtifacts && !gameState.inventory.includes("power_crystal")) {
    // Combine artifacts into power crystal
    gameState.inventory = gameState.inventory.filter(
      item => item !== "sun_medallion" && item !== "moon_stone" && item !== "star_gem"
    );
    gameState.inventory.push("power_crystal");
    gameState.artifacts = 3;
    gameState.score += 100;
    gameState.player.addJournalEntry("The three artifacts merged into the Power Crystal!");
    
    p.logs.player_info.push({
      screen_x: gameState.player.x,
      screen_y: gameState.player.y,
      game_x: gameState.player.x,
      game_y: gameState.player.y,
      action: "combined_artifacts",
      framecount: p.frameCount
    });
  }
}

function winGame(p) {
  gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
  gameState.score += 200;
  
  p.logs.game_info.push({
    data: { phase: "GAME_OVER_WIN", score: gameState.score },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  p.logs.player_info.push({
    screen_x: gameState.player.x,
    screen_y: gameState.player.y,
    game_x: gameState.player.x,
    game_y: gameState.player.y,
    action: "game_won",
    framecount: p.frameCount
  });
}

export function changeScene(sceneId) {
  if (SCENES[sceneId]) {
    gameState.currentScene = sceneId;
    gameState.selectedHotspot = null;
    if (!gameState.unlockedScenes.includes(sceneId)) {
      gameState.unlockedScenes.push(sceneId);
      gameState.score += 20;
    }
  }
}

export function getAvailableHotspots() {
  const scene = SCENES[gameState.currentScene];
  return scene.hotspots.filter(hotspot => {
    const isVisible = !hotspot.requires || gameState.puzzlesSolved.includes(hotspot.requires);
    const isCollected = hotspot.item && gameState.inventory.includes(hotspot.item);
    return isVisible && !isCollected;
  });
}

export function getAvailableExits() {
  const scene = SCENES[gameState.currentScene];
  return scene.exits.filter(exit => {
    return !exit.requires || gameState.puzzlesSolved.includes(exit.requires);
  });
}