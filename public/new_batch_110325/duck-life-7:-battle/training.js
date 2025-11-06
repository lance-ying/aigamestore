// training.js - Training mini-game logic
import { gameState, TRAINING_TYPES } from './globals.js';

export function startTraining(trainingType, p) {
  gameState.currentTraining = trainingType;
  gameState.trainingProgress = 0;
  gameState.trainingTimer = 180; // 3 seconds at 60fps
  gameState.trainingTarget = p.floor(p.random(15, 25));
  
  // Generate sequence for rhythm game
  gameState.trainingSequence = [];
  for (let i = 0; i < gameState.trainingTarget; i++) {
    gameState.trainingSequence.push(p.floor(p.random(4))); // 0-3 for arrow keys
  }
  gameState.trainingInput = [];
}

export function updateTraining(p) {
  if (!gameState.currentTraining) return;
  
  gameState.trainingTimer--;
  
  if (gameState.trainingTimer <= 0 || gameState.trainingProgress >= gameState.trainingTarget) {
    completeTraining();
  }
}

export function handleTrainingInput(keyCode, p) {
  if (!gameState.currentTraining) return;
  
  const training = TRAINING_TYPES.find(t => t.id === gameState.currentTraining);
  if (!training) return;
  
  // Different input mechanics for different training types
  if (training.id === 'power' || training.id === 'special') {
    // Rhythm game - match arrow sequence
    if (keyCode >= 37 && keyCode <= 40) {
      const arrowIndex = keyCode - 37;
      const expectedIndex = gameState.trainingInput.length;
      
      if (expectedIndex < gameState.trainingSequence.length) {
        gameState.trainingInput.push(arrowIndex);
        
        if (arrowIndex === gameState.trainingSequence[expectedIndex]) {
          gameState.trainingProgress++;
        }
      }
    }
  } else if (training.id === 'speed') {
    // Rapid tapping - space bar
    if (keyCode === 32) {
      gameState.trainingProgress++;
    }
  } else if (training.id === 'defence' || training.id === 'health') {
    // Timing game - press space at right moment
    if (keyCode === 32) {
      const timing = gameState.trainingTimer % 60;
      if (timing > 25 && timing < 35) {
        gameState.trainingProgress += 2;
      } else {
        gameState.trainingProgress += 1;
      }
    }
  }
}

function completeTraining() {
  const successRate = gameState.trainingProgress / gameState.trainingTarget;
  let statGain = 0;
  
  if (successRate >= 0.8) statGain = 5;
  else if (successRate >= 0.6) statGain = 3;
  else if (successRate >= 0.4) statGain = 2;
  else statGain = 1;
  
  const training = TRAINING_TYPES.find(t => t.id === gameState.currentTraining);
  if (training) {
    if (training.stat === 'health') {
      gameState.player.maxHealth += statGain * 2;
      gameState.player.health = gameState.player.maxHealth;
    } else {
      gameState.player[training.stat] += statGain;
    }
  }
  
  gameState.currentTraining = null;
  gameState.screen = 'WORLD';
}

export function renderTraining(p) {
  if (!gameState.currentTraining) return;
  
  const training = TRAINING_TYPES.find(t => t.id === gameState.currentTraining);
  if (!training) return;
  
  // Background
  p.fill(...training.color, 30);
  p.rect(0, 0, 600, 400);
  
  // Title
  p.fill(255);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(24);
  p.text(training.name, 300, 20);
  
  // Timer
  p.textSize(16);
  p.text(`Time: ${(gameState.trainingTimer / 60).toFixed(1)}s`, 300, 55);
  
  // Progress
  p.text(`Progress: ${gameState.trainingProgress} / ${gameState.trainingTarget}`, 300, 80);
  
  // Training specific visuals
  if (training.id === 'power' || training.id === 'special') {
    renderRhythmGame(p, training);
  } else if (training.id === 'speed') {
    renderTappingGame(p, training);
  } else if (training.id === 'defence' || training.id === 'health') {
    renderTimingGame(p, training);
  }
  
  // Instructions
  p.textSize(14);
  p.fill(200);
  p.text("Complete the mini-game to gain stat points!", 300, 360);
}

