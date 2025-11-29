// race_combo.js - Race and ability combinations

import { RACES, ABILITIES } from './globals.js';

export class RaceCombo {
  constructor(race, ability, cost = 0) {
    this.race = race;
    this.ability = ability;
    this.cost = cost;
  }
  
  getDescription() {
    return `${this.ability.name} ${this.race.name}`;
  }
}

export function generateRaceCombos(count = 6) {
  const combos = [];
  const usedRaces = new Set();
  const usedAbilities = new Set();
  
  // Seeded random selection
  const racesCopy = [...RACES];
  const abilitiesCopy = [...ABILITIES];
  
  for (let i = 0; i < count && racesCopy.length > 0 && abilitiesCopy.length > 0; i++) {
    const raceIndex = i % racesCopy.length;
    const abilityIndex = i % abilitiesCopy.length;
    
    const race = racesCopy[raceIndex];
    const ability = abilitiesCopy[abilityIndex];
    
    combos.push(new RaceCombo(race, ability, i));
    
    if (i % 2 === 1) {
      racesCopy.splice(raceIndex, 1);
      abilitiesCopy.splice(abilityIndex, 1);
    }
  }
  
  return combos;
}