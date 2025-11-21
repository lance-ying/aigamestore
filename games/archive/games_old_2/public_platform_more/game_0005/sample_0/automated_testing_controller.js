// automated_testing_controller.js - Automated testing

import { gameState, GAME_PHASES, BATTLE_PHASES } from './globals.js';

let lastActionFrame = 0;
let actionDelay = 15;
let testState = {
  initialized: false,
  targetCardIndices: [],
  actionQueue: []
};

function getTestWinAction(gameState) {
  const p = window.gameInstance;
  
  if (!p) return null;
  
  // Don't act too frequently
  if (p.frameCount - lastActionFrame < actionDelay) {
    return null;
  }
  
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return null;
  if (gameState.battlePhase !== BATTLE_PHASES.PLAYER_SELECT) return null;
  
  lastActionFrame = p.frameCount;
  
  // Strategy: Select high damage cards, prioritize when enemies are low
  const livingEnemies = gameState.enemies.filter(e => !e.isDead());
  const livingHeroes = gameState.heroes.filter(h => !h.isDead());
  
  if (livingEnemies.length === 0 || livingHeroes.length === 0) return null;
  
  // Analyze hand for best cards
  const attackCards = [];
  const defendCards = [];
  
  gameState.hand.forEach((card, idx) => {
    if (card.type === "ATTACK") {
      attackCards.push({ idx, card, priority: card.effect.damage || 10 });
    } else if (card.type === "DEFEND") {
      defendCards.push({ idx, card, priority: card.effect.heal || card.effect.shield || 5 });
    }
  });
  
  // Sort by priority
  attackCards.sort((a, b) => b.priority - a.priority);
  defendCards.sort((a, b) => b.priority - a.priority);
  
  // Decide strategy
  const lowestHeroHp = Math.min(...livingHeroes.map(h => h.hp));
  const needHealing = lowestHeroHp < 30;
  
  // Select cards
  if (gameState.selectedCards.length === 0) {
    // Start selection
    if (needHealing && defendCards.length > 0) {
      // Select healing card
      gameState.selectedCardIndex = defendCards[0].idx;
      return { keyCode: 32 }; // SPACE to select
    } else if (attackCards.length > 0) {
      // Select attack card
      gameState.selectedCardIndex = attackCards[0].idx;
      return { keyCode: 32 }; // SPACE to select
    }
  } else if (gameState.selectedCards.length < 3) {
    // Continue selecting
    const alreadySelected = new Set(gameState.selectedCards);
    
    // Find next best card
    const availableAttacks = attackCards.filter(a => !alreadySelected.has(a.idx));
    const availableDefends = defendCards.filter(d => !alreadySelected.has(d.idx));
    
    // Calculate remaining steam
    const usedSteam = gameState.selectedCards.reduce((sum, idx) => {
      return sum + gameState.hand[idx].cost;
    }, 0);
    const remainingSteam = gameState.currentSteam - usedSteam;
    
    // Try to select another card
    if (needHealing && availableDefends.length > 0) {
      const card = availableDefends.find(d => d.card.cost <= remainingSteam);
      if (card) {
        gameState.selectedCardIndex = card.idx;
        return { keyCode: 32 };
      }
    }
    
    if (availableAttacks.length > 0) {
      const card = availableAttacks.find(a => a.card.cost <= remainingSteam);
      if (card) {
        gameState.selectedCardIndex = card.idx;
        return { keyCode: 32 };
      }
    }
    
    // Can't select more, play what we have
    return { keyCode: 32 }; // Play cards
  } else {
    // Have 3 cards, play them
    return { keyCode: 32 };
  }
  
  return null;
}

function getBasicTestAction(gameState) {
  const p = window.gameInstance;
  
  if (!p) return null;
  
  if (p.frameCount - lastActionFrame < actionDelay) {
    return null;
  }
  
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return null;
  if (gameState.battlePhase !== BATTLE_PHASES.PLAYER_SELECT) return null;
  
  lastActionFrame = p.frameCount;
  
  // Simple random strategy
  if (gameState.selectedCards.length === 0) {
    // Select a random card
    if (gameState.hand.length > 0) {
      const randomIdx = Math.floor(Math.random() * gameState.hand.length);
      gameState.selectedCardIndex = randomIdx;
      return { keyCode: 32 }; // SPACE
    }
  } else if (gameState.selectedCards.length < 3) {
    // Try to select another card
    const usedSteam = gameState.selectedCards.reduce((sum, idx) => {
      return sum + gameState.hand[idx].cost;
    }, 0);
    const remainingSteam = gameState.currentSteam - usedSteam;
    
    // Find unselected cards that fit
    const available = [];
    gameState.hand.forEach((card, idx) => {
      if (!gameState.selectedCards.includes(idx) && card.cost <= remainingSteam) {
        available.push(idx);
      }
    });
    
    if (available.length > 0 && Math.random() > 0.3) {
      const randomIdx = available[Math.floor(Math.random() * available.length)];
      gameState.selectedCardIndex = randomIdx;
      return { keyCode: 32 };
    } else {
      // Play current selection
      return { keyCode: 32 };
    }
  } else {
    return { keyCode: 32 };
  }
  
  return null;
}

function getEnergyTestAction(gameState) {
  const p = window.gameInstance;
  
  if (!p) return null;
  
  if (p.frameCount - lastActionFrame < actionDelay) {
    return null;
  }
  
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return null;
  if (gameState.battlePhase !== BATTLE_PHASES.PLAYER_SELECT) return null;
  
  lastActionFrame = p.frameCount;
  
  // Test energy management by trying to use all steam each turn
  if (gameState.selectedCards.length === 0) {
    // Find highest cost card we can afford
    const affordable = gameState.hand
      .map((card, idx) => ({ card, idx }))
      .filter(item => item.card.cost <= gameState.currentSteam)
      .sort((a, b) => b.card.cost - a.card.cost);
    
    if (affordable.length > 0) {
      gameState.selectedCardIndex = affordable[0].idx;
      return { keyCode: 32 };
    }
  } else {
    const usedSteam = gameState.selectedCards.reduce((sum, idx) => {
      return sum + gameState.hand[idx].cost;
    }, 0);
    const remainingSteam = gameState.currentSteam - usedSteam;
    
    // Try to use remaining steam
    const available = gameState.hand
      .map((card, idx) => ({ card, idx }))
      .filter(item => !gameState.selectedCards.includes(item.idx) && item.card.cost <= remainingSteam)
      .sort((a, b) => b.card.cost - a.card.cost);
    
    if (available.length > 0 && gameState.selectedCards.length < 3) {
      gameState.selectedCardIndex = available[0].idx;
      return { keyCode: 32 };
    } else {
      return { keyCode: 32 }; // Play
    }
  }
  
  return null;
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getEnergyTestAction(gameState);
    default:
      return null;
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;