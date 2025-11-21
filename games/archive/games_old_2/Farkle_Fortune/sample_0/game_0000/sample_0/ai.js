// ai.js - AI logic

import { gameState, PLAYERS, LEVEL_CONFIG } from './globals.js';
import { calculateScore, getAllScoringCombinations } from './scoring.js';

export function aiSelectDice() {
  // Get available dice (not yet selected)
  const availableDice = gameState.dice.filter((d, i) => !gameState.selectedDiceIndices.includes(i));
  
  if (availableDice.length === 0) return [];
  
  // Get all scoring combinations
  const combinations = getAllScoringCombinations(availableDice);
  
  if (combinations.length === 0) return [];
  
  // AI difficulty based on level
  const levelConfig = LEVEL_CONFIG[gameState.level - 1];
  const aiThreshold = levelConfig.aiThreshold;
  
  // Level 1: Take first decent scoring option
  if (gameState.level === 1) {
    const bestCombo = combinations[0];
    return bestCombo.dice.map(d => gameState.dice.indexOf(d));
  }
  
  // Level 2 & 3: More strategic
  // Prefer combinations that use more dice if they're good scores
  let bestCombo = combinations[0];
  
  if (gameState.level >= 2) {
    for (let combo of combinations) {
      const scorePerDie = combo.score / combo.dice.length;
      const bestScorePerDie = bestCombo.score / bestCombo.dice.length;
      
      // Prefer higher total score, but also consider efficiency
      if (combo.score > bestCombo.score * 0.8 && combo.dice.length > bestCombo.dice.length) {
        bestCombo = combo;
        break;
      }
    }
  }
  
  return bestCombo.dice.map(d => gameState.dice.indexOf(d));
}

export function aiDecideAction() {
  const levelConfig = LEVEL_CONFIG[gameState.level - 1];
  const aiThreshold = levelConfig.aiThreshold;
  
  // Calculate available dice for next roll
  const availableDiceCount = gameState.dice.filter((d, i) => !gameState.selectedDiceIndices.includes(i)).length;
  
  // Level 1: Simple logic
  if (gameState.level === 1) {
    if (gameState.currentTurnScore >= aiThreshold) {
      return 'BANK';
    }
    if (availableDiceCount > 0) {
      return 'ROLL';
    }
    return 'BANK';
  }
  
  // Level 2: Medium strategy
  if (gameState.level === 2) {
    // Bank if score is good
    if (gameState.currentTurnScore >= aiThreshold + 200) {
      return 'BANK';
    }
    // Be cautious with few dice
    if (availableDiceCount <= 2 && gameState.currentTurnScore >= aiThreshold) {
      return 'BANK';
    }
    if (availableDiceCount > 0) {
      return 'ROLL';
    }
    return 'BANK';
  }
  
  // Level 3: Advanced strategy
  if (gameState.level === 3) {
    // Consider game state
    const scoreDiff = gameState.playerScoreTotal - gameState.aiScoreTotal;
    
    // If behind, take more risks
    if (scoreDiff > 1000) {
      if (gameState.currentTurnScore >= aiThreshold + 300 || availableDiceCount <= 1) {
        return 'BANK';
      }
    } else {
      // If ahead or close, be more conservative
      if (gameState.currentTurnScore >= aiThreshold || availableDiceCount <= 2) {
        return 'BANK';
      }
    }
    
    if (availableDiceCount > 0) {
      return 'ROLL';
    }
    return 'BANK';
  }
  
  return 'BANK';
}