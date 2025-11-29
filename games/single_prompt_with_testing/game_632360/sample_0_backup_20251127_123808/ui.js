/**
 * UI rendering on canvas overlay
 */
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

let uiCanvas = null;
let uiContext = null;

/**
 * Setup UI canvas overlay
 */
export function setupUI() {
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

/**
 * Render UI based on game phase
 */
export function renderUI() {
  if (!uiContext) return;
  
  // Clear canvas
  uiContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  switch (gameState.gamePhase) {
    case 'START':
      renderStartScreen();
      break;
    case 'PLAYING':
      renderHUD();
      break;
    case 'PAUSED':
      renderHUD();
      renderPauseScreen();
      break;
    case 'GAME_OVER_WIN':
      renderGameOverScreen(true);
      break;
    case 'GAME_OVER_LOSE':
      renderGameOverScreen(false);
      break;
  }
}

/**
 * Render start screen
 */
function renderStartScreen() {
  // Dark overlay
  uiContext.fillStyle = 'rgba(0, 0, 0, 0.85)';
  uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Title
  uiContext.fillStyle = '#00ff00';
  uiContext.font = 'bold 42px Arial';
  uiContext.textAlign = 'center';
  uiContext.fillText('ALIEN ESCAPE', CANVAS_WIDTH / 2, 100);
  
  // Subtitle
  uiContext.fillStyle = '#ffffff';
  uiContext.font = '18px Arial';
  uiContext.fillText('Survive the Chaos', CANVAS_WIDTH / 2, 140);
  
  // Instructions
  uiContext.font = '16px Arial';
  uiContext.textAlign = 'left';
  const instructions = [
    'Arrow Keys / WASD - Move',
    'Space - Jump (double jump available)',
    'Z - Shoot',
    'Shift - Special Ability',
    '',
    'Defeat enemies and collect items',
    'Reach the teleporter to escape!'
  ];
  
  instructions.forEach((line, i) => {
    uiContext.fillText(line, CANVAS_WIDTH / 2 - 150, 200 + i * 25);
  });
  
  // Start prompt
  uiContext.fillStyle = '#00ff00';
  uiContext.font = 'bold 24px Arial';
  uiContext.textAlign = 'center';
  const pulse = Math.sin(gameState.frameCount * 0.1) * 0.3 + 0.7;
  uiContext.globalAlpha = pulse;
  uiContext.fillText('PRESS ENTER TO START', CANVAS_WIDTH / 2, 370);
  uiContext.globalAlpha = 1.0;
}

/**
 * Render HUD during gameplay
 */
function renderHUD() {
  if (!gameState.player) return;
  
  // HUD background
  uiContext.fillStyle = 'rgba(0, 0, 0, 0.6)';
  uiContext.fillRect(10, 10, 250, 110);
  
  // Health bar
  uiContext.fillStyle = '#ffffff';
  uiContext.font = '14px Arial';
  uiContext.textAlign = 'left';
  uiContext.fillText('Health', 20, 30);
  
  const healthRatio = gameState.player.health / gameState.player.maxHealth;
  uiContext.fillStyle = 'rgba(100, 0, 0, 0.8)';
  uiContext.fillRect(20, 35, 220, 20);
  uiContext.fillStyle = healthRatio > 0.3 ? '#00ff00' : '#ff0000';
  uiContext.fillRect(20, 35, 220 * healthRatio, 20);
  
  uiContext.fillStyle = '#ffffff';
  uiContext.textAlign = 'center';
  uiContext.fillText(`${Math.ceil(gameState.player.health)}/${gameState.player.maxHealth}`, 130, 50);
  
  // Stats
  uiContext.textAlign = 'left';
  uiContext.fillText(`Score: ${gameState.score}`, 20, 75);
  uiContext.fillText(`Kills: ${gameState.killCount}`, 20, 95);
  uiContext.fillText(`Difficulty: ${gameState.difficultyMultiplier.toFixed(1)}x`, 20, 115);
  
  // Special ability cooldown
  if (gameState.player.specialCooldown > 0) {
    uiContext.fillStyle = 'rgba(0, 0, 0, 0.6)';
    uiContext.fillRect(CANVAS_WIDTH - 160, 10, 150, 40);
    uiContext.fillStyle = '#ffffff';
    uiContext.textAlign = 'left';
    uiContext.fillText('Special:', CANVAS_WIDTH - 150, 30);
    uiContext.fillText(`${gameState.player.specialCooldown.toFixed(1)}s`, CANVAS_WIDTH - 150, 45);
  } else {
    uiContext.fillStyle = 'rgba(0, 255, 0, 0.3)';
    uiContext.fillRect(CANVAS_WIDTH - 160, 10, 150, 40);
    uiContext.fillStyle = '#00ff00';
    uiContext.textAlign = 'left';
    uiContext.fillText('Special: READY', CANVAS_WIDTH - 150, 30);
  }
  
  // Active items
  const activeItems = Object.entries(gameState.player.itemEffects)
    .filter(([_, count]) => count > 0);
  
  if (activeItems.length > 0) {
    uiContext.fillStyle = 'rgba(0, 0, 0, 0.6)';
    uiContext.fillRect(10, CANVAS_HEIGHT - 100, 250, 90);
    
    uiContext.fillStyle = '#ffffff';
    uiContext.font = 'bold 14px Arial';
    uiContext.fillText('Active Items:', 20, CANVAS_HEIGHT - 80);
    
    uiContext.font = '12px Arial';
    activeItems.slice(0, 4).forEach(([effect, count], i) => {
      const displayName = effect.replace(/([A-Z])/g, ' $1').trim();
      uiContext.fillText(`${displayName}: ${count}`, 20, CANVAS_HEIGHT - 60 + i * 18);
    });
  }
  
  // Teleporter notification
  if (gameState.killCount >= 25 && !gameState.teleporter) {
    uiContext.fillStyle = 'rgba(0, 255, 255, 0.8)';
    uiContext.fillRect(CANVAS_WIDTH / 2 - 150, 50, 300, 40);
    uiContext.fillStyle = '#000000';
    uiContext.font = 'bold 18px Arial';
    uiContext.textAlign = 'center';
    uiContext.fillText('TELEPORTER AVAILABLE!', CANVAS_WIDTH / 2, 75);
  }
}

/**
 * Render pause screen
 */
function renderPauseScreen() {
  uiContext.fillStyle = 'rgba(0, 0, 0, 0.7)';
  uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  uiContext.fillStyle = '#ffffff';
  uiContext.font = 'bold 48px Arial';
  uiContext.textAlign = 'center';
  uiContext.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  
  uiContext.font = '20px Arial';
  uiContext.fillText('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
  uiContext.fillText('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
}

/**
 * Render game over screen
 */
function renderGameOverScreen(win) {
  uiContext.fillStyle = 'rgba(0, 0, 0, 0.9)';
  uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Title
  uiContext.fillStyle = win ? '#00ff00' : '#ff0000';
  uiContext.font = 'bold 54px Arial';
  uiContext.textAlign = 'center';
  uiContext.fillText(win ? 'ESCAPE SUCCESS!' : 'DEFEATED', CANVAS_WIDTH / 2, 120);
  
  // Stats
  uiContext.fillStyle = '#ffffff';
  uiContext.font = '24px Arial';
  uiContext.fillText(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
  uiContext.fillText(`Enemies Defeated: ${gameState.killCount}`, CANVAS_WIDTH / 2, 215);
  uiContext.fillText(`Time Survived: ${gameState.gameTime.toFixed(1)}s`, CANVAS_WIDTH / 2, 250);
  uiContext.fillText(`Max Difficulty: ${gameState.difficultyMultiplier.toFixed(1)}x`, CANVAS_WIDTH / 2, 285);
  
  // Items collected
  if (gameState.player) {
    const itemCount = Object.values(gameState.player.itemEffects).reduce((a, b) => a + b, 0);
    uiContext.fillText(`Items Collected: ${itemCount}`, CANVAS_WIDTH / 2, 320);
  }
  
  // Restart prompt
  uiContext.font = 'bold 20px Arial';
  const pulse = Math.sin(gameState.frameCount * 0.1) * 0.3 + 0.7;
  uiContext.globalAlpha = pulse;
  uiContext.fillText('Press R to Restart', CANVAS_WIDTH / 2, 370);
  uiContext.globalAlpha = 1.0;
}