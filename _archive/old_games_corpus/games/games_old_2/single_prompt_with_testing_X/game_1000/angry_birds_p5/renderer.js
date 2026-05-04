// renderer.js - Rendering functions for all game screens

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, BIRD_TYPES } from './globals.js';

export function renderStartScreen(p) {
  p.background(135, 206, 235);
  
  // Title
  p.fill(255, 100, 100);
  p.stroke(0);
  p.strokeWeight(4);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("BIRD STRIKE", CANVAS_WIDTH / 2, 80);
  
  // Instructions
  p.fill(50);
  p.noStroke();
  p.textSize(16);
  p.textAlign(p.CENTER, p.CENTER);
  
  p.text("Destroy all pigs to win!", CANVAS_WIDTH / 2, 150);
  p.text("Use special abilities wisely!", CANVAS_WIDTH / 2, 175);
  
  // Controls
  p.textSize(14);
  p.textAlign(p.LEFT, p.CENTER);
  const controlsX = 120;
  let y = 220;
  p.text("Arrow Keys: Aim angle and adjust power", controlsX, y);
  y += 25;
  p.text("SPACE: Launch bird / Activate ability", controlsX, y);
  y += 25;
  p.text("Z: Use power-up (when available)", controlsX, y);
  
  // Start prompt
  p.fill(255, 200, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  if (Math.floor(p.frameCount / 30) % 2 === 0) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 340);
  }
  
  // Draw decorative bird
  drawDecorativeBird(p, CANVAS_WIDTH / 2, 360);
}

export function renderPlayingScreen(p) {
  // Sky background
  p.background(135, 206, 235);
  
  // Clouds
  drawClouds(p);
  
  // Ground
  p.fill(100, 200, 100);
  p.noStroke();
  p.rect(0, 380, CANVAS_WIDTH, 20);
  
  // Grass details
  p.stroke(80, 180, 80);
  p.strokeWeight(2);
  for (let i = 0; i < CANVAS_WIDTH; i += 10) {
    p.line(i, 380, i + p.random(-3, 3), 375);
  }
  
  // Draw slingshot
  drawSlingshot(p);
  
  // Draw structures
  gameState.structures.forEach(structure => {
    if (!structure.destroyed) {
      structure.draw();
    }
  });
  
  // Draw pigs
  gameState.pigs.forEach(pig => {
    if (pig.alive) {
      pig.draw();
    }
  });
  
  // Draw all active birds
  gameState.birds.forEach(bird => {
    if (bird.active) {
      bird.draw();
    }
  });
  
  // Draw current bird
  if (gameState.currentBird) {
    gameState.currentBird.draw();
  }
  
  // Draw particles
  gameState.particles.forEach(particle => particle.draw());
  
  // Draw UI
  drawUI(p);
  
  // Paused indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.fill(0, 150);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(18);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }
}

export function renderGameOverScreen(p) {
  p.background(135, 206, 235);
  
  const won = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Title
  p.fill(won ? [100, 255, 100] : [255, 100, 100]);
  p.stroke(0);
  p.strokeWeight(4);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(won ? "VICTORY!" : "LEVEL FAILED", CANVAS_WIDTH / 2, 100);
  
  // Score
  p.fill(50);
  p.noStroke();
  p.textSize(24);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 170);
  p.text(`Gems Earned: ${gameState.gems}`, CANVAS_WIDTH / 2, 210);
  
  if (won) {
    p.textSize(18);
    p.text("All pigs defeated!", CANVAS_WIDTH / 2, 250);
  } else {
    p.textSize(18);
    p.text("Out of birds!", CANVAS_WIDTH / 2, 250);
  }
  
  // Restart prompt
  p.fill(255, 200, 0);
  p.textSize(20);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 320);
  
  // Draw final bird
  drawDecorativeBird(p, CANVAS_WIDTH / 2, 360);
}

