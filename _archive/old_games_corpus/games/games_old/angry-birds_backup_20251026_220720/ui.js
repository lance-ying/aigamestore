// ui.js - UI rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
  p.background(135, 206, 235);
  
  // Title
  p.fill(255);
  p.stroke(0);
  p.strokeWeight(4);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("BIRD SLINGSHOT", CANVAS_WIDTH / 2, 80);
  
  // Description
  p.textSize(16);
  p.noStroke();
  p.fill(0);
  p.text("Launch birds to destroy pigs and structures!", CANVAS_WIDTH / 2, 150);
  p.text("Use special abilities to maximize destruction", CANVAS_WIDTH / 2, 175);
  
  // Instructions
  p.textSize(14);
  p.textAlign(p.LEFT, p.CENTER);
  p.text("↑↓ - Adjust Power", 150, 220);
  p.text("←→ - Aim Angle", 150, 240);
  p.text("SPACE - Launch / Activate Ability", 150, 260);
  
  // Start prompt
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  p.fill(255, 255, 0);
  p.stroke(0);
  p.strokeWeight(2);
  
  const pulse = p.abs(p.sin(p.frameCount * 0.05));
  p.fill(255, 255, 0, 150 + pulse * 105);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 350);
}

export function renderGameUI(p) {
  // Score and Level
  p.fill(255);
  p.stroke(0);
  p.strokeWeight(2);
  p.textSize(18);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Score: ${gameState.score}`, 10, 10);
  p.text(`Level: ${gameState.currentLevel}/${gameState.totalLevels}`, 10, 35);
  
  // Birds remaining
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`Birds: ${gameState.birdsRemaining}`, CANVAS_WIDTH - 10, 10);
  
  // Show current bird type if aiming
  if (gameState.isAiming && gameState.currentBird) {
    const birdName = gameState.currentBird.birdData.name;
    const abilityName = gameState.currentBird.ability;
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(14);
    p.text(`${birdName} Bird (${abilityName})`, CANVAS_WIDTH - 10, 35);
  }
}

export function renderSlingshot(p) {
  const base = gameState.slingshotBase;
  
  // Draw slingshot structure
  p.strokeWeight(8);
  p.stroke(80, 50, 20);
  p.line(base.x - 20, base.y, base.x - 20, base.y - 60);
  p.line(base.x + 20, base.y, base.x + 20, base.y - 60);
  
  // Draw bands if aiming
  if (gameState.isAiming && gameState.currentBird) {
    p.strokeWeight(3);
    p.stroke(60, 40, 20);
    
    const bird = gameState.currentBird;
    const birdX = bird.body.position.x;
    const birdY = bird.body.position.y;
    
    p.line(base.x - 20, base.y - 50, birdX, birdY);
    p.line(base.x + 20, base.y - 50, birdX, birdY);
  }
}

export function renderAimingGuide(p) {
  if (!gameState.isAiming || !gameState.currentBird) return;
  
  const base = gameState.slingshotBase;
  const angleRad = (gameState.slingshotAngle * Math.PI) / 180;
  const power = gameState.slingshotPower;
  
  // Calculate initial velocity - must match launchBird() exactly
  const vx = Math.cos(angleRad) * power * 0.15;
  const vy = Math.sin(angleRad) * power * 0.15;
  const gravity = gameState.world.gravity.y;
  
  // Draw partial trajectory prediction (only first 40 steps)
  p.noFill();
  p.stroke(255, 255, 255, 180);
  p.strokeWeight(2);
  p.beginShape();
  
  // Start from bird's launch position
  let posX = base.x;
  let posY = base.y - 30;
  let velX = vx;
  let velY = vy;
  
  // Simulate trajectory matching Matter.js physics
  // Matter.js applies gravity and damping in this order per frame:
  // 1. Apply gravity to velocity
  // 2. Apply damping to velocity
  // 3. Update position with velocity
  const frictionAir = 0.01; // Default Matter.js frictionAir
  
  // Show only partial trajectory (40 steps instead of 90)
  for (let i = 0; i < 40; i++) {
    // Draw current position
    p.vertex(posX, posY);
    
    // Match Matter.js integration order:
    // 1. Apply forces (gravity) to velocity
    velY += gravity;
    
    // 2. Apply air friction damping to velocity
    velX *= (1 - frictionAir);
    velY *= (1 - frictionAir);
    
    // 3. Update position with velocity
    posX += velX;
    posY += velY;
    
    // Stop if trajectory goes off screen or hits ground
    if (posY > CANVAS_HEIGHT - 20 || posX > CANVAS_WIDTH + 100 || posX < -100) {
      break;
    }
  }
  p.endShape();
  
  // Draw angle and power indicators
  p.fill(255);
  p.noStroke();
  p.textSize(12);
  p.textAlign(p.LEFT, p.CENTER);
  p.text(`Angle: ${Math.round(gameState.slingshotAngle)}°`, base.x + 40, base.y - 70);
  p.text(`Power: ${Math.round(power)}%`, base.x + 40, base.y - 55);
}

export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.stroke(0);
  p.strokeWeight(3);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  
  p.textSize(18);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

export function renderGameOver(p) {
  p.background(135, 206, 235);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  // Draw background elements
  for (let i = 0; i < 20; i++) {
    p.fill(255, 255, 255, 100);
    p.noStroke();
    p.circle(
      (p.frameCount * 0.5 + i * 50) % (CANVAS_WIDTH + 100) - 50,
      50 + i * 15,
      20
    );
  }
  
  // Title
  p.fill(isWin ? [50, 255, 50] : [255, 50, 50]);
  p.stroke(0);
  p.strokeWeight(4);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(56);
  
  if (isWin) {
    if (gameState.currentLevel >= gameState.totalLevels) {
      p.text("ALL LEVELS COMPLETE!", CANVAS_WIDTH / 2, 100);
    } else {
      p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, 100);
    }
  } else {
    p.text("GAME OVER", CANVAS_WIDTH / 2, 100);
  }
  
  // Score
  p.fill(255);
  p.textSize(32);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
  
  // Message
  p.textSize(18);
  if (isWin) {
    if (gameState.currentLevel >= gameState.totalLevels) {
      p.text("You defeated all the pigs!", CANVAS_WIDTH / 2, 240);
      p.text("Congratulations!", CANVAS_WIDTH / 2, 265);
    } else {
      p.text("All pigs defeated!", CANVAS_WIDTH / 2, 240);
      p.text(`Level ${gameState.currentLevel} complete!`, CANVAS_WIDTH / 2, 265);
    }
  } else {
    p.text("Out of birds!", CANVAS_WIDTH / 2, 240);
    p.text("Try again!", CANVAS_WIDTH / 2, 265);
  }
  
  // Restart prompt
  p.textSize(24);
  p.fill(255, 255, 0);
  const pulse = p.abs(p.sin(p.frameCount * 0.05));
  p.fill(255, 255, 0, 150 + pulse * 105);
  
  if (isWin && gameState.currentLevel < gameState.totalLevels) {
    p.text("PRESS ENTER FOR NEXT LEVEL", CANVAS_WIDTH / 2, 330);
    p.textSize(18);
    p.text("or press R to restart from level 1", CANVAS_WIDTH / 2, 360);
  } else {
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 350);
  }
}