// scoring.js
import { gameState } from './globals.js';

export function calculateFinalScore() {
  let finalScore = 0;
  
  // Base clear bonus
  finalScore += 1000;

  // Time bonus (up to +400 based on % under par)
  const timeTaken = (Date.now() - gameState.stageStartTime) / 1000;
  if (timeTaken < gameState.parTime) {
    const percentUnderPar = 1 - (timeTaken / gameState.parTime);
    const timeBonus = Math.floor(400 * percentUnderPar);
    finalScore += timeBonus;
  }

  // Coin bonus
  finalScore += gameState.coinsCollected;
  
  // 100% collection bonus
  if (gameState.coinsCollected >= gameState.totalCoins) {
    finalScore += 100;
  }

  // Damage streak bonus (capped at +200)
  const streakBonus = Math.min(gameState.damageStreak * 10, 200);
  finalScore += streakBonus;

  // Hit penalty
  finalScore -= gameState.hitsTaken * 50;

  // Life bonus
  const livesRemaining = gameState.health;
  finalScore += livesRemaining * 100;

  // No-hit bonus
  if (gameState.hitsTaken === 0) {
    finalScore += 300;
  }

  // Update current score
  gameState.score += finalScore;

  return finalScore;
}

export function getRank(score) {
  if (score >= 2200) return 'S';
  if (score >= 1700) return 'A';
  if (score >= 1300) return 'B';
  return 'C';
}

export function saveStageProgress(stage, rank) {
  const key = `${gameState.currentWorld}-${stage}`;
  
  if (!gameState.stageProgress[key] || 
      getRankValue(rank) > getRankValue(gameState.stageProgress[key])) {
    gameState.stageProgress[key] = rank;
  }
}

function getRankValue(rank) {
  const ranks = { 'S': 4, 'A': 3, 'B': 2, 'C': 1 };
  return ranks[rank] || 0;
}