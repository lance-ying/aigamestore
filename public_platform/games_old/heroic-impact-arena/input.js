// input.js - Input handling

import { gameState, GAME_PHASE, PLAYER_MODE, TURN_PHASE } from './globals.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Handle control mode switching (bypass game phases)
  if (keyCode === 82 && gameState.gamePhase === GAME_PHASE.GAME_OVER_WIN || 
      keyCode === 82 && gameState.gamePhase === GAME_PHASE.GAME_OVER_LOSE) {
    return { action: 'RESTART' };
  }
  
  if (keyCode === 13 && gameState.gamePhase === GAME_PHASE.START) {
    return { action: 'START_GAME' };
  }
  
  if (keyCode === 27 && (gameState.gamePhase === GAME_PHASE.PLAYING || gameState.gamePhase === GAME_PHASE.PAUSED)) {
    return { action: 'TOGGLE_PAUSE' };
  }
  
  if (gameState.gamePhase !== GAME_PHASE.PLAYING) {
    return null;
  }
  
  if (gameState.activeTurn !== TURN_PHASE.PLAYER) {
    return null;
  }
  
  // Player turn input handling
  if (gameState.playerMode === PLAYER_MODE.CHARACTER_SELECT) {
    return handleCharacterSelectInput(keyCode);
  } else if (gameState.playerMode === PLAYER_MODE.ABILITY_SELECT) {
    return handleAbilitySelectInput(keyCode);
  } else if (gameState.playerMode === PLAYER_MODE.TARGET_SELECT) {
    return handleTargetSelectInput(keyCode);
  }
  
  return null;
}

function handleCharacterSelectInput(keyCode) {
  const livingHeroes = gameState.playerCharacters.filter(c => !c.isDefeated && !c.hasActed);
  
  if (keyCode === 37) { // Left
    do {
      gameState.currentSelectedCharacterIndex = 
        (gameState.currentSelectedCharacterIndex - 1 + gameState.playerCharacters.length) % 
        gameState.playerCharacters.length;
    } while (gameState.playerCharacters[gameState.currentSelectedCharacterIndex].isDefeated || 
             gameState.playerCharacters[gameState.currentSelectedCharacterIndex].hasActed);
    return { action: 'SELECT_PREV_CHARACTER' };
  } else if (keyCode === 39) { // Right
    do {
      gameState.currentSelectedCharacterIndex = 
        (gameState.currentSelectedCharacterIndex + 1) % gameState.playerCharacters.length;
    } while (gameState.playerCharacters[gameState.currentSelectedCharacterIndex].isDefeated || 
             gameState.playerCharacters[gameState.currentSelectedCharacterIndex].hasActed);
    return { action: 'SELECT_NEXT_CHARACTER' };
  } else if (keyCode === 32) { // Space
    return { action: 'CONFIRM_CHARACTER' };
  } else if (keyCode === 16) { // Shift
    return { action: 'END_TURN' };
  }
  
  return null;
}

function handleAbilitySelectInput(keyCode) {
  const char = gameState.playerCharacters[gameState.currentActingHeroIndex];
  
  if (keyCode === 38) { // Up
    do {
      gameState.currentSelectedAbilityIndex = 
        (gameState.currentSelectedAbilityIndex - 1 + char.abilities.length) % char.abilities.length;
    } while (!char.abilities[gameState.currentSelectedAbilityIndex].isAvailable());
    return { action: 'SELECT_PREV_ABILITY' };
  } else if (keyCode === 40) { // Down
    do {
      gameState.currentSelectedAbilityIndex = 
        (gameState.currentSelectedAbilityIndex + 1) % char.abilities.length;
    } while (!char.abilities[gameState.currentSelectedAbilityIndex].isAvailable());
    return { action: 'SELECT_NEXT_ABILITY' };
  } else if (keyCode === 32) { // Space
    return { action: 'CONFIRM_ABILITY' };
  } else if (keyCode === 90) { // Z
    return { action: 'CANCEL_ABILITY' };
  }
  
  return null;
}

function handleTargetSelectInput(keyCode) {
  const livingEnemies = gameState.enemyCharacters.filter(e => !e.isDefeated);
  
  if (keyCode === 37) { // Left
    do {
      gameState.currentSelectedTargetIndex = 
        (gameState.currentSelectedTargetIndex - 1 + gameState.enemyCharacters.length) % 
        gameState.enemyCharacters.length;
    } while (gameState.enemyCharacters[gameState.currentSelectedTargetIndex].isDefeated);
    return { action: 'SELECT_PREV_TARGET' };
  } else if (keyCode === 39) { // Right
    do {
      gameState.currentSelectedTargetIndex = 
        (gameState.currentSelectedTargetIndex + 1) % gameState.enemyCharacters.length;
    } while (gameState.enemyCharacters[gameState.currentSelectedTargetIndex].isDefeated);
    return { action: 'SELECT_NEXT_TARGET' };
  } else if (keyCode === 32) { // Space
    return { action: 'CONFIRM_TARGET' };
  } else if (keyCode === 90) { // Z
    return { action: 'CANCEL_TARGET' };
  }
  
  return null;
}