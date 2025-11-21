import { gameState, PHASE } from './globals.js';
import { resolveCombat } from './combat.js';

export class AI {
  constructor(p) {
    this.p = p;
  }

  takeTurn(player) {
    this.reinforcePhase(player);
    this.attackPhase(player);
  }

  reinforcePhase(player) {
    const territories = player.getTerritoriesOwned(gameState.territories);
    
    while (gameState.reinforcementPool > 0) {
      const borderTerritories = territories.filter(t => {
        return t.adjacentIds.some(adjId => {
          const adjTerritory = gameState.territories.find(ter => ter.id === adjId);
          return adjTerritory && adjTerritory.ownerId !== player.id;
        });
      });
      
      if (borderTerritories.length > 0) {
        const targetTerritory = borderTerritories[Math.floor(this.p.random(borderTerritories.length))];
        targetTerritory.addArmies(1);
        gameState.reinforcementPool--;
      } else if (territories.length > 0) {
        const targetTerritory = territories[Math.floor(this.p.random(territories.length))];
        targetTerritory.addArmies(1);
        gameState.reinforcementPool--;
      } else {
        break;
      }
    }
  }

  attackPhase(player) {
    let attacksThisTurn = 0;
    const maxAttacks = 10;
    
    while (attacksThisTurn < maxAttacks) {
      const territories = player.getTerritoriesOwned(gameState.territories);
      const validAttackers = territories.filter(t => t.armies > 1);
      
      if (validAttackers.length === 0) break;
      
      let attackExecuted = false;
      
      for (let attacker of validAttackers) {
        const adjacentEnemies = attacker.adjacentIds
          .map(id => gameState.territories.find(t => t.id === id))
          .filter(t => t && t.ownerId !== player.id && t.armies < attacker.armies);
        
        if (adjacentEnemies.length > 0) {
          const defender = adjacentEnemies[Math.floor(this.p.random(adjacentEnemies.length))];
          
          const attackerArmies = Math.min(3, attacker.armies - 1);
          const combatResult = resolveCombat(this.p, attackerArmies, defender.armies);
          
          attacker.removeArmies(combatResult.attackerLosses);
          defender.removeArmies(combatResult.defenderLosses);
          
          if (defender.armies === 0) {
            const movedArmies = Math.min(attackerArmies, attacker.armies - 1);
            defender.changeOwner(player.id, movedArmies);
            attacker.removeArmies(movedArmies);
            
            const defenderPlayer = gameState.players.find(p => p.id === defender.ownerId);
            if (defenderPlayer) {
              const defenderTerritories = defenderPlayer.getTerritoriesOwned(gameState.territories);
              if (defenderTerritories.length === 0) {
                gameState.score += 100;
              }
            }
          }
          
          attackExecuted = true;
          attacksThisTurn++;
          break;
        }
      }
      
      if (!attackExecuted) break;
    }
  }
}