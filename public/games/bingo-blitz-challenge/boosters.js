// boosters.js
import { gameState } from './globals.js';
import { findNumberOnCard, getSquareKey, checkForBingo } from './bingoCard.js';
import { handleCorrectMark, addScore, handleBingo } from './scoring.js';

export function activateInstantMark(p) {
  if (!gameState.boosters.instantMark.available) return;
  
  const pos = findNumberOnCard(gameState.currentCalledNumber);
  if (pos && !gameState.markedSquares.has(getSquareKey(pos.row, pos.col))) {
    gameState.markedSquares.add(getSquareKey(pos.row, pos.col));
    addScore(200, p);
    handleCorrectMark(false, p);
    gameState.boosters.instantMark.available = false;
  }
}

export function activateScoreMultiplier(p) {
  if (!gameState.boosters.scoreMultiplier.available) return;
  
  gameState.boosters.scoreMultiplier.active = true;
  gameState.boosters.scoreMultiplier.endTime = Date.now() + 5000;
  gameState.boosters.scoreMultiplier.available = false;
}

export function activateFreeMark(p) {
  if (!gameState.boosters.freeMark.available) return;
  
  gameState.boosters.freeMark.active = true;
}

export function updateBoosters(p) {
  const now = Date.now();
  
  if (gameState.boosters.scoreMultiplier.active && now >= gameState.boosters.scoreMultiplier.endTime) {
    gameState.boosters.scoreMultiplier.active = false;
  }
}

export function useFreeMarkOnSelected(p) {
  const key = getSquareKey(gameState.selectedRow, gameState.selectedCol);
  if (!gameState.markedSquares.has(key)) {
    gameState.markedSquares.add(key);
    addScore(150, p);
    gameState.boosters.freeMark.active = false;
    gameState.boosters.freeMark.available = false;
    
    // Check for bingo after free mark
    const newBingos = checkForBingo(p);
    if (newBingos.length > 0) {
      for (const bingo of newBingos) {
        const bingoKey = JSON.stringify(bingo);
        if (!gameState.recentBingos.some(b => JSON.stringify(b.bingo) === bingoKey)) {
          handleBingo(p);
          gameState.recentBingos.push({ bingo, time: Date.now() });
        }
      }
    }
  }
}