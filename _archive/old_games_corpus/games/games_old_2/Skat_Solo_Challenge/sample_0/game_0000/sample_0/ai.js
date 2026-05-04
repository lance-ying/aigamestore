// ai.js - AI player logic

import { gameState } from './globals.js';
import { isTrump, canPlayCard, getTrumpRank, getSuitRank } from './skatRules.js';

export class AIPlayer {
  constructor(playerIndex, difficulty) {
    this.playerIndex = playerIndex;
    this.difficulty = difficulty; // 'easy', 'medium', 'hard'
  }
  
  decideBid(currentBid, hand) {
    if (this.difficulty === 'easy') {
      // Random bidding - 30% chance to bid
      if (Math.random() < 0.3 && hand.length >= 8) {
        return true;
      }
      return false;
    } else if (this.difficulty === 'medium') {
      // Basic heuristic - count jacks and high cards
      const jacks = hand.filter(c => c.rank === 'J').length;
      const aces = hand.filter(c => c.rank === 'A').length;
      const tens = hand.filter(c => c.rank === '10').length;
      
      const strength = jacks * 3 + aces * 2 + tens;
      return strength >= 6 && currentBid < 35;
    } else {
      // Advanced - evaluate best possible game
      const jacks = hand.filter(c => c.rank === 'J').length;
      const strength = this.evaluateHandStrength(hand);
      
      if (jacks >= 3 && currentBid < 50) return true;
      if (strength > 40 && currentBid < 40) return true;
      if (strength > 30 && currentBid < 30) return true;
      
      return false;
    }
  }
  
  evaluateHandStrength(hand) {
    let maxStrength = 0;
    
    for (let suit of ['CLUBS', 'SPADES', 'HEARTS', 'DIAMONDS']) {
      const suitCards = hand.filter(c => c.suit === suit);
      const jacks = hand.filter(c => c.rank === 'J').length;
      const strength = suitCards.length * 5 + jacks * 8;
      maxStrength = Math.max(maxStrength, strength);
    }
    
    return maxStrength;
  }
  
  chooseGameType(hand) {
    const jacks = hand.filter(c => c.rank === 'J').length;
    
    if (this.difficulty === 'easy') {
      // Pick first suit with most cards
      let bestSuit = 'CLUBS';
      let maxCount = 0;
      for (let suit of ['CLUBS', 'SPADES', 'HEARTS', 'DIAMONDS']) {
        const count = hand.filter(c => c.suit === suit).length;
        if (count > maxCount) {
          maxCount = count;
          bestSuit = suit;
        }
      }
      return bestSuit;
    } else if (this.difficulty === 'medium') {
      // Prefer Grand if 3+ jacks
      if (jacks >= 3) return 'GRAND';
      
      // Otherwise pick suit with most cards
      let bestSuit = 'CLUBS';
      let maxCount = 0;
      for (let suit of ['CLUBS', 'SPADES', 'HEARTS', 'DIAMONDS']) {
        const count = hand.filter(c => c.suit === suit).length;
        if (count > maxCount) {
          maxCount = count;
          bestSuit = suit;
        }
      }
      return bestSuit;
    } else {
      // Advanced - evaluate each game type
      if (jacks >= 3) return 'GRAND';
      
      let bestSuit = 'CLUBS';
      let maxStrength = 0;
      for (let suit of ['CLUBS', 'SPADES', 'HEARTS', 'DIAMONDS']) {
        const suitCards = hand.filter(c => c.suit === suit);
        const strength = suitCards.reduce((sum, c) => sum + c.value, 0) + jacks * 8;
        if (strength > maxStrength) {
          maxStrength = strength;
          bestSuit = suit;
        }
      }
      return bestSuit;
    }
  }
  
  chooseCardToPlay(hand, currentTrick, gameType, trumpSuit) {
    const validCards = hand.filter(card => 
      canPlayCard(card, hand, currentTrick, gameType, trumpSuit)
    );
    
    if (validCards.length === 0) return null;
    
    if (this.difficulty === 'easy') {
      // Random valid card
      return validCards[Math.floor(Math.random() * validCards.length)];
    } else if (this.difficulty === 'medium') {
      return this.playMediumStrategy(validCards, currentTrick, gameType, trumpSuit);
    } else {
      return this.playHardStrategy(validCards, currentTrick, gameType, trumpSuit, hand);
    }
  }
  
