// challenges.js - Challenge system

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CHALLENGE_DURATION,
  TARGET_DISPLAY_FPS,
  gameState
} from './globals.js';

export class Challenge {
  constructor(type, requirement, description) {
    this.type = type;
    this.requirement = requirement;
    this.description = description;
    this.timeRemaining = CHALLENGE_DURATION;
    this.completed = false;
  }
  
  update(p) {
    this.timeRemaining--;
    
    // Check completion
    if (this.checkCompletion()) {
      this.completed = true;
      return true;
    }
    
    // Check failure
    if (this.timeRemaining <= 0) {
      return false;
    }
    
    return null; // Still in progress
  }
  
  checkCompletion() {
    switch (this.type) {
      case 'MAINTAIN_FPS':
        return gameState.currentFPS >= this.requirement;
      case 'REDUCE_TWIST':
        return Math.abs(gameState.cableTwist) < this.requirement;
      case 'COOL_DOWN':
        return gameState.gpuTemp < this.requirement && gameState.cpuTemp < this.requirement;
      case 'LOW_USAGE':
        return gameState.cpuUsage < this.requirement && gameState.gpuUsage < this.requirement;
      default:
        return false;
    }
  }
  
  draw(p) {
    // Challenge display
    p.push();
    p.fill(0, 0, 0, 200);
    p.noStroke();
    p.rect(10, 80, 250, 80, 5);
    
    p.fill(255, 200, 0);
    p.textSize(14);
    p.textAlign(p.LEFT, p.TOP);
    p.text("CHALLENGE", 20, 90);
    
    p.fill(255);
    p.textSize(11);
    p.text(this.description, 20, 110);
    
    // Progress bar
    const progress = this.timeRemaining / CHALLENGE_DURATION;
    p.fill(50);
    p.rect(20, 140, 230, 10, 2);
    p.fill(progress > 0.3 ? [0, 255, 100] : [255, 50, 50]);
    p.rect(20, 140, 230 * progress, 10, 2);
    
    p.pop();
  }
}

export function createChallenge(difficulty) {
  const challengeTypes = [
    {
      type: 'MAINTAIN_FPS',
      requirement: TARGET_DISPLAY_FPS - (5 - difficulty),
      description: `Maintain FPS above ${TARGET_DISPLAY_FPS - (5 - difficulty)}`
    },
    {
      type: 'REDUCE_TWIST',
      requirement: 180 - (difficulty * 20),
      description: `Reduce cable twist below ${180 - (difficulty * 20)}°`
    },
    {
      type: 'COOL_DOWN',
      requirement: 65 - (difficulty * 2),
      description: `Cool temps below ${65 - (difficulty * 2)}°C`
    },
    {
      type: 'LOW_USAGE',
      requirement: 60 - (difficulty * 5),
      description: `Keep CPU/GPU below ${60 - (difficulty * 5)}%`
    }
  ];
  
  const selected = challengeTypes[Math.floor(Math.random() * challengeTypes.length)];
  return new Challenge(selected.type, selected.requirement, selected.description);
}