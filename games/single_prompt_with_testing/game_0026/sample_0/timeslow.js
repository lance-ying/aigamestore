// timeslow.js - Time slow mechanic

import { gameState, KEYS } from './globals.js';

export function updateTimeSlow(p) {
  // Check for time slow activation
  if (p.keyIsDown(KEYS.X) && gameState.timeSlowCharge > 0 && !gameState.timeSlowActive) {
    gameState.timeSlowActive = true;
  }
  
  // Deactivate if charge depleted or key released
  if (gameState.timeSlowActive) {
    if (gameState.timeSlowCharge <= 0 || !p.keyIsDown(KEYS.X)) {
      gameState.timeSlowActive = false;
    } else {
      gameState.timeSlowCharge -= 0.5;
    }
  } else {
    // Recharge slowly
    if (gameState.timeSlowCharge < 100) {
      gameState.timeSlowCharge += 0.1;
    }
  }
}

export function getTimeScale() {
  return gameState.timeSlowActive ? 0.3 : 1.0;
}

export function renderTimeSlowEffect(p) {
  if (gameState.timeSlowActive) {
    p.push();
    p.fill(100, 200, 255, 30);
    p.noStroke();
    p.rect(0, 0, p.width, p.height);
    
    // Scanlines effect
    p.stroke(100, 200, 255, 50);
    p.strokeWeight(1);
    for (let y = 0; y < p.height; y += 4) {
      p.line(0, y, p.width, y);
    }
    p.pop();
  }
}