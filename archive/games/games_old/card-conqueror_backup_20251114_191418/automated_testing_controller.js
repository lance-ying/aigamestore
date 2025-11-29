// Automated testing controller for Card Conqueror

// Test 1: Basic functionality testing with sticky keys
function getStickyKeysAction(gameState) {
  // Track position history to detect stalling
  if (!gameState.testData) {
    gameState.testData = {
      positionHistory: [],
      stuckCounter: 0,
      lastAction: null,
      actionCounter: 0
    };
  }
  
  // If we're in reward screen, always select a card
  if (gameState.battleState === "REWARD") {
    return 32; // SPACE to select a card
  }
  
  // If it's enemy turn, we can't do anything
  if (gameState.turn === "ENEMY") {
    return null;
  }
  
  // Record current state
  gameState.testData.positionHistory.push({
    handSize: gameState.hand.length,
    energy: gameState.energy,
    enemyHealth: gameState.currentEnemy ? gameState.currentEnemy.health : 0
  });
  
  // Check if we're stuck (no changes in last 10 frames)
  if (gameState.testData.positionHistory.length > 10) {
    const current = gameState.testData.positionHistory[gameState.testData.positionHistory.length - 1];
    const previous = gameState.testData.positionHistory[gameState.testData.positionHistory.length - 10];
    
    if (current.handSize === previous.handSize && 
        current.energy === previous.energy && 
        current.enemyHealth === previous.enemyHealth) {
      gameState.testData.stuckCounter++;
    } else {
      gameState.testData.stuckCounter = 0;
    }
    
    // Trim history to avoid memory bloat
    if (gameState.testData.positionHistory.length > 20) {
      gameState.testData.positionHistory.shift();
    }
  }
  
  // If stuck, try random actions
  if (gameState.testData.stuckCounter > 5) {
    const randomAction = Math.random();
    if (randomAction < 0.5) {
      return 32; // SPACE to play card
    } else {
      return 90; // Z to end turn
    }
  }
  
  // Normal strategy: sticky keys with occasional changes
  gameState.testData.actionCounter++;
  
  // Change action every 30 frames
  if (gameState.testData.actionCounter % 30 === 0) {
    const randomValue = Math.random();
    
    if (randomValue < 0.4) {
      gameState.testData.lastAction = 32; // SPACE to play card
    } else if (randomValue < 0.6) {
      gameState.testData.lastAction = 38; // UP to navigate
    } else if (randomValue < 0.8) {
      gameState.testData.lastAction = 40; // DOWN to navigate
    } else {
      gameState.testData.lastAction = 90; // Z to end turn
    }
  }
  
  return gameState.testData.lastAction;
}

// Test 2: Win strategy
function getTestWinAction(gameState) {
  // Initialize test data if not present
  if (!gameState.testData) {
    gameState.testData = {
      actionQueue: [],
      turnStrategy: "attack", // "attack" or "defend"
      lastEnemyHealth: gameState.currentEnemy ? gameState.currentEnemy.health : 0,
      lastPlayerHealth: gameState.player ? gameState.player.health : 0
    };
  }
  
  // If in reward screen, always select first card (usually best)
  if (gameState.battleState === "REWARD") {
    // Select attack cards for a balanced deck
    if (gameState.availableRewards.length > 0) {
      const attackCards = gameState.availableRewards.findIndex(card => 
        card.type.name === "Attack" && card.energy <= 2);
      
      if (attackCards !== -1 && attackCards !== gameState.selectedRewardIndex) {
        // Navigate to attack card
        if (attackCards < gameState.selectedRewardIndex) {
          return 38; // UP key
        } else {
          return 40; // DOWN key
        }
      }
      
      // Select card
      return 32; // SPACE
    }
  }
  
  // If it's enemy turn, we can't do anything
  if (gameState.turn === "ENEMY") {
    return null;
  }
  
  // Update strategy based on enemy intention
  if (gameState.currentEnemy) {
    const enemyIntention = gameState.currentEnemy.getCurrentIntention();
    
    // If enemy is going to attack and we have no block, prioritize defense
    if ((enemyIntention === "ATTACK" || enemyIntention === "HEAVY_ATTACK") && 
        gameState.player.block === 0) {
      gameState.testData.turnStrategy = "defend";
    } 
    // Otherwise, prioritize attack
    else {
      gameState.testData.turnStrategy = "attack";
    }
    
    // Track enemy and player health to detect progress
    gameState.testData.lastEnemyHealth = gameState.currentEnemy.health;
    gameState.testData.lastPlayerHealth = gameState.player.health;
  }
  
  // If we have an action queue, execute it
  if (gameState.testData.actionQueue.length > 0) {
    return gameState.testData.actionQueue.shift();
  }
  
  // If we have no energy or no cards, end turn
  if (gameState.energy === 0 || gameState.hand.length === 0) {
    return 90; // Z to end turn
  }
  
  // Find the best card to play based on strategy
  let bestCardIndex = -1;
  
  if (gameState.testData.turnStrategy === "defend") {
    // Find defensive cards first
    bestCardIndex = gameState.hand.findIndex(card => 
      card.type.name === "Skill" && 
      card.energy <= gameState.energy &&
      card.description.toLowerCase().includes("block"));
  }
  
  // If no defensive card found or we're in attack mode, find attack cards
  if (bestCardIndex === -1 && gameState.testData.turnStrategy === "attack") {
    bestCardIndex = gameState.hand.findIndex(card => 
      card.type.name === "Attack" && 
      card.energy <= gameState.energy);
  }
  
  // If still no card found, find any playable card
  if (bestCardIndex === -1) {
    bestCardIndex = gameState.hand.findIndex(card => card.energy <= gameState.energy);
  }
  
  // If we found a card to play
  if (bestCardIndex !== -1) {
    // Create action queue to navigate to and play the card
    const actions = [];
    
    // Navigate to the card
    while (gameState.selectedCardIndex !== bestCardIndex) {
      if (gameState.selectedCardIndex < bestCardIndex) {
        actions.push(40); // DOWN
      } else {
        actions.push(38); // UP
      }
    }
    
    // Play the card
    actions.push(32); // SPACE
    
    gameState.testData.actionQueue = actions;
    return gameState.testData.actionQueue.shift();
  }
  
  // If we can't play any cards, end turn
  return 90; // Z to end turn
}

