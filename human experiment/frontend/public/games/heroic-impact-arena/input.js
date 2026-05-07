// input.js - TAP-BASED INPUT HANDLING
// All controls use single discrete taps, no held keys required
// Each keypress triggers exactly ONE action with cooldown protection

import { gameState, GAME_PHASE, PLAYER_MODE, TURN_PHASE, INPUT_COOLDOWN_FRAMES } from './globals.js';

// Check if input is on cooldown to prevent key repeat from triggering multiple actions
function isInputOnCooldown(keyCode, currentFrame) {
  // If same key was pressed recently, ignore it (prevents OS key repeat)
  if (gameState.lastKeyPressed === keyCode && 
      currentFrame - gameState.lastKeyPressedFrame < INPUT_COOLDOWN_FRAMES) {
    return true;
  }
  return false;
}

// Update input cooldown state after accepting an input
function updateInputCooldown(keyCode, currentFrame) {
  gameState.lastKeyPressed = keyCode;
  gameState.lastKeyPressedFrame = currentFrame;
  gameState.inputCooldownActive = true;
}

export function handleKeyPressed(p, key, keyCode) {
  // Check input cooldown - prevents multiple actions from single held key
  if (isInputOnCooldown(keyCode, p.frameCount)) {
    return null; // Ignore this input, it's too soon after last press
  }
  
  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  let action = null;
  
  // Handle control mode switching (bypass game phases)
  if (keyCode === 82 && (gameState.gamePhase === GAME_PHASE.GAME_OVER_WIN || 
      gameState.gamePhase === GAME_PHASE.GAME_OVER_LOSE)) {
    action = { action: 'RESTART' };
  }
  else if (keyCode === 13 && gameState.gamePhase === GAME_PHASE.START) {
    action = { action: 'START_GAME' };
  }
  else if (keyCode === 27 && (gameState.gamePhase === GAME_PHASE.PLAYING || gameState.gamePhase === GAME_PHASE.PAUSED)) {
    action = { action: 'TOGGLE_PAUSE' };
  }
  else if (gameState.gamePhase === GAME_PHASE.PLAYING && gameState.activeTurn === TURN_PHASE.PLAYER) {
    // Player turn input handling
    if (gameState.playerMode === PLAYER_MODE.CHARACTER_SELECT) {
      action = handleCharacterSelectInput(keyCode);
    } else if (gameState.playerMode === PLAYER_MODE.ABILITY_SELECT) {
      action = handleAbilitySelectInput(keyCode);
    } else if (gameState.playerMode === PLAYER_MODE.TARGET_SELECT) {
      action = handleTargetSelectInput(keyCode);
    }
  }
  
  // Only update cooldown if a valid action was generated
  if (action) {
    updateInputCooldown(keyCode, p.frameCount);
  }
  
  return action;
}

// TAP-BASED: Single tap moves selection to previous available character
function handleCharacterSelectInput(keyCode) {
  const livingHeroes = gameState.playerCharacters.filter(c => !c.isDefeated && !c.hasActed);
  
  if (keyCode === 37) { // Left arrow - single tap moves left
    do {
      gameState.currentSelectedCharacterIndex = 
        (gameState.currentSelectedCharacterIndex - 1 + gameState.playerCharacters.length) % 
        gameState.playerCharacters.length;
    } while (gameState.playerCharacters[gameState.currentSelectedCharacterIndex].isDefeated || 
             gameState.playerCharacters[gameState.currentSelectedCharacterIndex].hasActed);
    return { action: 'SELECT_PREV_CHARACTER' };
  } else if (keyCode === 39) { // Right arrow - single tap moves right
    do {
      gameState.currentSelectedCharacterIndex = 
        (gameState.currentSelectedCharacterIndex + 1) % gameState.playerCharacters.length;
    } while (gameState.playerCharacters[gameState.currentSelectedCharacterIndex].isDefeated || 
             gameState.playerCharacters[gameState.currentSelectedCharacterIndex].hasActed);
    return { action: 'SELECT_NEXT_CHARACTER' };
  } else if (keyCode === 32) { // Space - single tap confirms
    return { action: 'CONFIRM_CHARACTER' };
  } else if (keyCode === 16) { // Shift - single tap ends turn
    return { action: 'END_TURN' };
  }
  
  return null;
}

// TAP-BASED: Single tap changes ability selection
function handleAbilitySelectInput(keyCode) {
  const char = gameState.playerCharacters[gameState.currentActingHeroIndex];
  
  if (keyCode === 38) { // Up arrow - single tap moves up
    do {
      gameState.currentSelectedAbilityIndex = 
        (gameState.currentSelectedAbilityIndex - 1 + char.abilities.length) % char.abilities.length;
    } while (!char.abilities[gameState.currentSelectedAbilityIndex].isAvailable());
    return { action: 'SELECT_PREV_ABILITY' };
  } else if (keyCode === 40) { // Down arrow - single tap moves down
    do {
      gameState.currentSelectedAbilityIndex = 
        (gameState.currentSelectedAbilityIndex + 1) % char.abilities.length;
    } while (!char.abilities[gameState.currentSelectedAbilityIndex].isAvailable());
    return { action: 'SELECT_NEXT_ABILITY' };
  } else if (keyCode === 32) { // Space - single tap confirms
    return { action: 'CONFIRM_ABILITY' };
  } else if (keyCode === 90) { // Z - single tap cancels
    return { action: 'CANCEL_ABILITY' };
  }
  
  return null;
}

// TAP-BASED: Single tap changes target selection
function handleTargetSelectInput(keyCode) {
  const livingEnemies = gameState.enemyCharacters.filter(e => !e.isDefeated);
  
  if (keyCode === 37) { // Left arrow - single tap moves left
    do {
      gameState.currentSelectedTargetIndex = 
        (gameState.currentSelectedTargetIndex - 1 + gameState.enemyCharacters.length) % 
        gameState.enemyCharacters.length;
    } while (gameState.enemyCharacters[gameState.currentSelectedTargetIndex].isDefeated);
    return { action: 'SELECT_PREV_TARGET' };
  } else if (keyCode === 39) { // Right arrow - single tap moves right
    do {
      gameState.currentSelectedTargetIndex = 
        (gameState.currentSelectedTargetIndex + 1) % gameState.enemyCharacters.length;
    } while (gameState.enemyCharacters[gameState.currentSelectedTargetIndex].isDefeated);
    return { action: 'SELECT_NEXT_TARGET' };
  } else if (keyCode === 32) { // Space - single tap confirms
    return { action: 'CONFIRM_TARGET' };
  } else if (keyCode === 90) { // Z - single tap cancels
    return { action: 'CANCEL_TARGET' };
  }
  
  return null;
}