function renderRhythmGame(p, training) {
  p.textSize(18);
  p.fill(255);
  p.text("Match the arrow sequence!", 300, 120);
  
  // Show sequence
  const startX = 150;
  const y = 200;
  const spacing = 40;
  
  for (let i = 0; i < Math.min(10, gameState.trainingSequence.length); i++) {
    const arrow = gameState.trainingSequence[i];
    const x = startX + i * spacing;
    
    // Check if this was input correctly
    const wasCorrect = i < gameState.trainingInput.length && 
                       gameState.trainingInput[i] === gameState.trainingSequence[i];
    const wasFailed = i < gameState.trainingInput.length && 
                      gameState.trainingInput[i] !== gameState.trainingSequence[i];
    
    p.fill(...(wasCorrect ? [100, 255, 100] : wasFailed ? [255, 100, 100] : [255, 255, 255]));
    
    drawArrow(p, x, y, arrow, 25);
  }
  
  // Current position indicator
  if (gameState.trainingInput.length < gameState.trainingSequence.length) {
    const indicatorX = startX + gameState.trainingInput.length * spacing;
    p.noFill();
    p.stroke(255, 255, 0);
    p.strokeWeight(3);
    p.rect(indicatorX - 15, y - 15, 30, 30);
    p.strokeWeight(1);
  }
}

function renderTappingGame(p, training) {
  p.textSize(18);
  p.fill(255);
  p.text("Press SPACE rapidly!", 300, 120);
  
  // Visual feedback
  const progress = gameState.trainingProgress / gameState.trainingTarget;
  const barWidth = 400;
  const barHeight = 40;
  const x = 100;
  const y = 200;
  
  // Background bar
  p.fill(50);
  p.rect(x, y, barWidth, barHeight);
  
  // Progress bar
  p.fill(...training.color);
  p.rect(x, y, barWidth * progress, barHeight);
  
  // Border
  p.noFill();
  p.stroke(255);
  p.rect(x, y, barWidth, barHeight);
  p.noStroke();
  
  // Duck animation
  const duckX = x + (barWidth * progress);
  drawDuck(p, duckX, y + barHeight / 2, 20, [255, 200, 0]);
}

function renderTimingGame(p, training) {
  p.textSize(18);
  p.fill(255);
  p.text("Press SPACE when the bar is in the green zone!", 300, 120);
  
  const barWidth = 400;
  const barHeight = 40;
  const x = 100;
  const y = 200;
  
  // Background
  p.fill(50);
  p.rect(x, y, barWidth, barHeight);
  
  // Green zone
  const greenStart = barWidth * 0.4;
  const greenWidth = barWidth * 0.2;
  p.fill(100, 255, 100);
  p.rect(x + greenStart, y, greenWidth, barHeight);
  
  // Moving indicator
  const timing = (gameState.trainingTimer % 60) / 60;
  const indicatorX = x + (barWidth * timing);
  p.fill(255, 100, 100);
  p.rect(indicatorX - 5, y, 10, barHeight);
  
  // Border
  p.noFill();
  p.stroke(255);
  p.rect(x, y, barWidth, barHeight);
  p.noStroke();
}

function drawArrow(p, x, y, direction, size) {
  p.push();
  p.translate(x, y);
  p.rotate(direction * p.HALF_PI);
  p.beginShape();
  p.vertex(0, -size);
  p.vertex(size * 0.6, 0);
  p.vertex(size * 0.3, 0);
  p.vertex(size * 0.3, size);
  p.vertex(-size * 0.3, size);
  p.vertex(-size * 0.3, 0);
  p.vertex(-size * 0.6, 0);
  p.endShape(p.CLOSE);
  p.pop();
}

function drawDuck(p, x, y, size, color) {
  p.push();
  p.translate(x, y);
  
  // Body
  p.fill(...color);
  p.ellipse(0, 0, size * 1.5, size);
  
  // Head
  p.ellipse(-size * 0.5, -size * 0.5, size, size);
  
  // Beak
  p.fill(255, 150, 0);
  p.triangle(-size * 0.8, -size * 0.5, -size * 1.2, -size * 0.3, -size * 1.2, -size * 0.7);
  
  // Eye
  p.fill(0);
  p.circle(-size * 0.6, -size * 0.6, size * 0.2);
  
  p.pop();
}