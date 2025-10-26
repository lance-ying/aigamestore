// gameLogic.js - Core game logic

import { gameState, GAME_TYPES } from './globals.js';
import { createDeck, shuffleDeck, Card } from './card.js';
import { 
  canPlayCard, 
  determineWinner, 
  calculatePoints, 
  getNextBid,
  isTrump 
} from './skatRules.js';
import { AIPlayer } from './ai.js';

let aiPlayers = [];

export function initializeGame(p) {
  // Reset game state
  gameState.level = 1;
  gameState.roundsInLevel = 0;
  gameState.roundsWonInLevel = 0;
  gameState.cumulativeScore = 0;
  
  // Create AI players
  aiPlayers = [
    null, // Human player
    new AIPlayer(1, 'easy'),
    new AIPlayer(2, 'easy')
  ];
  
  startNewRound(p);
}

export function startNewRound(p) {
  // Update AI difficulty based on level
  if (gameState.level === 1) {
    aiPlayers[1] = new AIPlayer(1, 'easy');
    aiPlayers[2] = new AIPlayer(2, 'easy');
  } else if (gameState.level === 2) {
    aiPlayers[1] = new AIPlayer(1, 'medium');
    aiPlayers[2] = new AIPlayer(2, 'medium');
  } else {
    aiPlayers[1] = new AIPlayer(1, 'hard');
    aiPlayers[2] = new AIPlayer(2, 'hard');
  }
  
  // Reset round state
  gameState.deck = shuffleDeck(createDeck(), p);
  gameState.playerHands = [[], [], []];
  gameState.skatCards = [];
  gameState.currentTrick = [];
  gameState.collectedTricks = [[], [], []];
  gameState.discardedCards = [];
  
  gameState.biddingPhase = true;
  gameState.currentBidValue = 18;
  gameState.activeBidders = [true, true, true];
  gameState.declarer = -1;
  gameState.biddingPlayerIndex = 0;
  
  gameState.gameType = null;
  gameState.trumpSuit = null;
  gameState.skatTaken = false;
  gameState.cardsToDiscard = 0;
  
  gameState.trickNumber = 0;
  gameState.currentPlayerIndex = 0;
  gameState.leadPlayerIndex = 0;
  
  gameState.selectedCardIndex = 0;
  gameState.selectedGameTypeIndex = 0;
  
  gameState.declarerPoints = 0;
  gameState.opponentPoints = 0;
  gameState.roundWinner = null;
  gameState.roundComplete = false;
  
  // Deal cards
  dealCards();
}

export function dealCards() {
  let cardIndex = 0;
  
  // Deal 10 cards to each player
  for (let i = 0; i < 10; i++) {
    for (let player = 0; player < 3; player++) {
      gameState.playerHands[player].push(gameState.deck[cardIndex++]);
    }
  }
  
  // Deal 2 cards to Skat
  gameState.skatCards = [gameState.deck[cardIndex++], gameState.deck[cardIndex++]];
}

export function updateBidding(p) {
  const currentPlayer = gameState.biddingPlayerIndex;
  
  if (!gameState.activeBidders[currentPlayer]) {
    // Move to next player
    gameState.biddingPlayerIndex = (gameState.biddingPlayerIndex + 1) % 3;
    
    // Check if bidding is done
    const activeBidderCount = gameState.activeBidders.filter(b => b).length;
    if (activeBidderCount <= 1) {
      finalizeBidding();
    }
    return;
  }
  
  if (currentPlayer !== 0 && gameState.controlMode === "HUMAN") {
    // AI turn to bid
    const ai = aiPlayers[currentPlayer];
    const shouldBid = ai.decideBid(gameState.currentBidValue, gameState.playerHands[currentPlayer]);
    
    if (shouldBid) {
      gameState.currentBidValue = getNextBid(gameState.currentBidValue);
      gameState.biddingPlayerIndex = (gameState.biddingPlayerIndex + 1) % 3;
    } else {
      gameState.activeBidders[currentPlayer] = false;
      gameState.biddingPlayerIndex = (gameState.biddingPlayerIndex + 1) % 3;
    }
    
    // Check if bidding is done
    const activeBidderCount = gameState.activeBidders.filter(b => b).length;
    if (activeBidderCount <= 1) {
      finalizeBidding();
    }
  }
}

export function handleBid() {
  if (gameState.biddingPlayerIndex === 0 && gameState.activeBidders[0]) {
    gameState.currentBidValue = getNextBid(gameState.currentBidValue);
    gameState.biddingPlayerIndex = (gameState.biddingPlayerIndex + 1) % 3;
  }
}

