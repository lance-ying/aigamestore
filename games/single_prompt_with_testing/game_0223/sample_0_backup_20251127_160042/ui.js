// ui.js - UI rendering

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  GAME_DURATION
} from './globals.js';

export function renderStartScreen(p) {
  p.background(10, 5, 15);
  
  // Title with glow effect
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(200, 0, 0, 100);
  p.textSize(52);
  p.text('TATTLETAIL', CANVAS_WIDTH / 2 + 3, CANVAS_HEIGHT / 2 - 97);
  p.fill(255, 50, 100);
  p.textSize(48);
  p.text('TATTLETAIL', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 100);
  
  // Subtitle
  p.fill(200, 150, 200);
  p.textSize(16);
  p.text('Christmas 1998', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
  
  // Description
  p.fill(180, 180, 200);
  p.textSize(13);
  p.text('Keep Tattletail quiet and survive until morning', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
  p.text('Don\'t let Mama catch you...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
  
  // Controls
  p.fill(150, 150, 180);
  p.textSize(12);
  p.text('Arrow Keys: Move and Turn', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
  p.text('SPACE: Care for Tattletail', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
  p.text('Z: Toggle Flashlight | SHIFT: Shake Flashlight', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 90);
  p.text('ESC: Pause | R: Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 110);
  
  // Start prompt (blinking)
  if (Math.floor(gameState.frameCount / 30) % 2 === 0) {
    p.fill(255, 255, 100);
    p.textSize(20);
    p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
  }
}

export function renderHUD(p) {
  // Time remaining
  const minutes = Math.floor(gameState.timeRemaining / 60);
  const seconds = Math.floor(gameState.timeRemaining % 60);
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(18);
  p.text(`Time: ${timeStr}`, 10, 10);
  
  // Score
  p.text(`Score: ${gameState.score}`, 10, 35);
  
  // Flashlight battery
  const batteryWidth = 100;
  const batteryHeight = 15;
  const batteryX = 10;
  const batteryY = 60;
  const batteryRatio = gameState.flashlightBattery / 100;
  
  p.fill(40);
  p.rect(batteryX, batteryY, batteryWidth, batteryHeight);
  
  // Battery color based on level
  if (batteryRatio > 0.5) {
    p.fill(0, 200, 0);
  } else if (batteryRatio > 0.25) {
    p.fill(200, 200, 0);
  } else {
    p.fill(200, 0, 0);
  }
  p.rect(batteryX, batteryY, batteryWidth * batteryRatio, batteryHeight);
  
  p.noFill();
  p.stroke(255);
  p.strokeWeight(2);
  p.rect(batteryX, batteryY, batteryWidth, batteryHeight);
  
  p.fill(255);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(10);
  p.text('Battery', batteryX + batteryWidth / 2, batteryY + batteryHeight / 2);
  
  // Flashlight status
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.fill(gameState.flashlightOn ? [0, 255, 0] : [100, 100, 100]);
  p.text(gameState.flashlightOn ? 'Flashlight: ON' : 'Flashlight: OFF', 10, 85);
  
  // Tattletail needs
  const needsX = 10;
  const needsY = 110;
  const barWidth = 100;
  const barHeight = 12;
  
  p.textSize(11);
  p.fill(255);
  p.text('Tattletail Status:', needsX, needsY);
  
  // Hunger
  drawStatusBar(p, needsX, needsY + 20, barWidth, barHeight, 
    gameState.tattletailHunger / 100, 'Hunger', [255, 200, 50]);
  
  // Cleanliness
  drawStatusBar(p, needsX, needsY + 40, barWidth, barHeight,
    gameState.tattletailCleanliness / 100, 'Clean', [100, 200, 255]);
  
  // Battery
  drawStatusBar(p, needsX, needsY + 60, barWidth, barHeight,
    gameState.tattletailBattery / 100, 'Power', [50, 255, 50]);
  
  // Current need indicator
  if (gameState.tattletailNeedType !== "none") {
    p.fill(255, 100, 100);
    p.textSize(13);
    const needText = gameState.tattletailNeedType === "food" ? "NEEDS FOOD!" :
                     gameState.tattletailNeedType === "brush" ? "NEEDS BRUSH!" :
                     "NEEDS CHARGE!";
    p.text(needText, needsX, needsY + 85);
  }
  
  // Noise meter
  const noiseX = CANVAS_WIDTH - 120;
  const noiseY = 10;
  const noiseMeterWidth = 100;
  const noiseMeterHeight = 20;
  const noiseRatio = Math.min(1, gameState.noiseLevel / 100);
  
  p.fill(20);
  p.rect(noiseX, noiseY, noiseMeterWidth, noiseMeterHeight);
  
  // Noise level color (green to red)
  const r = Math.floor(255 * noiseRatio);
  const g = Math.floor(255 * (1 - noiseRatio));
  p.fill(r, g, 0);
  p.rect(noiseX, noiseY, noiseMeterWidth * noiseRatio, noiseMeterHeight);
  
  p.noFill();
  p.stroke(255);
  p.strokeWeight(2);
  p.rect(noiseX, noiseY, noiseMeterWidth, noiseMeterHeight);
  
  p.fill(255);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(10);
  p.text('NOISE', noiseX + noiseMeterWidth / 2, noiseY + noiseMeterHeight / 2);
  
  // Warning if noise is high
  if (gameState.noiseLevel > 60) {
    p.fill(255, 0, 0);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(16);
    if (Math.floor(gameState.frameCount / 15) % 2 === 0) {
      p.text('MAMA IS COMING!', CANVAS_WIDTH / 2, 40);
    }
  }
  
  // Minimap (imported from renderer)
  // This will be called from renderer.js
}

function drawStatusBar(p, x, y, width, height, ratio, label, color) {
  // Background
  p.fill(40);
  p.noStroke();
  p.rect(x, y, width, height);
  
  // Fill
  p.fill(color[0], color[1], color[2]);
  p.rect(x, y, width * ratio, height);
  
  // Border
  p.noFill();
  p.stroke(255);
  p.strokeWeight(1);
  p.rect(x, y, width, height);
  
  // Label
  p.fill(255);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(9);
  p.text(label, x + width / 2, y + height / 2);
}

export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  
  p.textSize(20);
  p.text('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
}

export function renderGameOver(p) {
  p.fill(0, 0, 0, 220);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  if (isWin) {
    p.fill(255, 255, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text('YOU SURVIVED!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
    
    p.fill(200, 200, 255);
    p.textSize(20);
    p.text('Christmas morning has arrived', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
    p.text('You kept Tattletail safe!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 5);
  } else {
    p.fill(255, 0, 0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text('MAMA CAUGHT YOU', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
    
    p.fill(200, 150, 150);
    p.textSize(20);
    p.text('You made too much noise...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  }
  
  p.fill(255);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  
  p.textSize(18);
  p.text('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
}