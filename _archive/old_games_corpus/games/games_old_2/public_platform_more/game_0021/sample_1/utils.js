// utils.js - Utility functions

// Check if a number is prime
export function isPrime(n) {
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  
  for (let i = 3; i <= Math.sqrt(n); i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

// Get prime factors of a number
export function getPrimeFactors(n) {
  const factors = [];
  let num = n;
  
  // Check for 2s
  while (num % 2 === 0) {
    factors.push(2);
    num = num / 2;
  }
  
  // Check odd factors
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

// Get current difficulty level based on score
export function getCurrentDifficultyLevel(score, levels) {
  for (let i = levels.length - 1; i >= 0; i--) {
    if (score >= levels[i].scoreThreshold) {
      return levels[i];
    }
  }
  return levels[0];
}

// Check line-circle collision for slicing
export function lineIntersectsCircle(x1, y1, x2, y2, cx, cy, radius) {
  // Calculate line segment length
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;
  
  if (lengthSquared === 0) {
    // Line is a point
    const distSquared = (cx - x1) * (cx - x1) + (cy - y1) * (cy - y1);
    return distSquared <= radius * radius;
  }
  
  // Calculate closest point on line segment to circle center
  const t = Math.max(0, Math.min(1, ((cx - x1) * dx + (cy - y1) * dy) / lengthSquared));
  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;
  
  // Check distance from closest point to circle center
  const distSquared = (cx - closestX) * (cx - closestX) + (cy - closestY) * (cy - closestY);
  return distSquared <= radius * radius;
}