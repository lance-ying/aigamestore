// combat.js - Combat resolution system
import { gameState } from './globals.js';

export class Combat {
  constructor(clearingId, attacker, defender) {
    this.clearingId = clearingId;
    this.attacker = attacker;
    this.defender = defender;
    this.attackerHits = 0;
    this.defenderHits = 0;
    this.resolved = false;
  }

  rollDice(numDice) {
    // Custom dice: 0-3 hits per die (weighted)
    let hits = 0;
    for (let i = 0; i < numDice; i++) {
      const roll = Math.random();
      if (roll < 0.5) hits += 1;      // 50% - 1 hit
      else if (roll < 0.75) hits += 0; // 25% - 0 hits
      else if (roll < 0.9) hits += 2;  // 15% - 2 hits
      else hits += 3;                   // 10% - 3 hits
    }
    return hits;
  }

  resolve(clearings) {
    const clearing = clearings[this.clearingId];
    const attackerUnits = clearing.getUnitCount(this.attacker);
    const defenderUnits = clearing.getUnitCount(this.defender);
    
    // Roll dice for both sides
    this.attackerHits = this.rollDice(Math.min(attackerUnits, 2));
    this.defenderHits = this.rollDice(Math.min(defenderUnits, 2));
    
    // Apply damage (attacker hits first)
    const defenderLosses = Math.min(this.attackerHits, defenderUnits);
    const attackerLosses = Math.min(this.defenderHits, attackerUnits);
    
    clearing.removeUnit(this.defender, defenderLosses);
    clearing.removeUnit(this.attacker, attackerLosses);
    
    this.resolved = true;
    
    return {
      attackerLosses,
      defenderLosses,
      victor: defenderLosses > attackerLosses ? this.attacker : this.defender
    };
  }
}

export function checkForCombat(clearings) {
  const combats = [];
  
  for (const clearing of clearings) {
    const factionsPresent = Object.keys(clearing.units);
    if (factionsPresent.length >= 2) {
      // Combat between first two factions with units
      combats.push(new Combat(clearing.id, factionsPresent[0], factionsPresent[1]));
    }
  }
  
  return combats;
}