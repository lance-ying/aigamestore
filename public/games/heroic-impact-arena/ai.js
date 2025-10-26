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
  
  // Target lowest HP player
  const livingPlayers = playerCharacters.filter(c => !c.isDefeated);
  if (livingPlayers.length === 0) return null;
  
  const target = livingPlayers.reduce((lowest, current) => 
    current.currentHP < lowest.currentHP ? current : lowest
  );
  
  return {
    attacker: enemy,
    ability: chosenAbility,
    target: target,
    isPlayerTarget: true
  };
}