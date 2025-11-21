// utils.js - Utility functions for prime checking and factorization
export function isPrime(n) {
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  for (let i = 3; i <= Math.sqrt(n); i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

export function getPrimeFactors(n) {
  const factors = [];
  let num = n;
  
  // Check for 2s
  while (num % 2 === 0) {
    factors.push(2);
    num = num / 2;
  }
  
  // Check for odd factors
  for (let i = 3; i <= Math.sqrt(num); i += 2) {
    while (num % i === 0) {
      factors.push(i);
      num = num / i;
    }
  }
  
  // If num is still greater than 2, it's a prime factor
  if (num > 2) {
    factors.push(num);
  }
  
  return factors;
}

export function getCurrentDifficulty(score, DIFFICULTY_LEVELS) {
  for (let i = DIFFICULTY_LEVELS.length - 1; i >= 0; i--) {
    if (score >= DIFFICULTY_LEVELS[i].scoreThreshold) {
      return DIFFICULTY_LEVELS[i];
    }
  }
  return DIFFICULTY_LEVELS[0];
}