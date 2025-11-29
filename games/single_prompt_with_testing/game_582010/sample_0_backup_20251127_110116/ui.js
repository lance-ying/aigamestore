/**
 * UI rendering system using 2D canvas overlay
 */
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASE, GAME_CONFIG } from './globals.js';

// Create UI canvas overlay
const uiCanvas = document.createElement('canvas');
uiCanvas.width = CANVAS_WIDTH;
uiCanvas.height = CANVAS_HEIGHT;
uiCanvas.style.position = 'absolute';
uiCanvas.style.top = '0';
uiCanvas.style.left = '0';
uiCanvas.style.pointerEvents = 'none';
uiCanvas.style.zIndex = '1000';
uiCanvas.style.margin = '0';
uiCanvas.style.padding = '0';

const uiContext = uiCanvas.getContext('2d');

/**
 * Initialize UI system
 */
export function initUI() {
  // Append UI canvas to game container
  if (gameState.gameContainer) {
    gameState.gameContainer.appendChild(uiCanvas);
  }
}

/**
 * Render all UI elements
 */
export function renderUI() {
  // Clear canvas
  uiContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  switch (gameState.gamePhase) {
    case GAME_PHASE.START:
      renderStartScreen();
      break;
    case GAME_PHASE.PLAYING:
      renderHUD();
      break;
    case GAME_PHASE.PAUSED:
      renderHUD();
      renderPauseOverlay();
      break;
    case GAME_PHASE.GAME_OVER_WIN:
      renderVictoryScreen();
      break;
    case GAME_PHASE.GAME_OVER_LOSE:
      renderDefeatScreen();
      break;
  }
}

/**
 * Render start screen
 */
function renderStartScreen() {
  // Semi-transparent background
  uiContext.fillStyle = 'rgba(0, 0, 0, 0.8)';
  uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Title
  uiContext.fillStyle = '#ff6b35';
  uiContext.font = 'bold 40px Arial';
  uiContext.textAlign = 'center';
  uiContext.fillText('MONSTER HUNTER', CANVAS_WIDTH / 2, 100);
  
  // Subtitle
  uiContext.fillStyle = '#ffffff';
  uiContext.font = 'bold 20px Arial';
  uiContext.fillText('The Hunt Begins', CANVAS_WIDTH / 2, 130);
  
  // Instructions
  uiContext.font = '16px Arial';
  uiContext.fillStyle = '#cccccc';
  uiContext.fillText('Track the monster using scoutflies', CANVAS_WIDTH / 2, 170);
  uiContext.fillText('Collect tracks to reveal the monster location', CANVAS_WIDTH / 2, 190);
  uiContext.fillText('Defeat the monster to complete the hunt!', CANVAS_WIDTH / 2, 210);
  
  // Controls
  uiContext.fillStyle = '#ffffff';
  uiContext.font = 'bold 14px Arial';
  uiContext.fillText('CONTROLS', CANVAS_WIDTH / 2, 245);
  
  uiContext.font = '13px Arial';
  uiContext.fillStyle = '#aaaaaa';
  uiContext.fillText('WASD: Move Character', CANVAS_WIDTH / 2, 265);
  uiContext.fillText('Arrow Keys: Rotate Camera', CANVAS_WIDTH / 2, 285);
  uiContext.fillText('Space: Attack', CANVAS_WIDTH / 2, 305);
  uiContext.fillText('Shift: Dodge Roll', CANVAS_WIDTH / 2, 325);
  uiContext.fillText('Z: Use Healing Item', CANVAS_WIDTH / 2, 345);
  
  // Start prompt
  uiContext.fillStyle = '#ffff00';
  uiContext.font = 'bold 18px Arial';
  const pulse = 0.7 + Math.sin(Date.now() * 0.005) * 0.3;
  uiContext.globalAlpha = pulse;
  uiContext.fillText('PRESS ENTER TO START', CANVAS_WIDTH / 2, 380);
  uiContext.globalAlpha = 1.0;
}

