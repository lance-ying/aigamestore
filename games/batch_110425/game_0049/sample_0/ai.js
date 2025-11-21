// ai.js
import { gameState, TURN_PHASES } from './globals.js';
import { executeCombat } from './combat.js';

export class AIController {
  constructor(player, p) {
    this.player = player;
    this.p = p;
  }

  makeDecision(territories) {
    const phase = gameState.turnPhase;
    
    switch (phase) {
      case TURN_PHASES.DEPLOYMENT:
        return this.deployArmies(territories);
      case TURN_PHASES.ATTACK:
        return this.performAttacks(territories);
      case TURN_PHASES.FORTIFY:
        return this.fortify(territories);
      default:
        return null;
    }
  }

  deployArmies(territories) {
    // Deploy to border territories (adjacent to enemy)
    const myTerritories = territories.filter(t => t.owner === this.player);
    const borderTerritories = myTerritories.filter(t => {
      return t.neighbors.some(nId => {
        const neighbor = territories.find(nt => nt.id === nId);
        return neighbor && neighbor.owner !== this.player;
      });
    });
    
    if (borderTerritories.length > 0) {
      // Deploy to weakest border territory
      const weakest = borderTerritories.reduce((min, t) => 
        t.armies < min.armies ? t : min
      );
      return { action: 'deploy', territory: weakest };
    }
    
    // Fallback: deploy to any territory
    if (myTerritories.length > 0) {
      return { action: 'deploy', territory: myTerritories[0] };
    }
    
    return null;
  }

  performAttacks(territories) {
    const myTerritories = territories.filter(t => t.owner === this.player);
    
    // Find territories that can attack
    const canAttack = myTerritories.filter(t => t.armies >= 3);
    
    for (const territory of canAttack) {
      // Find weakest adjacent enemy
      const enemyNeighbors = territory.neighbors
        .map(nId => territories.find(t => t.id === nId))
        .filter(t => t && t.owner !== this.player);
      
      if (enemyNeighbors.length > 0) {
        // Attack if we have advantage
        const target = enemyNeighbors.reduce((min, t) => 
          t.armies < min.armies ? t : min
        );
        
        if (territory.armies > target.armies * 1.5) {
          return { 
            action: 'attack', 
            from: territory, 
            to: target 
          };
        }
      }
    }
    
    // No good attacks available
    return { action: 'endAttack' };
  }

  fortify(territories) {
    // Simple fortify: move armies from safe territories to border
    const myTerritories = territories.filter(t => t.owner === this.player);
    
    const safeTerritories = myTerritories.filter(t => {
      return t.armies > 1 && t.neighbors.every(nId => {
        const neighbor = territories.find(nt => nt.id === nId);
        return neighbor && neighbor.owner === this.player;
      });
    });
    
    const borderTerritories = myTerritories.filter(t => {
      return t.neighbors.some(nId => {
        const neighbor = territories.find(nt => nt.id === nId);
        return neighbor && neighbor.owner !== this.player;
      });
    });
    
    if (safeTerritories.length > 0 && borderTerritories.length > 0) {
      const from = safeTerritories[0];
      const to = borderTerritories[0];
      
      // Check if connected
      if (from.neighbors.includes(to.id)) {
        return { action: 'fortify', from, to };
      }
    }
    
    return { action: 'endFortify' };
  }
}