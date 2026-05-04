// automated_testing_controller.js - Automated testing

import { gameState } from './globals.js';
import { KEY_SPACE, KEY_LEFT, KEY_RIGHT, KEY_Z, KEY_SHIFT } from './globals.js';
import { ROOM_DEFINITIONS } from './room_data.js';

let testState = {
  phase: 'exploring',
  visitedHotspots: new Set(),
  lastHotspot: -1,
  actionCounter: 0,
  stuckCounter: 0,
  lastRoomChange: 0
};

function getTestWinAction(gameState) {
  testState.actionCounter++;

  // Optimal strategy to win: systematically explore and solve puzzles
  const currentRoom = gameState.rooms[gameState.currentRoom];
  if (!currentRoom) return { keyPressed: KEY_RIGHT };

  const numHotspots = currentRoom.hotspots.length;
  const currentHotspot = gameState.currentHotspot;

  // Check if stuck
  if (testState.lastRoomChange === gameState.currentRoom &&
      testState.lastHotspot === currentHotspot &&
      testState.actionCounter % 20 === 0) {
    testState.stuckCounter++;
  } else {
    testState.stuckCounter = 0;
  }

  testState.lastHotspot = currentHotspot;
  testState.lastRoomChange = gameState.currentRoom;

  // If stuck, try different approach
  if (testState.stuckCounter > 5) {
    testState.stuckCounter = 0;
    // Open inventory and try to select an item
    if (!gameState.showInventory && gameState.inventory.length > 0) {
      return { keyPressed: KEY_Z };
    }
    if (gameState.showInventory) {
      return { keyPressed: KEY_SPACE };
    }
  }

  // Strategy: Explore all hotspots, collect items, solve puzzles
  const hotspotKey = `${gameState.currentRoom}_${currentHotspot}`;

  // If inventory is open, select an item
  if (gameState.showInventory) {
    if (gameState.inventoryIndex < gameState.inventory.length - 1 && testState.actionCounter % 10 < 5) {
      return { keyPressed: KEY_RIGHT };
    }
    return { keyPressed: KEY_SPACE };
  }

  // Check current hotspot
  const hotspot = currentRoom.hotspots[currentHotspot];
  
  // Priority 1: Collect items
  if (hotspot.type === 'item' && !gameState.collectedItems.has(hotspot.item)) {
    return { keyPressed: KEY_SPACE };
  }

  // Priority 2: Examine objects for clues
  if (hotspot.type === 'examine' && !testState.visitedHotspots.has(hotspotKey)) {
    testState.visitedHotspots.add(hotspotKey);
    return { keyPressed: KEY_SPACE };
  }

  // Priority 3: Try to solve puzzles
  if ((hotspot.type === 'puzzle' || hotspot.type === 'combine') && 
      !gameState.solvedPuzzles.has(`room${gameState.currentRoom}_${hotspot.type}${hotspot.puzzleId || currentHotspot}`)) {
    return { keyPressed: KEY_SPACE };
  }

  // Priority 4: Try to unlock doors
  if (hotspot.type === 'door') {
    if (hotspot.locked && gameState.inventory.length > 0) {
      // Try to open inventory to select key
      if (!gameState.selectedItem) {
        return { keyPressed: KEY_Z };
      }
      // Try to use item on door
      return { keyPressed: KEY_SPACE };
    } else if (!hotspot.locked) {
      // Enter the room
      return { keyPressed: KEY_SPACE };
    }
  }

  // Default: Navigate to next hotspot
  if (testState.actionCounter % 3 === 0) {
    return { keyPressed: KEY_RIGHT };
  } else if (testState.actionCounter % 3 === 1) {
    return { keyPressed: KEY_LEFT };
  } else {
    return { keyPressed: KEY_SPACE };
  }
}

function getBasicTestAction(gameState) {
  // Test basic movement and interaction
  const actions = [KEY_RIGHT, KEY_SPACE, KEY_LEFT, KEY_SPACE, KEY_Z];
  const actionIndex = Math.floor(Date.now() / 500) % actions.length;
  return { keyPressed: actions[actionIndex] };
}

function getRandomAction(gameState) {
  const actions = [KEY_LEFT, KEY_RIGHT, KEY_SPACE, KEY_Z];
  const randomIndex = Math.floor(Math.random() * actions.length);
  return { keyPressed: actions[randomIndex] };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;