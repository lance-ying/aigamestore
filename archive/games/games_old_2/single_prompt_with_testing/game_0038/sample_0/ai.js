// ai.js - AI player logic

import { gameState } from './globals.js';
import { getAdjacentTerritories, isAdjacent } from './territory.js';

export class AIController {
  constructor(playerIndex) {
    this.playerIndex = playerIndex;
  }
  
  selectRaceCombo(availableCombos) {
    // Simple strategy: pick first available with most tokens
    let best = availableCombos[0];
    for (let combo of availableCombos) {
      if (combo.race.tokens > best.race.tokens) {
        best = combo;
      }
    }
    return best;
  }
  
  selectTargetTerritory(territories, player) {
    const playerTerritories = territories.filter(
      t => t.owner === this.playerIndex && !t.isDeclined
    );
    
    // Find conquerable territories
    const targets = [];
    
    if (playerTerritories.length === 0) {
      // First conquest - look for cheap territories
      territories.forEach(territory => {
        if (territory.owner === null && territory.terrain.name !== "Water") {
          const cost = territory.getConquestCost();
          if (cost <= player.availableTokens) {
            targets.push({ territory, cost, priority: 10 - cost + territory.bonusPoints });
          }
        }
      });
    } else {
      // Expand from existing territories
      playerTerritories.forEach(owned => {
        const adjacent = getAdjacentTerritories(territories, owned);
        adjacent.forEach(territory => {
          if (territory.owner !== this.playerIndex && territory.terrain.name !== "Water") {
            const cost = territory.getConquestCost();
            if (cost <= player.availableTokens) {
              let priority = 10 - cost + territory.bonusPoints;
              if (territory.owner !== null) priority += 3; // Prefer attacking
              targets.push({ territory, cost, priority });
            }
          }
        });
      });
    }
    
    // Sort by priority
    targets.sort((a, b) => b.priority - a.priority);
    
    return targets.length > 0 ? targets[0].territory : null;
  }
  
  shouldDecline(territories, player) {
    const activeCount = player.getActiveTerritoriesCount(territories);
    const hasDeclined = player.declinedRace !== null;
    
    // Decline if we have few tokens left and many territories
    if (player.availableTokens < 3 && activeCount > 3 && !hasDeclined) {
      return true;
    }
    
    return false;
  }
}