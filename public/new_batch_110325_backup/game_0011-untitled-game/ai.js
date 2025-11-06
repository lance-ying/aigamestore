// ai.js
import { CATEGORIES } from './globals.js';
import { calculateScore, countDice } from './dice.js';

export function getAIHoldDecision(player, diceValues, rollsLeft) {
  const counts = countDice(diceValues);
  const diceHeld = [false, false, false, false, false];
  
  if (rollsLeft <= 0) return diceHeld;
  
  // Find highest count
  let maxCount = 0;
  let maxValue = 0;
  for (let val in counts) {
    if (counts[val] > maxCount || (counts[val] === maxCount && parseInt(val) > maxValue)) {
      maxCount = counts[val];
      maxValue = parseInt(val);
    }
  }
  
  // Hold dice based on difficulty
  if (player.difficulty === 'hard') {
    // Hold pairs and higher
    if (maxCount >= 2) {
      for (let i = 0; i < diceValues.length; i++) {
        if (diceValues[i] === maxValue) {
          diceHeld[i] = true;
        }
      }
    }
    
    // Also check for straight potential
    const sorted = [...diceValues].sort((a, b) => a - b);
    const unique = [...new Set(sorted)];
    if (unique.length >= 4) {
      // Hold for straight
      const straightVals = unique.slice(0, 4);
      for (let i = 0; i < diceValues.length; i++) {
        if (straightVals.includes(diceValues[i])) {
          diceHeld[i] = true;
        }
      }
    }
  } else if (player.difficulty === 'medium') {
    // Hold triples and higher
    if (maxCount >= 3) {
      for (let i = 0; i < diceValues.length; i++) {
        if (diceValues[i] === maxValue) {
          diceHeld[i] = true;
        }
      }
    }
  } else {
    // Easy: only hold if 4+ of a kind
    if (maxCount >= 4) {
      for (let i = 0; i < diceValues.length; i++) {
        if (diceValues[i] === maxValue) {
          diceHeld[i] = true;
        }
      }
    }
  }
  
  return diceHeld;
}

export function getAICategoryChoice(player, diceValues) {
  const available = player.getAvailableCategories();
  if (available.length === 0) return null;
  
  let bestCategory = available[0];
  let bestScore = calculateScore(bestCategory.id, diceValues);
  
  // Calculate score for each available category
  for (let cat of available) {
    const score = calculateScore(cat.id, diceValues);
    
    // Prioritize high-value categories
    let priority = score;
    
    if (player.difficulty === 'hard') {
      // Bonus for Kniffel
      if (cat.id === 'kniffel' && score > 0) priority += 100;
      // Bonus for Full House
      if (cat.id === 'full_house' && score > 0) priority += 20;
      // Bonus for Large Straight
      if (cat.id === 'large_straight' && score > 0) priority += 30;
      // Prefer upper section if close to bonus
      if (cat.upper && player.upperSectionScore < 63) {
        priority += 5;
      }
    } else if (player.difficulty === 'medium') {
      // Basic prioritization
      if (cat.id === 'kniffel' && score > 0) priority += 50;
      if (cat.id === 'full_house' && score > 0) priority += 10;
    }
    
    if (priority > bestScore) {
      bestScore = priority;
      bestCategory = cat;
    }
  }
  
  return bestCategory;
}