// Test 3: Card selection and reward system testing
function getTestCardSelectionAction(gameState) {
  // Initialize test data if not present
  if (!gameState.testData) {
    gameState.testData = {
      deckBalance: {
        attack: 0,
        skill: 0,
        power: 0
      },
      actionQueue: [],
      lastState: null
    };
  }
  
  // Update deck balance counts
  if (gameState.deck && (!gameState.testData.lastState || gameState.testData.lastState !== "REWARD")) {
    gameState.testData.deckBalance = {
      attack: gameState.deck.filter(card => card.type.name === "Attack").length,
      skill: gameState.deck.filter(card => card.type.name === "Skill").length,
      power: gameState.deck.filter(card => card.type.name === "Power").length
    };
  }
  
  // Save current state
  gameState.testData.lastState = gameState.battleState;
  
  // If in reward screen, select cards based on deck balance
  if (gameState.battleState === "REWARD") {
    if (gameState.availableRewards.length > 0) {
      // Determine what type of card we need most
      let neededType = "Attack";
      if (gameState.testData.deckBalance.attack > gameState.testData.deckBalance.skill) {
        neededType = "Skill";
      }
      if (gameState.testData.deckBalance.power < 2) {
        neededType = "Power";
      }
      
      // Find a card of the needed type
      const targetCardIndex = gameState.availableRewards.findIndex(card => 
        card.type.name === neededType);
      
      if (targetCardIndex !== -1 && targetCardIndex !== gameState.selectedRewardIndex) {
        // Navigate to the target card
        if (targetCardIndex < gameState.selectedRewardIndex) {
          return 38; // UP
        } else {
          return 40; // DOWN
        }
      }
      
      // Select the card
      return 32; // SPACE
    }
  }
  
  // For actual gameplay, use the win strategy
  return getTestWinAction(gameState);
}

// Test 4: Energy management testing
function getTestEnergyManagementAction(gameState) {
  // Initialize test data if not present
  if (!gameState.testData) {
    gameState.testData = {
      actionQueue: [],
      turnCount: 0,
      energyEfficiency: 0,
      totalEnergy: 0
    };
  }
  
  // If in reward screen, select low-cost, high-value cards
  if (gameState.battleState === "REWARD") {
    if (gameState.availableRewards.length > 0) {
      // Prefer 0 or 1 cost cards
      const targetCardIndex = gameState.availableRewards.findIndex(card => 
        card.energy <= 1);
      
      if (targetCardIndex !== -1 && targetCardIndex !== gameState.selectedRewardIndex) {
        // Navigate to the target card
        if (targetCardIndex < gameState.selectedRewardIndex) {
          return 38; // UP
        } else {
          return 40; // DOWN
        }
      }
      
      // Select the card
      return 32; // SPACE
    }
  }
  
  // If it's enemy turn, we can't do anything
  if (gameState.turn === "ENEMY") {
    // Track energy efficiency at end of turn
    if (gameState.testData.turnCount !== gameState.player.turnCount) {
      gameState.testData.turnCount = gameState.player.turnCount;
      gameState.testData.totalEnergy += 3; // Assuming 3 energy per turn
      gameState.testData.energyEfficiency = 
        (gameState.testData.totalEnergy - gameState.energy) / gameState.testData.totalEnergy;
    }
    return null;
  }
  
  // If we have an action queue, execute it
  if (gameState.testData.actionQueue.length > 0) {
    return gameState.testData.actionQueue.shift();
  }
  
  // Sort cards by energy efficiency (damage or block per energy)
  let cardValues = [];
  
  for (let i = 0; i < gameState.hand.length; i++) {
    const card = gameState.hand[i];
    if (card.energy > gameState.energy) continue;
    
    let value = 0;
    
    // Estimate card value
    if (card.description.includes("damage") || card.description.includes("Deal")) {
      // Extract damage value
      const damageMatch = card.description.match(/(\d+)\s+damage/);
      if (damageMatch) {
        value = parseInt(damageMatch[1]) / Math.max(1, card.energy);
      }
    } else if (card.description.includes("block")) {
      // Extract block value
      const blockMatch = card.description.match(/(\d+)\s+block/);
      if (blockMatch) {
        value = parseInt(blockMatch[1]) / Math.max(1, card.energy);
      }
    } else if (card.description.includes("draw")) {
      // Card draw is valuable
      value = 5 / Math.max(1, card.energy);
    }
    
    // Zero cost cards are always good
    if (card.energy === 0) {
      value += 3;
    }
    
    cardValues.push({ index: i, value });
  }
  
  // Sort by value
  cardValues.sort((a, b) => b.value - a.value);
  
  // If we found a card to play
  if (cardValues.length > 0) {
    const bestCardIndex = cardValues[0].index;
    
    // Create action queue to navigate to and play the card
    const actions = [];
    
    // Navigate to the card
    while (gameState.selectedCardIndex !== bestCardIndex) {
      if (gameState.selectedCardIndex < bestCardIndex) {
        actions.push(40); // DOWN
      } else {
        actions.push(38); // UP
      }
    }
    
    // Play the card
    actions.push(32); // SPACE
    
    gameState.testData.actionQueue = actions;
    return gameState.testData.actionQueue.shift();
  }
  
  // If we can't play any cards, end turn
  return 90; // Z to end turn
}

