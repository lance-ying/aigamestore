import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';

let uiCanvas = null;
let uiContext = null;

export function setupUI() {
  // Create 2D canvas overlay for UI
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
  
  // Append to game container
  if (gameState.gameContainer) {
    gameState.gameContainer.appendChild(uiCanvas);
  } else {
    document.body.appendChild(uiCanvas);
  }
  
  uiContext = uiCanvas.getContext('2d');
}

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
      renderPauseScreen();
      break;
    case "GAME_OVER_WIN":
    case "GAME_OVER_LOSE":
      renderGameOverScreen();
      break;
  }
}

function renderStartScreen() {
  // Start prompt with pulse effect
  const pulseAlpha = 0.5 + Math.sin(gameState.frameCount * 0.1) * 0.5;
  uiContext.fillStyle = `rgba(0, 255, 255, ${pulseAlpha})`;
  uiContext.font = 'bold 24px Arial';
  uiContext.textAlign = 'center';
  uiContext.fillText('PRESS ENTER TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
}

function renderHUD() {
  // HUD background
  uiContext.fillStyle = 'rgba(0, 0, 0, 0.6)';
  uiContext.fillRect(10, 10, 220, 100);
  
  // Border
  uiContext.strokeStyle = '#00ffff';
  uiContext.lineWidth = 2;
  uiContext.strokeRect(10, 10, 220, 100);
  
  // Time
  const currentTime = (Date.now() - gameState.gameStartTime) / 1000;
  gameState.elapsedTime = currentTime;
  uiContext.fillStyle = '#00ffff';
  uiContext.font = 'bold 18px Arial';
  uiContext.textAlign = 'left';
  uiContext.fillText(`TIME: ${currentTime.toFixed(2)}s`, 20, 35);
  
  // Score
  uiContext.fillStyle = '#ffff00';
  uiContext.fillText(`SCORE: ${gameState.score}`, 20, 58);
  
  // Cards
  uiContext.fillStyle = '#ff0066';
  const cardCount = gameState.player ? gameState.player.cards : 0;
  uiContext.fillText(`CARDS: ${cardCount}`, 20, 81);
  
  // Demons remaining
  const demonsLeft = gameState.totalDemons - gameState.demonsEliminated;
  uiContext.fillStyle = '#ffffff';
  uiContext.fillText(`DEMONS: ${demonsLeft}/${gameState.totalDemons}`, 20, 104);
  
  // Crosshair
  drawCrosshair();
  
  // Ability indicators
  drawAbilityIndicators();
}

function drawCrosshair() {
  const centerX = CANVAS_WIDTH / 2;
  const centerY = CANVAS_HEIGHT / 2;
  const size = 10;
  const gap = 5;
  
  uiContext.strokeStyle = '#00ffff';
  uiContext.lineWidth = 2;
  
  // Horizontal line
  uiContext.beginPath();
  uiContext.moveTo(centerX - size - gap, centerY);
  uiContext.lineTo(centerX - gap, centerY);
  uiContext.stroke();
  
  uiContext.beginPath();
  uiContext.moveTo(centerX + gap, centerY);
  uiContext.lineTo(centerX + size + gap, centerY);
  uiContext.stroke();
  
  // Vertical line
  uiContext.beginPath();
  uiContext.moveTo(centerX, centerY - size - gap);
  uiContext.lineTo(centerX, centerY - gap);
  uiContext.stroke();
  
  uiContext.beginPath();
  uiContext.moveTo(centerX, centerY + gap);
  uiContext.lineTo(centerX, centerY + size + gap);
  uiContext.stroke();
  
  // Center dot
  uiContext.fillStyle = '#00ffff';
  uiContext.beginPath();
  uiContext.arc(centerX, centerY, 2, 0, Math.PI * 2);
  uiContext.fill();
}

function drawAbilityIndicators() {
  const x = CANVAS_WIDTH - 130;
  const y = CANVAS_HEIGHT - 80;
  
  // Background
  uiContext.fillStyle = 'rgba(0, 0, 0, 0.6)';
  uiContext.fillRect(x, y, 120, 70);
  
  // Border
  uiContext.strokeStyle = '#00ffff';
  uiContext.lineWidth = 2;
  uiContext.strokeRect(x, y, 120, 70);
  
  // Abilities title
  uiContext.fillStyle = '#ffffff';
  uiContext.font = 'bold 14px Arial';
  uiContext.textAlign = 'left';
  uiContext.fillText('ABILITIES:', x + 10, y + 20);
  
  uiContext.font = '12px Arial';
  
  // Dash indicator
  const canDash = gameState.player && gameState.player.canDash && gameState.player.cards > 0;
  uiContext.fillStyle = canDash ? '#00ff00' : '#666666';
  uiContext.fillText('SHIFT: Dash', x + 10, y + 40);
  
  // Super jump indicator
  const canSuperJump = gameState.player && gameState.player.cards > 0 && gameState.hasJumped;
  uiContext.fillStyle = canSuperJump ? '#00ff00' : '#666666';
  uiContext.fillText('SPACE: Super Jump', x + 10, y + 55);
}

function renderPauseScreen() {
  // Semi-transparent overlay
  uiContext.fillStyle = 'rgba(0, 0, 0, 0.7)';
  uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Pause text with glow
  uiContext.shadowBlur = 15;
  uiContext.shadowColor = '#00ffff';
  uiContext.fillStyle = '#00ffff';
  uiContext.font = 'bold 48px Arial';
  uiContext.textAlign = 'center';
  uiContext.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  uiContext.shadowBlur = 0;
  
  // Instructions
  uiContext.fillStyle = '#ffffff';
  uiContext.font = '20px Arial';
  uiContext.fillText('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  uiContext.fillText('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
}

function renderGameOverScreen() {
  // Dark overlay
  uiContext.fillStyle = 'rgba(10, 10, 21, 0.9)';
  uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  // Title with glow
  uiContext.shadowBlur = 20;
  uiContext.shadowColor = isWin ? '#00ff00' : '#ff0000';
  uiContext.fillStyle = isWin ? '#00ff00' : '#ff0000';
  uiContext.font = 'bold 48px Arial';
  uiContext.textAlign = 'center';
  uiContext.fillText(isWin ? 'TRIAL COMPLETE' : 'TRIAL FAILED', CANVAS_WIDTH / 2, 120);
  uiContext.shadowBlur = 0;
  
  // Stats
  uiContext.fillStyle = '#ffffff';
  uiContext.font = 'bold 24px Arial';
  
  if (isWin) {
    const finalTime = ((gameState.gameEndTime - gameState.gameStartTime) / 1000).toFixed(2);
    uiContext.fillText(`TIME: ${finalTime}s`, CANVAS_WIDTH / 2, 180);
    
    // Time rank
    let rank = 'D';
    let rankColor = '#888888';
    if (finalTime < 20) {
      rank = 'S';
      rankColor = '#ffff00';
    } else if (finalTime < 30) {
      rank = 'A';
      rankColor = '#00ffff';
    } else if (finalTime < 40) {
      rank = 'B';
      rankColor = '#00ff00';
    } else if (finalTime < 50) {
      rank = 'C';
      rankColor = '#ff9900';
    }
    
    uiContext.fillStyle = rankColor;
    uiContext.font = 'bold 72px Arial';
    uiContext.fillText(`RANK: ${rank}`, CANVAS_WIDTH / 2, 260);
  }
  
  uiContext.fillStyle = '#ffff00';
  uiContext.font = 'bold 20px Arial';
  uiContext.fillText(`FINAL SCORE: ${gameState.score}`, CANVAS_WIDTH / 2, 300);
  
  // Stats breakdown
  uiContext.fillStyle = '#aaaaaa';
  uiContext.font = '16px Arial';
  uiContext.fillText(`Demons Eliminated: ${gameState.demonsEliminated}/${gameState.totalDemons}`, CANVAS_WIDTH / 2, 330);
  uiContext.fillText(`Cards Collected: ${gameState.cardsCollected}`, CANVAS_WIDTH / 2, 350);
  
  // Restart prompt
  const pulseAlpha = 0.5 + Math.sin(gameState.frameCount * 0.1) * 0.5;
  uiContext.fillStyle = `rgba(0, 255, 255, ${pulseAlpha})`;
  uiContext.font = 'bold 20px Arial';
  uiContext.fillText('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
}