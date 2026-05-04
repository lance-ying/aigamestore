// render.js - Rendering functions

import { gameState, GAME_PHASES, FISHING_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, LOCATIONS, WIN_CONDITIONS } from './globals.js';
import { Fish, Projectile } from './entities.js';
import { drawShop } from './shop.js';
import { drawFishing } from './fishing.js';

export function drawGame(p) {
  // Clear background
  const location = LOCATIONS[gameState.currentLocation];
  const bgColor = location.bgColor;
  p.background(...bgColor);
  
  if (gameState.gamePhase === GAME_PHASES.START) {
    drawStartScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    if (gameState.fishingPhase === FISHING_PHASES.SHOP) {
      drawShop(p);
    } else {
      drawPlayingScreen(p);
    }
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    drawPlayingScreen(p);
    drawPausedOverlay(p);
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
             gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    drawGameOverScreen(p);
  }
}

function drawStartScreen(p) {
  p.background(20, 40, 80);
  
  // Title
  p.fill(255, 220, 100);
  p.textSize(32);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("RIDICULOUS FISHING", CANVAS_WIDTH / 2, 80);
  
  p.fill(200, 180, 255);
  p.textSize(18);
  p.text("A Tale of Redemption", CANVAS_WIDTH / 2, 115);
  
  // Description
  p.fill(200, 200, 200);
  p.textSize(14);
  p.textAlign(p.CENTER, p.TOP);
  const desc = [
    "Cast your line and descend into the depths!",
    "Steer to avoid fish on the way down.",
    "Shoot fish on the way up to earn cash.",
    "Buy upgrades and unlock new locations.",
    "",
    "Complete Billy's journey by mastering",
    "all locations and maxing out equipment!"
  ];
  
  let yPos = 160;
  desc.forEach(line => {
    p.text(line, CANVAS_WIDTH / 2, yPos);
    yPos += 20;
  });
  
  // Controls
  p.fill(150, 200, 255);
  p.textSize(13);
  yPos = 300;
  const controls = [
    "Arrow Keys: Steer lure",
    "Space: Shoot weapon",
    "Z: Cast line / Continue",
    "Shift: Open shop (at surface)"
  ];
  
  controls.forEach(line => {
    p.text(line, CANVAS_WIDTH / 2, yPos);
    yPos += 18;
  });
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textSize(16);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
}

function drawPlayingScreen(p) {
  // Draw ocean background gradient
  drawOceanBackground(p);
  
  // Draw depth markers
  if (gameState.fishingPhase !== FISHING_PHASES.SURFACE) {
    drawDepthMarkers(p);
  }
  
  // Draw entities
  gameState.entities.forEach(entity => {
    if (entity instanceof Fish) {
      entity.draw();
    }
  });
  
  // Draw projectiles
  gameState.projectiles.forEach(proj => {
    proj.draw();
  });
  
  // Draw fishing effects
  drawFishing(p);
  
  // Draw player (lure)
  if (gameState.player) {
    gameState.player.draw();
  }
  
  // Draw surface
  if (gameState.fishingPhase === FISHING_PHASES.SURFACE) {
    drawSurface(p);
  }
  
  // Draw UI
  drawUI(p);
}

function drawOceanBackground(p) {
  const location = LOCATIONS[gameState.currentLocation];
  const baseColor = location.bgColor;
  
  // Gradient based on depth
  for (let y = 0; y < CANVAS_HEIGHT; y++) {
    const t = y / CANVAS_HEIGHT;
    const r = baseColor[0] * (1 - t * 0.7);
    const g = baseColor[1] * (1 - t * 0.7);
    const b = baseColor[2] * (1 - t * 0.5);
    
    p.stroke(r, g, b);
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Add some particles in water
  p.noStroke();
  for (let i = 0; i < 30; i++) {
    const x = (p.frameCount * 0.5 + i * 20) % CANVAS_WIDTH;
    const y = (i * 15) % CANVAS_HEIGHT;
    p.fill(255, 255, 255, 50);
    p.ellipse(x, y, 3);
  }
}

function drawDepthMarkers(p) {
  p.stroke(255, 255, 255, 100);
  p.strokeWeight(1);
  p.fill(255, 255, 255, 150);
  p.textSize(12);
  p.textAlign(p.RIGHT, p.CENTER);
  
  const startDepth = Math.floor(gameState.currentDepth / 50) * 50;
  for (let d = startDepth; d < startDepth + 400; d += 50) {
    const screenY = 50 + (d - gameState.currentDepth) + (gameState.player ? gameState.player.y - 50 : 0);
    if (screenY > 0 && screenY < CANVAS_HEIGHT) {
      p.line(CANVAS_WIDTH - 40, screenY, CANVAS_WIDTH - 30, screenY);
      p.text(`${d}m`, CANVAS_WIDTH - 45, screenY);
    }
  }
}

function drawSurface(p) {
  // Water surface
  p.fill(100, 180, 255, 100);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 60);
  
  // Waves
  p.stroke(150, 200, 255);
  p.strokeWeight(2);
  p.noFill();
  for (let x = 0; x < CANVAS_WIDTH; x += 10) {
    const y = 50 + p.sin((x + p.frameCount) * 0.05) * 5;
    if (x === 0) {
      p.beginShape();
      p.vertex(x, y);
    } else {
      p.vertex(x, y);
    }
  }
  p.endShape();
  
  // Instructions
  p.fill(255, 255, 255);
  p.noStroke();
  p.textSize(14);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("Press Z to cast line", CANVAS_WIDTH / 2, 25);
  p.textSize(12);
  p.text("Press SHIFT for shop", CANVAS_WIDTH / 2, 45);
}