// Test 5: Enemy AI and intention system testing
function getTestEnemyIntentionAction(gameState) {
  // Initialize test data if not present
  if (!gameState.testData) {
    gameState.testData = {
      actionQueue: [],
      lastEnemyIntention: null,
      intentionChanges: 0,
      intentionMatched: 0,
      totalIntentions: 0
    };
  }
  
  // If in reward screen, select balanced cards
  if (gameState.battleState === "REWARD") {
    return 32; // SPACE to select card
  }
  
  // If it's enemy turn, track intention changes
  if (gameState.turn === "ENEMY") {
    if (gameState.currentEnemy) {
      const currentIntention = gameState.currentEnemy.getCurrentIntention();
      
      // Count intention changes
      if (gameState.testData.lastEnemyIntention !== null && 
          currentIntention !== gameState.testData.lastEnemyIntention) {
        gameState.testData.intentionChanges++;
      }
      
      gameState.testData.lastEnemyIntention = currentIntention;
    }
    return null;
  }
  
  // If we have an action queue, execute it
  if (gameState.testData.actionQueue.length > 0) {
    return gameState.testData.actionQueue.shift();
  }
  
  // Check enemy intention and respond accordingly
  if (gameState.currentEnemy) {
    const enemyIntention = gameState.currentEnemy.getCurrentIntention();
    gameState.testData.totalIntentions++;
    
    // View enemy intention
    if (Math.random() < 0.2) {
      return 16; // SHIFT to view intentions
    }
    
    let bestCardIndex = -1;
    
    // If enemy is attacking, prioritize defense
    if (enemyIntention === "ATTACK" || enemyIntention === "HEAVY_ATTACK") {
      bestCardIndex = gameState.hand.findIndex(card => 
        card.type.name === "Skill" && 
        card.energy <= gameState.energy &&
        card.description.toLowerCase().includes("block"));
    } 
    // If enemy is defending or buffing, prioritize attack
    else if (enemyIntention === "DEFEND" || enemyIntention === "BUFF") {
      bestCardIndex = gameState.hand.findIndex(card => 
        card.type.name === "Attack" && 
        card.energy <= gameState.energy);
    }
    
    // If no specific card found, find any playable card
    if (bestCardIndex === -1) {
      bestCardIndex = gameState.hand.findIndex(card => card.energy <= gameState.energy);
    }
    
    // If we found a card to play
    if (bestCardIndex !== -1) {
      // Create action queue to navigate to and play the card
      const actions = [];
      
      // Navigate to the card
      while (gameState.selectedCardIndex !== bestCardIndex) {
        if (gameState.selectedCardIndex < bestCardIndex) {
          actions.push(40); // DOWN
        } else {
          actions.push(38); // UP
        }
      }
      
      // Play the card
      actions.push(32); // SPACE
      
      gameState.testData.actionQueue = actions;
      return gameState.testData.actionQueue.shift();
    }
  }
  
  // If we can't play any cards, end turn
  return 90; // Z to end turn
}

// Main testing controller function
export function game_testing_controller(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getStickyKeysAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestCardSelectionAction(gameState);
    case "TEST_4":
      return getTestEnergyManagementAction(gameState);
    case "TEST_5":
      return getTestEnemyIntentionAction(gameState);
    default:
      return null;
  }
}

// Expose the game_testing_controller function globally
window.game_testing_controller = game_testing_controller;
export default game_testing_controller;