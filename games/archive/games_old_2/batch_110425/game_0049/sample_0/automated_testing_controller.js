// automated_testing_controller.js
import { gameState, TURN_PHASES, GAME_PHASES } from './globals.js';

function getTestBasicAction(state) {
  // Navigate through territories and test selections
  const frameCount = window.gameInstance ? window.gameInstance.frameCount : 0;
  
  if (frameCount % 30 < 10) {
    return { key: 'ArrowRight', keyCode: 39 };
  } else if (frameCount % 30 < 20) {
    return { key: 'ArrowLeft', keyCode: 37 };
  } else {
    return { key: ' ', keyCode: 32 };
  }
}

function getTestWinAction(state) {
  if (state.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  const currentPlayer = state.players[state.currentPlayerIndex];
  
  // Only act during human player's turn
  if (currentPlayer.isAI) {
    return null;
  }
  
  switch (state.turnPhase) {
    case TURN_PHASES.DEPLOYMENT: {
      // Deploy to strongest territory adjacent to enemy
      const myTerritories = state.territories.filter(t => t.owner === currentPlayer);
      const borderTerritories = myTerritories.filter(t => {
        return t.neighbors.some(nId => {
          const neighbor = state.territories.find(nt => nt.id === nId);
          return neighbor && neighbor.owner !== currentPlayer;
        });
      });
      
      if (borderTerritories.length > 0 && state.reinforcementsToPlace > 0) {
        // Find strongest border territory
        const strongest = borderTerritories.reduce((max, t) => 
          t.armies > max.armies ? t : max
        );
        
        // Navigate to it
        const targetIndex = state.territories.indexOf(strongest);
        if (state.navigationIndex !== targetIndex) {
          if (targetIndex > state.navigationIndex) {
            return { key: 'ArrowRight', keyCode: 39 };
          } else {
            return { key: 'ArrowLeft', keyCode: 37 };
          }
        }
        
        // Deploy
        return { key: ' ', keyCode: 32 };
      }
      break;
    }
    
    case TURN_PHASES.ATTACK: {
      const currentTerritory = state.territories[state.navigationIndex];
      
      if (!state.attackingTerritory) {
        // Find a territory that can attack
        const canAttack = state.territories.filter(t => 
          t.owner === currentPlayer && t.armies >= 3
        );
        
        if (canAttack.length > 0) {
          // Find one with weak adjacent enemy
          for (const territory of canAttack) {
            const enemyNeighbors = territory.neighbors
              .map(nId => state.territories.find(t => t.id === nId))
              .filter(t => t && t.owner !== currentPlayer);
            
            if (enemyNeighbors.length > 0) {
              const weakest = enemyNeighbors.reduce((min, t) => 
                t.armies < min.armies ? t : min
              );
              
              // Navigate to attacking territory
              const attackerIndex = state.territories.indexOf(territory);
              if (state.navigationIndex !== attackerIndex) {
                if (attackerIndex > state.navigationIndex) {
                  return { key: 'ArrowRight', keyCode: 39 };
                } else {
                  return { key: 'ArrowLeft', keyCode: 37 };
                }
              }
              
              // Select it
              return { key: ' ', keyCode: 32 };
            }
          }
        }
        
        // No good attacks, end phase
        return { key: 'z', keyCode: 90 };
      } else {
        // Have attacker, select target
        const enemyNeighbors = state.attackingTerritory.neighbors
          .map(nId => state.territories.find(t => t.id === nId))
          .filter(t => t && t.owner !== currentPlayer);
        
        if (enemyNeighbors.length > 0) {
          const target = enemyNeighbors[0];
          const targetIndex = state.territories.indexOf(target);
          
          if (state.navigationIndex !== targetIndex) {
            if (targetIndex > state.navigationIndex) {
              return { key: 'ArrowRight', keyCode: 39 };
            } else {
              return { key: 'ArrowLeft', keyCode: 37 };
            }
          }
          
          return { key: ' ', keyCode: 32 };
        }
      }
      
      return { key: 'z', keyCode: 90 };
    }
    
    case TURN_PHASES.FORTIFY: {
      // Skip fortify for speed
      return { key: 'z', keyCode: 90 };
    }
  }
  
  return null;
}

function getRandomAction(state) {
  const actions = [
    { key: 'ArrowLeft', keyCode: 37 },
    { key: 'ArrowRight', keyCode: 39 },
    { key: 'ArrowUp', keyCode: 38 },
    { key: 'ArrowDown', keyCode: 40 },
    { key: ' ', keyCode: 32 },
    { key: 'z', keyCode: 90 }
  ];
  
  return actions[Math.floor(Math.random() * actions.length)];
}

export function get_automated_testing_action(state) {
  switch (state.controlMode) {
    case "TEST_1":
      return getTestBasicAction(state);
    case "TEST_2":
      return getTestWinAction(state);
    default:
      return getRandomAction(state);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;