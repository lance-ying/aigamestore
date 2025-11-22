// automated_testing_controller.js - Automated testing functions
import { gameState, KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_DOWN, KEY_SPACE } from './globals.js';

class TestingHelper {
  constructor() {
    this.actionHistory = [];
    this.stuckCounter = 0;
    this.lastPosition = { x: 0, y: 0 };
  }

  isStuck(player) {
    if (!player) return false;
    
    const dist = Math.abs(player.x - this.lastPosition.x) + Math.abs(player.y - this.lastPosition.y);
    if (dist < 2) {
      this.stuckCounter++;
    } else {
      this.stuckCounter = 0;
    }
    
    this.lastPosition = { x: player.x, y: player.y };
    return this.stuckCounter > 60;
  }

  findNearestItem(player, items) {
    let nearest = null;
    let minDist = Infinity;
    
    for (let item of items) {
      if (!item.collected) {
        const dist = Math.abs(item.x - player.x) + Math.abs(item.y - player.y);
        if (dist < minDist) {
          minDist = dist;
          nearest = item;
        }
      }
    }
    
    return nearest;
  }

  findNearestInteractable(player, interactables) {
    let nearest = null;
    let minDist = Infinity;
    
    for (let obj of interactables) {
      if (obj.locked || !obj.activated) {
        const dist = Math.abs(obj.x - player.x) + Math.abs(obj.y - player.y);
        if (dist < minDist) {
          minDist = dist;
          nearest = obj;
        }
      }
    }
    
    return nearest;
  }

  moveTowards(player, targetX, targetY) {
    const keys = [];
    
    const dx = targetX - player.x;
    const dy = targetY - player.y;
    
    if (Math.abs(dx) > 20) {
      keys.push(dx > 0 ? KEY_RIGHT : KEY_LEFT);
    }
    
    if (player.onLadder) {
      if (Math.abs(dy) > 20) {
        keys.push(dy > 0 ? KEY_DOWN : KEY_UP);
      }
    }
    
    return keys;
  }
}

const testHelper = new TestingHelper();

function getTestWinAction(state) {
  const player = state.player;
  if (!player) return [];
  
  const actions = [];
  
  // Strategy: Collect items, solve puzzles in order, progress through floors
  
  // First priority: Collect nearby items
  const nearestItem = testHelper.findNearestItem(player, state.items);
  if (nearestItem) {
    const moveKeys = testHelper.moveTowards(player, nearestItem.x, nearestItem.y);
    actions.push(...moveKeys);
    
    // If close enough to item, it will auto-collect
    const dist = Math.abs(nearestItem.x - player.x) + Math.abs(nearestItem.y - player.y);
    if (dist < 50) {
      return actions; // Moving towards it
    }
  }
  
  // Second priority: Interact with objects
  const nearestInteractable = testHelper.findNearestInteractable(player, state.interactables);
  if (nearestInteractable) {
    const moveKeys = testHelper.moveTowards(player, nearestInteractable.x, nearestInteractable.y);
    actions.push(...moveKeys);
    
    const dist = Math.abs(nearestInteractable.x - player.x) + Math.abs(nearestInteractable.y - player.y);
    if (dist < 60) {
      actions.push(KEY_SPACE); // Interact
      return actions;
    }
  }
  
  // Third priority: Move towards unlocked doors
  for (let door of state.doors) {
    if (!door.locked) {
      const moveKeys = testHelper.moveTowards(player, door.x, door.y);
      actions.push(...moveKeys);
      return actions;
    }
  }
  
  // If stuck, try random movement
  if (testHelper.isStuck(player)) {
    const randomKey = [KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_DOWN][Math.floor(Math.random() * 4)];
    actions.push(randomKey);
  }
  
  return actions;
}

function getBasicTestAction(state) {
  const player = state.player;
  if (!player) return [];
  
  const actions = [];
  const frame = state.framesSinceLastAction || 0;
  
  // Simple movement pattern: explore the level
  if (frame < 60) {
    actions.push(KEY_RIGHT);
  } else if (frame < 120) {
    actions.push(KEY_LEFT);
  } else if (frame < 150) {
    actions.push(KEY_UP);
  } else if (frame < 180) {
    actions.push(KEY_SPACE);
  }
  
  return actions;
}

function getRandomAction(state) {
  const actions = [];
  if (Math.random() > 0.7) {
    const keys = [KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_DOWN, KEY_SPACE];
    actions.push(keys[Math.floor(Math.random() * keys.length)]);
  }
  return actions;
}

export function get_automated_testing_action(state) {
  switch (state.controlMode) {
    case "TEST_1":
      return getBasicTestAction(state);
    case "TEST_2":
      return getTestWinAction(state);
    default:
      return getRandomAction(state);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;