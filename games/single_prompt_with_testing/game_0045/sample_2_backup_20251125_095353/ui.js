// ui.js - UI rendering on canvas overlay
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, CARD_TYPES } from './globals.js';

let uiCanvas = null;
let uiContext = null;

// Initialize UI canvas
export function initUI() {
  uiCanvas = document.createElement('canvas');
  uiCanvas.width = CANVAS_WIDTH;
  uiCanvas.height = CANVAS_HEIGHT;
  uiCanvas.style.position = 'absolute';
  uiCanvas.style.top = '0';
  uiCanvas.style.left = '0';
  uiCanvas.style.pointerEvents = 'none';
  uiCanvas.style.zIndex = '1000';
  uiCanvas.style.margin = '0';
  uiCanvas.style.padding = '0';
  
  if (gameState.gameContainer) {
    gameState.gameContainer.appendChild(uiCanvas);
  }
  
  uiContext = uiCanvas.getContext('2d');
}

// Render all UI elements
export function renderUI() {
  if (!uiContext) return;
  
  // Clear canvas
  uiContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  switch (gameState.gamePhase) {
    case "START":
      renderStartScreen();
      break;
    case "PLAYING":
      renderHUD();
      renderCrosshair();
      break;
    case "PAUSED":
      renderHUD();
      renderPauseScreen();
      break;
    case "GAME_OVER_WIN":
      renderWinScreen();
      break;
    case "GAME_OVER_LOSE":
      renderLoseScreen();
      break;
  }
}

