import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, WIN_SCORE } from './globals.js';

export function setupUI() {
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
  
  if (gameState.gameContainer) {
    gameState.gameContainer.appendChild(uiCanvas);
  }
  
  gameState.uiCanvas = uiCanvas;
  gameState.uiContext = uiCanvas.getContext('2d');
}

export function renderUI() {
  const ctx = gameState.uiContext;
  if (!ctx) return;
  
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  if (gameState.gamePhase === "START") {
    // Start screen
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('TRACK RUNNER', CANVAS_WIDTH / 2, 120);
    
    ctx.font = '18px Arial';
    ctx.fillText('Dodge trains and barriers!', CANVAS_WIDTH / 2, 160);
    ctx.fillText('Collect coins for points!', CANVAS_WIDTH / 2, 185);
    
    ctx.font = '16px Arial';
    ctx.fillStyle = '#ffff00';
    ctx.fillText(`Reach ${WIN_SCORE} points to win!`, CANVAS_WIDTH / 2, 220);
    
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.fillText('Arrow Keys / WASD: Move & Jump/Slide', CANVAS_WIDTH / 2, 260);
    ctx.fillText('Space: Jump', CANVAS_WIDTH / 2, 280);
    
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#00ff00';
    ctx.fillText('PRESS ENTER TO START', CANVAS_WIDTH / 2, 330);
    
  } else if (gameState.gamePhase === "PLAYING") {
    // HUD
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(10, 10, 220, 80);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${gameState.score}`, 20, 35);
    ctx.fillText(`Distance: ${Math.floor(gameState.distance)}m`, 20, 60);
    
    // Speed indicator
    const speedPercent = Math.floor((gameState.gameSpeed / 0.5) * 100);
    ctx.fillText(`Speed: ${speedPercent}%`, 20, 85);
    
    // Lane indicator
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(CANVAS_WIDTH / 2 - 60, CANVAS_HEIGHT - 50, 120, 30);
    
    const laneNames = ['LEFT', 'CENTER', 'RIGHT'];
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Lane: ${laneNames[gameState.player ? gameState.player.currentLane : 1]}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 28);
    
  } else if (gameState.gamePhase === "PAUSED") {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    
    ctx.font = '20px Arial';
    ctx.fillText('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
    
  } else if (gameState.gamePhase === "GAME_OVER_WIN") {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('YOU WIN!', CANVAS_WIDTH / 2, 140);
    
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 190);
    ctx.fillText(`Distance: ${Math.floor(gameState.distance)}m`, CANVAS_WIDTH / 2, 220);
    
    ctx.font = '20px Arial';
    ctx.fillText('Press R to Restart', CANVAS_WIDTH / 2, 280);
    
  } else if (gameState.gamePhase === "GAME_OVER_LOSE") {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, 140);
    
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 190);
    ctx.fillText(`Distance: ${Math.floor(gameState.distance)}m`, CANVAS_WIDTH / 2, 220);
    
    ctx.font = '20px Arial';
    ctx.fillText('Press R to Restart', CANVAS_WIDTH / 2, 280);
  }
}