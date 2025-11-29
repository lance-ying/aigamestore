// ui.js - UI rendering on canvas overlay

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
} from './globals.js';

export function renderStartScreen() {
  const ctx = gameState.uiContext;
  
  // Clear canvas
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Dark overlay
  ctx.fillStyle = 'rgba(10, 5, 15, 0.95)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Title with glow effect
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  ctx.fillStyle = 'rgba(200, 0, 0, 0.5)';
  ctx.font = 'bold 52px Courier New';
  ctx.fillText('TATTLETAIL', CANVAS_WIDTH / 2 + 3, CANVAS_HEIGHT / 2 - 97);
  
  ctx.fillStyle = '#ff3266';
  ctx.font = 'bold 48px Courier New';
  ctx.fillText('TATTLETAIL', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 100);
  
  // Subtitle
  ctx.fillStyle = '#c896c8';
  ctx.font = '16px Courier New';
  ctx.fillText('Christmas 1998', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
  
  // Description
  ctx.fillStyle = '#b4b4c8';
  ctx.font = '13px Courier New';
  ctx.fillText('Keep Tattletail quiet and survive until morning', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
  ctx.fillText('Don\'t let Mama catch you...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
  
  // Controls
  ctx.fillStyle = '#9696b4';
  ctx.font = '12px Courier New';
  ctx.fillText('Arrow Keys: Move and Turn', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
  ctx.fillText('SPACE: Care for Tattletail', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
  ctx.fillText('Z: Toggle Flashlight | X: Shake Flashlight | SHIFT: Sprint', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 90);
  ctx.fillText('ESC: Pause | R: Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 110);
  
  // Start prompt (blinking)
  if (Math.floor(gameState.frameCount / 30) % 2 === 0) {
    ctx.fillStyle = '#ffff64';
    ctx.font = '20px Courier New';
    ctx.fillText('PRESS ENTER TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
  }
}

export function renderHUD() {
  const ctx = gameState.uiContext;
  
  // Clear canvas
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Time remaining
  const minutes = Math.floor(gameState.timeRemaining / 60);
  const seconds = Math.floor(gameState.timeRemaining % 60);
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  
  ctx.fillStyle = 'white';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = '18px Courier New';
  ctx.fillText(`Time: ${timeStr}`, 10, 10);
  
  // Score
  ctx.fillText(`Score: ${gameState.score}`, 10, 35);
  
  // Flashlight battery
  const batteryWidth = 100;
  const batteryHeight = 15;
  const batteryX = 10;
  const batteryY = 60;
  const batteryRatio = gameState.flashlightBattery / 100;
  
  ctx.fillStyle = '#282828';
  ctx.fillRect(batteryX, batteryY, batteryWidth, batteryHeight);
  
  // Battery color based on level
  if (batteryRatio > 0.5) {
    ctx.fillStyle = '#00c800';
  } else if (batteryRatio > 0.25) {
    ctx.fillStyle = '#c8c800';
  } else {
    ctx.fillStyle = '#c80000';
  }
  ctx.fillRect(batteryX, batteryY, batteryWidth * batteryRatio, batteryHeight);
  
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.strokeRect(batteryX, batteryY, batteryWidth, batteryHeight);
  
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '10px Courier New';
  ctx.fillText('Battery', batteryX + batteryWidth / 2, batteryY + batteryHeight / 2);
  
  // Flashlight status
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = '12px Courier New';
  ctx.fillStyle = gameState.flashlightOn ? '#00ff00' : '#646464';
  ctx.fillText(gameState.flashlightOn ? 'Flashlight: ON' : 'Flashlight: OFF', 10, 85);
  
  // Sprint indicator
  if (gameState.isSprinting) {
    ctx.fillStyle = '#ffff00';
    ctx.fillText('SPRINTING', 10, 105);
  }
  
  // Tattletail needs
  const needsX = 10;
  const needsY = 130;
  const barWidth = 100;
  const barHeight = 12;
  
  ctx.font = '11px Courier New';
  ctx.fillStyle = 'white';
  ctx.fillText('Tattletail Status:', needsX, needsY);
  
  // Hunger
  drawStatusBar(ctx, needsX, needsY + 20, barWidth, barHeight, 
    gameState.tattletailHunger / 100, 'Hunger', [255, 200, 50]);
  
  // Cleanliness
  drawStatusBar(ctx, needsX, needsY + 40, barWidth, barHeight,
    gameState.tattletailCleanliness / 100, 'Clean', [100, 200, 255]);
  
  // Battery
  drawStatusBar(ctx, needsX, needsY + 60, barWidth, barHeight,
    gameState.tattletailBattery / 100, 'Power', [50, 255, 50]);
  
  // Current need indicator
  if (gameState.tattletailNeedType !== "none") {
    ctx.fillStyle = '#ff6464';
    ctx.font = '13px Courier New';
    const needText = gameState.tattletailNeedType === "food" ? "NEEDS FOOD!" :
                     gameState.tattletailNeedType === "brush" ? "NEEDS BRUSH!" :
                     "NEEDS CHARGE!";
    ctx.fillText(needText, needsX, needsY + 85);
  }
  
  // Noise meter
  const noiseX = CANVAS_WIDTH - 120;
  const noiseY = 10;
  const noiseMeterWidth = 100;
  const noiseMeterHeight = 20;
  const noiseRatio = Math.min(1, gameState.noiseLevel / 100);
  
  ctx.fillStyle = '#141414';
  ctx.fillRect(noiseX, noiseY, noiseMeterWidth, noiseMeterHeight);
  
  // Noise level color (green to red)
  const r = Math.floor(255 * noiseRatio);
  const g = Math.floor(255 * (1 - noiseRatio));
  ctx.fillStyle = `rgb(${r}, ${g}, 0)`;
  ctx.fillRect(noiseX, noiseY, noiseMeterWidth * noiseRatio, noiseMeterHeight);
  
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.strokeRect(noiseX, noiseY, noiseMeterWidth, noiseMeterHeight);
  
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '10px Courier New';
  ctx.fillText('NOISE', noiseX + noiseMeterWidth / 2, noiseY + noiseMeterHeight / 2);
  
  // Warning if Mama is active
  if (gameState.mamaActive) {
    ctx.fillStyle = '#ff0000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = '16px Courier New';
    if (Math.floor(gameState.frameCount / 15) % 2 === 0) {
      ctx.fillText('MAMA IS HUNTING!', CANVAS_WIDTH / 2, 40);
    }
  }
}

function drawStatusBar(ctx, x, y, width, height, ratio, label, color) {
  // Background
  ctx.fillStyle = '#282828';
  ctx.fillRect(x, y, width, height);
  
  // Fill
  ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
  ctx.fillRect(x, y, width * ratio, height);
  
  // Border
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, height);
  
  // Label
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '9px Courier New';
  ctx.fillText(label, x + width / 2, y + height / 2);
}

export function renderPausedOverlay() {
  const ctx = gameState.uiContext;
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 48px Courier New';
  ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  
  ctx.font = '20px Courier New';
  ctx.fillText('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
}

export function renderJumpscare() {
  const ctx = gameState.uiContext;
  
  // Calculate elapsed time since jumpscare started
  const elapsed = Date.now() - gameState.jumpscareTime;
  const intensity = Math.min(1, elapsed / 500); // Fade in over 0.5 seconds
  
  // Red flash overlay
  const flashIntensity = Math.sin(elapsed / 100) * 0.5 + 0.5;
  ctx.fillStyle = `rgba(255, 0, 0, ${intensity * flashIntensity * 0.7})`;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Mama's face (simplified jumpscare)
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Glowing red eyes
  const eyeSize = 40 + Math.sin(elapsed / 100) * 10;
  ctx.fillStyle = `rgba(255, 0, 0, ${intensity})`;
  ctx.beginPath();
  ctx.arc(CANVAS_WIDTH / 2 - 60, CANVAS_HEIGHT / 2 - 20, eyeSize, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(CANVAS_WIDTH / 2 + 60, CANVAS_HEIGHT / 2 - 20, eyeSize, 0, Math.PI * 2);
  ctx.fill();
  
  // Pupils
  ctx.fillStyle = `rgba(0, 0, 0, ${intensity})`;
  ctx.beginPath();
  ctx.arc(CANVAS_WIDTH / 2 - 60, CANVAS_HEIGHT / 2 - 20, eyeSize * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(CANVAS_WIDTH / 2 + 60, CANVAS_HEIGHT / 2 - 20, eyeSize * 0.5, 0, Math.PI * 2);
  ctx.fill();
  
  // Jumpscare text
  const scale = 1 + Math.sin(elapsed / 50) * 0.1;
  ctx.save();
  ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
  ctx.scale(scale, scale);
  
  ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
  ctx.shadowBlur = 20;
  ctx.fillStyle = `rgba(255, 255, 255, ${intensity})`;
  ctx.font = 'bold 60px Courier New';
  ctx.fillText('MAMA!', 0, 0);
  
  ctx.restore();
}

export function renderGameOver() {
  const ctx = gameState.uiContext;
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  if (isWin) {
    ctx.fillStyle = '#ffff64';
    ctx.font = 'bold 48px Courier New';
    ctx.fillText('YOU SURVIVED!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
    
    ctx.fillStyle = '#c8c8ff';
    ctx.font = '20px Courier New';
    ctx.fillText('Christmas morning has arrived', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
    ctx.fillText('You kept Tattletail safe!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 5);
  } else {
    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 48px Courier New';
    ctx.fillText('MAMA CAUGHT YOU', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
    
    ctx.fillStyle = '#c89696';
    ctx.font = '20px Courier New';
    ctx.fillText('She heard you...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  }
  
  ctx.fillStyle = 'white';
  ctx.font = '24px Courier New';
  ctx.fillText(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  
  ctx.font = '18px Courier New';
  ctx.fillText('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
}