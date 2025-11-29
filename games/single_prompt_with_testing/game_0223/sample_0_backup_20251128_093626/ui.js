// ui.js - UI rendering on canvas overlay

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  MAX_LEVELS
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
  ctx.fillText('Christmas 1998 - 9 Levels', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
  
  // Description
  ctx.fillStyle = '#b4b4c8';
  ctx.font = '13px Courier New';
  ctx.fillText('Collect items and return to the green exit', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
  ctx.fillText('Survive all 9 levels as Mama gets faster!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
  
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
  
  // Level indicator
  ctx.fillStyle = '#ffff64';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = 'bold 18px Courier New';
  ctx.fillText(`Level ${gameState.currentLevel}/${MAX_LEVELS}`, 10, 10);
  
  // Collectibles
  ctx.fillStyle = 'white';
  ctx.font = '16px Courier New';
  ctx.fillText(`Items: ${gameState.collectiblesCollected}/${gameState.collectiblesNeeded}`, 10, 35);
  
  // Score
  ctx.fillText(`Score: ${gameState.score}`, 10, 60);
  
  // Flashlight battery
  const batteryWidth = 100;
  const batteryHeight = 15;
  const batteryX = 10;
  const batteryY = 85;
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
  ctx.fillText(gameState.flashlightOn ? 'Flashlight: ON' : 'Flashlight: OFF', 10, 110);
  
  // Sprint indicator
  if (gameState.isSprinting) {
    ctx.fillStyle = '#ffff00';
    ctx.fillText('SPRINTING', 10, 130);
  }
  
  // Tattletail needs
  const needsX = 10;
  const needsY = 155;
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
  
  // Objective hint
  if (gameState.collectiblesCollected >= gameState.collectiblesNeeded) {
    if (Math.floor(gameState.frameCount / 30) % 2 === 0) {
      ctx.fillStyle = '#00ff00';
      ctx.font = 'bold 14px Courier New';
      ctx.fillText('RETURN TO EXIT!', needsX, needsY + 105);
    }
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
  
  // Render minimap
  renderMinimap(ctx);
}

function renderMinimap(ctx) {
  const minimapX = CANVAS_WIDTH - 130;
  const minimapY = CANVAS_HEIGHT - 130;
  const minimapSize = 120;
  const mapScale = minimapSize / 40; // 40 is the map width
  
  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(minimapX, minimapY, minimapSize, minimapSize);
  
  // Border
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 2;
  ctx.strokeRect(minimapX, minimapY, minimapSize, minimapSize);
  
  // Draw walls
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 1;
  const walls = [
    { x1: 0, y1: 0, x2: 40, y2: 0 },
    { x1: 40, y1: 0, x2: 40, y2: 30 },
    { x1: 40, y1: 30, x2: 0, y2: 30 },
    { x1: 0, y1: 30, x2: 0, y2: 0 },
  ];
  
  walls.forEach(wall => {
    ctx.beginPath();
    ctx.moveTo(minimapX + wall.x1 * mapScale, minimapY + wall.y1 * mapScale);
    ctx.lineTo(minimapX + wall.x2 * mapScale, minimapY + wall.y2 * mapScale);
    ctx.stroke();
  });
  
  // Draw goal (green circle)
  if (gameState.goal) {
    ctx.fillStyle = gameState.collectiblesCollected >= gameState.collectiblesNeeded ? '#00ff00' : '#006400';
    ctx.beginPath();
    ctx.arc(
      minimapX + gameState.goal.mesh.position.x * mapScale,
      minimapY + gameState.goal.mesh.position.z * mapScale,
      4,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  
  // Draw collectibles (yellow dots)
  gameState.collectibles.forEach(collectible => {
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.arc(
      minimapX + collectible.mesh.position.x * mapScale,
      minimapY + collectible.mesh.position.z * mapScale,
      2,
      0,
      Math.PI * 2
    );
    ctx.fill();
  });
  
  // Draw mama (red circle with glow)
  if (gameState.mama && gameState.mama.active) {
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(
      minimapX + gameState.mama.mesh.position.x * mapScale,
      minimapY + gameState.mama.mesh.position.z * mapScale,
      6,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(
      minimapX + gameState.mama.mesh.position.x * mapScale,
      minimapY + gameState.mama.mesh.position.z * mapScale,
      3,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  
  // Draw player (blue triangle)
  if (gameState.player) {
    ctx.save();
    ctx.translate(
      minimapX + gameState.player.mesh.position.x * mapScale,
      minimapY + gameState.player.mesh.position.z * mapScale
    );
    ctx.rotate(-gameState.camera.rotation.y + Math.PI / 2);
    
    ctx.fillStyle = '#00ccff';
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(3, 3);
    ctx.lineTo(-3, 3);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  }
  
  // Label
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.font = '10px Courier New';
  ctx.fillText('MAP', minimapX + minimapSize / 2, minimapY - 2);
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

export function renderLevelComplete() {
  const ctx = gameState.uiContext;
  
  ctx.fillStyle = 'rgba(0, 50, 0, 0.8)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  ctx.fillStyle = '#00ff00';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 48px Courier New';
  ctx.fillText(`LEVEL ${gameState.currentLevel} COMPLETE!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
  
  ctx.fillStyle = 'white';
  ctx.font = '20px Courier New';
  ctx.fillText(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  // Show difficulty for next level
  const nextLevel = gameState.currentLevel + 1;
  let difficulty = 'EASY';
  if (nextLevel > 6) difficulty = 'HARD';
  else if (nextLevel > 3) difficulty = 'MEDIUM';
  
  ctx.fillStyle = '#ffff00';
  ctx.font = '18px Courier New';
  ctx.fillText(`Next Level: ${difficulty}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  
  if (Math.floor(gameState.frameCount / 30) % 2 === 0) {
    ctx.fillStyle = '#00ff00';
    ctx.font = '24px Courier New';
    ctx.fillText('PRESS ENTER TO CONTINUE', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
  }
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
    ctx.fillText('YOU WON!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
    
    ctx.fillStyle = '#c8c8ff';
    ctx.font = '20px Courier New';
    ctx.fillText('You completed all 9 levels!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
    ctx.fillText('Christmas morning has arrived', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 5);
  } else {
    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 48px Courier New';
    ctx.fillText('MAMA CAUGHT YOU', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
    
    ctx.fillStyle = '#c89696';
    ctx.font = '20px Courier New';
    ctx.fillText('She heard you...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
    ctx.fillText(`Made it to Level ${gameState.currentLevel}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 5);
  }
  
  ctx.fillStyle = 'white';
  ctx.font = '24px Courier New';
  ctx.fillText(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  
  ctx.font = '18px Courier New';
  ctx.fillText('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
}