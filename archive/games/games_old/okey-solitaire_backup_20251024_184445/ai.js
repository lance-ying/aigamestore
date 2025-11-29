import { gameState } from './globals.js';
import { evaluateHandStrength, validateHand } from './validation.js';

export function aiTakeTurn(playerIndex, p) {
  const hand = gameState.players[playerIndex];
  
  // Decide whether to draw from center or previous discard
  let drawFromDiscard = false;
  const prevPlayerIndex = (playerIndex + 3) % 4;
  const prevDiscard = gameState.discardPiles[prevPlayerIndex];
  
  if (prevDiscard.length > 0) {
    const discardTile = prevDiscard[prevDiscard.length - 1];
    
    // AI logic based on level
    const threshold = gameState.level === 1 ? 0.2 : gameState.level === 2 ? 0.4 : 0.6;
    
    // Check if discard would improve hand
    const currentStrength = evaluateHandStrength(hand, gameState.okeyTile);
    const testHand = [...hand, discardTile];
    const newStrength = evaluateHandStrength(testHand, gameState.okeyTile);
    
    if (newStrength > currentStrength * (1 + threshold)) {
      drawFromDiscard = true;
    }
  }
  
  // Draw tile
  let drawnTile;
  if (drawFromDiscard && prevDiscard.length > 0) {
    drawnTile = prevDiscard.pop();
  } else {
    if (gameState.drawPile.length > 0) {
      drawnTile = gameState.drawPile.pop();
    } else {
      // No tiles left - game over
      return 'NO_TILES';
    }
  }
  
  hand.push(drawnTile);
  
  // Check if AI can win
  if (validateHand(hand.slice(0, 14), gameState.okeyTile)) {
    // AI wins!
    return 'WIN';
  }
  
  // Discard worst tile
  let worstTileIndex = 0;
  let worstScore = Infinity;
  
  for (let i = 0; i < hand.length; i++) {
    const testHand = hand.filter((t, idx) => idx !== i);
    const score = evaluateHandStrength(testHand, gameState.okeyTile);
    
    if (score < worstScore) {
      worstScore = score;
      worstTileIndex = i;
    }
  }
  
  const discardedTile = hand.splice(worstTileIndex, 1)[0];
  gameState.discardPiles[playerIndex].push(discardedTile);
  
  return 'CONTINUE';
}