export function handlePass() {
  if (gameState.biddingPlayerIndex === 0 && gameState.activeBidders[0]) {
    gameState.activeBidders[0] = false;
    gameState.biddingPlayerIndex = (gameState.biddingPlayerIndex + 1) % 3;
    
    const activeBidderCount = gameState.activeBidders.filter(b => b).length;
    if (activeBidderCount <= 1) {
      finalizeBidding();
    }
  }
}

export function finalizeBidding() {
  gameState.biddingPhase = false;
  
  // Find declarer (last active bidder)
  for (let i = 0; i < 3; i++) {
    if (gameState.activeBidders[i]) {
      gameState.declarer = i;
      break;
    }
  }
  
  // If no one bid, player 0 becomes declarer by default
  if (gameState.declarer === -1) {
    gameState.declarer = 0;
  }
  
  gameState.currentPlayerIndex = gameState.declarer;
}

export function handleTakeSkat() {
  if (gameState.declarer === 0 && !gameState.skatTaken && !gameState.gameType) {
    // Add Skat cards to hand
    gameState.playerHands[0].push(...gameState.skatCards);
    gameState.skatCards = [];
    gameState.skatTaken = true;
    gameState.cardsToDiscard = 2;
  }
}

export function handleDiscardCard() {
  if (gameState.cardsToDiscard > 0 && gameState.declarer === 0) {
    const hand = gameState.playerHands[0];
    if (gameState.selectedCardIndex >= 0 && gameState.selectedCardIndex < hand.length) {
      const card = hand.splice(gameState.selectedCardIndex, 1)[0];
      gameState.discardedCards.push(card);
      gameState.cardsToDiscard--;
      
      if (gameState.selectedCardIndex >= hand.length) {
        gameState.selectedCardIndex = Math.max(0, hand.length - 1);
      }
    }
  }
}

export function handleGameTypeSelection() {
  if (gameState.declarer === 0 && gameState.cardsToDiscard === 0 && !gameState.gameType) {
    const gameTypes = ['CLUBS', 'SPADES', 'HEARTS', 'DIAMONDS', 'GRAND'];
    gameState.gameType = gameTypes[gameState.selectedGameTypeIndex];
    
    if (gameState.gameType === 'GRAND') {
      gameState.trumpSuit = null;
    } else {
      gameState.trumpSuit = gameState.gameType;
    }
    
    gameState.currentPlayerIndex = gameState.declarer;
    gameState.leadPlayerIndex = gameState.declarer;
  }
}

export function updateAIGameTypeSelection() {
  if (gameState.declarer !== 0 && gameState.cardsToDiscard === 0 && !gameState.gameType) {
    const ai = aiPlayers[gameState.declarer];
    
    // AI takes Skat
    if (!gameState.skatTaken) {
      gameState.playerHands[gameState.declarer].push(...gameState.skatCards);
      gameState.skatCards = [];
      gameState.skatTaken = true;
      
      // AI discards
      const discards = ai.chooseCardsToDiscard(gameState.playerHands[gameState.declarer]);
      for (let card of discards) {
        const index = gameState.playerHands[gameState.declarer].indexOf(card);
        if (index >= 0) {
          gameState.playerHands[gameState.declarer].splice(index, 1);
          gameState.discardedCards.push(card);
        }
      }
    }
    
    // AI chooses game type
    gameState.gameType = ai.chooseGameType(gameState.playerHands[gameState.declarer]);
    if (gameState.gameType === 'GRAND') {
      gameState.trumpSuit = null;
    } else {
      gameState.trumpSuit = gameState.gameType;
    }
    
    gameState.currentPlayerIndex = gameState.declarer;
    gameState.leadPlayerIndex = gameState.declarer;
  }
}

export function handlePlayCard() {
  const currentPlayer = gameState.currentPlayerIndex;
  
  if (currentPlayer === 0) {
    const hand = gameState.playerHands[0];
    if (gameState.selectedCardIndex >= 0 && gameState.selectedCardIndex < hand.length) {
      const card = hand[gameState.selectedCardIndex];
      
      if (canPlayCard(card, hand, gameState.currentTrick.map(t => t.card), 
                      gameState.gameType, gameState.trumpSuit)) {
        playCard(currentPlayer, gameState.selectedCardIndex);
      }
    }
  }
}

