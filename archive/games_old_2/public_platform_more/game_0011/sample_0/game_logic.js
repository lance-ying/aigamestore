// game_logic.js
import { gameState, GAME_PHASES, CATEGORIES } from './globals.js';
import { Player } from './player.js';
import { rollDice, calculateScore } from './dice.js';
import { getAIHoldDecision, getAICategoryChoice } from './ai.js';

export function initGame(p) {
  // Reset game state
  gameState.gamePhase = GAME_PHASES.PLAYING;
  gameState.currentPlayerIndex = 0;
  gameState.currentRound = 0;
  gameState.rollsLeft = 3;
  gameState.diceValues = [1, 1, 1, 1, 1];
  gameState.diceHeld = [false, false, false, false, false];
  gameState.selectedDiceIndex = -1;
  gameState.selectedCategoryIndex = 0;
  gameState.mustSelectCategory = false;
  gameState.showDiceAnimation = false;
  gameState.animationFrame = 0;
  gameState.winner = null;
  gameState.winnerScore = 0;
  
  // Create players
  gameState.players = [
    new Player("You", false),
    new Player("AI Easy", true, "easy"),
    new Player("AI Medium", true, "medium"),
    new Player("AI Hard", true, "hard")
  ];
  
  // Log game start
  p.logs.game_info.push({
    data: { phase: gameState.gamePhase, round: 0 },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Initial roll
  gameState.diceValues = rollDice(gameState.diceValues, gameState.diceHeld);
  gameState.rollsLeft = 2;
}

export function handleRoll(p) {
  if (gameState.rollsLeft > 0 && !gameState.mustSelectCategory) {
    gameState.diceValues = rollDice(gameState.diceValues, gameState.diceHeld);
    gameState.rollsLeft--;
    
    // If no more rolls, must select category
    if (gameState.rollsLeft === 0) {
      gameState.mustSelectCategory = true;
      gameState.selectedDiceIndex = -1;
    }
    
    // Log roll
    p.logs.game_info.push({
      data: { action: 'roll', dice: [...gameState.diceValues], rollsLeft: gameState.rollsLeft },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function handleDiceSelection(direction) {
  if (gameState.mustSelectCategory || gameState.rollsLeft === 0) return;
  
  if (direction === 'up') {
    gameState.selectedDiceIndex = (gameState.selectedDiceIndex - 1 + 5) % 5;
  } else if (direction === 'down') {
    gameState.selectedDiceIndex = (gameState.selectedDiceIndex + 1) % 5;
  } else if (direction === 'toggle' && gameState.selectedDiceIndex >= 0) {
    gameState.diceHeld[gameState.selectedDiceIndex] = !gameState.diceHeld[gameState.selectedDiceIndex];
  }
}

export function handleCategorySelection(direction) {
  if (!gameState.mustSelectCategory && gameState.rollsLeft > 0) return;
  
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const availableCategories = currentPlayer.getAvailableCategories();
  
  if (availableCategories.length === 0) return;
  
  // Find current category in available list
  let currentInAvailable = availableCategories.findIndex(
    cat => cat.id === CATEGORIES[gameState.selectedCategoryIndex].id
  );
  
  if (currentInAvailable === -1) {
    // Current selection is not available, find first available
    gameState.selectedCategoryIndex = CATEGORIES.findIndex(
      cat => cat.id === availableCategories[0].id
    );
    return;
  }
  
  if (direction === 'left') {
    currentInAvailable = (currentInAvailable - 1 + availableCategories.length) % availableCategories.length;
  } else if (direction === 'right') {
    currentInAvailable = (currentInAvailable + 1) % availableCategories.length;
  }
  
  gameState.selectedCategoryIndex = CATEGORIES.findIndex(
    cat => cat.id === availableCategories[currentInAvailable].id
  );
}

export function confirmCategorySelection(p) {
  if (!gameState.mustSelectCategory && gameState.rollsLeft > 0) return;
  
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const category = CATEGORIES[gameState.selectedCategoryIndex];
  
  if (currentPlayer.hasUsedCategory(category.id)) return;
  
  // Calculate and assign score
  const score = calculateScore(category.id, gameState.diceValues);
  currentPlayer.scores[category.id] = score;
  currentPlayer.calculateTotalScore();
  
  // Log scoring
  p.logs.game_info.push({
    data: { 
      action: 'score', 
      player: currentPlayer.name,
      category: category.id,
      score: score,
      totalScore: currentPlayer.totalScore
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Move to next player/turn
  advanceTurn(p);
}

export function advanceTurn(p) {
  gameState.currentPlayerIndex++;
  
  // Check if round complete
  if (gameState.currentPlayerIndex >= gameState.players.length) {
    gameState.currentPlayerIndex = 0;
    gameState.currentRound++;
    
    // Check if game complete
    if (gameState.currentRound >= gameState.totalRounds) {
      endGame(p);
      return;
    }
  }
  
  // Reset turn state
  gameState.rollsLeft = 3;
  gameState.diceHeld = [false, false, false, false, false];
  gameState.selectedDiceIndex = -1;
  gameState.mustSelectCategory = false;
  
  // Roll for new turn
  gameState.diceValues = rollDice(gameState.diceValues, gameState.diceHeld);
  gameState.rollsLeft = 2;
  
  // Find first available category
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const available = currentPlayer.getAvailableCategories();
  if (available.length > 0) {
    gameState.selectedCategoryIndex = CATEGORIES.findIndex(
      cat => cat.id === available[0].id
    );
  }
}

export function endGame(p) {
  // Calculate winner
  let highestScore = -1;
  let winner = null;
  
  gameState.players.forEach(player => {
    player.calculateTotalScore();
    if (player.totalScore > highestScore) {
      highestScore = player.totalScore;
      winner = player;
    }
  });
  
  gameState.winner = winner.name;
  gameState.winnerScore = winner.totalScore;
  
  // Check if human player won
  if (winner === gameState.players[0]) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
  } else {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
  }
  
  // Log game end
  p.logs.game_info.push({
    data: { 
      phase: gameState.gamePhase,
      winner: gameState.winner,
      score: gameState.winnerScore
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function updateAI(p) {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  if (!currentPlayer.isAI) return;
  
  // AI decision delay (for visual clarity)
  if (gameState.animationFrame < 30) {
    gameState.animationFrame++;
    return;
  }
  
  gameState.animationFrame = 0;
  
  if (gameState.mustSelectCategory || gameState.rollsLeft === 0) {
    // AI selects category
    const category = getAICategoryChoice(currentPlayer, gameState.diceValues);
    if (category) {
      gameState.selectedCategoryIndex = CATEGORIES.findIndex(cat => cat.id === category.id);
      confirmCategorySelection(p);
    }
  } else if (gameState.rollsLeft > 0) {
    // AI decides which dice to hold
    const holdDecision = getAIHoldDecision(currentPlayer, gameState.diceValues, gameState.rollsLeft);
    gameState.diceHeld = holdDecision;
    
    // AI rolls
    setTimeout(() => handleRoll(p), 100);
  }
}