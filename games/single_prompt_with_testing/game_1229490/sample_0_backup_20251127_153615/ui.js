import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, STYLE_RANKS } from './globals.js';

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

// Render UI based on game phase
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
      break;
    case "PAUSED":
      renderHUD();
      renderPauseOverlay();
      break;
    case "GAME_OVER_WIN":
      renderGameOverScreen(true);
      break;
    case "GAME_OVER_LOSE":
      renderGameOverScreen(false);
      break;
  }
}

// Start screen
function renderStartScreen() {
  // Dark overlay
  uiContext.fillStyle = 'rgba(20, 0, 0, 0.9)';
  uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Title
  uiContext.fillStyle = '#ff0000';
  uiContext.font = 'bold 48px Arial';
  uiContext.textAlign = 'center';
  uiContext.fillText('ULTRAKILL', CANVAS_WIDTH / 2, 100);
  
  // Subtitle
  uiContext.fillStyle = '#ff6666';
  uiContext.font = 'bold 20px Arial';
  uiContext.fillText('BLOOD ARENA', CANVAS_WIDTH / 2, 140);
  
  // Instructions
  uiContext.fillStyle = 'white';
  uiContext.font = '16px Arial';
  uiContext.textAlign = 'left';
  
  const instructions = [
    'WASD - Move',
    'SPACE - Jump',
    'SHIFT - Dash',
    'Z - Shoot',
    'ARROWS - Aim',
    '',
    'Kill enemies to collect blood and restore health.',
    'Chain kills for higher style ranks and score!',
    'Survive all 5 waves to achieve victory.'
  ];
  
  instructions.forEach((text, i) => {
    uiContext.fillText(text, 180, 180 + i * 25);
  });
  
  // Start prompt
  uiContext.fillStyle = '#ffff00';
  uiContext.font = 'bold 24px Arial';
  uiContext.textAlign = 'center';
  
  // Blinking effect
  if (Math.floor(performance.now() / 500) % 2 === 0) {
    uiContext.fillText('PRESS ENTER TO START', CANVAS_WIDTH / 2, 370);
  }
}

// HUD
function renderHUD() {
  // Health bar
  const healthBarX = 20;
  const healthBarY = 20;
  const healthBarWidth = 200;
  const healthBarHeight = 25;
  
  // Background
  uiContext.fillStyle = 'rgba(100, 0, 0, 0.7)';
  uiContext.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
  
  // Health fill
  if (gameState.player) {
    const healthRatio = gameState.player.health / gameState.player.maxHealth;
    const fillWidth = healthBarWidth * healthRatio;
    
    // Color based on health
    let healthColor = 'rgba(0, 255, 0, 0.9)';
    if (healthRatio < 0.3) healthColor = 'rgba(255, 0, 0, 0.9)';
    else if (healthRatio < 0.6) healthColor = 'rgba(255, 255, 0, 0.9)';
    
    uiContext.fillStyle = healthColor;
    uiContext.fillRect(healthBarX, healthBarY, fillWidth, healthBarHeight);
    
    // Border
    uiContext.strokeStyle = 'white';
    uiContext.lineWidth = 2;
    uiContext.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
    
    // Text
    uiContext.fillStyle = 'white';
    uiContext.font = 'bold 14px Arial';
    uiContext.textAlign = 'center';
    uiContext.fillText(
      `${Math.ceil(gameState.player.health)} / ${gameState.player.maxHealth}`,
      healthBarX + healthBarWidth / 2,
      healthBarY + healthBarHeight / 2 + 5
    );
  }
  
  // Score
  uiContext.fillStyle = 'white';
  uiContext.font = 'bold 18px Arial';
  uiContext.textAlign = 'left';
  uiContext.fillText(`SCORE: ${gameState.score}`, 20, 70);
  
  // Wave counter
  uiContext.fillText(`WAVE: ${gameState.currentWave} / ${5}`, 20, 95);
  
  // Style rank (large, center-top)
  uiContext.fillStyle = getStyleRankColor(gameState.currentStyleRank);
  uiContext.font = 'bold 36px Arial';
  uiContext.textAlign = 'center';
  uiContext.fillText(gameState.currentStyleRank, CANVAS_WIDTH / 2, 50);
  
  // Combo counter
  if (gameState.styleCombo > 1) {
    uiContext.fillStyle = '#ffff00';
    uiContext.font = 'bold 20px Arial';
    uiContext.fillText(`x${gameState.styleCombo} COMBO`, CANVAS_WIDTH / 2, 80);
  }
  
  // Enemy counter
  const enemiesLeft = gameState.enemies.length;
  uiContext.fillStyle = 'white';
  uiContext.font = '16px Arial';
  uiContext.textAlign = 'right';
  uiContext.fillText(`ENEMIES: ${enemiesLeft}`, CANVAS_WIDTH - 20, 30);
  
  // Cooldown indicators
  if (gameState.player) {
    // Dash cooldown
    if (gameState.player.dashCooldown > 0) {
      const dashProgress = 1 - (gameState.player.dashCooldown / gameState.player.dashCooldownMax);
      drawCooldownIndicator(CANVAS_WIDTH - 70, CANVAS_HEIGHT - 40, 25, dashProgress, '#00ffff', 'DASH');
    }
  }
}

