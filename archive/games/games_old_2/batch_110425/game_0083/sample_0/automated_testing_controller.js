// automated_testing_controller.js - Automated testing AI

import { gameState } from './globals.js';

function getTestWinAction(gameState) {
  // Strategy: Efficiently interact with all NPCs and solve all puzzles to reach 100%
  
  const player = gameState.player;
  if (!player) return getRandomAction(gameState);
  
  // Priority 1: Complete active dialogue
  if (gameState.activeDialogue) {
    // Always use arrow down and confirm after a delay
    if (gameState.activeDialogue.choices && gameState.activeDialogue.choices.length > 0) {
      return {
        up: false,
        down: Math.random() < 0.3,
        left: false,
        right: false,
        interact: false,
        confirm: Math.random() < 0.4
      };
    } else {
      return {
        up: false,
        down: false,
        left: false,
        right: false,
        interact: false,
        confirm: true
      };
    }
  }
  
  // Priority 2: Complete active puzzle
  const activePuzzle = gameState.interactables.find(i => i.active);
  if (activePuzzle) {
    return {
      up: Math.random() < 0.2,
      down: Math.random() < 0.3,
      left: false,
      right: false,
      interact: false,
      confirm: Math.random() < 0.5
    };
  }
  
  // Priority 3: Find and interact with nearest uninteracted NPC
  const uninteractedNPCs = gameState.npcs.filter(npc => !npc.hasInteracted || npc.interactionCount < 3);
  if (uninteractedNPCs.length > 0) {
    const target = findNearest(player, uninteractedNPCs);
    return moveTowardsAndInteract(player, target);
  }
  
  // Priority 4: Find and solve unsolved puzzles
  const unsolvedPuzzles = gameState.interactables.filter(i => !i.solved);
  if (unsolvedPuzzles.length > 0) {
    const target = findNearest(player, unsolvedPuzzles);
    return moveTowardsAndInteract(player, target);
  }
  
  // Priority 5: Re-interact with NPCs for more dialogue
  if (gameState.npcs.length > 0) {
    const target = findNearest(player, gameState.npcs);
    return moveTowardsAndInteract(player, target);
  }
  
  // Fallback: explore
  return getExplorationAction(gameState);
}

function getTestBasicAction(gameState) {
  // Basic movement and interaction testing
  const player = gameState.player;
  if (!player) return getRandomAction(gameState);
  
  // Handle active states
  if (gameState.activeDialogue) {
    return { up: false, down: false, left: false, right: false, interact: false, confirm: true };
  }
  
  const activePuzzle = gameState.interactables.find(i => i.active);
  if (activePuzzle) {
    return { up: false, down: true, left: false, right: false, interact: false, confirm: Math.random() < 0.3 };
  }
  
  // Systematic exploration pattern
  const frame = gameState.player.x + gameState.player.y;
  const pattern = Math.floor(frame / 100) % 4;
  
  switch(pattern) {
    case 0: return { up: false, down: false, left: false, right: true, interact: false, confirm: false };
    case 1: return { up: false, down: true, left: false, right: false, interact: false, confirm: false };
    case 2: return { up: false, down: false, left: true, right: false, interact: false, confirm: false };
    case 3: return { up: true, down: false, left: false, right: false, interact: false, confirm: false };
  }
  
  return getRandomAction(gameState);
}

function getTestVarietyAction(gameState) {
  // Test interaction variety with randomized choices
  const player = gameState.player;
  if (!player) return getRandomAction(gameState);
  
  // Handle dialogues with variety
  if (gameState.activeDialogue) {
    if (gameState.activeDialogue.choices && gameState.activeDialogue.choices.length > 0) {
      // Randomize choices
      const moveChoice = Math.random();
      return {
        up: moveChoice < 0.3,
        down: moveChoice > 0.7,
        left: false,
        right: false,
        interact: false,
        confirm: Math.random() < 0.4
      };
    }
    return { up: false, down: false, left: false, right: false, interact: false, confirm: true };
  }
  
  // Interact with various entities
  const allInteractables = [...gameState.npcs, ...gameState.interactables];
  if (allInteractables.length > 0) {
    const target = allInteractables[Math.floor(Math.random() * allInteractables.length)];
    const action = moveTowardsAndInteract(player, target);
    action.interact = Math.random() < 0.1; // Occasional interactions
    return action;
  }
  
  return getRandomAction(gameState);
}

function findNearest(player, entities) {
  let nearest = entities[0];
  let minDist = Infinity;
  
  for (const entity of entities) {
    const dist = Math.hypot(entity.x - player.x, entity.y - player.y);
    if (dist < minDist) {
      minDist = dist;
      nearest = entity;
    }
  }
  
  return nearest;
}

function moveTowardsAndInteract(player, target) {
  const dx = target.x - player.x;
  const dy = target.y - player.y;
  const dist = Math.hypot(dx, dy);
  
  // If close enough, interact
  if (dist < 60) {
    return {
      up: false,
      down: false,
      left: false,
      right: false,
      interact: true,
      confirm: false
    };
  }
  
  // Move towards target
  const threshold = 0.3;
  return {
    up: dy < -threshold,
    down: dy > threshold,
    left: dx < -threshold,
    right: dx > threshold,
    interact: false,
    confirm: false
  };
}

function getExplorationAction(gameState) {
  const player = gameState.player;
  if (!player) return getRandomAction(gameState);
  
  // Explore towards center if near edges
  const centerX = 300;
  const centerY = 200;
  const toCenter = Math.hypot(centerX - player.x, centerY - player.y) > 150;
  
  if (toCenter) {
    return {
      up: player.y > centerY,
      down: player.y < centerY,
      left: player.x > centerX,
      right: player.x < centerX,
      interact: Math.random() < 0.05,
      confirm: false
    };
  }
  
  // Random exploration
  return getRandomAction(gameState);
}

function getRandomAction(gameState) {
  const r = Math.random();
  return {
    up: r < 0.25,
    down: r >= 0.25 && r < 0.5,
    left: r >= 0.5 && r < 0.75,
    right: r >= 0.75,
    interact: Math.random() < 0.05,
    confirm: Math.random() < 0.05
  };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestVarietyAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;