// automated_testing_controller.js - Automated testing AI

import { gameState, GAME_PHASE, COMBAT_STATE } from './globals.js';

let testState = {
  stateHistory: [],
  stuckCounter: 0,
  lastAction: null
};

function getTestWinAction(gameState) {
  // Strategy: Play optimally to win the game
  
  if (gameState.gamePhase === GAME_PHASE.START) {
    return { key: 'Enter', keyCode: 13 };
  }
  
  if (gameState.gamePhase === GAME_PHASE.BOOK_SELECT) {
    // Select first book
    if (gameState.menuSelection !== 0) {
      return { key: 'ArrowLeft', keyCode: 37 };
    }
    return { key: ' ', keyCode: 32 };
  }
  
  if (gameState.gamePhase === GAME_PHASE.PLAYING) {
    if (gameState.combatState === COMBAT_STATE.PLAYER_TURN) {
      // Find best card to play
      const playableCards = gameState.hand.map((card, i) => ({ card, index: i }))
        .filter(c => c.card.cost <= gameState.player.mana);
      
      if (playableCards.length > 0) {
        // Priority: Attack cards first, then defend if health low
        const healthPercent = gameState.player.health / gameState.player.maxHealth;
        
        if (healthPercent < 0.4) {
          const defendCard = playableCards.find(c => c.card.type === "DEFEND");
          if (defendCard) {
            if (gameState.selectedCardIndex !== defendCard.index) {
              return gameState.selectedCardIndex < defendCard.index ? 
                { key: 'ArrowRight', keyCode: 39 } : { key: 'ArrowLeft', keyCode: 37 };
            }
            return { key: ' ', keyCode: 32 };
          }
        }
        
        // Find attack card
        const attackCard = playableCards.find(c => c.card.type === "ATTACK");
        if (attackCard) {
          // Select weakest enemy
          const aliveEnemies = gameState.enemies.map((e, i) => ({ e, i }))
            .filter(obj => !obj.e.isDead);
          
          if (aliveEnemies.length > 0) {
            const weakest = aliveEnemies.reduce((min, curr) => 
              curr.e.health < min.e.health ? curr : min
            );
            
            if (gameState.selectedEnemyIndex !== weakest.i) {
              return gameState.selectedEnemyIndex < weakest.i ?
                { key: 'ArrowDown', keyCode: 40 } : { key: 'ArrowUp', keyCode: 38 };
            }
            
            if (gameState.selectedCardIndex !== attackCard.index) {
              return gameState.selectedCardIndex < attackCard.index ?
                { key: 'ArrowRight', keyCode: 39 } : { key: 'ArrowLeft', keyCode: 37 };
            }
            
            return { key: ' ', keyCode: 32 };
          }
        }
        
        // Play any card
        if (gameState.selectedCardIndex !== playableCards[0].index) {
          return { key: 'ArrowRight', keyCode: 39 };
        }
        return { key: ' ', keyCode: 32 };
      }
      
      // No playable cards, end turn
      return { key: 'z', keyCode: 90 };
    }
    
    if (gameState.combatState === COMBAT_STATE.REWARD) {
      // Choose best reward card (prioritize attacks)
      const bestCardIndex = gameState.rewardCards.findIndex(c => c.type === "ATTACK");
      const targetIndex = bestCardIndex >= 0 ? bestCardIndex : 0;
      
      if (gameState.selectedRewardIndex !== targetIndex) {
        return gameState.selectedRewardIndex < targetIndex ?
          { key: 'ArrowRight', keyCode: 39 } : { key: 'ArrowLeft', keyCode: 37 };
      }
      return { key: ' ', keyCode: 32 };
    }
  }
  
  // Default: wait
  return null;
}

function getBasicTestAction(gameState) {
  // Basic movement and interaction test
  
  if (gameState.gamePhase === GAME_PHASE.START) {
    return { key: 'Enter', keyCode: 13 };
  }
  
  if (gameState.gamePhase === GAME_PHASE.BOOK_SELECT) {
    if (Math.random() < 0.7) {
      return { key: ' ', keyCode: 32 };
    }
    return { key: 'ArrowRight', keyCode: 39 };
  }
  
  if (gameState.gamePhase === GAME_PHASE.PLAYING) {
    if (gameState.combatState === COMBAT_STATE.PLAYER_TURN) {
      const rand = Math.random();
      
      if (rand < 0.4 && gameState.hand.length > 0) {
        // Try to play card
        if (gameState.hand[gameState.selectedCardIndex || 0].cost <= gameState.player.mana) {
          return { key: ' ', keyCode: 32 };
        }
      }
      
      if (rand < 0.6) {
        return { key: 'ArrowRight', keyCode: 39 };
      } else if (rand < 0.8) {
        return { key: 'ArrowLeft', keyCode: 37 };
      }
      
      return { key: 'z', keyCode: 90 };
    }
    
    if (gameState.combatState === COMBAT_STATE.REWARD) {
      return { key: ' ', keyCode: 32 };
    }
  }
  
  return null;
}

function getRandomAction(gameState) {
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

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;