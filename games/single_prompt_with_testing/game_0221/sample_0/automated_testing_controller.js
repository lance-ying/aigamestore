// automated_testing_controller.js - Automated testing logic

import { gameState } from './globals.js';

// TEST_1: Basic movement and NPC interaction testing
function getTest1Action() {
  if (!gameState.player) return null;
  
  // Systematic exploration pattern
  const targetNPCIndex = Math.floor(gameState.frameCount / 180) % gameState.npcs.length;
  
  if (gameState.npcs.length > 0 && targetNPCIndex < gameState.npcs.length) {
    const targetNPC = gameState.npcs[targetNPCIndex];
    const dx = targetNPC.x - gameState.player.x;
    const dy = targetNPC.y - gameState.player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Move toward NPC
    if (distance > 50) {
      if (Math.abs(dx) > Math.abs(dy)) {
        return { keyCode: dx > 0 ? 39 : 37 }; // Right or Left
      } else {
        return { keyCode: dy > 0 ? 40 : 38 }; // Down or Up
      }
    } else {
      // Close enough - interact
      if (gameState.frameCount % 60 === 0) {
        return { keyCode: 32 }; // Space to interact
      }
    }
  }
  
  // Random exploration when no specific target
  if (gameState.frameCount % 90 === 0) {
    const actions = [37, 38, 39, 40];
    return { keyCode: actions[Math.floor(Math.random() * actions.length)] };
  }
  
  return null;
}

// TEST_2: Optimal tablet collection to win
function getTest2WinAction() {
  if (!gameState.player) return null;
  
  // Priority: collect nearest tablet
  if (gameState.tablets.length > 0) {
    let nearest = gameState.tablets[0];
    let nearestDist = Infinity;
    
    for (const tablet of gameState.tablets) {
      const dx = tablet.x - gameState.player.x;
      const dy = tablet.y - gameState.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < nearestDist) {
        nearest = tablet;
        nearestDist = dist;
      }
    }
    
    const dx = nearest.x - gameState.player.x;
    const dy = nearest.y - gameState.player.y;
    
    // Move toward nearest tablet
    if (nearestDist > 30) {
      // Use shift for sprint
      if (gameState.frameCount % 2 === 0) {
        if (Math.abs(dx) > Math.abs(dy)) {
          return { keyCode: dx > 0 ? 39 : 37, shift: true }; // Right or Left + sprint
        } else {
          return { keyCode: dy > 0 ? 40 : 38, shift: true }; // Down or Up + sprint
        }
      } else {
        return { keyCode: 16 }; // Hold shift
      }
    } else {
      // Close enough - try to collect
      if (gameState.frameCount % 10 === 0) {
        return { keyCode: 32 }; // Space to collect
      }
    }
  }
  
  // If no tablets, talk to NPCs for clues
  if (gameState.npcs.length > 0 && gameState.cluesFound.length < 8) {
    const untouchedNPCs = gameState.npcs.filter(npc => !npc.hasSpoken);
    if (untouchedNPCs.length > 0) {
      const targetNPC = untouchedNPCs[0];
      const dx = targetNPC.x - gameState.player.x;
      const dy = targetNPC.y - gameState.player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 50) {
        if (Math.abs(dx) > Math.abs(dy)) {
          return { keyCode: dx > 0 ? 39 : 37 };
        } else {
          return { keyCode: dy > 0 ? 40 : 38 };
        }
      } else {
        if (gameState.frameCount % 30 === 0) {
          return { keyCode: 32 }; // Interact
        }
      }
    }
  }
  
  return null;
}

export function get_automated_testing_action(state) {
  switch (state.controlMode) {
    case "TEST_1":
      return getTest1Action();
    case "TEST_2":
      return getTest2WinAction();
    default:
      return null;
  }
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;