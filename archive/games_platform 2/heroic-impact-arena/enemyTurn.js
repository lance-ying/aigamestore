// enemyTurn.js - Enemy turn processing

import { gameState, TURN_PHASE, PLAYER_MODE, GAME_PHASE } from './globals.js';
import { executeEnemyTurn } from './ai.js';
import { calculateDamage } from './character.js';
import { createAttackAnimation, createHealAnimation, createDamageNumberAnimation, spawnImpactParticles } from './animations.js';
import { checkAllHeroesDefeated } from './combat.js';

let enemyTurnIndex = 0;
let enemyActionDelay = 0;
const ENEMY_ACTION_DELAY = 60; // frames between enemy actions

export function updateEnemyTurn(p) {
  // Wait for animations to complete
  if (gameState.animationQueue.length > 0) {
    return;
  }
  
  // Delay between actions
  if (enemyActionDelay > 0) {
    enemyActionDelay--;
    return;
  }
  
  // Find next living enemy
  while (enemyTurnIndex < gameState.enemyCharacters.length && 
         gameState.enemyCharacters[enemyTurnIndex].isDefeated) {
    enemyTurnIndex++;
  }
  
  // All enemies have acted
  if (enemyTurnIndex >= gameState.enemyCharacters.length) {
    endEnemyTurn();
    return;
  }
  
  const enemy = gameState.enemyCharacters[enemyTurnIndex];
  
  // Update status effects
  enemy.updateStatusEffects();
  
  // Check if stunned
  if (enemy.hasStatusEffect('STUN')) {
    enemyTurnIndex++;
    enemyActionDelay = 30;
    return;
  }
  
  // Execute enemy action
  const action = executeEnemyTurn(
    enemy, 
    gameState.playerCharacters, 
    gameState.enemyCharacters, 
    p
  );
  
  if (action) {
    executeEnemyAction(action, p);
  }
  
  enemyTurnIndex++;
  enemyActionDelay = ENEMY_ACTION_DELAY;
}

function executeEnemyAction(action, p) {
  const { attacker, ability, target, isPlayerTarget } = action;
  
  if (ability.abilityType === 'ATTACK') {
    const damage = calculateDamage(attacker, target, ability, p);
    
    // Create attack animation with damage callback
    const onDamageApply = () => {
      target.takeDamage(damage);
      
      // Spawn impact particles
      spawnImpactParticles(target.x, target.y, attacker.type, gameState.particles);
      
      if (ability.statusEffect && !target.isDefeated) {
        target.addStatusEffect({ ...ability.statusEffect });
      }
      
      // Check lose condition after damage is applied
      if (checkAllHeroesDefeated()) {
        setTimeout(() => {
          if (gameState.gamePhase === GAME_PHASE.PLAYING) {
            gameState.gamePhase = GAME_PHASE.GAME_OVER_LOSE;
            p.logs.game_info.push({
              data: { phase: 'GAME_OVER_LOSE', finalScore: gameState.score },
              framecount: p.frameCount,
              timestamp: Date.now()
            });
          }
        }, 500);
      }
    };
    
    gameState.animationQueue.push(createAttackAnimation(attacker, target, damage, onDamageApply));
    gameState.animationQueue.push(createDamageNumberAnimation(target.x, target.y, damage, false));
  } else if (ability.abilityType === 'HEAL') {
    target.heal(ability.healValue);
    gameState.animationQueue.push(createHealAnimation(target, ability.healValue));
    gameState.animationQueue.push(createDamageNumberAnimation(target.x, target.y, ability.healValue, true));
  }
  
  ability.use();
}

function endEnemyTurn() {
  enemyTurnIndex = 0;
  gameState.activeTurn = TURN_PHASE.PLAYER;
  gameState.playerMode = PLAYER_MODE.CHARACTER_SELECT;
  gameState.turnCounter++;
  
  // Update all characters
  [...gameState.playerCharacters, ...gameState.enemyCharacters].forEach(char => {
    if (!char.isDefeated) {
      char.updateStatusEffects();
      char.updateAbilityCooldowns();
      char.resetTurn();
    }
  });
  
  // Find first available hero
  for (let i = 0; i < gameState.playerCharacters.length; i++) {
    if (!gameState.playerCharacters[i].isDefeated) {
      gameState.currentActingHeroIndex = i;
      gameState.currentSelectedCharacterIndex = i;
      gameState.currentSelectedAbilityIndex = 0;
      break;
    }
  }
}

export function resetEnemyTurn() {
  enemyTurnIndex = 0;
  enemyActionDelay = 0;
}