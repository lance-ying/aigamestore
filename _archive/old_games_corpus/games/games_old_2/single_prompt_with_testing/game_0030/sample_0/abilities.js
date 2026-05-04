// abilities.js - Commander abilities implementation

import { ABILITIES, gameState, GRID_SIZE } from './globals.js';
import { VisualEffect } from './entities.js';
import { fireShot } from './combat.js';

export function canUseAbility(abilityKey) {
  const ability = ABILITIES[abilityKey];
  if (!ability) return false;
  
  if (gameState.playerResources < ability.cost) return false;
  if (gameState.abilityCooldowns[abilityKey] > 0) return false;
  
  return true;
}

export function useAbility(abilityKey, p) {
  if (!canUseAbility(abilityKey)) return false;
  
  const ability = ABILITIES[abilityKey];
  gameState.playerResources -= ability.cost;
  gameState.abilityCooldowns[abilityKey] = ability.cooldown;
  
  switch (abilityKey) {
    case 'SALVO':
      return useSalvo(p);
    case 'SONAR':
      return useSonar(p);
    case 'REPAIR':
      return useRepair(p);
  }
  
  return false;
}

function useSalvo(p) {
  // Fire 3 shots in a line from cursor position
  const { cursorX, cursorY } = gameState;
  let hits = 0;
  
  for (let i = 0; i < 3; i++) {
    const targetX = cursorX + i;
    if (targetX < GRID_SIZE && !gameState.aiGrid.isTargeted(targetX, cursorY)) {
      const result = fireShot(targetX, cursorY, p, false);
      if (result.hit) hits++;
    }
  }
  
  p.logs.game_info.push({
    data: { action: 'ability_salvo', hits },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  return true;
}

function useSonar(p) {
  // Reveal 3x3 area around cursor
  const { cursorX, cursorY } = gameState;
  let shipsFound = 0;
  
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const x = cursorX + dx;
      const y = cursorY + dy;
      
      if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
        gameState.aiGrid.reveal(x, y);
        
        // Add sonar effect
        gameState.effects.push(new VisualEffect(x, y, 'sonar', 30));
        
        // Check if ship is here
        for (let ship of gameState.aiShips) {
          if (ship.occupies(x, y) && !ship.sunk) {
            shipsFound++;
            break;
          }
        }
      }
    }
  }
  
  p.logs.game_info.push({
    data: { action: 'ability_sonar', shipsFound },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  return true;
}

function useRepair(p) {
  // Repair 2 HP on least damaged ship
  let targetShip = null;
  let mostDamage = 0;
  
  for (let ship of gameState.playerShips) {
    const damage = ship.length - ship.health;
    if (damage > mostDamage && !ship.sunk) {
      mostDamage = damage;
      targetShip = ship;
    }
  }
  
  if (targetShip) {
    const repaired = targetShip.repair(2);
    
    p.logs.game_info.push({
      data: { action: 'ability_repair', ship: targetShip.name, repaired },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    return true;
  }
  
  return false;
}

export function updateAbilityCooldowns() {
  for (let key in gameState.abilityCooldowns) {
    if (gameState.abilityCooldowns[key] > 0) {
      gameState.abilityCooldowns[key]--;
    }
  }
}