function drawSlingshot(p) {
  const slingshotX = 100;
  const slingshotY = 320;
  
  // Base
  p.fill(100, 70, 50);
  p.stroke(0);
  p.strokeWeight(2);
  p.rect(slingshotX - 15, slingshotY, 30, 60);
  
  // Y-shaped arms
  p.strokeWeight(4);
  p.line(slingshotX - 10, slingshotY, slingshotX - 20, slingshotY - 40);
  p.line(slingshotX + 10, slingshotY, slingshotX + 20, slingshotY - 40);
  
  if (gameState.isAiming && gameState.currentBird && !gameState.birdLaunched) {
    // Draw elastic bands
    p.stroke(80, 60, 40);
    p.strokeWeight(3);
    p.line(slingshotX - 20, slingshotY - 40, gameState.currentBird.x, gameState.currentBird.y);
    p.line(slingshotX + 20, slingshotY - 40, gameState.currentBird.x, gameState.currentBird.y);
    
    // Draw trajectory preview
    drawTrajectoryPreview(p, slingshotX, slingshotY);
  }
}

function drawTrajectoryPreview(p, startX, startY) {
  if (!gameState.currentBird) return;
  
  const radians = p.radians(gameState.slingshotAngle);
  const vx = p.cos(radians) * gameState.slingshotPower * 0.2;
  const vy = p.sin(radians) * gameState.slingshotPower * 0.2;
  
  let x = startX;
  let y = slingshotY - 30;
  let velX = vx;
  let velY = vy;
  
  p.stroke(255, 255, 255, 150);
  p.strokeWeight(2);
  
  for (let i = 0; i < 30; i++) {
    velY += 0.5; // gravity
    velX *= 0.99;
    velY *= 0.99;
    
    const nextX = x + velX;
    const nextY = y + velY;
    
    if (i % 3 === 0) {
      p.point(nextX, nextY);
    }
    
    x = nextX;
    y = nextY;
    
    if (y > CANVAS_HEIGHT) break;
  }
}

function drawUI(p) {
  // Score and gems
  p.fill(255);
  p.stroke(0);
  p.strokeWeight(2);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`Score: ${gameState.score}`, 10, 10);
  p.text(`Gems: ${gameState.gems}`, 10, 30);
  p.text(`Level: ${gameState.level}`, 10, 50);
  
  // Birds remaining
  p.textAlign(p.LEFT, p.BOTTOM);
  p.text(`Birds: ${gameState.birdsRemaining}`, 10, CANVAS_HEIGHT - 10);
  
  // Draw bird icons
  for (let i = 0; i < gameState.birdsRemaining; i++) {
    p.fill(...BIRD_TYPES[gameState.selectedBirdType].color);
    p.circle(70 + i * 25, CANVAS_HEIGHT - 20, 15);
  }
  
  // Power bar
  const powerBarX = CANVAS_WIDTH - 150;
  const powerBarY = CANVAS_HEIGHT - 50;
  const powerBarWidth = 100;
  const powerBarHeight = 20;
  
  p.fill(50);
  p.rect(powerBarX, powerBarY, powerBarWidth, powerBarHeight);
  p.fill(255, 200, 0);
  p.rect(powerBarX, powerBarY, powerBarWidth * (gameState.slingshotPower / 100), powerBarHeight);
  
  p.fill(255);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(12);
  p.text("POWER", powerBarX + powerBarWidth / 2, powerBarY + powerBarHeight / 2);
  
  // Angle indicator
  p.textAlign(p.RIGHT, p.BOTTOM);
  p.textSize(14);
  p.text(`Angle: ${Math.round(gameState.slingshotAngle)}°`, CANVAS_WIDTH - 10, CANVAS_HEIGHT - 70);
}

function drawClouds(p) {
  p.fill(255, 255, 255, 200);
  p.noStroke();
  
  // Static clouds for consistent rendering
  const clouds = [
    { x: 100, y: 60 },
    { x: 300, y: 100 },
    { x: 500, y: 50 }
  ];
  
  clouds.forEach(cloud => {
    p.ellipse(cloud.x, cloud.y, 60, 30);
    p.ellipse(cloud.x - 20, cloud.y + 5, 50, 25);
    p.ellipse(cloud.x + 20, cloud.y + 5, 50, 25);
  });
}

function drawDecorativeBird(p, x, y) {
  p.fill(220, 40, 40);
  p.stroke(0);
  p.strokeWeight(2);
  p.circle(x, y, 30);
  
  p.fill(255);
  p.circle(x + 5, y - 3, 10);
  p.fill(0);
  p.circle(x + 7, y - 3, 5);
  
  p.fill(255, 150, 0);
  p.triangle(x + 12, y, x + 20, y - 3, x + 20, y + 3);
}