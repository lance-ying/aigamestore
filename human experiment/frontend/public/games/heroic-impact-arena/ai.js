// ai.js - Enemy AI logic

import { calculateDamage } from './character.js';

export function executeEnemyTurn(enemy, playerCharacters, enemyCharacters, p) {
  // Skip if stunned
  if (enemy.hasStatusEffect('STUN')) {
    return null;
  }
  
  // Choose ability (prefer heal if ally is low, otherwise strongest available)
  let chosenAbility = enemy.abilities[0];
  
  // Check for heal ability
  const healAbility = enemy.abilities.find(a => a.abilityType === 'HEAL' && a.isAvailable());
  if (healAbility) {
    // Find lowest HP ally
    const damagedAllies = enemyCharacters.filter(e => !e.isDefeated && e.currentHP < e.maxHP * 0.5);
    if (damagedAllies.length > 0) {
      chosenAbility = healAbility;
      const target = damagedAllies[0];
      return {
        attacker: enemy,
        ability: chosenAbility,
        target: target,
        isPlayerTarget: false
      };
    }
  }
  
  // Choose strongest available attack
  const availableAttacks = enemy.abilities.filter(a => 
    (a.abilityType === 'ATTACK' || a.abilityType === 'DEBUFF') && a.isAvailable()
  );
  
  if (availableAttacks.length > 0) {
    chosenAbility = availableAttacks.reduce((best, current) => 
      current.damage > best.damage ? current : best
    );
  }
  
  // Diversified targeting strategy
  const livingPlayers = playerCharacters.filter(c => !c.isDefeated);
  if (livingPlayers.length === 0) return null;
  
  let target;
  
  // Use enemy ID to determine targeting strategy for variety
  const enemyIndex = enemyCharacters.indexOf(enemy);
  const strategy = enemyIndex % 3; // Cycle through 3 strategies
  
  if (strategy === 0) {
    // Target lowest HP
    target = livingPlayers.reduce((lowest, current) => 
      current.currentHP < lowest.currentHP ? current : lowest
    );
  } else if (strategy === 1) {
    // Target highest power (biggest threat)
    target = livingPlayers.reduce((strongest, current) => 
      current.power > strongest.power ? current : strongest
    );
  } else {
    // Target random player (adds unpredictability)
    const randomIndex = Math.floor(Math.random() * livingPlayers.length);
    target = livingPlayers[randomIndex];
  }
  
  return {
    attacker: enemy,
    ability: chosenAbility,
    target: target,
    isPlayerTarget: true
  };
}