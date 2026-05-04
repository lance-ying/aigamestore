// input_handler.js - Input handling

import { gameState, GAME_PHASES, COMBAT_PHASES } from './globals.js';
import { playCard, executeEnemyTurn, checkCombatEnd } from './combat.js';
import { endTurn, drawCards } from './card_system.js';
import { startGame, restartGame } from './game.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Game phase transitions
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      startGame(p);
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
      restartGame(p);
    }
    return;
  }
  
  // Gameplay inputs
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  if (gameState.combatPhase === COMBAT_PHASES.SELECT_CARD) {
    handleCardSelectionInput(p, keyCode);
  } else if (gameState.combatPhase === COMBAT_PHASES.SELECT_TARGET) {
    handleTargetSelectionInput(p, keyCode);
  } else if (gameState.combatPhase === COMBAT_PHASES.REWARD) {
    handleRewardInput(p, keyCode);
  }
}

function handleCardSelectionInput(p, keyCode) {
  if (keyCode === 37) { // LEFT
    gameState.selectedCardIndex = Math.max(0, gameState.selectedCardIndex - 1);
  } else if (keyCode === 39) { // RIGHT
    gameState.selectedCardIndex = Math.min(gameState.hand.length - 1, gameState.selectedCardIndex + 1);
  } else if (keyCode === 32) { // SPACE
    if (gameState.hand.length > 0) {
      // Find valid target
      gameState.selectedTargetIndex = 0;
      const aliveEnemies = gameState.enemies.filter(e => e.hp > 0);
      if (aliveEnemies.length > 0) {
        gameState.selectedTargetIndex = gameState.enemies.indexOf(aliveEnemies[0]);
        gameState.combatPhase = COMBAT_PHASES.SELECT_TARGET;
      }
    }
  }
}

function handleTargetSelectionInput(p, keyCode) {
  const aliveEnemies = gameState.enemies.filter(e => e.hp > 0);
  
  if (keyCode === 37 || keyCode === 38) { // LEFT or UP
    let newIndex = gameState.selectedTargetIndex - 1;
    if (newIndex < 0) newIndex = gameState.enemies.length - 1;
    
    while (newIndex !== gameState.selectedTargetIndex && 
           (newIndex < 0 || gameState.enemies[newIndex].hp <= 0)) {
      newIndex--;
      if (newIndex < 0) newIndex = gameState.enemies.length - 1;
    }
    
    if (gameState.enemies[newIndex].hp > 0) {
      gameState.selectedTargetIndex = newIndex;
    }
  } else if (keyCode === 39 || keyCode === 40) { // RIGHT or DOWN
    let newIndex = gameState.selectedTargetIndex + 1;
    if (newIndex >= gameState.enemies.length) newIndex = 0;
    
    while (newIndex !== gameState.selectedTargetIndex && 
           (newIndex >= gameState.enemies.length || gameState.enemies[newIndex].hp <= 0)) {
      newIndex++;
      if (newIndex >= gameState.enemies.length) newIndex = 0;
    }
    
    if (gameState.enemies[newIndex].hp > 0) {
      gameState.selectedTargetIndex = newIndex;
    }
  } else if (keyCode === 32) { // SPACE - confirm
    if (playCard(gameState.selectedCardIndex)) {
      gameState.combatPhase = COMBAT_PHASES.ANIMATING;
      gameState.animationTimer = 40;
    }
  } else if (keyCode === 90) { // Z - cancel
    gameState.combatPhase = COMBAT_PHASES.SELECT_CARD;
  }
}

function handleRewardInput(p, keyCode) {
  if (keyCode === 37) { // LEFT
    gameState.selectedRewardIndex = Math.max(0, gameState.selectedRewardIndex - 1);
  } else if (keyCode === 39) { // RIGHT
    gameState.selectedRewardIndex = Math.min(2, gameState.selectedRewardIndex + 1);
  } else if (keyCode === 32) { // SPACE
    const selectedCard = gameState.rewardCards[gameState.selectedRewardIndex];
    gameState.player.masterDeck.push(selectedCard);
    
    // Advance to next floor
    import('./game.js').then(module => {
      module.advanceFloor(p);
    });
  }
}