// game_logic.js - Core game logic and systems

import { gameState, GAME_PHASE } from './globals.js';

export function updateGameLogic(p) {
  // Update day counter
  gameState.framesSinceDay++;
  if (gameState.framesSinceDay >= gameState.framesPerDay) {
    gameState.framesSinceDay = 0;
    gameState.daysSurvived++;
    gameState.score += 100;
    
    // Increase difficulty
    gameState.hungerDecay += 0.001;
    gameState.sanityDecay += 0.001;
  }
  
  // Degrade resources
  gameState.hunger = Math.max(0, gameState.hunger - gameState.hungerDecay);
  gameState.sanity = Math.max(0, gameState.sanity - gameState.sanityDecay);
  gameState.power = Math.max(0, gameState.power - gameState.powerDecay);
  
  // Health affected by hunger
  if (gameState.hunger < 20) {
    gameState.health -= 0.05;
  }
  
  // Sanity affects hallucinations
  gameState.hallucinationIntensity = Math.max(0, 100 - gameState.sanity);
  gameState.hallucinationTimer++;
  
  // Status display timer
  if (gameState.showStatus) {
    gameState.statusTimer--;
    if (gameState.statusTimer <= 0) {
      gameState.showStatus = false;
    }
  }
  
  // Update entities
  if (gameState.player) {
    gameState.player.update();
  }
  
  for (let interactable of gameState.interactables) {
    interactable.update();
  }
  
  // Check game over conditions
  checkGameOver(p);
}

export function checkGameOver(p) {
  if (gameState.health <= 0) {
    gameState.gamePhase = GAME_PHASE.GAME_OVER_LOSE;
    gameState.gameOverReason = "You succumbed to starvation and exhaustion.";
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_LOSE", reason: "health" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else if (gameState.sanity <= 0) {
    gameState.gamePhase = GAME_PHASE.GAME_OVER_LOSE;
    gameState.gameOverReason = "The isolation consumed your mind.";
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_LOSE", reason: "sanity" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else if (gameState.power <= 0) {
    gameState.gamePhase = GAME_PHASE.GAME_OVER_LOSE;
    gameState.gameOverReason = "The ship's systems failed completely.";
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_LOSE", reason: "power" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else if (gameState.daysSurvived >= 50) {
    // Win condition (nearly impossible)
    gameState.gamePhase = GAME_PHASE.GAME_OVER_WIN;
    gameState.gameOverReason = "Against all odds, you survived 50 days.";
    gameState.score += 5000;
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_WIN" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function handleInteraction(p) {
  if (!gameState.player) return;
  
  for (let interactable of gameState.interactables) {
    if (interactable.canInteract(gameState.player)) {
      const success = interactable.interact();
      if (success) {
        gameState.score += 10;
      }
      break; // Only interact with one object at a time
    }
  }
}