/**
 * Render HUD during gameplay
 */
function renderHUD() {
  // HUD background
  uiContext.fillStyle = 'rgba(0, 0, 0, 0.6)';
  uiContext.fillRect(10, 10, 250, 120);
  
  // Player health bar
  uiContext.fillStyle = '#ffffff';
  uiContext.font = 'bold 14px Arial';
  uiContext.textAlign = 'left';
  uiContext.fillText('Hunter Health', 20, 30);
  
  drawHealthBar(20, 35, 230, 20, 
    gameState.player ? gameState.player.health : 0, 
    GAME_CONFIG.PLAYER_MAX_HEALTH,
    '#00ff00', '#ff0000');
  
  // Monster health bar (only show when revealed)
  if (gameState.monsterRevealed && gameState.monster) {
    uiContext.fillText('Monster Health', 20, 70);
    drawHealthBar(20, 75, 230, 20, 
      gameState.monster.health, 
      GAME_CONFIG.MONSTER_MAX_HEALTH,
      '#ff6b35', '#8b0000');
  }
  
  // Tracking progress
  uiContext.fillText(`Tracks: ${gameState.tracksCollected}/${GAME_CONFIG.TRACKS_TO_REVEAL}`, 20, 110);
  
  // Cooldown indicators
  if (gameState.player) {
    const y = 150;
    
    // Attack cooldown
    if (gameState.player.attackCooldown > 0) {
      drawCooldownIndicator(20, y, 'Attack', gameState.player.attackCooldown, GAME_CONFIG.PLAYER_ATTACK_COOLDOWN);
    }
    
    // Dodge cooldown
    if (gameState.player.dodgeCooldown > 0) {
      drawCooldownIndicator(20, y + 30, 'Dodge', gameState.player.dodgeCooldown, GAME_CONFIG.PLAYER_DODGE_COOLDOWN);
    }
    
    // Heal cooldown
    if (gameState.player.healCooldown > 0) {
      drawCooldownIndicator(20, y + 60, 'Heal', gameState.player.healCooldown, GAME_CONFIG.PLAYER_HEAL_COOLDOWN);
    }
  }
  
  // Monster revealed indicator
  if (gameState.monsterRevealed) {
    uiContext.fillStyle = '#ff0000';
    uiContext.font = 'bold 16px Arial';
    uiContext.textAlign = 'center';
    const pulse = 0.7 + Math.sin(Date.now() * 0.01) * 0.3;
    uiContext.globalAlpha = pulse;
    uiContext.fillText('MONSTER LOCATED!', CANVAS_WIDTH / 2, 30);
    uiContext.globalAlpha = 1.0;
  }
}

/**
 * Draw a health bar
 */
function drawHealthBar(x, y, width, height, current, max, fillColor, bgColor) {
  const ratio = Math.max(0, current / max);
  
  // Background
  uiContext.fillStyle = bgColor;
  uiContext.fillRect(x, y, width, height);
  
  // Fill
  uiContext.fillStyle = fillColor;
  uiContext.fillRect(x, y, width * ratio, height);
  
  // Border
  uiContext.strokeStyle = '#ffffff';
  uiContext.lineWidth = 2;
  uiContext.strokeRect(x, y, width, height);
  
  // Text
  uiContext.fillStyle = '#ffffff';
  uiContext.font = '12px Arial';
  uiContext.textAlign = 'center';
  uiContext.fillText(`${Math.ceil(current)}/${max}`, x + width / 2, y + height / 2 + 4);
}

/**
 * Draw a cooldown indicator
 */
