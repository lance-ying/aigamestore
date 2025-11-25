// world.js - World generation and management

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Platform, Orb } from './entities.js';

export function initializeWorld() {
  gameState.platforms = [];
  gameState.orbs = [];
  
  // Ground level platforms
  gameState.platforms.push(new Platform(0, 380, 200, 20, 'solid'));
  gameState.platforms.push(new Platform(250, 380, 150, 20, 'solid'));
  gameState.platforms.push(new Platform(450, 380, 150, 20, 'solid'));
  
  // Lower section - accessible without abilities
  gameState.platforms.push(new Platform(100, 320, 100, 15, 'solid'));
  gameState.platforms.push(new Platform(300, 280, 120, 15, 'solid'));
  gameState.platforms.push(new Platform(480, 240, 100, 15, 'solid'));
  
  // Red orb area (double jump) - needs basic jumps
  gameState.platforms.push(new Platform(50, 200, 80, 15, 'solid'));
  gameState.platforms.push(new Platform(200, 160, 100, 15, 'solid'));
  gameState.orbs.push(new Orb(250, 130, 'doubleJump', [200, 50, 50]));
  
  // Mid section - needs double jump
  gameState.platforms.push(new Platform(380, 140, 100, 15, 'solid'));
  gameState.platforms.push(new Platform(520, 100, 80, 15, 'solid'));
  gameState.platforms.push(new Platform(100, 80, 120, 15, 'solid'));
  
  // Blue orb area (ground pound) - needs double jump to reach
  gameState.platforms.push(new Platform(280, 20, 100, 15, 'solid'));
  gameState.platforms.push(new Platform(280, -20, 40, 15, 'fragile'));
  gameState.platforms.push(new Platform(330, -20, 40, 15, 'fragile'));
  gameState.orbs.push(new Orb(310, -50, 'groundPound', [50, 100, 200]));
  
  // Upper section - needs ground pound to break through
  gameState.platforms.push(new Platform(150, -80, 80, 15, 'fragile'));
  gameState.platforms.push(new Platform(400, -120, 100, 15, 'solid'));
  gameState.platforms.push(new Platform(200, -160, 80, 15, 'solid'));
  
  // Yellow orb area (dash) - needs ground pound
  gameState.platforms.push(new Platform(50, -200, 60, 15, 'solid'));
  gameState.platforms.push(new Platform(500, -200, 60, 15, 'solid'));
  gameState.orbs.push(new Orb(280, -230, 'dash', [220, 200, 50]));
  
  // Top section - needs dash to reach
  gameState.platforms.push(new Platform(350, -280, 120, 15, 'solid'));
  gameState.platforms.push(new Platform(150, -320, 100, 15, 'solid'));
  gameState.platforms.push(new Platform(420, -360, 80, 15, 'solid'));
  
  // Final goal platform
  gameState.platforms.push(new Platform(250, -420, 100, 20, 'solid'));
}

export function renderWorld(p) {
  // Background - changes color with saturation
  const saturation = gameState.worldSaturation;
  const bgGradient = [
    [30 + 60 * saturation, 30 + 60 * saturation, 40 + 80 * saturation],
    [50 + 100 * saturation, 40 + 80 * saturation, 60 + 100 * saturation]
  ];
  
  // Gradient background
  for (let y = 0; y < CANVAS_HEIGHT; y++) {
    const inter = y / CANVAS_HEIGHT;
    const col = [
      bgGradient[0][0] * (1 - inter) + bgGradient[1][0] * inter,
      bgGradient[0][1] * (1 - inter) + bgGradient[1][1] * inter,
      bgGradient[0][2] * (1 - inter) + bgGradient[1][2] * inter
    ];
    p.stroke(...col);
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Distant mountains/shapes (parallax effect)
  p.noStroke();
  const parallaxOffset = gameState.cameraY * 0.3;
  for (let i = 0; i < 5; i++) {
    const mountainY = 300 + i * 50 + parallaxOffset;
    if (mountainY > -100 && mountainY < CANVAS_HEIGHT + 100) {
      p.fill(40 + 60 * saturation, 50 + 60 * saturation, 80 + 60 * saturation, 100);
      p.triangle(
        100 + i * 120, mountainY,
        200 + i * 120, mountainY - 150,
        300 + i * 120, mountainY
      );
    }
  }
  
  // Floating particles in background
  for (let i = 0; i < 20; i++) {
    const px = (i * 47) % CANVAS_WIDTH;
    const py = ((i * 73 + gameState.cameraY * 0.5) % CANVAS_HEIGHT);
    p.fill(200 * saturation, 200 * saturation, 255 * saturation, 100);
    p.ellipse(px, py, 3, 3);
  }
}

export function renderGoal(p) {
  const goalY = -420 - gameState.cameraY;
  
  // Only render if in view
  if (goalY > -50 && goalY < CANVAS_HEIGHT + 50) {
    p.push();
    p.translate(300, goalY - 30);
    
    const saturation = gameState.worldSaturation;
    
    // Glowing effect
    for (let i = 3; i > 0; i--) {
      p.fill(200 * saturation, 150 * saturation, 255 * saturation, 30 / i);
      p.noStroke();
      const size = 80 + i * 20;
      p.ellipse(0, 0, size, size);
    }
    
    // Core
    p.fill(255 * saturation, 200 * saturation, 255 * saturation);
    p.noStroke();
    p.ellipse(0, 0, 50, 50);
    
    // Rotating symbols
    const rotation = p.frameCount * 0.02;
    for (let i = 0; i < 4; i++) {
      p.push();
      p.rotate(rotation + i * Math.PI / 2);
      p.fill(255 * saturation, 255 * saturation, 200 * saturation);
      p.rect(30, -3, 15, 6);
      p.pop();
    }
    
    p.pop();
  }
}

export function checkGoalReached(player, p) {
  const goalX = 300;
  const goalY = -420;
  const dist = p.dist(player.x, player.y, goalX, goalY);
  return dist < 40;
}