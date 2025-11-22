// location_manager.js - Manages locations and hotspots

import { gameState, LOCATIONS, ITEMS, MAX_INVENTORY_SIZE } from './globals.js';

export function getCurrentLocation() {
  return LOCATIONS[gameState.currentLocation];
}

export function getVisibleHotspots() {
  const location = getCurrentLocation();
  return location.hotspots.filter(hotspot => {
    if (hotspot.hidden) {
      // Check if this hotspot should be revealed
      if (hotspot.id === "key" && gameState.objectStates.forestKey) return true;
      if (hotspot.id === "map" && gameState.objectStates.lighthouseMap) return true;
      if (hotspot.id === "gem" && gameState.objectStates.templeGem) return true;
      return false;
    }
    if (hotspot.type === "item" && hotspot.collected) return false;
    if (hotspot.type === "exit" && !hotspot.unlocked) return false;
    return true;
  });
}

export function interactWithHotspot(hotspot, p) {
  const location = getCurrentLocation();
  
  switch (hotspot.type) {
    case "item":
      return collectItem(hotspot, p);
    case "exit":
      return changeLocation(hotspot.target, p);
    case "puzzle":
      return solvePuzzle(hotspot, p);
    case "codePuzzle":
      return attemptCode(hotspot, p);
    default:
      return false;
  }
}

function collectItem(hotspot, p) {
  if (gameState.inventory.length >= MAX_INVENTORY_SIZE) {
    return false;
  }
  
  if (!hotspot.collected) {
    gameState.inventory.push(hotspot.item);
    gameState.collectedItems.push(hotspot.item);
    hotspot.collected = true;
    gameState.itemsCollected++;
    gameState.score += 10;
    
    p.logs.game_info.push({
      data: `Collected item: ${hotspot.item}`,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    return true;
  }
  return false;
}

function changeLocation(target, p) {
  gameState.currentLocation = target;
  gameState.selectedHotspotIndex = 0;
  
  if (!gameState.discoveredLocations.includes(target)) {
    gameState.discoveredLocations.push(target);
    gameState.score += 20;
  }
  
  p.logs.game_info.push({
    data: `Changed location to: ${target}`,
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  return true;
}

function solvePuzzle(hotspot, p) {
  if (!hotspot.requires) return false;
  
  // Check if player has selected item
  if (gameState.selectedInventoryIndex === -1) return false;
  
  const selectedItem = gameState.inventory[gameState.selectedInventoryIndex];
  
  // Check if selected item is required
  if (!hotspot.requires.includes(selectedItem)) return false;
  
  // For multi-item puzzles, check if all required items are in inventory
  const hasAllItems = hotspot.requires.every(item => gameState.inventory.includes(item));
  
  if (!hasAllItems) return false;
  
  // Solve the puzzle
  const unlockKey = hotspot.unlocks;
  gameState.objectStates[unlockKey] = true;
  gameState.puzzlesSolved.push(hotspot.id);
  gameState.puzzlesCompleted++;
  gameState.score += 50;
  
  // Remove used items
  hotspot.requires.forEach(item => {
    const index = gameState.inventory.indexOf(item);
    if (index > -1) {
      gameState.inventory.splice(index, 1);
    }
  });
  
  gameState.selectedInventoryIndex = -1;
  
  // Unlock related hotspots or exits
  if (unlockKey === "forestKey") {
    const keyHotspot = LOCATIONS.forest.hotspots.find(h => h.id === "key");
    if (keyHotspot) keyHotspot.hidden = false;
  } else if (unlockKey === "lighthouse") {
    const mapHotspot = LOCATIONS.lighthouse.hotspots.find(h => h.id === "map");
    if (mapHotspot) mapHotspot.hidden = false;
    const exitHotspot = LOCATIONS.forest.hotspots.find(h => h.id === "toLighthouse");
    if (exitHotspot) exitHotspot.unlocked = true;
  } else if (unlockKey === "templeAccess") {
    const exitHotspot = LOCATIONS.lighthouse.hotspots.find(h => h.id === "toTemple");
    if (exitHotspot) exitHotspot.unlocked = true;
  } else if (unlockKey === "templeDoor") {
    const gemHotspot = LOCATIONS.temple.hotspots.find(h => h.id === "gem");
    if (gemHotspot) gemHotspot.hidden = false;
    const exitHotspot = LOCATIONS.temple.hotspots.find(h => h.id === "toCave");
    if (exitHotspot) exitHotspot.unlocked = true;
  } else if (unlockKey === "altarActivated") {
    gameState.hasWon = true;
  }
  
  p.logs.game_info.push({
    data: `Puzzle solved: ${hotspot.id}`,
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  return true;
}

function attemptCode(hotspot, p) {
  // For simplicity, auto-solve code puzzles when interacted with correct code knowledge
  if (gameState.inventory.includes("Ancient Map") && hotspot.code === "1842") {
    gameState.objectStates[hotspot.unlocks] = true;
    const exitHotspot = LOCATIONS.lighthouse.hotspots.find(h => h.id === "toTemple");
    if (exitHotspot) exitHotspot.unlocked = true;
    gameState.puzzlesCompleted++;
    gameState.score += 50;
    
    p.logs.game_info.push({
      data: `Code puzzle solved: ${hotspot.id}`,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    return true;
  }
  return false;
}

export function examineItem(itemName) {
  return ITEMS[itemName]?.description || "No description available";
}