// Render start screen
function renderStartScreen() {
  // Dark overlay
  uiContext.fillStyle = 'rgba(0, 0, 0, 0.8)';
  uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Title with neon glow effect
  uiContext.save();
  uiContext.shadowBlur = 20;
  uiContext.shadowColor = '#00ffff';
  uiContext.fillStyle = '#00ffff';
  uiContext.font = 'bold 40px Arial';
  uiContext.textAlign = 'center';
  uiContext.fillText('NEON WHITE', CANVAS_WIDTH / 2, 100);
  uiContext.restore();
  
  // Subtitle
  uiContext.fillStyle = '#ffffff';
  uiContext.font = '16px Arial';
  uiContext.textAlign = 'center';
  uiContext.fillText('Speedrunning FPS with Parkour Cards', CANVAS_WIDTH / 2, 140);
  
  // Instructions
  uiContext.fillStyle = '#cccccc';
  uiContext.font = '14px Arial';
  const instructions = [
    'OBJECTIVE: Eliminate demons and reach the goal portal',
    '',
    'MOVEMENT: WASD or Arrow Keys',
    'JUMP: Space',
    'SPRINT: Shift',
    'SHOOT: Z',
    'SWITCH CARDS: 1, 2, 3',
    '',
    'SOUL CARDS: Shoot enemies or discard for parkour moves',
    '• PISTOL (Cyan): Double Jump',
    '• RIFLE (Magenta): Forward Dash',
    '• SHOTGUN (Yellow): Grapple Boost',
    '',
    'Press ENTER to Start'
  ];
  
  let y = 180;
  instructions.forEach(line => {
    uiContext.fillText(line, CANVAS_WIDTH / 2, y);
    y += 18;
  });
  
  // Flashing prompt
  if (Math.floor(gameState.frameCount / 30) % 2 === 0) {
    uiContext.fillStyle = '#00ff00';
    uiContext.font = 'bold 18px Arial';
    uiContext.fillText('>>> PRESS ENTER TO START <<<', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
  }
}

// Render HUD during gameplay
function renderHUD() {
  // Background panel for HUD
  uiContext.fillStyle = 'rgba(0, 0, 0, 0.6)';
  uiContext.fillRect(5, 5, 250, 100);
  
  // Score
  uiContext.fillStyle = '#00ffff';
  uiContext.font = 'bold 16px Arial';
  uiContext.textAlign = 'left';
  uiContext.fillText(`SCORE: ${gameState.score}`, 15, 25);
  
  // Timer
  if (gameState.levelStartTime > 0) {
    const elapsed = (performance.now() - gameState.levelStartTime) / 1000;
    uiContext.fillStyle = '#ffffff';
    uiContext.fillText(`TIME: ${elapsed.toFixed(2)}s`, 15, 45);
  }
  
  // Enemies killed
  uiContext.fillStyle = '#ff00ff';
  uiContext.fillText(`DEMONS: ${gameState.enemiesKilled}/${gameState.totalEnemies}`, 15, 65);
  
  // Soul Cards inventory
  uiContext.fillStyle = '#ffff00';
  uiContext.fillText('SOUL CARDS:', 15, 90);
  
  // Draw card slots
  if (gameState.player) {
    const slotX = 130;
    const slotY = 72;
    const slotSize = 30;
    const slotSpacing = 35;
    
    for (let i = 0; i < 3; i++) {
      const x = slotX + i * slotSpacing;
      const card = gameState.player.soulCards[i];
      
      // Slot background
      if (i === gameState.player.currentCardIndex) {
        uiContext.strokeStyle = '#00ff00';
        uiContext.lineWidth = 3;
      } else {
        uiContext.strokeStyle = '#666666';
        uiContext.lineWidth = 2;
      }
      uiContext.strokeRect(x, slotY, slotSize, slotSize);
      
      // Card
      if (card) {
        const cardData = CARD_TYPES[card];
        uiContext.fillStyle = `#${cardData.color.toString(16).padStart(6, '0')}`;
        uiContext.fillRect(x + 2, slotY + 2, slotSize - 4, slotSize - 4);
        
        // Card number
        uiContext.fillStyle = '#000000';
        uiContext.font = 'bold 12px Arial';
        uiContext.textAlign = 'center';
        uiContext.fillText((i + 1).toString(), x + slotSize / 2, slotY + slotSize / 2 + 4);
      }
    }
  }
  
  // Instructions in corner
  uiContext.fillStyle = 'rgba(0, 0, 0, 0.6)';
  uiContext.fillRect(CANVAS_WIDTH - 155, 5, 150, 60);
  
  uiContext.fillStyle = '#cccccc';
  uiContext.font = '11px Arial';
  uiContext.textAlign = 'left';
  uiContext.fillText('Z: Shoot Card', CANVAS_WIDTH - 145, 20);
  uiContext.fillText('Space: Use Ability', CANVAS_WIDTH - 145, 35);
  uiContext.fillText('1-3: Switch Card', CANVAS_WIDTH - 145, 50);
}

// Render crosshair
function renderCrosshair() {
  const centerX = CANVAS_WIDTH / 2;
  const centerY = CANVAS_HEIGHT / 2;
  const size = 10;
  
  uiContext.strokeStyle = '#00ffff';
  uiContext.lineWidth = 2;
  
  // Crosshair lines
  uiContext.beginPath();
  uiContext.moveTo(centerX - size, centerY);
  uiContext.lineTo(centerX + size, centerY);
  uiContext.moveTo(centerX, centerY - size);
  uiContext.lineTo(centerX, centerY + size);
  uiContext.stroke();
  
  // Center dot
  uiContext.fillStyle = '#00ffff';
  uiContext.beginPath();
  uiContext.arc(centerX, centerY, 2, 0, Math.PI * 2);
  uiContext.fill();
}

// Render pause screen
function renderPauseScreen() {
  uiContext.fillStyle = 'rgba(0, 0, 0, 0.7)';
  uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  uiContext.fillStyle = '#ffffff';
  uiContext.font = 'bold 40px Arial';
  uiContext.textAlign = 'center';
  uiContext.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  
  uiContext.font = '20px Arial';
  uiContext.fillText('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
  uiContext.fillText('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
}

// Render win screen
function renderWinScreen() {
  uiContext.fillStyle = 'rgba(0, 0, 0, 0.8)';
  uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Victory title with glow
  uiContext.save();
  uiContext.shadowBlur = 30;
  uiContext.shadowColor = '#00ff00';
  uiContext.fillStyle = '#00ff00';
  uiContext.font = 'bold 50px Arial';
  uiContext.textAlign = 'center';
  uiContext.fillText('MISSION COMPLETE', CANVAS_WIDTH / 2, 120);
  uiContext.restore();
  
  // Stats
  uiContext.fillStyle = '#ffffff';
  uiContext.font = '20px Arial';
  uiContext.fillText(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
  uiContext.fillText(`Time: ${gameState.levelCompleteTime.toFixed(2)}s`, CANVAS_WIDTH / 2, 210);
  
  if (gameState.bestTime < Infinity) {
    uiContext.fillStyle = '#ffff00';
    uiContext.fillText(`Best Time: ${gameState.bestTime.toFixed(2)}s`, CANVAS_WIDTH / 2, 240);
  }
  
  uiContext.fillStyle = '#00ffff';
  uiContext.fillText(`Demons Eliminated: ${gameState.enemiesKilled}/${gameState.totalEnemies}`, CANVAS_WIDTH / 2, 270);
  
  // Instructions
  uiContext.fillStyle = '#cccccc';
  uiContext.font = '18px Arial';
  uiContext.fillText('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
}

// Render lose screen
function renderLoseScreen() {
  uiContext.fillStyle = 'rgba(0, 0, 0, 0.8)';
  uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  uiContext.fillStyle = '#ff0000';
  uiContext.font = 'bold 50px Arial';
  uiContext.textAlign = 'center';
  uiContext.fillText('MISSION FAILED', CANVAS_WIDTH / 2, 150);
  
  uiContext.fillStyle = '#ffffff';
  uiContext.font = '20px Arial';
  uiContext.fillText(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 200);
  
  uiContext.fillStyle = '#cccccc';
  uiContext.font = '18px Arial';
  uiContext.fillText('Press R to Restart', CANVAS_WIDTH / 2, 280);
}