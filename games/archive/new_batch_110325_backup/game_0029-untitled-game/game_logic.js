// game_logic.js - Core game logic

import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, WORD_CARDS } from './globals.js';
import { createCardDeck } from './card.js';

export function initializeGame(p) {
  // Copy word cards to game state
  gameState.allCards = [...WORD_CARDS];
  
  // Reset scores and round data
  gameState.score = 0;
  gameState.currentRound = 0;
  gameState.roundScores = [];
  gameState.cardsCompleted = 0;
  gameState.cardsSkipped = 0;
  gameState.cardsIncorrect = 0;
  
  // Set total rounds from menu selection
  gameState.totalRounds = [3, 4, 5][gameState.menuSelection];
  
  // Initialize entities array
  gameState.entities = [];
  
  // Create player object (for logging purposes)
  gameState.player = {
    x: 300,
    y: 200,
    state: "idle"
  };
  
  // Start first round
  startNewRound(p);
}

export function startNewRound(p) {
  gameState.roundTimeRemaining = gameState.roundTimeLimit;
  gameState.roundStartTime = Date.now();
  
  // Create shuffled deck for this round
  gameState.entities = createCardDeck(p);
  gameState.currentCardIndex = 0;
  gameState.currentCard = gameState.entities[0];
  
  gameState.feedbackMessage = "";
  gameState.feedbackTimer = 0;
  gameState.cardTransition = 0;
  
  // Reset round counters
  const roundStart = {
    completed: gameState.cardsCompleted,
    skipped: gameState.cardsSkipped,
    incorrect: gameState.cardsIncorrect
  };
  gameState.roundStartStats = roundStart;
}

export function updateGame(p) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  // Update timer
  const elapsed = (Date.now() - gameState.roundStartTime) / 1000;
  gameState.roundTimeRemaining = Math.max(0, gameState.roundTimeLimit - elapsed);
  
  // Check if round time is up
  if (gameState.roundTimeRemaining <= 0) {
    endRound(p);
    return;
  }
  
  // Update feedback timer
  if (gameState.feedbackTimer > 0) {
    gameState.feedbackTimer--;
  }
  
  // Update card transition animation
  if (gameState.cardTransition > 0) {
    gameState.cardTransition *= 0.85;
    if (gameState.cardTransition < 0.5) {
      gameState.cardTransition = 0;
    }
  }
  
  // Update player position for logging
  if (gameState.player) {
    gameState.player.x = 300;
    gameState.player.y = 200;
    gameState.player.state = gameState.feedbackTimer > 0 ? "action" : "waiting";
  }
}

export function markCardCorrect(p) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  if (gameState.feedbackTimer > 0) return;
  
  gameState.score += 1;
  gameState.cardsCompleted++;
  gameState.feedbackMessage = "CORRECT!";
  gameState.feedbackTimer = 30;
  
  advanceToNextCard(p);
}

export function markCardSkip(p) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  if (gameState.feedbackTimer > 0) return;
  
  gameState.cardsSkipped++;
  gameState.feedbackMessage = "SKIPPED";
  gameState.feedbackTimer = 20;
  
  advanceToNextCard(p);
}

export function markCardIncorrect(p) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  if (gameState.feedbackTimer > 0) return;
  
  gameState.score = Math.max(0, gameState.score - 1);
  gameState.cardsIncorrect++;
  gameState.feedbackMessage = "INCORRECT!";
  gameState.feedbackTimer = 30;
  
  advanceToNextCard(p);
}

function advanceToNextCard(p) {
  gameState.currentCardIndex++;
  
  if (gameState.currentCardIndex >= gameState.entities.length) {
    // Reshuffle deck if we run out of cards
    gameState.entities = createCardDeck(p);
    gameState.currentCardIndex = 0;
  }
  
  gameState.currentCard = gameState.entities[gameState.currentCardIndex];
  gameState.cardTransition = 20;
}

function endRound(p) {
  // Calculate round score
  const roundCorrect = gameState.cardsCompleted - (gameState.roundStartStats?.completed || 0);
  const roundIncorrect = gameState.cardsIncorrect - (gameState.roundStartStats?.incorrect || 0);
  const roundScore = roundCorrect - roundIncorrect;
  
  gameState.roundScores.push({
    score: roundScore,
    correct: roundCorrect,
    incorrect: roundIncorrect
  });
  
  gameState.currentRound++;
  
  if (gameState.currentRound >= gameState.totalRounds) {
    // Game over
    if (gameState.score >= 10) {
      gameState.gamePhase = PHASE_GAME_OVER_WIN;
    } else {
      gameState.gamePhase = PHASE_GAME_OVER_LOSE;
    }
    
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, finalScore: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else {
    // Start next round
    startNewRound(p);
  }
}

export function handleMenuNavigation(direction) {
  if (direction === "left") {
    gameState.menuSelection = Math.max(0, gameState.menuSelection - 1);
  } else if (direction === "right") {
    gameState.menuSelection = Math.min(2, gameState.menuSelection + 1);
  }
}