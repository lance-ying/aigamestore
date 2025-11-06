// dice.js

export function rollDice(diceValues, diceHeld) {
  const newValues = [...diceValues];
  for (let i = 0; i < newValues.length; i++) {
    if (!diceHeld[i]) {
      newValues[i] = Math.floor(Math.random() * 6) + 1;
    }
  }
  return newValues;
}

export function countDice(diceValues) {
  const counts = {};
  diceValues.forEach(val => {
    counts[val] = (counts[val] || 0) + 1;
  });
  return counts;
}

export function calculateScore(categoryId, diceValues) {
  const counts = countDice(diceValues);
  const sortedValues = [...diceValues].sort((a, b) => a - b);
  const sum = diceValues.reduce((a, b) => a + b, 0);
  
  switch (categoryId) {
    case 'ones':
      return (counts[1] || 0) * 1;
    case 'twos':
      return (counts[2] || 0) * 2;
    case 'threes':
      return (counts[3] || 0) * 3;
    case 'fours':
      return (counts[4] || 0) * 4;
    case 'fives':
      return (counts[5] || 0) * 5;
    case 'sixes':
      return (counts[6] || 0) * 6;
      
    case 'three_kind':
      for (let val in counts) {
        if (counts[val] >= 3) return sum;
      }
      return 0;
      
    case 'four_kind':
      for (let val in counts) {
        if (counts[val] >= 4) return sum;
      }
      return 0;
      
    case 'full_house':
      const hasThree = Object.values(counts).includes(3);
      const hasTwo = Object.values(counts).includes(2);
      if (hasThree && hasTwo) return 25;
      return 0;
      
    case 'small_straight':
      const smallStraights = [
        [1, 2, 3, 4],
        [2, 3, 4, 5],
        [3, 4, 5, 6]
      ];
      for (let straight of smallStraights) {
        if (straight.every(val => sortedValues.includes(val))) {
          return 30;
        }
      }
      return 0;
      
    case 'large_straight':
      const largeStraights = [
        [1, 2, 3, 4, 5],
        [2, 3, 4, 5, 6]
      ];
      for (let straight of largeStraights) {
        const matches = straight.every(val => sortedValues.includes(val));
        if (matches && new Set(sortedValues).size === 5) {
          return 40;
        }
      }
      return 0;
      
    case 'kniffel':
      for (let val in counts) {
        if (counts[val] === 5) return 50;
      }
      return 0;
      
    case 'chance':
      return sum;
      
    default:
      return 0;
  }
}