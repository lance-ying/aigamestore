// input.js - Input handling system

import { gameState, KEY_ENTER, KEY_ESC, KEY_R, KEY_SPACE, KEY_Z, logInput, logGameInfo } from './globals.js';
import { resetWorld } from './world.js';

export function handleKeyPress(p) {
  const keyCode = p.keyCode;
  gameState.keys[keyCode] = true;
  
  logInput(p, 'keyPressed', { key: p.key, keyCode: keyCode });
  
  // Phase control keys
  if (keyCode === KEY_ENTER) {
    if (gameState.gamePhase === "START") {
      gameState.gamePhase = "PLAYING";
      logGameInfo(p, { gamePhase: "PLAYING" });
    }
  }
  
  if (keyCode === KEY_ESC) {
    if (gameState.gamePhase === "PLAYING") {
      gameState.gamePhase = "PAUSED";
      logGameInfo(p, { gamePhase: "PAUSED" });
    } else if (gameState.gamePhase === "PAUSED") {
      gameState.gamePhase = "PLAYING";
      logGameInfo(p, { gamePhase: "PLAYING" });
    }
  }
  
  if (keyCode === KEY_R) {
    if (gameState.gamePhase === "GAME_OVER_WIN" || 
        gameState.gamePhase === "GAME_OVER_LOSE") {
      resetWorld();
      gameState.gamePhase = "START";
      logGameInfo(p, { gamePhase: "START", action: "restart" });
    }
  }
  
  // Gameplay keys
  if (gameState.gamePhase === "PLAYING") {
    if (keyCode === KEY_SPACE) {
      // Interaction key
      if (gameState.activeDialogue) {
        // Advance dialogue
        gameState.activeDialogue.lineIndex++;
        if (gameState.activeDialogue.lineIndex >= 1) {
          gameState.activeDialogue = null;
        }
      } else if (gameState.player) {
        // Try to interact with NPC or collect tablet
        const interacted = gameState.player.interactWithNearestNPC();
        if (!interacted) {
          gameState.player.collectNearestTablet();
        }
      }
    }
    
    if (keyCode === KEY_Z && gameState.timeLoopUnlocked) {
      // Manual time loop reset
      triggerTimeLoop(p);
    }
  }
}

export function handleKeyRelease(p) {
  const keyCode = p.keyCode;
  gameState.keys[keyCode] = false;
  
  logInput(p, 'keyReleased', { key: p.key, keyCode: keyCode });
}

function triggerTimeLoop(p) {
  gameState.loopCount++;
  gameState.curseTriggered = true;
  
  // Reset tablets but keep NPC knowledge
  const preservedKnowledge = { ...gameState.npcKnowledge };
  const preservedClues = [...gameState.cluesFound];
  
  resetWorld();
  
  gameState.npcKnowledge = preservedKnowledge;
  gameState.cluesFound = preservedClues;
  gameState.gamePhase = "PLAYING";
  
  logGameInfo(p, { action: "time_loop_reset", loopCount: gameState.loopCount });
}

// Unlock time loop ability after collecting enough tablets
export function checkTimeLoopUnlock() {
  if (gameState.tabletsCollected >= 3 && !gameState.timeLoopUnlocked) {
    gameState.timeLoopUnlocked = true;
  }
}