export function playCard(playerIndex, cardIndex) {
  const hand = gameState.playerHands[playerIndex];
  const card = hand.splice(cardIndex, 1)[0];
  
  gameState.currentTrick.push({
    playerIndex: playerIndex,
    card: card
  });
  
  // Log player action
  if (playerIndex === 0 && gameState.player) {
    gameState.player.cardPlayed = card.rank + ' of ' + card.suit;
  }
  
  if (gameState.currentTrick.length === 3) {
    // Trick complete
    setTimeout(() => resolveTrick(), 1000);
  } else {
    // Next player
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % 3;
    
    if (gameState.selectedCardIndex >= gameState.playerHands[0].length) {
      gameState.selectedCardIndex = Math.max(0, gameState.playerHands[0].length - 1);
    }
  }
}

export function resolveTrick() {
  const winnerIndex = determineWinner(
    gameState.currentTrick,
    gameState.gameType,
    gameState.trumpSuit
  );
  
  // Add cards to winner's collected tricks
  for (let play of gameState.currentTrick) {
    gameState.collectedTricks[winnerIndex].push(play.card);
  }
  
  gameState.currentTrick = [];
  gameState.trickNumber++;
  gameState.currentPlayerIndex = winnerIndex;
  gameState.leadPlayerIndex = winnerIndex;
  
  if (gameState.selectedCardIndex >= gameState.playerHands[0].length) {
    gameState.selectedCardIndex = Math.max(0, gameState.playerHands[0].length - 1);
  }
  
  // Check if round is complete
  if (gameState.trickNumber === 10) {
    endRound();
  }
}

export function endRound() {
  // Calculate points
  gameState.declarerPoints = calculatePoints(gameState.collectedTricks[gameState.declarer]);
  gameState.declarerPoints += calculatePoints(gameState.discardedCards);
  
  gameState.opponentPoints = 0;
  for (let i = 0; i < 3; i++) {
    if (i !== gameState.declarer) {
      gameState.opponentPoints += calculatePoints(gameState.collectedTricks[i]);
    }
  }
  
  // Determine winner
  if (gameState.declarerPoints >= 61) {
    gameState.roundWinner = 'DECLARER';
    
    // Award points
    let roundScore = 100;
    if (gameState.declarer === 0) {
      roundScore = 100;
    } else {
      roundScore = 50; // Won as opponent
    }
    
    // Bonuses
    if (gameState.opponentPoints < 31) {
      roundScore += 25; // Schneider
    }
    if (gameState.opponentPoints === 0) {
      roundScore += 50; // Schwarz
    }
    if (gameState.gameType === 'GRAND') {
      roundScore += 50;
    }
    
    if (gameState.declarer === 0) {
      gameState.cumulativeScore += roundScore;
      gameState.roundsWonInLevel++;
    }
    
    gameState.lastRoundScore = roundScore;
  } else {
    gameState.roundWinner = 'OPPONENTS';
    
    let roundScore = 50; // Won as opponent
    if (gameState.declarer !== 0) {
      // Human was opponent and won
      gameState.cumulativeScore += roundScore;
      gameState.roundsWonInLevel++;
    }
    
    gameState.lastRoundScore = gameState.declarer !== 0 ? roundScore : 0;
  }
  
  gameState.roundComplete = true;
}

export function handleRoundContinue() {
  gameState.roundsInLevel++;
  
  // Check level completion
  if (gameState.roundsInLevel >= 3) {
    if (gameState.roundsWonInLevel >= 2) {
      // Level complete
      gameState.cumulativeScore += 200; // Level bonus
      
      if (gameState.level >= 3) {
        // Game won
        gameState.gamePhase = "GAME_OVER_WIN";
      } else {
        // Next level
        gameState.level++;
        gameState.roundsInLevel = 0;
        gameState.roundsWonInLevel = 0;
        gameState.roundComplete = false;
        startNewRound(window.gameInstance);
      }
    } else {
      // Level failed
      gameState.gamePhase = "GAME_OVER_LOSE";
    }
  } else {
    // Next round
    gameState.roundComplete = false;
    startNewRound(window.gameInstance);
  }
}

export function updateAITurn(p) {
  if (gameState.currentPlayerIndex === 0 || gameState.controlMode !== "HUMAN") return;
  if (gameState.currentTrick.length >= 3) return;
  if (gameState.roundComplete) return;
  
  const ai = aiPlayers[gameState.currentPlayerIndex];
  const hand = gameState.playerHands[gameState.currentPlayerIndex];
  
  const card = ai.chooseCardToPlay(
    hand,
    gameState.currentTrick.map(t => t.card),
    gameState.gameType,
    gameState.trumpSuit
  );
  
  if (card) {
    const cardIndex = hand.indexOf(card);
    if (cardIndex >= 0) {
      setTimeout(() => playCard(gameState.currentPlayerIndex, cardIndex), 500);
    }
  }
}

export function getAIPlayers() {
  return aiPlayers;
}