  playMediumStrategy(validCards, currentTrick, gameType, trumpSuit) {
    if (currentTrick.length === 0) {
      // Lead with high non-trump or trump
      const nonTrumps = validCards.filter(c => !isTrump(c, gameType, trumpSuit));
      if (nonTrumps.length > 0) {
        return nonTrumps.reduce((best, card) => 
          card.value > best.value ? card : best
        );
      }
      return validCards[0];
    } else {
      // Try to win or dump low card
      const trumps = validCards.filter(c => isTrump(c, gameType, trumpSuit));
      if (trumps.length > 0 && currentTrick.length < 3) {
        return trumps[trumps.length - 1]; // Play lowest trump
      }
      
      // Play highest valid card to try winning
      return validCards.reduce((best, card) => 
        card.value > best.value ? card : best
      );
    }
  }
  
  playHardStrategy(validCards, currentTrick, gameType, trumpSuit, fullHand) {
    const isPartner = gameState.declarer === this.playerIndex;
    
    if (currentTrick.length === 0) {
      // Strategic lead
      const trumps = validCards.filter(c => isTrump(c, gameType, trumpSuit));
      const nonTrumps = validCards.filter(c => !isTrump(c, gameType, trumpSuit));
      
      if (!isPartner && trumps.length > 0) {
        // Opponents: lead with trump to draw declarer's trumps
        return trumps.reduce((best, card) => 
          getTrumpRank(card, gameType, trumpSuit) > getTrumpRank(best, gameType, trumpSuit) ? card : best
        );
      }
      
      if (nonTrumps.length > 0) {
        // Lead with high value card
        return nonTrumps.reduce((best, card) => 
          card.value > best.value ? card : best
        );
      }
      
      return validCards[0];
    } else {
      // React to trick
      const currentWinner = this.getCurrentTrickWinner(currentTrick, gameType, trumpSuit);
      const winnerIsDeclarer = gameState.declarer === currentWinner;
      
      if (isPartner) {
        // Declarer: try to win or save good cards
        if (winnerIsDeclarer) {
          // Already winning, play low
          return validCards.reduce((lowest, card) => 
            card.value < lowest.value ? card : lowest
          );
        } else {
          // Try to overtake
          const trumps = validCards.filter(c => isTrump(c, gameType, trumpSuit));
          if (trumps.length > 0) {
            return trumps.reduce((best, card) => 
              getTrumpRank(card, gameType, trumpSuit) > getTrumpRank(best, gameType, trumpSuit) ? card : best
            );
          }
          return validCards[0];
        }
      } else {
        // Opponent: block declarer or dump
        if (!winnerIsDeclarer) {
          // Partner winning, play low
          return validCards.reduce((lowest, card) => 
            card.value < lowest.value ? card : lowest
          );
        } else {
          // Try to beat declarer
          const trumps = validCards.filter(c => isTrump(c, gameType, trumpSuit));
          if (trumps.length > 0 && currentTrick.length === 2) {
            // Last player, play highest trump
            return trumps.reduce((best, card) => 
              getTrumpRank(card, gameType, trumpSuit) > getTrumpRank(best, gameType, trumpSuit) ? card : best
            );
          }
          return validCards.reduce((best, card) => 
            card.value > best.value ? card : best
          );
        }
      }
    }
  }
  
  getCurrentTrickWinner(trick, gameType, trumpSuit) {
    if (trick.length === 0) return -1;
    
    let winningIndex = trick[0].playerIndex;
    let winningCard = trick[0].card;
    
    for (let i = 1; i < trick.length; i++) {
      const currentCard = trick[i].card;
      
      const currentIsTrump = isTrump(currentCard, gameType, trumpSuit);
      const winningIsTrump = isTrump(winningCard, gameType, trumpSuit);
      
      if (currentIsTrump && !winningIsTrump) {
        winningIndex = trick[i].playerIndex;
        winningCard = currentCard;
      } else if (currentIsTrump && winningIsTrump) {
        if (getTrumpRank(currentCard, gameType, trumpSuit) > getTrumpRank(winningCard, gameType, trumpSuit)) {
          winningIndex = trick[i].playerIndex;
          winningCard = currentCard;
        }
      } else if (!currentIsTrump && !winningIsTrump && currentCard.suit === winningCard.suit) {
        if (getSuitRank(currentCard) > getSuitRank(winningCard)) {
          winningIndex = trick[i].playerIndex;
          winningCard = currentCard;
        }
      }
    }
    
    return winningIndex;
  }
  
  chooseCardsToDiscard(hand) {
    // Discard two lowest value cards (avoid jacks)
    const sortedHand = [...hand].sort((a, b) => {
      if (a.rank === 'J') return 1;
      if (b.rank === 'J') return -1;
      return a.value - b.value;
    });
    
    return [sortedHand[0], sortedHand[1]];
  }
}