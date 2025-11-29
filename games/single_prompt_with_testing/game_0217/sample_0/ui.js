// ui.js - UI rendering for all game screens

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';

export function renderStartScreen(p) {
  // Animated background
  renderAnimatedBackground(p);
  
  // Title with pulsing effect
  const titlePulse = Math.sin(gameState.frameCount * 0.05) * 0.1 + 1;
  p.push();
  p.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 100);
  p.scale(titlePulse);
  
  p.fill(...COLORS.pinkLight);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text('THE GOOD TIME', 0, -20);
  p.text('GARDEN', 0, 30);
  
  p.pop();
  
  // Subtitle
  p.fill(...COLORS.pinkMedium);
  p.textSize(16);
  p.textAlign(p.CENTER, p.CENTER);
  p.text('"It\'s good to be wet!"', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  
  // Instructions
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.CENTER, p.CENTER);
  const instructions = [
    'Help your friend by collecting 15 food orbs',
    'in this surreal, pulsating world.',
    '',
    'Arrow Keys: Move and Jump',
    'Space: Collect food when near',
    '',
    'PRESS ENTER TO START'
  ];
  
  let yOffset = CANVAS_HEIGHT / 2 + 30;
  instructions.forEach((line, i) => {
    if (i === instructions.length - 1) {
      // Pulse the "press enter" text
      const alpha = Math.sin(gameState.frameCount * 0.1) * 100 + 155;
      p.fill(255, 255, 100, alpha);
      p.textSize(18);
    }
    p.text(line, CANVAS_WIDTH / 2, yOffset);
    yOffset += 20;
  });
  
  // Draw some ambient creatures
  drawAmbientCreatures(p);
}

export function renderPlayingUI(p) {
  // Top bar background
  p.fill(...COLORS.pinkDark, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 50);
  
  // Food collected counter
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`Food: ${gameState.foodCollected}/${gameState.foodRequired}`, 10, 10);
  
  // Progress bar
  const barX = 10;
  const barY = 32;
  const barWidth = 150;
  const barHeight = 12;
  const progress = gameState.foodCollected / gameState.foodRequired;
  
  // Background
  p.fill(...COLORS.pinkDeep);
  p.rect(barX, barY, barWidth, barHeight);
  
  // Progress fill
  p.fill(...COLORS.foodGlow);
  p.rect(barX, barY, barWidth * progress, barHeight);
  
  // Border
  p.noFill();
  p.stroke(255);
  p.strokeWeight(2);
  p.rect(barX, barY, barWidth, barHeight);
  
  // Friend satisfaction indicator
  if (gameState.friend) {
    p.noStroke();
    p.fill(255);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(14);
    p.text('Friend Satisfaction:', CANVAS_WIDTH - 10, 10);
    
    const satX = CANVAS_WIDTH - 10 - 100;
    const satY = 32;
    const satWidth = 100;
    const satHeight = 12;
    
    p.fill(...COLORS.pinkDeep);
    p.rect(satX, satY, satWidth, satHeight);
    
    const satColor = p.lerpColor(
      p.color(...COLORS.pinkDark),
      p.color(100, 255, 100),
      gameState.friend.satisfaction
    );
    p.fill(satColor);
    p.rect(satX, satY, satWidth * gameState.friend.satisfaction, satHeight);
    
    p.noFill();
    p.stroke(255);
    p.strokeWeight(2);
    p.rect(satX, satY, satWidth, satHeight);
  }
}

export function renderPausedOverlay(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Paused text
  const pulse = Math.sin(gameState.frameCount * 0.1) * 0.1 + 1;
  p.push();
  p.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  p.scale(pulse);
  
  p.fill(...COLORS.pinkLight);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text('PAUSED', 0, -20);
  
  p.pop();
  
  p.fill(255);
  p.textSize(20);
  p.textAlign(p.CENTER, p.CENTER);
  p.text('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  p.text('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
}

export function renderGameOverScreen(p) {
  // Overlay
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  // Title
  const pulse = Math.sin(gameState.frameCount * 0.08) * 0.15 + 1;
  p.push();
  p.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
  p.scale(pulse);
  
  if (isWin) {
    p.fill(100, 255, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(54);
    p.textStyle(p.BOLD);
    p.text('YOUR FRIEND', 0, -20);
    p.text('IS SATISFIED!', 0, 30);
  } else {
    p.fill(255, 100, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text('TRY AGAIN', 0, 0);
  }
  
  p.pop();
  
  // Message
  p.fill(255);
  p.textSize(18);
  p.textAlign(p.CENTER, p.CENTER);
  if (isWin) {
    p.text('The wetness has been achieved!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
    p.text(`Food collected: ${gameState.foodCollected}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  } else {
    p.text(`Food collected: ${gameState.foodCollected}/${gameState.foodRequired}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
  }
  
  // Restart prompt
  const alpha = Math.sin(gameState.frameCount * 0.15) * 100 + 155;
  p.fill(255, 255, 100, alpha);
  p.textSize(20);
  p.text('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 90);
}

function renderAnimatedBackground(p) {
  // Pulsing organic shapes
  for (let i = 0; i < 5; i++) {
    const x = (i / 5) * CANVAS_WIDTH;
    const y = CANVAS_HEIGHT / 2;
    const pulse = Math.sin(gameState.frameCount * 0.02 + i) * 20 + 60;
    
    p.fill(...COLORS.pinkLight, 30);
    p.noStroke();
    p.circle(x, y, pulse * 2);
  }
}

function drawAmbientCreatures(p) {
  // Draw a few static decorative creatures
  const positions = [
    { x: 100, y: CANVAS_HEIGHT - 80, scale: 0.8 },
    { x: 500, y: CANVAS_HEIGHT - 100, scale: 1.2 },
    { x: 300, y: 120, scale: 0.6 }
  ];
  
  positions.forEach((pos, i) => {
    p.push();
    p.translate(pos.x, pos.y);
    p.scale(pos.scale);
    
    const wobble = Math.sin(gameState.frameCount * 0.05 + i) * 0.1 + 1;
    p.scale(wobble);
    
    // Simple blob
    p.fill(...COLORS.creatureSkin, 100);
    p.noStroke();
    p.beginShape();
    for (let j = 0; j < 6; j++) {
      const angle = (j / 6) * Math.PI * 2;
      const r = 20 + Math.sin(gameState.frameCount * 0.08 + j) * 5;
      p.vertex(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    p.endShape(p.CLOSE);
    
    p.pop();
  });
}