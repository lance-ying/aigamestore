// numberCaller.js
import { gameState, LEVEL_CONFIG } from './globals.js';

export function callNextNumber(p) {
  const availableNumbers = [];
  for (let i = 1; i <= 75; i++) {
    if (!gameState.calledNumbers.includes(i)) {
      availableNumbers.push(i);
    }
  }
  
  if (availableNumbers.length === 0) {
    return null;
  }
  
  const idx = Math.floor(p.random(availableNumbers.length));
  const number = availableNumbers[idx];
  
  gameState.calledNumbers.push(number);
  gameState.currentCalledNumber = number;
  gameState.lastCalledNumberTime = Date.now();
  
  // Determine if lucky or penalty (level 2+)
  gameState.luckyNumber = null;
  gameState.penaltyNumber = null;
  
  if (gameState.level >= 2) {
    const rand = p.random();
    if (gameState.level === 2 && rand < 0.15) {
      gameState.luckyNumber = number;
    } else if (gameState.level === 3 && rand < 0.2) {
      if (rand < 0.1) {
        gameState.luckyNumber = number;
      } else {
        gameState.penaltyNumber = number;
      }
    } else if (gameState.level === 4 && rand < 0.3) {
      if (rand < 0.15) {
        gameState.luckyNumber = number;
      } else {
        gameState.penaltyNumber = number;
      }
    }
  }
  
  return number;
}

export function updateNumberCalling(p) {
  const currentTime = Date.now();
  if (currentTime >= gameState.nextNumberCallTime) {
    callNextNumber(p);
    const config = LEVEL_CONFIG[gameState.level - 1];
    gameState.numberCallInterval = config.callSpeed;
    gameState.nextNumberCallTime = currentTime + gameState.numberCallInterval;
  }
}

export function getNumberPrefix(number) {
  if (number >= 1 && number <= 15) return 'B';
  if (number >= 16 && number <= 30) return 'I';
  if (number >= 31 && number <= 45) return 'N';
  if (number >= 46 && number <= 60) return 'G';
  if (number >= 61 && number <= 75) return 'O';
  return '';
}