function drawCooldownIndicator(x, y, label, current, max) {
  const ratio = 1 - (current / max);
  const width = 100;
  const height = 20;
  
  // Background
  uiContext.fillStyle = 'rgba(0, 0, 0, 0.6)';
  uiContext.fillRect(x, y, width, height);
  
  // Fill
  uiContext.fillStyle = '#4444ff';
  uiContext.fillRect(x, y, width * ratio, height);
  
  // Border
  uiContext.strokeStyle = '#ffffff';
  uiContext.lineWidth = 1;
  uiContext.strokeRect(x, y, width, height);
  
  // Label
  uiContext.fillStyle = '#ffffff';
  uiContext.font = '11px Arial';
  uiContext.textAlign = 'left';
  uiContext.fillText(label, x + 5, y + 14);
}

/**
 * Render pause overlay
 */
function renderPauseOverlay() {
  uiContext.fillStyle = 'rgba(0, 0, 0, 0.7)';
  uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  uiContext.fillStyle = '#ffffff';
  uiContext.font = 'bold 36px Arial';
  uiContext.textAlign = 'center';
  uiContext.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  
  uiContext.font = '18px Arial';
  uiContext.fillText('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  uiContext.fillText('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
}

/**
 * Render victory screen
 */
function renderVictoryScreen() {
  uiContext.fillStyle = 'rgba(0, 50, 0, 0.8)';
  uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  uiContext.fillStyle = '#00ff00';
  uiContext.font = 'bold 48px Arial';
  uiContext.textAlign = 'center';
  uiContext.fillText('HUNT COMPLETE!', CANVAS_WIDTH / 2, 120);
  
  uiContext.fillStyle = '#ffffff';
  uiContext.font = '24px Arial';
  uiContext.fillText('Monster Slain', CANVAS_WIDTH / 2, 160);
  
  // Stats
  uiContext.font = '18px Arial';
  uiContext.fillStyle = '#cccccc';
  const time = gameState.huntDuration.toFixed(1);
  uiContext.fillText(`Hunt Duration: ${time}s`, CANVAS_WIDTH / 2, 200);
  uiContext.fillText(`Tracks Collected: ${gameState.tracksCollected}`, CANVAS_WIDTH / 2, 225);
  
  // Rewards
  uiContext.fillStyle = '#ffff00';
  uiContext.font = 'bold 20px Arial';
  uiContext.fillText('REWARDS EARNED', CANVAS_WIDTH / 2, 265);
  
  uiContext.fillStyle = '#ffffff';
  uiContext.font = '16px Arial';
  uiContext.fillText('Monster Scale x3', CANVAS_WIDTH / 2, 295);
  uiContext.fillText('Monster Fang x2', CANVAS_WIDTH / 2, 320);
  uiContext.fillText('Monster Hide x5', CANVAS_WIDTH / 2, 345);
  
  // Restart prompt
  uiContext.fillStyle = '#ffff00';
  uiContext.font = 'bold 18px Arial';
  uiContext.fillText('Press R to Return to Camp', CANVAS_WIDTH / 2, 380);
}

/**
 * Render defeat screen
 */
function renderDefeatScreen() {
  uiContext.fillStyle = 'rgba(50, 0, 0, 0.8)';
  uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  uiContext.fillStyle = '#ff0000';
  uiContext.font = 'bold 48px Arial';
  uiContext.textAlign = 'center';
  uiContext.fillText('QUEST FAILED', CANVAS_WIDTH / 2, 140);
  
  uiContext.fillStyle = '#ffffff';
  uiContext.font = '24px Arial';
  uiContext.fillText('You have been defeated', CANVAS_WIDTH / 2, 185);
  
  // Message
  uiContext.font = '16px Arial';
  uiContext.fillStyle = '#cccccc';
  uiContext.fillText('The monster was too powerful this time.', CANVAS_WIDTH / 2, 230);
  uiContext.fillText('Prepare better and try again!', CANVAS_WIDTH / 2, 255);
  
  // Restart prompt
  uiContext.fillStyle = '#ffff00';
  uiContext.font = 'bold 18px Arial';
  uiContext.fillText('Press R to Return to Camp', CANVAS_WIDTH / 2, 310);
}