function drawUI(p) {
  // Top bar background
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 30);
  
  // Cash
  p.fill(100, 255, 100);
  p.textSize(14);
  p.textAlign(p.LEFT, p.CENTER);
  p.text(`Cash: $${gameState.cash}`, 10, 15);
  
  // Score
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 15);
  
  // Location
  const location = LOCATIONS[gameState.currentLocation];
  p.fill(150, 200, 255);
  p.textAlign(p.RIGHT, p.CENTER);
  p.text(location.name, CANVAS_WIDTH - 10, 15);
  
  // Depth indicator
  if (gameState.fishingPhase !== FISHING_PHASES.SURFACE) {
    p.fill(255, 255, 255);
    p.textAlign(p.LEFT, p.BOTTOM);
    p.textSize(12);
    const maxDepth = 200 + gameState.lineUpgradeLevel * 50;
    p.text(`Depth: ${Math.floor(gameState.currentDepth)}m / ${maxDepth}m`, 10, CANVAS_HEIGHT - 10);
  }
  
  // Upgrade indicators
  p.textAlign(p.RIGHT, p.BOTTOM);
  p.textSize(11);
  p.fill(200, 200, 255);
  p.text(`Line: ${gameState.lineUpgradeLevel}/4`, CANVAS_WIDTH - 10, CANVAS_HEIGHT - 45);
  p.text(`Speed: ${gameState.speedUpgradeLevel}/4`, CANVAS_WIDTH - 10, CANVAS_HEIGHT - 30);
  p.text(`Weapon: ${gameState.weaponUpgradeLevel}/4`, CANVAS_WIDTH - 10, CANVAS_HEIGHT - 15);
}

function drawPausedOverlay(p) {
  p.fill(255, 255, 255);
  p.textSize(16);
  p.textAlign(p.RIGHT, p.TOP);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

function drawGameOverScreen(p) {
  p.background(20, 20, 40);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Title
  p.fill(...(isWin ? [100, 255, 100] : [255, 100, 100]));
  p.textSize(36);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(isWin ? "REDEMPTION COMPLETE!" : "GAME OVER", CANVAS_WIDTH / 2, 80);
  
  // Stats
  p.fill(200, 200, 200);
  p.textSize(16);
  let yPos = 140;
  
  const stats = [
    `Final Score: ${gameState.score}`,
    `Total Cash Earned: $${gameState.cash}`,
    `Unique Species Caught: ${gameState.uniqueSpeciesCaught.size}`,
    `Locations Unlocked: ${gameState.unlockedLocations}/${LOCATIONS.length}`,
    ``,
    `Line Upgrade: ${gameState.lineUpgradeLevel}/4`,
    `Speed Upgrade: ${gameState.speedUpgradeLevel}/4`,
    `Weapon Upgrade: ${gameState.weaponUpgradeLevel}/4`
  ];
  
  stats.forEach(line => {
    p.text(line, CANVAS_WIDTH / 2, yPos);
    yPos += 25;
  });
  
  // Win message
  if (isWin) {
    p.fill(255, 220, 100);
    p.textSize(14);
    p.text("Billy has found his redemption through the art of fishing!", CANVAS_WIDTH / 2, yPos + 10);
  }
  
  // Restart prompt
  p.fill(255, 255, 100);
  p.textSize(16);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
}