// game_logic.js
import { gameState, GAME_PHASES, ACTIONS, FOOD_TYPES, HABITATS } from './globals.js';
import { Bird, createBirdDeck } from './bird.js';

export function initializeGame(p) {
  gameState.round = 1;
  gameState.turnsThisRound = 0;
  gameState.score = 0;
  
  // Initialize food
  gameState.food = {
    [FOOD_TYPES.WORM]: 2,
    [FOOD_TYPES.SEED]: 2,
    [FOOD_TYPES.FISH]: 1,
    [FOOD_TYPES.BERRY]: 1
  };
  
  // Create bird deck
  gameState.availableBirds = createBirdDeck();
  
  // Shuffle birds
  for (let i = gameState.availableBirds.length - 1; i > 0; i--) {
    const j = Math.floor(p.random() * (i + 1));
    [gameState.availableBirds[i], gameState.availableBirds[j]] = 
      [gameState.availableBirds[j], gameState.availableBirds[i]];
  }
  
  // Draw initial hand
  gameState.handCards = [];
  for (let i = 0; i < 5; i++) {
    if (gameState.availableBirds.length > 0) {
      gameState.handCards.push(gameState.availableBirds.pop());
    }
  }
  
  // Initialize board
  gameState.board = {
    [HABITATS.FOREST]: [],
    [HABITATS.GRASSLAND]: [],
    [HABITATS.WETLAND]: []
  };
  
  // Reset UI state
  gameState.selectedAction = null;
  gameState.selectedHabitat = null;
  gameState.selectedCardIndex = -1;
  gameState.selectedBirdSlot = -1;
  gameState.actionPhase = "SELECT_ACTION";
  gameState.showingMessage = false;
  gameState.animating = false;
}

export function selectAction(action) {
  gameState.selectedAction = action;
  
  switch(action) {
    case ACTIONS.PLAY_BIRD:
      if (gameState.handCards.length === 0) {
        showMessage("No birds in hand!");
        gameState.selectedAction = null;
        return;
      }
      gameState.actionPhase = "SELECT_CARD";
      gameState.selectedCardIndex = 0;
      break;
      
    case ACTIONS.GAIN_FOOD:
      executeGainFood();
      break;
      
    case ACTIONS.LAY_EGGS:
      executeLayEggs();
      break;
      
    case ACTIONS.DRAW_CARDS:
      executeDrawCards();
      break;
  }
}

export function executeGainFood() {
  // Gain random food based on available types
  const foodTypes = Object.values(FOOD_TYPES);
  const randomFood = foodTypes[Math.floor(Math.random() * foodTypes.length)];
  gameState.food[randomFood]++;
  
  // Activate forest habitat
  activateHabitat(HABITATS.FOREST);
  
  showMessage(`Gained 1 ${randomFood}!`);
  endTurn();
}

export function executeLayEggs() {
  // Lay eggs on birds in grassland
  let eggsLaid = 0;
  const grasslandBirds = gameState.board[HABITATS.GRASSLAND];
  
  for (let bird of grasslandBirds) {
    if (bird.addEgg()) {
      eggsLaid++;
      if (eggsLaid >= 2) break; // Max 2 eggs per turn
    }
  }
  
  // Activate grassland habitat
  activateHabitat(HABITATS.GRASSLAND);
  
  if (eggsLaid > 0) {
    showMessage(`Laid ${eggsLaid} egg(s)!`);
  } else {
    showMessage("No space for eggs!");
  }
  
  endTurn();
}

export function executeDrawCards() {
  // Draw cards from deck
  let cardsDrawn = 0;
  for (let i = 0; i < 2; i++) {
    if (gameState.availableBirds.length > 0) {
      gameState.handCards.push(gameState.availableBirds.pop());
      cardsDrawn++;
    }
  }
  
  // Activate wetland habitat
  activateHabitat(HABITATS.WETLAND);
  
  if (cardsDrawn > 0) {
    showMessage(`Drew ${cardsDrawn} card(s)!`);
  } else {
    showMessage("No cards left to draw!");
  }
  
  endTurn();
}

