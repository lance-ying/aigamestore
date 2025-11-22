// input_handler.js - Input handling for human and automated testing

import { gameState, GAME_PHASES, PLAYER_SPEED, PLAYER_SPRINT_SPEED } from './globals.js';
import { initializeGame, checkInteractions, interactWithCharacter, collectIngredient, tryToCook, checkWinCondition, updateMiniGame } from './game_logic.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Global controls
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      initializeGame(p);
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: "PLAYING" },
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
        data: { phase: "PAUSED" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      gameState.gamePhase = GAME_PHASES.START;
      p.logs.game_info.push({
        data: { phase: "START" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  // Gameplay controls
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    // Cooking menu toggle
    if (keyCode === 90) { // Z
      const interaction = checkInteractions(p, gameState.player);
      if (interaction && interaction.type === 'cooking_station') {
        gameState.showCookingMenu = !gameState.showCookingMenu;
      }
      return;
    }
    
    // Space for interactions
    if (keyCode === 32) { // SPACE
      if (gameState.showCookingMenu) {
        // Try to cook
        const success = tryToCook(p);
        if (success) {
          // Check win condition
          if (checkWinCondition()) {
            gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
            p.logs.game_info.push({
              data: { phase: "GAME_OVER_WIN" },
              framecount: p.frameCount,
              timestamp: Date.now()
            });
          }
        }
      } else if (gameState.miniGameActive) {
        // Mini-game interaction
      } else {
        // Normal interaction
        const interaction = checkInteractions(p, gameState.player);
        if (interaction) {
          if (interaction.type === 'character') {
            interactWithCharacter(interaction.target);
          } else if (interaction.type === 'ingredient') {
            collectIngredient(interaction.target);
          }
        }
      }
    }
  }
}

export function getMovementInput(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return { vx: 0, vy: 0, sprint: false };
  }
  
  if (gameState.showCookingMenu) {
    return { vx: 0, vy: 0, sprint: false };
  }
  
  if (gameState.miniGameActive) {
    // Mini-game controls
    if (gameState.miniGameType === "berry_catch") {
      let dx = 0;
      if (p.keyIsDown(37)) dx = -4; // LEFT
      if (p.keyIsDown(39)) dx = 4;  // RIGHT
      
      if (gameState.miniGameData) {
        gameState.miniGameData.basketX += dx;
        gameState.miniGameData.basketX = Math.max(40, Math.min(560, gameState.miniGameData.basketX));
      }
    }
    return { vx: 0, vy: 0, sprint: false };
  }
  
  let vx = 0;
  let vy = 0;
  let sprint = false;
  
  if (p.keyIsDown(37)) vx = -1; // LEFT
  if (p.keyIsDown(39)) vx = 1;  // RIGHT
  if (p.keyIsDown(38)) vy = -1; // UP
  if (p.keyIsDown(40)) vy = 1;  // DOWN
  if (p.keyIsDown(16)) sprint = true; // SHIFT
  
  // Normalize diagonal movement
  if (vx !== 0 && vy !== 0) {
    const mag = Math.sqrt(vx * vx + vy * vy);
    vx /= mag;
    vy /= mag;
  }
  
  return { vx, vy, sprint };
}