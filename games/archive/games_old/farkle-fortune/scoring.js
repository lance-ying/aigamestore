// scoring.js - Scoring calculation functions

export function calculateScore(selectedDice) {
  if (selectedDice.length === 0) return 0;
  
  const values = selectedDice.map(d => d.value);
  const counts = {};
  
  for (let val of values) {
    counts[val] = (counts[val] || 0) + 1;
  }
  
  let score = 0;
  const used = new Array(values.length).fill(false);
  
  // Check for straight (1-2-3-4-5-6)
  if (values.length === 6) {
    const sorted = [...values].sort();
    if (sorted.join('') === '123456') {
      return 1500;
    }
    
    // Check for three pairs
    const pairs = Object.values(counts).filter(c => c === 2).length;
    if (pairs === 3) {
      return 1000;
    }
    
    // Check for two sets of three
    const threes = Object.values(counts).filter(c => c === 3).length;
    if (threes === 2) {
      return 2500;
    }
  }
  
  // Check for sets (six, five, four, three of a kind)
  for (let val = 1; val <= 6; val++) {
    if (counts[val] >= 3) {
      const baseScore = val === 1 ? 1000 : val * 100;
      if (counts[val] === 6) {
        score += baseScore * 4;
        for (let i = 0; i < 6; i++) {
          if (values[i] === val && !used[i]) {
            used[i] = true;
          }
        }
      } else if (counts[val] === 5) {
        score += baseScore * 3;
        for (let i = 0; i < 5; i++) {
          if (values[i] === val && !used[i]) {
            used[i] = true;
          }
        }
      } else if (counts[val] === 4) {
        score += baseScore * 2;
        for (let i = 0; i < 4; i++) {
          if (values[i] === val && !used[i]) {
            used[i] = true;
          }
        }
      } else if (counts[val] === 3) {
        score += baseScore;
        let count = 0;
        for (let i = 0; i < values.length && count < 3; i++) {
          if (values[i] === val && !used[i]) {
            used[i] = true;
            count++;
          }
        }
      }
    }
  }
  
  // Check for single 1s and 5s
  for (let i = 0; i < values.length; i++) {
    if (!used[i]) {
      if (values[i] === 1) {
        score += 100;
        used[i] = true;
      } else if (values[i] === 5) {
        score += 50;
        used[i] = true;
      }
    }
  }
  
  return score;
}

export function hasAnyScoring(dice) {
  const values = dice.map(d => d.value);
  const counts = {};
  
  for (let val of values) {
    counts[val] = (counts[val] || 0) + 1;
  }
  
  // Check for any three of a kind
  for (let val = 1; val <= 6; val++) {
    if (counts[val] >= 3) return true;
  }
  
  // Check for 1s or 5s
  if (counts[1] > 0 || counts[5] > 0) return true;
  
  // Check for special combinations with all 6 dice
  if (dice.length === 6) {
    const sorted = [...values].sort();
    if (sorted.join('') === '123456') return true;
    
    const pairs = Object.values(counts).filter(c => c === 2).length;
    if (pairs === 3) return true;
    
    const threes = Object.values(counts).filter(c => c === 3).length;
    if (threes === 2) return true;
  }
  
  return false;
}

export function getAllScoringCombinations(dice) {
  const combinations = [];
  
  // Try all possible selections
  const n = dice.length;
  for (let mask = 1; mask < (1 << n); mask++) {
    const selected = [];
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        selected.push(dice[i]);
      }
    }
    const score = calculateScore(selected);
    if (score > 0) {
      combinations.push({ dice: selected, score: score, mask: mask });
    }
  }
  
  // Sort by score descending
  combinations.sort((a, b) => b.score - a.score);
  return combinations;
}