export function selectCard(index) {
  if (index >= 0 && index < gameState.handCards.length) {
    gameState.selectedCardIndex = index;
    const bird = gameState.handCards[index];
    
    // Check if we can afford this bird
    if (!canAffordBird(bird)) {
      showMessage("Not enough food!");
      return;
    }
    
    gameState.selectedHabitat = bird.habitat;
    gameState.actionPhase = "SELECT_SLOT";
    gameState.selectedBirdSlot = 0;
  }
}

export function canAffordBird(bird) {
  const foodCopy = {...gameState.food};
  
  for (let foodType of bird.foodCost) {
    if (foodCopy[foodType] > 0) {
      foodCopy[foodType]--;
    } else {
      return false;
    }
  }
  
  return true;
}

export function playBird() {
  if (gameState.selectedCardIndex < 0) return;
  
  const bird = gameState.handCards[gameState.selectedCardIndex];
  const habitat = bird.habitat;
  const slot = gameState.selectedBirdSlot;
  
  // Pay food cost
  for (let foodType of bird.foodCost) {
    gameState.food[foodType]--;
  }
  
  // Remove from hand
  gameState.handCards.splice(gameState.selectedCardIndex, 1);
  
  // Add to board at the correct position
  const habitatRow = gameState.board[habitat];
  if (slot <= habitatRow.length) {
    habitatRow.splice(slot, 0, bird);
  }
  
  // Activate habitat
  activateHabitat(habitat);
  
  showMessage(`Played ${bird.name}!`);
  endTurn();
}

export function activateHabitat(habitat) {
  const birds = gameState.board[habitat];
  
  // Activate from right to left (newest to oldest)
  for (let i = birds.length - 1; i >= 0; i--) {
    const bird = birds[i];
    
    if (bird.powerType) {
      activateBirdPower(bird);
    }
  }
}

export function activateBirdPower(bird) {
  switch(bird.powerType) {
    case "GAIN_FOOD":
      const foodTypes = Object.values(FOOD_TYPES);
      const randomFood = foodTypes[Math.floor(Math.random() * foodTypes.length)];
      gameState.food[randomFood]++;
      break;
      
    case "LAY_EGG":
      bird.addEgg();
      break;
      
    case "DRAW_CARD":
      if (gameState.availableBirds.length > 0) {
        gameState.handCards.push(gameState.availableBirds.pop());
      }
      break;
      
    case "BONUS_POINTS":
      gameState.score += 2;
      break;
  }
}

export function endTurn() {
  gameState.turnsThisRound++;
  gameState.selectedAction = null;
  gameState.selectedCardIndex = -1;
  gameState.selectedHabitat = null;
  gameState.selectedBirdSlot = -1;
  gameState.actionPhase = "SELECT_ACTION";
  
  // Check if round is over
  if (gameState.turnsThisRound >= gameState.maxTurnsPerRound) {
    endRound();
  }
}

export function endRound() {
  gameState.round++;
  gameState.turnsThisRound = 0;
  
  // Award points for round completion
  gameState.score += 5;
  
  if (gameState.round > gameState.maxRounds) {
    endGame();
  } else {
    showMessage(`Round ${gameState.round} starting!`);
  }
}

export function endGame() {
  // Calculate final score
  let finalScore = gameState.score;
  
  // Add points from birds
  for (let habitat in gameState.board) {
    for (let bird of gameState.board[habitat]) {
      finalScore += bird.pointValue;
      finalScore += bird.eggs; // 1 point per egg
    }
  }
  
  gameState.score = finalScore;
  
  // Win condition: score >= 50
  if (gameState.score >= 50) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
  } else {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
  }
}

export function showMessage(msg) {
  gameState.showingMessage = true;
  gameState.message = msg;
  gameState.messageTimer = 60; // Show for 1 second
}

export function updateMessage() {
  if (gameState.showingMessage) {
    gameState.messageTimer--;
    if (gameState.messageTimer <= 0) {
      gameState.showingMessage = false;
    }
  }
}