// testing.js - Automated testing controllers

import { gameState, GAME_PHASE, PLAYER_MODE, TURN_PHASE } from './globals.js';

export function getTestAction(p) {
  if (gameState.controlMode === 'TEST_1') {
    return getBasicTestAction(p);
  } else if (gameState.controlMode === 'TEST_2') {
    return getWinTestAction(p);
  }
  return null;
}

function getBasicTestAction(p) {
  // Basic testing: Select first hero, first ability, first target
  if (gameState.gamePhase === GAME_PHASE.START) {
    return { action: 'START_GAME' };
  }
  
  if (gameState.gamePhase !== GAME_PHASE.PLAYING) {
    return null;
  }
  
  if (gameState.activeTurn !== TURN_PHASE.PLAYER) {
    return null;
  }
  
  // Simple action every 30 frames
  if (p.frameCount % 30 !== 0) {
    return null;
  }
  
  if (gameState.playerMode === PLAYER_MODE.CHARACTER_SELECT) {
    return { action: 'CONFIRM_CHARACTER' };
  } else if (gameState.playerMode === PLAYER_MODE.ABILITY_SELECT) {
    return { action: 'CONFIRM_ABILITY' };
  } else if (gameState.playerMode === PLAYER_MODE.TARGET_SELECT) {
    return { action: 'CONFIRM_TARGET' };
  }
  
  return null;
}

function getWinTestAction(p) {
  // Optimized win strategy
  if (gameState.gamePhase === GAME_PHASE.START) {
    return { action: 'START_GAME' };
  }
  
  if (gameState.gamePhase === GAME_PHASE.GAME_OVER_WIN || 
      gameState.gamePhase === GAME_PHASE.GAME_OVER_LOSE) {
    return null;
  }
  
  if (gameState.gamePhase !== GAME_PHASE.PLAYING) {
    return null;
  }
  
  if (gameState.activeTurn !== TURN_PHASE.PLAYER) {
    return null;
  }
  
  // Act every 20 frames
  if (p.frameCount % 20 !== 0) {
    return null;
  }
  
  if (gameState.playerMode === PLAYER_MODE.CHARACTER_SELECT) {
    // Select hero with lowest HP percentage
    let lowestHPIndex = -1;
    let lowestHPPercent = 1;
    
    gameState.playerCharacters.forEach((char, index) => {
      if (!char.isDefeated && !char.hasActed) {
        const hpPercent = char.currentHP / char.maxHP;
        if (hpPercent < lowestHPPercent) {
          lowestHPPercent = hpPercent;
          lowestHPIndex = index;
        }
      }
    });
    
    if (lowestHPIndex !== -1 && gameState.currentSelectedCharacterIndex !== lowestHPIndex) {
      gameState.currentSelectedCharacterIndex = lowestHPIndex;
      return { action: 'SELECT_NEXT_CHARACTER' };
    }
    
    return { action: 'CONFIRM_CHARACTER' };
  } else if (gameState.playerMode === PLAYER_MODE.ABILITY_SELECT) {
    const char = gameState.playerCharacters[gameState.currentActingHeroIndex];
    
    // If low HP, use heal
    if (char.currentHP < char.maxHP * 0.4) {
      const healAbility = char.abilities.findIndex(a => a.abilityType === 'HEAL' && a.isAvailable());
      if (healAbility !== -1) {
        gameState.currentSelectedAbilityIndex = healAbility;
        return { action: 'CONFIRM_ABILITY' };
      }
    }
    
    // Otherwise use strongest available attack
    let strongestIndex = 0;
    let strongestDamage = 0;
    
    char.abilities.forEach((ability, index) => {
      if (ability.isAvailable() && ability.abilityType === 'ATTACK' && ability.damage > strongestDamage) {
        strongestDamage = ability.damage;
        strongestIndex = index;
      }
    });
    
    gameState.currentSelectedAbilityIndex = strongestIndex;
    return { action: 'CONFIRM_ABILITY' };
  } else if (gameState.playerMode === PLAYER_MODE.TARGET_SELECT) {
    // Target lowest HP enemy
    let lowestHPIndex = -1;
    let lowestHP = Infinity;
    
    gameState.enemyCharacters.forEach((enemy, index) => {
      if (!enemy.isDefeated && enemy.currentHP < lowestHP) {
        lowestHP = enemy.currentHP;
        lowestHPIndex = index;
      }
    });
    
    if (lowestHPIndex !== -1) {
      gameState.currentSelectedTargetIndex = lowestHPIndex;
    }
    
    return { action: 'CONFIRM_TARGET' };
  }
  
  return null;
}