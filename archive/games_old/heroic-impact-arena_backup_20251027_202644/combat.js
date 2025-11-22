// combat.js - Combat logic

import { gameState, PLAYER_MODE, TURN_PHASE, GAME_PHASE } from './globals.js';
import { calculateDamage } from './character.js';
import { createAttackAnimation, createHealAnimation, createDamageNumberAnimation, spawnImpactParticles } from './animations.js';

export function executePlayerAction(p) {
  const char = gameState.playerCharacters[gameState.currentActingHeroIndex];
  const ability = char.abilities[gameState.currentSelectedAbilityIndex];
  
  if (ability.targetType === 'SELF') {
    // Execute self-target ability
    executeSelfAbility(char, ability, p);
    ability.use();
    char.hasActed = true;
    advanceToNextHero();
  } else if (ability.targetType === 'SINGLE') {
    // Need to select target
    gameState.playerMode = PLAYER_MODE.TARGET_SELECT;
    gameState.currentSelectedTargetIndex = findFirstLivingEnemy();
  }
}

export function executeTargetedAction(p) {
  const attacker = gameState.playerCharacters[gameState.currentActingHeroIndex];
  const ability = attacker.abilities[gameState.currentSelectedAbilityIndex];
  const target = gameState.enemyCharacters[gameState.currentSelectedTargetIndex];
  
  if (ability.abilityType === 'ATTACK') {
    executeAttack(attacker, target, ability, p);
  }
  
  ability.use();
  attacker.hasActed = true;
  
  advanceToNextHero();
}

function executeSelfAbility(char, ability, p) {
  if (ability.abilityType === 'HEAL') {
    char.heal(ability.healValue);
    gameState.animationQueue.push(createHealAnimation(char, ability.healValue));
    gameState.animationQueue.push(createDamageNumberAnimation(char.x, char.y, ability.healValue, true));
  } else if (ability.abilityType === 'BUFF' && ability.statusEffect) {
    char.addStatusEffect({ ...ability.statusEffect });
  }
}

function executeAttack(attacker, target, ability, p) {
  const damage = calculateDamage(attacker, target, ability, p);
  
  // Create attack animation with damage callback
  // Damage is applied when animation reaches target (at ~80% progress)
  const onDamageApply = () => {
    target.takeDamage(damage);
    
    // Spawn impact particles
    spawnImpactParticles(target.x, target.y, attacker.type, gameState.particles);
    
    // Apply status effects
    if (ability.statusEffect && !target.isDefeated) {
      target.addStatusEffect({ ...ability.statusEffect });
    }
    
    // Update score
    if (target.isDefeated) {
      if (target.name.includes('Boss')) {
        gameState.score += 500;
      } else if (target.name === 'Brawler' || target.name.includes('Elite')) {
        gameState.score += 150;
      } else {
        gameState.score += 50;
      }
    }
    
    // Check win condition after damage is applied
    if (checkAllEnemiesDefeated()) {
      // Delay level completion to allow animations to finish
      setTimeout(() => {
        if (gameState.gamePhase === GAME_PHASE.PLAYING) {
          handleLevelComplete(p);
        }
      }, 500);
    }
  };
  
  // Add animations
  gameState.animationQueue.push(createAttackAnimation(attacker, target, damage, onDamageApply));
  gameState.animationQueue.push(createDamageNumberAnimation(target.x, target.y, damage, false));
}

function advanceToNextHero() {
  const nextHero = findNextAvailableHero();
  
  if (nextHero !== -1) {
    gameState.currentActingHeroIndex = nextHero;
    gameState.currentSelectedCharacterIndex = nextHero;
    gameState.currentSelectedAbilityIndex = 0;
    gameState.playerMode = PLAYER_MODE.CHARACTER_SELECT;
  } else {
    // All heroes have acted, switch to enemy turn
    startEnemyTurn();
  }
}

function findNextAvailableHero() {
  for (let i = 0; i < gameState.playerCharacters.length; i++) {
    const char = gameState.playerCharacters[i];
    if (!char.isDefeated && !char.hasActed) {
      return i;
    }
  }
  return -1;
}

function findFirstLivingEnemy() {
  for (let i = 0; i < gameState.enemyCharacters.length; i++) {
    if (!gameState.enemyCharacters[i].isDefeated) {
      return i;
    }
  }
  return 0;
}

function startEnemyTurn() {
  gameState.activeTurn = TURN_PHASE.ENEMY;
  gameState.playerMode = PLAYER_MODE.CHARACTER_SELECT;
  
  // Reset hero actions for next turn
  gameState.playerCharacters.forEach(char => char.resetTurn());
}

export function checkAllEnemiesDefeated() {
  return gameState.enemyCharacters.every(e => e.isDefeated);
}

export function checkAllHeroesDefeated() {
  return gameState.playerCharacters.every(c => c.isDefeated);
}

function handleLevelComplete(p) {
  // Calculate bonuses
  let bonus = 200; // Level completion
  
  // Perfect health bonus
  const allHighHP = gameState.playerCharacters.every(c => 
    c.isDefeated || c.currentHP >= c.maxHP * 0.8
  );
  if (allHighHP) {
    bonus += 100;
  }
  
  // Turn efficiency bonus
  const targetTurns = gameState.targetTurnsForBonus[gameState.currentLevel - 1];
  if (gameState.turnCounter < targetTurns) {
    bonus += (targetTurns - gameState.turnCounter) * 25;
  }
  
  gameState.score += bonus;
  
  p.logs.game_info.push({
    data: { phase: 'LEVEL_COMPLETE', level: gameState.currentLevel, bonus: bonus },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Advance to next level or win
  if (gameState.currentLevel < gameState.maxLevel) {
    gameState.currentLevel++;
    // Enter level transition phase
    gameState.gamePhase = GAME_PHASE.LEVEL_TRANSITION;
    gameState.levelTransitionTimer = 120; // 2 seconds at 60fps
  } else {
    gameState.gamePhase = GAME_PHASE.GAME_OVER_WIN;
    p.logs.game_info.push({
      data: { phase: 'GAME_WIN', finalScore: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function completeLevel Transition(p) {
  // Import here to avoid circular dependency
  import('./levels.js').then(module => {
    // Heal heroes to full health between levels
    gameState.playerCharacters.forEach(char => {
      if (!char.isDefeated) {
        char.heal(char.maxHP); // Full health restoration
        char.updateAbilityCooldowns();
        char.activeStatusEffects = [];
        char.resetTurn();
      }
    });
    
    // Generate new enemies
    gameState.enemyCharacters = module.generateEnemiesForLevel(gameState.currentLevel, p);
    
    // Reset turn state
    gameState.activeTurn = TURN_PHASE.PLAYER;
    gameState.playerMode = PLAYER_MODE.CHARACTER_SELECT;
    gameState.currentActingHeroIndex = 0;
    gameState.currentSelectedCharacterIndex = 0;
    gameState.turnCounter = 0;
    gameState.animationQueue = [];
    gameState.particles = [];
    
    // Return to playing phase
    gameState.gamePhase = GAME_PHASE.PLAYING;
  });
}