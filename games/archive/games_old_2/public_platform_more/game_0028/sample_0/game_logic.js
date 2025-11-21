// game_logic.js - Core game mechanics

import { gameState, PHASE_PLAYING, PHASE_GAME_OVER_WIN } from './globals.js';
import { HABITAT_FOREST, HABITAT_GRASSLAND, HABITAT_WETLAND } from './globals.js';
import { FOOD_SEED, FOOD_BERRY, FOOD_FISH, FOOD_RODENT, ACTIONS_PER_ROUND } from './globals.js';

export function initializeGame(p) {
  gameState.currentRound = 1;
  gameState.actionsRemaining = ACTIONS_PER_ROUND[0];
  gameState.totalActions = ACTIONS_PER_ROUND[0];
  gameState.score = 0;
  gameState.eggsLaid = 0;
  gameState.birdsPlayed = 0;
  
  // Reset resources
  gameState.foodSupply[FOOD_SEED] = 2;
  gameState.foodSupply[FOOD_BERRY] = 1;
  gameState.foodSupply[FOOD_FISH] = 1;
  gameState.foodSupply[FOOD_RODENT] = 0;
  
  // Clear habitats
  gameState.habitats[HABITAT_FOREST] = [];
  gameState.habitats[HABITAT_GRASSLAND] = [];
  gameState.habitats[HABITAT_WETLAND] = [];
  
  // Deal initial hand
  gameState.hand = [];
  for (let i = 0; i < 5; i++) {
    drawCard();
  }
  
  // Reset UI
  gameState.selectedAction = null;
  gameState.selectedHabitat = null;
  gameState.selectedCardIndex = -1;
  gameState.uiMode = "ACTION_SELECT";
  gameState.menuIndex = 0;
  
  gameState.roundGoalScores = [0, 0, 0, 0];
  
  showMessage(p, "Round 1 - Start!");
}

export function drawCard() {
  if (gameState.birdDeck.length === 0) {
    // Reshuffle discard
    gameState.birdDeck = [...gameState.discardPile];
    gameState.discardPile = [];
    shuffleDeck();
  }
  
  if (gameState.birdDeck.length > 0 && gameState.hand.length < 8) {
    const card = gameState.birdDeck.pop();
    gameState.hand.push(card);
  }
}

export function shuffleDeck() {
  // Fisher-Yates shuffle
  for (let i = gameState.birdDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [gameState.birdDeck[i], gameState.birdDeck[j]] = [gameState.birdDeck[j], gameState.birdDeck[i]];
  }
}

export function canPlayBird(card, habitat) {
  if (card.habitat !== habitat) return false;
  
  // Check food cost
  const foodNeeded = {};
  for (const food of card.foodCost) {
    foodNeeded[food] = (foodNeeded[food] || 0) + 1;
  }
  
  for (const food in foodNeeded) {
    if (gameState.foodSupply[food] < foodNeeded[food]) {
      return false;
    }
  }
  
  return true;
}

export function playBird(p, card, habitat) {
  // Pay food cost
  for (const food of card.foodCost) {
    gameState.foodSupply[food]--;
  }
  
  // Add to habitat
  gameState.habitats[habitat].push(card);
  
  // Remove from hand
  const index = gameState.hand.indexOf(card);
  if (index > -1) {
    gameState.hand.splice(index, 1);
  }
  
  gameState.birdsPlayed++;
  gameState.actionsRemaining--;
  
  showMessage(p, `Played ${card.name} in ${habitat}`);
  
  checkRoundEnd(p);
}

export function activateHabitat(p, habitat) {
  const birds = gameState.habitats[habitat];
  
  for (const bird of birds) {
    if (bird.abilityType === "WHEN_ACTIVATED") {
      activateBirdAbility(p, bird);
    }
  }
  
  gameState.actionsRemaining--;
  showMessage(p, `Activated ${habitat}`);
  
  checkRoundEnd(p);
}

