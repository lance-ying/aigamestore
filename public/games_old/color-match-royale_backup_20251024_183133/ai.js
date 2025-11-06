import { gameState } from './globals.js';
import { CARD_TYPES } from './globals.js';

export function getAIMove(player, currentColor, topCard, level, p) {
  const playableCards = player.getPlayableCards(currentColor, topCard);
  
  if (playableCards.length === 0) {
    return { action: 'DRAW' };
  }

  let bestMove = playableCards[0];
  
  if (level >= 2) {
    const actionCards = playableCards.filter(({ card }) => 
      card.type === CARD_TYPES.SKIP || 
      card.type === CARD_TYPES.REVERSE || 
      card.type === CARD_TYPES.DRAW_TWO
    );
    
    if (actionCards.length > 0 && p.random() < 0.7) {
      bestMove = actionCards[p.floor(p.random(actionCards.length))];
    }
  }
  
  if (level >= 3) {
    const wildDrawFour = playableCards.filter(({ card }) => 
      card.type === CARD_TYPES.WILD_DRAW_FOUR
    );
    
    if (wildDrawFour.length > 0 && p.random() < 0.6) {
      bestMove = wildDrawFour[0];
    }
  }
  
  if (level >= 4 && player.hand.length <= 3) {
    const highValueCards = playableCards.filter(({ card }) => 
      card.type !== CARD_TYPES.NUMBER || card.value >= 7
    );
    if (highValueCards.length > 0) {
      bestMove = highValueCards[p.floor(p.random(highValueCards.length))];
    }
  }
  
  const chosenColor = selectBestColorForAI(player, p);
  
  return {
    action: 'PLAY',
    cardIndex: bestMove.index,
    chosenColor: chosenColor
  };
}

function selectBestColorForAI(player, p) {
  const colorCounts = {
    RED: 0,
    GREEN: 0,
    BLUE: 0,
    YELLOW: 0
  };
  
  for (const card of player.hand) {
    if (card.color) {
      colorCounts[card.color]++;
    }
  }
  
  let maxColor = 'RED';
  let maxCount = colorCounts.RED;
  
  for (const color in colorCounts) {
    if (colorCounts[color] > maxCount) {
      maxCount = colorCounts[color];
      maxColor = color;
    }
  }
  
  return maxColor;
}