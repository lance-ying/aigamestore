// opponent.js - AI opponent for tournament

export class Opponent {
  constructor(name, difficulty) {
    this.name = name;
    this.difficulty = difficulty; // 0.5 to 1.5 speed multiplier
    this.score = 0;
    this.progress = 0; // 0 to 100
    this.bubblesRemaining = 0;
  }

  update(deltaTime, totalBubbles, playerProgress) {
    // AI opponents clear bubbles over time based on difficulty
    const baseSpeed = 0.3; // Progress per second
    const progressRate = baseSpeed * this.difficulty * deltaTime;
    
    // Add some variance based on player progress to keep it competitive
    const catchupFactor = playerProgress > this.progress ? 1.1 : 0.9;
    
    this.progress = Math.min(100, this.progress + progressRate * catchupFactor);
    this.bubblesRemaining = Math.floor(totalBubbles * (1 - this.progress / 100));
    this.score = Math.floor(this.progress * 100 * this.difficulty);
  }
}