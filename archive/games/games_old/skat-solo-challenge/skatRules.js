// skatRules.js - Skat game rules and logic

import { gameState } from './globals.js';
import { Card } from './card.js';

export function getTrumpCards(gameType, trumpSuit) {
  const trumps = [];
  
  if (gameType === 'GRAND') {
    // Only Jacks are trumps
    trumps.push('J_CLUBS', 'J_SPADES', 'J_HEARTS', 'J_DIAMONDS');
  } else if (gameType === 'NULL') {
    // No trumps
    return [];
  } else {
    // Suit game - Jacks + chosen suit
    trumps.push('J_CLUBS', 'J_SPADES', 'J_HEARTS', 'J_DIAMONDS');
    trumps.push('7_' + trumpSuit, '8_' + trumpSuit, '9_' + trumpSuit, 
                '10_' + trumpSuit, 'Q_' + trumpSuit, 'K_' + trumpSuit, 'A_' + trumpSuit);
  }
  
  return trumps;
}

export function isTrump(card, gameType, trumpSuit) {
  if (gameType === 'NULL') return false;
  if (gameType === 'GRAND') return card.rank === 'J';
  
  // Suit game
  if (card.rank === 'J') return true;
  if (card.suit === trumpSuit) return true;
  return false;
}

export function getTrumpRank(card, gameType, trumpSuit) {
  if (!isTrump(card, gameType, trumpSuit)) return -1;
  
  // Jack hierarchy: Clubs > Spades > Hearts > Diamonds
  if (card.rank === 'J') {
    const jackOrder = ['CLUBS', 'SPADES', 'HEARTS', 'DIAMONDS'];
    return 100 + (3 - jackOrder.indexOf(card.suit));
  }
  
  // Trump suit hierarchy: A > 10 > K > Q > 9 > 8 > 7
  const trumpOrder = ['7', '8', '9', 'Q', 'K', '10', 'A'];
  return trumpOrder.indexOf(card.rank);
}

export function getSuitRank(card) {
  // Non-trump suit hierarchy: A > 10 > K > Q > 9 > 8 > 7
  const suitOrder = ['7', '8', '9', 'Q', 'K', '10', 'A'];
  return suitOrder.indexOf(card.rank);
}

export function canPlayCard(card, hand, currentTrick, gameType, trumpSuit) {
  if (currentTrick.length === 0) return true; // Can lead with any card
  
  const ledCard = currentTrick[0];
  const ledSuit = isTrump(ledCard, gameType, trumpSuit) ? 'TRUMP' : ledCard.suit;
  
  // Check if we need to follow suit
  if (ledSuit === 'TRUMP') {
    // Must play trump if we have it
    const hasTrump = hand.some(c => isTrump(c, gameType, trumpSuit));
    if (hasTrump) {
      return isTrump(card, gameType, trumpSuit);
    }
  } else {
    // Must follow suit if we have it
    const hasSuit = hand.some(c => c.suit === ledSuit && !isTrump(c, gameType, trumpSuit));
    if (hasSuit) {
      return card.suit === ledSuit && !isTrump(card, gameType, trumpSuit);
    }
  }
  
  // Can play any card if we can't follow
  return true;
}

export function determineWinner(trick, gameType, trumpSuit) {
  if (trick.length === 0) return -1;
  
  let winningIndex = 0;
  let winningCard = trick[0].card;
  
  const ledIsTrump = isTrump(winningCard, gameType, trumpSuit);
  const ledSuit = ledIsTrump ? 'TRUMP' : winningCard.suit;
  
  for (let i = 1; i < trick.length; i++) {
    const currentCard = trick[i].card;
    const currentIsTrump = isTrump(currentCard, gameType, trumpSuit);
    const winningIsTrump = isTrump(winningCard, gameType, trumpSuit);
    
    // Trump beats non-trump
    if (currentIsTrump && !winningIsTrump) {
      winningIndex = i;
      winningCard = currentCard;
    } else if (currentIsTrump && winningIsTrump) {
      // Higher trump wins
      if (getTrumpRank(currentCard, gameType, trumpSuit) > getTrumpRank(winningCard, gameType, trumpSuit)) {
        winningIndex = i;
        winningCard = currentCard;
      }
    } else if (!currentIsTrump && !winningIsTrump) {
      // Same suit - higher rank wins
      if (currentCard.suit === winningCard.suit) {
        if (getSuitRank(currentCard) > getSuitRank(winningCard)) {
          winningIndex = i;
          winningCard = currentCard;
        }
      }
    }
  }
  
  return trick[winningIndex].playerIndex;
}

export function calculatePoints(cards) {
  return cards.reduce((sum, card) => sum + card.value, 0);
}

export function isValidBid(value) {
  const validBids = [18, 20, 22, 23, 24, 27, 30, 33, 35, 36, 40, 44, 45, 46, 48, 50, 54, 55, 59, 60];
  return validBids.includes(value);
}

export function getNextBid(currentBid) {
  const validBids = [18, 20, 22, 23, 24, 27, 30, 33, 35, 36, 40, 44, 45, 46, 48, 50, 54, 55, 59, 60];
  const index = validBids.indexOf(currentBid);
  if (index >= 0 && index < validBids.length - 1) {
    return validBids[index + 1];
  }
  return currentBid;
}