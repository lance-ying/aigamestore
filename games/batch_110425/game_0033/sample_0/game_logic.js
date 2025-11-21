// game_logic.js - Core game logic and mechanics

import { gameState, PHASE_GAME_OVER_WIN } from './globals.js';
import { showMessage } from './ui.js';
import { getAvailableHotspots } from './locations.js';
import { combineItems } from './player.js';

export function updateGame(p, locations) {
  // Update message timer
  if (gameState.messageTimer > 0) {
    gameState.messageTimer--;
  }
  
  // Track frames since last action for automated testing
  gameState.framesSinceAction++;
}

export function handleHotspotInteraction(p, locations) {
  const location = locations[gameState.currentLocation];
  const hotspot = location.hotspots[gameState.selectedHotspot];
  
  if (!hotspot) return;
  
  switch (hotspot.type) {
    case 'examine':
      handleExamine(hotspot);
      break;
    case 'item':
      handleItemCollection(hotspot);
      break;
    case 'use':
      handleUseHotspot(hotspot, locations);
      break;
    case 'exit':
      handleExit(hotspot, locations);
      break;
    case 'dialogue':
      handleDialogue(hotspot);
      break;
  }
  
  gameState.framesSinceAction = 0;
  gameState.actionHistory.push({
    type: 'interact',
    hotspot: hotspot.name,
    frame: p.frameCount
  });
}

function handleExamine(hotspot) {
  hotspot.examined = true;
  showMessage(hotspot.data.description, 180);
  
  if (hotspot.data.clue && !gameState.puzzlesSolved.includes(hotspot.data.clue)) {
    gameState.puzzlesSolved.push(hotspot.data.clue);
    gameState.score += 15;
    showMessage(`${hotspot.data.description} [Clue discovered!]`, 180);
  }
}

function handleItemCollection(hotspot) {
  if (hotspot.collected) return;
  
  // Check requirements
  if (hotspot.data.requires) {
    if (!gameState.puzzlesSolved.includes(hotspot.data.requires)) {
      showMessage("You need more information before taking this.", 120);
      return;
    }
  }
  
  hotspot.collected = true;
  gameState.player.addToInventory(hotspot.data.itemId, hotspot.data.description);
  showMessage(`Collected: ${hotspot.name}`, 120);
}

function handleUseHotspot(hotspot, locations) {
  if (hotspot.solved) return;
  
  // Check if player has required items
  if (hotspot.data.solution) {
    const hasAllItems = hotspot.data.solution.every(itemId => 
      gameState.player.hasItem(itemId) || gameState.puzzlesSolved.includes(itemId)
    );
    
    if (!hasAllItems) {
      showMessage("You need the right items or knowledge to solve this.", 140);
      return;
    }
    
    // Solve the puzzle
    hotspot.solved = true;
    gameState.score += 50;
    showMessage("Puzzle solved!", 120);
    
    // Check for win condition
    if (hotspot.data.winCondition) {
      gameState.gamePhase = PHASE_GAME_OVER_WIN;
      gameState.score += 100;
      return;
    }
    
    // Handle location transition if specified
    if (hotspot.data.targetLocation !== undefined) {
      setTimeout(() => {
        gameState.currentLocation = hotspot.data.targetLocation;
        gameState.selectedHotspot = 0;
        showMessage(`Entering: ${locations[hotspot.data.targetLocation].name}`, 120);
      }, 1000);
    }
  }
}

function handleExit(hotspot, locations) {
  // Check requirements
  if (hotspot.data.requires) {
    if (!gameState.player.hasItem(hotspot.data.requires)) {
      showMessage(`You need: ${hotspot.data.requires.replace(/_/g, ' ')}`, 120);
      return;
    }
  }
  
  gameState.currentLocation = hotspot.data.targetLocation;
  gameState.selectedHotspot = 0;
  showMessage(`Entering: ${locations[hotspot.data.targetLocation].name}`, 120);
}

function handleDialogue(hotspot) {
  if (!hotspot.data.dialogue || hotspot.data.dialogue.length === 0) return;
  
  // Simple dialogue: just process the first available option
  for (let option of hotspot.data.dialogue) {
    if (option.requires && !gameState.puzzlesSolved.includes(option.requires)) {
      continue;
    }
    
    showMessage(option.text, 180);
    
    if (option.response && !gameState.puzzlesSolved.includes(option.response)) {
      gameState.puzzlesSolved.push(option.response);
      gameState.score += 20;
    }
    break;
  }
}

export function handleInventoryUse(locations) {
  if (gameState.selectedInventoryItem < 0 || gameState.selectedInventoryItem >= gameState.inventory.length) {
    return;
  }
  
  const item = gameState.inventory[gameState.selectedInventoryItem];
  const location = locations[gameState.currentLocation];
  
  // Try to use item on current location
  showMessage(`Using ${item.id.replace(/_/g, ' ')}...`, 90);
  
  // Check if item can be used on any hotspot
  let used = false;
  for (let hotspot of location.hotspots) {
    if (hotspot.type === 'use' && !hotspot.solved) {
      if (hotspot.data.solution && hotspot.data.solution.includes(item.id)) {
        showMessage(`${item.id.replace(/_/g, ' ')} might be useful here.`, 120);
        used = true;
        break;
      }
    }
  }
  
  if (!used) {
    showMessage("That doesn't work here.", 90);
  }
}

export function handleInventoryCombine() {
  if (gameState.selectedInventoryItem < 0 || gameState.selectedInventoryItem >= gameState.inventory.length) {
    showMessage("Select an item first.", 90);
    return;
  }
  
  // For simplicity, try to combine with the next item
  const nextIndex = (gameState.selectedInventoryItem + 1) % gameState.inventory.length;
  if (nextIndex === gameState.selectedInventoryItem || gameState.inventory.length < 2) {
    showMessage("Need two items to combine.", 90);
    return;
  }
  
  const item1 = gameState.inventory[gameState.selectedInventoryItem];
  const item2 = gameState.inventory[nextIndex];
  
  const result = combineItems(item1.id, item2.id);
  
  if (result) {
    // Remove old items
    for (let itemId of result.remove) {
      gameState.player.removeFromInventory(itemId);
    }
    
    // Add new item
    gameState.player.addToInventory(result.result, result.description);
    showMessage(`Combined items! Created: ${result.result.replace(/_/g, ' ')}`, 150);
    gameState.selectedInventoryItem = -1;
    gameState.score += 25;
  } else {
    showMessage("These items don't combine.", 90);
  }
}

export function navigateHotspots(direction, locations) {
  const location = locations[gameState.currentLocation];
  const available = getAvailableHotspots(location);
  
  if (available.length === 0) return;
  
  const currentIndex = available.indexOf(gameState.selectedHotspot);
  let newIndex;
  
  if (direction === 'next') {
    newIndex = (currentIndex + 1) % available.length;
  } else {
    newIndex = (currentIndex - 1 + available.length) % available.length;
  }
  
  gameState.selectedHotspot = available[newIndex];
}

export function navigateInventory(direction) {
  if (gameState.inventory.length === 0) return;
  
  if (gameState.selectedInventoryItem < 0) {
    gameState.selectedInventoryItem = 0;
    return;
  }
  
  if (direction === 'next') {
    gameState.selectedInventoryItem = (gameState.selectedInventoryItem + 1) % gameState.inventory.length;
  } else {
    gameState.selectedInventoryItem = (gameState.selectedInventoryItem - 1 + gameState.inventory.length) % gameState.inventory.length;
  }
}