// scoring.js
import { gameState, LEVEL_CONFIG } from './globals.js';
import { checkForBingo } from './bingoCard.js';

export function addScore(points, p) {
  let multiplier = gameState.comboMultiplier;
  
  if (gameState.boosters.scoreMultiplier.active) {
    multiplier *= 2;
  }
  
  gameState.score += Math.floor(points * multiplier);
}

export function handleCorrectMark(isQuick, p) {
  const config = LEVEL_CONFIG[gameState.level - 1];
  let points = config.markPoints;
  
  if (gameState.luckyNumber === gameState.currentCalledNumber) {
    points *= 2;
  }
  
  if (isQuick) {
    points += 25;
  }
  
  addScore(points, p);
  
  // Charge booster meter
  gameState.boosterMeter++;
  if (gameState.boosterMeter >= config.boosterCharge) {
    gameState.boosterMeter = 0;
    chargeNextBooster();
  }
  
  // Check for bingo
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
  
  // Level 4: Check for combo multiplier
  if (gameState.level === 4) {
    updateComboMultiplier(p);
  }
}

export function handleIncorrectMark(p) {
  let penalty = 100;
  
  if (gameState.penaltyNumber === gameState.currentCalledNumber) {
    penalty = 200;
  }
  
  gameState.score = Math.max(0, gameState.score - penalty);
  gameState.boosterMeter = Math.max(0, gameState.boosterMeter - 2);
}

export function handleBingo(p) {
  const config = LEVEL_CONFIG[gameState.level - 1];
  addScore(config.bingoPoints, p);
  gameState.bingosAchieved++;
}

function chargeNextBooster() {
  if (!gameState.boosters.instantMark.available) {
    gameState.boosters.instantMark.available = true;
  } else if (!gameState.boosters.scoreMultiplier.available) {
    gameState.boosters.scoreMultiplier.available = true;
  } else if (!gameState.boosters.freeMark.available) {
    gameState.boosters.freeMark.available = true;
  }
}

function updateComboMultiplier(p) {
  const now = Date.now();
  const recentBingosInWindow = gameState.recentBingos.filter(b => now - b.time < 10000);
  
  if (recentBingosInWindow.length >= 3 && gameState.comboMultiplier === 1) {
    gameState.comboMultiplier = 1.5;
    gameState.comboEndTime = now + 10000;
  }
  
  if (gameState.comboMultiplier > 1 && now >= gameState.comboEndTime) {
    gameState.comboMultiplier = 1;
  }
}