// Draw cooldown indicator
function drawCooldownIndicator(x, y, radius, progress, color, label) {
  // Background circle
  uiContext.fillStyle = 'rgba(0, 0, 0, 0.5)';
  uiContext.beginPath();
  uiContext.arc(x, y, radius, 0, Math.PI * 2);
  uiContext.fill();
  
  // Progress arc
  uiContext.strokeStyle = color;
  uiContext.lineWidth = 4;
  uiContext.beginPath();
  uiContext.arc(x, y, radius - 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
  uiContext.stroke();
  
  // Label
  uiContext.fillStyle = 'white';
  uiContext.font = '10px Arial';
  uiContext.textAlign = 'center';
  uiContext.fillText(label, x, y + 35);
}

// Pause overlay
function renderPauseOverlay() {
  uiContext.fillStyle = 'rgba(0, 0, 0, 0.7)';
  uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  uiContext.fillStyle = 'white';
  uiContext.font = 'bold 48px Arial';
  uiContext.textAlign = 'center';
  uiContext.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  
  uiContext.font = '20px Arial';
  uiContext.fillText('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
  uiContext.fillText('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
}

// Game over screen
function renderGameOverScreen(won) {
  uiContext.fillStyle = 'rgba(0, 0, 0, 0.85)';
  uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Title
  uiContext.fillStyle = won ? '#00ff00' : '#ff0000';
  uiContext.font = 'bold 56px Arial';
  uiContext.textAlign = 'center';
  uiContext.fillText(won ? 'VICTORY' : 'DEATH', CANVAS_WIDTH / 2, 120);
  
  // Final style rank
  uiContext.fillStyle = getStyleRankColor(gameState.currentStyleRank);
  uiContext.font = 'bold 48px Arial';
  uiContext.fillText(`RANK: ${gameState.currentStyleRank}`, CANVAS_WIDTH / 2, 180);
  
  // Stats
  uiContext.fillStyle = 'white';
  uiContext.font = '20px Arial';
  uiContext.fillText(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  uiContext.fillText(`Enemies Killed: ${gameState.totalEnemiesKilled}`, CANVAS_WIDTH / 2, 250);
  uiContext.fillText(`Max Combo: ${gameState.styleCombo}`, CANVAS_WIDTH / 2, 280);
  
  // Restart prompt
  uiContext.fillStyle = '#ffff00';
  uiContext.font = 'bold 24px Arial';
  
  if (Math.floor(performance.now() / 500) % 2 === 0) {
    uiContext.fillText('Press R to Restart', CANVAS_WIDTH / 2, 340);
  }
}

// Get color for style rank
function getStyleRankColor(rank) {
  switch (rank) {
    case 'ULTRAKILL': return '#ff00ff';
    case 'SSS': return '#ff0000';
    case 'SS': return '#ff4444';
    case 'S': return '#ff8800';
    case 'A': return '#ffff00';
    case 'B': return '#88ff00';
    case 'C': return '#00ff88';
    case 'D': return '#888888';
    default: return '#ffffff';
  }
}