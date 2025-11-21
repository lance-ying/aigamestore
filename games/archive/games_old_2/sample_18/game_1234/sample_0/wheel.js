// wheel.js - Spinning wheel logic

import { CATEGORIES, gameState, PLAY_STATES } from './globals.js';

export function spinWheel(p) {
  if (gameState.playState !== PLAY_STATES.SPINNING) return;
  
  // Start the wheel spinning
  gameState.wheelSpeed = 0.5 + Math.random() * 0.3;
  
  // Choose a random target category
  gameState.wheelTargetCategory = Math.floor(Math.random() * CATEGORIES.length);
  
  // Calculate target angle (with multiple rotations for visual effect)
  const rotations = 3 + Math.random() * 2; // 3-5 full rotations
  const segmentAngle = (Math.PI * 2) / CATEGORIES.length;
  gameState.wheelAngle = rotations * Math.PI * 2 + gameState.wheelTargetCategory * segmentAngle;
}

export function updateWheel(p) {
  if (gameState.wheelSpeed > 0) {
    // Decelerate the wheel
    const currentAngle = (p.frameCount * gameState.wheelSpeed) % (Math.PI * 2);
    gameState.wheelSpeed *= 0.98;
    
    // Check if wheel has stopped
    if (gameState.wheelSpeed < 0.001) {
      gameState.wheelSpeed = 0;
      gameState.selectedCategory = CATEGORIES[gameState.wheelTargetCategory].name;
      
      // Transition to question state after a brief delay
      setTimeout(() => {
        if (gameState.playState === PLAY_STATES.SPINNING) {
          gameState.playState = PLAY_STATES.QUESTION;
          startNewQuestion(p);
        }
      }, 500);
    }
  }
}

export function renderWheel(p) {
  const centerX = p.width / 2;
  const centerY = 200;
  const radius = 100;
  
  p.push();
  p.translate(centerX, centerY);
  
  // Rotate based on current animation
  const currentRotation = gameState.wheelSpeed > 0 ? 
    (p.frameCount * gameState.wheelSpeed) : 
    (gameState.wheelTargetCategory * (Math.PI * 2) / CATEGORIES.length);
  
  p.rotate(currentRotation);
  
  // Draw wheel segments
  const segmentAngle = (Math.PI * 2) / CATEGORIES.length;
  for (let i = 0; i < CATEGORIES.length; i++) {
    const angle = i * segmentAngle;
    
    p.fill(...CATEGORIES[i].color);
    p.stroke(255);
    p.strokeWeight(2);
    
    p.beginShape();
    p.vertex(0, 0);
    for (let a = 0; a <= segmentAngle; a += 0.1) {
      const x = Math.cos(angle + a) * radius;
      const y = Math.sin(angle + a) * radius;
      p.vertex(x, y);
    }
    p.endShape(p.CLOSE);
    
    // Draw category text
    p.push();
    p.rotate(angle + segmentAngle / 2);
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text(CATEGORIES[i].icon, radius * 0.7, 0);
    p.pop();
  }
  
  p.pop();
  
  // Draw pointer
  p.fill(255, 0, 0);
  p.noStroke();
  p.triangle(centerX, centerY - radius - 20, centerX - 10, centerY - radius - 5, centerX + 10, centerY - radius - 5);
  
  // Draw instruction
  if (gameState.wheelSpeed === 0 && gameState.playState === PLAY_STATES.SPINNING) {
    p.fill(255);
    p.textAlign(p.CENTER);
    p.textSize(16);
    p.text("PRESS SPACE TO SPIN", centerX, centerY + radius + 30);
  }
}

function startNewQuestion(p) {
  const { getRandomQuestion } = require('./questionBank.js');
  const category = gameState.selectedCategory;
  const difficulty = gameState.levelConfig.difficulty;
  
  gameState.currentQuestion = getRandomQuestion(category, difficulty);
  gameState.selectedAnswerIndex = -1;
  gameState.questionStartTime = p.millis();
  gameState.usedRemoveTwoWrong = false;
  
  // Log question start
  if (p.logs) {
    p.logs.game_info.push({
      data: `Question started: ${category} - ${difficulty}`,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}