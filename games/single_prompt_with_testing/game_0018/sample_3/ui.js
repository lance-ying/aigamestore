import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function setupUI() {
  // Create UI canvas overlay
  gameState.uiCanvas = document.createElement('canvas');
  gameState.uiCanvas.width = CANVAS_WIDTH;
  gameState.uiCanvas.height = CANVAS_HEIGHT;
  gameState.uiCanvas.style.position = 'absolute';
  gameState.uiCanvas.style.top = '0';
  gameState.uiCanvas.style.left = '0';
  gameState.uiCanvas.style.pointerEvents = 'none';
  gameState.uiCanvas.style.zIndex = '1000';
  
  const rendererParent = gameState.renderer.domElement.parentElement;
  if (rendererParent) {
    rendererParent.style.position = 'relative';
    rendererParent.appendChild(gameState.uiCanvas);
  } else {
    document.body.appendChild(gameState.uiCanvas);
  }
  
  gameState.uiContext = gameState.uiCanvas.getContext('2d');
}

export function renderUI() {
  const ctx = gameState.uiContext;
  
  // Clear canvas
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  if (gameState.gamePhase === "START") {
    renderStartScreen(ctx);
  } else if (gameState.gamePhase === "PLAYING") {
    renderHUD(ctx);
  } else if (gameState.gamePhase === "PAUSED") {
    renderPauseScreen(ctx);
  } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
    renderGameOverScreen(ctx);
  }
}

function renderStartScreen(ctx) {
  // Dark overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Title
  ctx.fillStyle = '#00aaff';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('RAIL RUNNER', CANVAS_WIDTH / 2, 120);
  
  // Instructions
  ctx.fillStyle = 'white';
  ctx.font = '18px Arial';
  ctx.fillText('Dodge trains and obstacles!', CANVAS_WIDTH / 2, 180);
  ctx.fillText('Collect coins for points!', CANVAS_WIDTH / 2, 210);
  
  ctx.font = '16px Arial';
  ctx.fillStyle = '#aaaaaa';
  ctx.fillText('Arrow Keys / WASD: Move', CANVAS_WIDTH / 2, 260);
  ctx.fillText('↑/W: Jump | ↓/S: Slide', CANVAS_WIDTH / 2, 285);
  ctx.fillText('←/A or →/D: Change Lane', CANVAS_WIDTH / 2, 310);
  
  // Start prompt
  ctx.fillStyle = '#ffff00';
  ctx.font = 'bold 24px Arial';
  ctx.fillText('PRESS ENTER TO START', CANVAS_WIDTH / 2, 360);
}

function renderHUD(ctx) {
  // Semi-transparent background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(10, 10, 220, 80);
  
  // Score
  ctx.fillStyle = '#ffff00';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${gameState.score}`, 20, 35);
  
  // Distance
  ctx.fillStyle = 'white';
  ctx.font = '16px Arial';
  ctx.fillText(`Distance: ${Math.floor(gameState.distance)}m`, 20, 60);
  
  // Speed indicator
  const speedPercent = Math.floor((gameState.gameSpeed / 0.5) * 100);
  ctx.fillText(`Speed: ${speedPercent}%`, 20, 80);
  
  // Control mode indicator
  if (gameState.controlMode !== 'HUMAN') {
    ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
    ctx.fillRect(CANVAS_WIDTH - 160, 10, 150, 30);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`TEST MODE: ${gameState.controlMode}`, CANVAS_WIDTH - 85, 30);
  }
}

function renderPauseScreen(ctx) {
  // Dark overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Pause text
  ctx.fillStyle = 'white';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  
  ctx.font = '20px Arial';
  ctx.fillText('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
  ctx.fillText('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
}

function renderGameOverScreen(ctx) {
  // Dark overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Game over text
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  ctx.fillStyle = isWin ? '#00ff00' : '#ff3333';
  ctx.font = 'bold 52px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(isWin ? 'VICTORY!' : 'GAME OVER', CANVAS_WIDTH / 2, 140);
  
  // Stats
  ctx.fillStyle = 'white';
  ctx.font = '24px Arial';
  ctx.fillText(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 200);
  ctx.fillText(`Distance: ${Math.floor(gameState.distance)}m`, CANVAS_WIDTH / 2, 235);
  
  // Restart prompt
  ctx.fillStyle = '#ffff00';
  ctx.font = 'bold 22px Arial';
  ctx.fillText('Press R to Restart', CANVAS_WIDTH / 2, 300);
}