export function activateBirdAbility(p, bird) {
  const ability = bird.ability.toLowerCase();
  
  if (ability.includes("gain") && ability.includes("seed")) {
    const count = ability.includes("2") ? 2 : 1;
    gameState.foodSupply[FOOD_SEED] += count;
  } else if (ability.includes("gain") && ability.includes("berry")) {
    const count = ability.includes("2") ? 2 : 1;
    gameState.foodSupply[FOOD_BERRY] += count;
  } else if (ability.includes("gain") && ability.includes("fish")) {
    const count = ability.includes("2") ? 2 : 1;
    gameState.foodSupply[FOOD_FISH] += count;
  } else if (ability.includes("gain") && ability.includes("rodent")) {
    const count = ability.includes("2") ? 2 : 1;
    gameState.foodSupply[FOOD_RODENT] += count;
  } else if (ability.includes("lay") && ability.includes("egg")) {
    const count = ability.includes("2") ? 2 : 1;
    // Lay eggs on this bird
    for (let i = 0; i < count; i++) {
      if (bird.eggs < bird.maxEggs) {
        bird.eggs++;
        gameState.eggsLaid++;
      }
    }
  } else if (ability.includes("draw") && ability.includes("card")) {
    const count = ability.includes("2") ? 2 : 1;
    for (let i = 0; i < count; i++) {
      drawCard();
    }
  }
}

export function gainFood(p, foodType) {
  gameState.foodSupply[foodType]++;
  gameState.actionsRemaining--;
  
  showMessage(p, `Gained ${foodType}`);
  checkRoundEnd(p);
}

export function layEggs(p, bird) {
  if (bird.eggs < bird.maxEggs) {
    bird.eggs++;
    gameState.eggsLaid++;
    gameState.actionsRemaining--;
    
    showMessage(p, `Laid egg on ${bird.name}`);
    checkRoundEnd(p);
  }
}

export function drawCardsAction(p) {
  drawCard();
  drawCard();
  gameState.actionsRemaining--;
  
  showMessage(p, "Drew 2 cards");
  checkRoundEnd(p);
}

export function checkRoundEnd(p) {
  if (gameState.actionsRemaining <= 0) {
    endRound(p);
  }
}

export function endRound(p) {
  // Calculate round goal
  const goal = gameState.roundGoals[gameState.currentRound - 1];
  let playerScore = 0;
  
  if (goal.habitat) {
    playerScore = gameState.habitats[goal.habitat].length;
  } else if (goal.type === "EGGS") {
    playerScore = gameState.eggsLaid;
  }
  
  gameState.roundGoalScores[gameState.currentRound - 1] = Math.min(playerScore, 5);
  
  gameState.currentRound++;
  
  if (gameState.currentRound > 4) {
    endGame(p);
  } else {
    gameState.actionsRemaining = ACTIONS_PER_ROUND[gameState.currentRound - 1];
    gameState.totalActions = ACTIONS_PER_ROUND[gameState.currentRound - 1];
    gameState.uiMode = "ACTION_SELECT";
    gameState.menuIndex = 0;
    showMessage(p, `Round ${gameState.currentRound} - Start!`);
  }
}

export function endGame(p) {
  calculateFinalScore();
  
  if (gameState.score >= 30) {
    gameState.gamePhase = PHASE_GAME_OVER_WIN;
  } else {
    gameState.gamePhase = "GAME_OVER_LOSE";
  }
  
  p.logs.game_info.push({
    data: { phase: gameState.gamePhase, finalScore: gameState.score },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function calculateFinalScore() {
  let total = 0;
  
  // Bird points
  for (const habitat in gameState.habitats) {
    for (const bird of gameState.habitats[habitat]) {
      total += bird.points;
      total += bird.eggs; // Each egg worth 1 point
    }
  }
  
  // Round goals
  for (const score of gameState.roundGoalScores) {
    total += score;
  }
  
  gameState.score = total;
}

export function showMessage(p, text) {
  gameState.messageText = text;
  gameState.messageTimer = 120; // 2 seconds at 60fps
}

export function updateMessage() {
  if (gameState.messageTimer > 0) {
    gameState.messageTimer--;
  }
}