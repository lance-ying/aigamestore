import { gameState, LEVEL_CONFIG, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

let canvas, ctx;

export function setupUI() {
  canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.pointerEvents = 'none'; // Click through
  canvas.style.zIndex = '100'; // Ensure it appears above the Three.js canvas
  
  const container = document.getElementById('game-container');
  if (container) {
    container.appendChild(canvas);
  } else {
    console.error('game-container not found!');
  }
  
  ctx = canvas.getContext('2d');
}

export function renderUI() {
  if (!ctx) return;
  
  // Clear the canvas
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Font setup
  ctx.font = '20px Arial';
  ctx.fillStyle = 'white';
  ctx.shadowColor = 'black';
  ctx.shadowBlur = 4;
  
  if (gameState.gamePhase === "START") {
    drawCenteredText("press enter to begin", 0);
  } else if (gameState.gamePhase === "PLAYING") {
    const speed = Math.floor(gameState.speed * 100);
    const levelConfig = gameState.currentLevelConfig;
    
    // Calculate coins needed for next level
    let coinsNeeded = 0;
    let nextLevelNum = levelConfig.level + 1;
    let progressText = '';
    
    if (nextLevelNum <= 9) {
      const nextLevelConfig = LEVEL_CONFIG[nextLevelNum - 1];
      coinsNeeded = nextLevelConfig.coinsRequired - gameState.coins_collected;
      progressText = `${coinsNeeded} coins to Level ${nextLevelNum}`;
    } else {
      progressText = 'MAX LEVEL';
    }
    
    // HUD - left aligned
    ctx.textAlign = 'left';
    ctx.font = 'bold 24px Arial';
    ctx.fillText(`Score: ${gameState.score}`, 20, 30);
    
    ctx.font = '20px Arial';
    const livesText = '❤️'.repeat(gameState.lives) + '🖤'.repeat(gameState.maxLives - gameState.lives);
    ctx.fillText(`Lives: ${livesText}`, 20, 55);
    
    ctx.font = '18px Arial';
    ctx.fillText(`Coins: ${gameState.coins_collected}`, 20, 80);
    
    ctx.font = '16px Arial';
    const difficultyColor = 
      levelConfig.difficulty === 'EASY' ? '#4CAF50' : 
      levelConfig.difficulty === 'MEDIUM' ? '#FFA500' : '#FF4444';
    ctx.fillStyle = difficultyColor;
    ctx.fillText(`Level: ${gameState.currentLevel}/9 (${levelConfig.difficulty})`, 20, 105);
    
    ctx.fillStyle = '#ffdd88';
    ctx.font = '13px Arial';
    ctx.fillText(progressText, 20, 125);
    
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.fillText(`Speed: ${speed}%`, 20, 145);
    
    // Invincibility indicator
    if (gameState.invincibilityTimer > 0) {
      ctx.fillStyle = '#00ffff';
      ctx.font = 'bold 14px Arial';
      ctx.fillText('INVINCIBLE!', 20, 165);
    }
  } else if (gameState.gamePhase === "LEVEL_COMPLETE") {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    const nextLevel = gameState.currentLevel + 1;
    ctx.fillStyle = '#4CAF50';
    drawCenteredText(`LEVEL ${gameState.currentLevel} COMPLETE!`, -60, 48, '#4CAF50');
    
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    drawCenteredText(`Coins: ${gameState.coins_collected}`, -20);
    drawCenteredText(`Score: ${gameState.score}`, 10);
    drawCenteredText(`Lives: ${gameState.lives}`, 40);
    
    ctx.fillStyle = '#ffdd88';
    ctx.font = '20px Arial';
    drawCenteredText(
      nextLevel <= 9 ? `Proceeding to Level ${nextLevel}...` : 'Preparing Final Level...',
      80
    );
  } else if (gameState.gamePhase === "PAUSED") {
    // Show HUD when paused (no overlay, no pause text, just the stats)
    const speed = Math.floor(gameState.speed * 100);
    const levelConfig = gameState.currentLevelConfig;
    
    // Calculate coins needed for next level
    let coinsNeeded = 0;
    let nextLevelNum = levelConfig.level + 1;
    let progressText = '';
    
    if (nextLevelNum <= 9) {
      const nextLevelConfig = LEVEL_CONFIG[nextLevelNum - 1];
      coinsNeeded = nextLevelConfig.coinsRequired - gameState.coins_collected;
      progressText = `${coinsNeeded} coins to Level ${nextLevelNum}`;
    } else {
      progressText = 'MAX LEVEL';
    }
    
    // HUD - left aligned
    ctx.textAlign = 'left';
    ctx.font = 'bold 24px Arial';
    ctx.fillText(`Score: ${gameState.score}`, 20, 30);
    
    ctx.font = '20px Arial';
    const livesText = '❤️'.repeat(gameState.lives) + '🖤'.repeat(gameState.maxLives - gameState.lives);
    ctx.fillText(`Lives: ${livesText}`, 20, 55);
    
    ctx.font = '18px Arial';
    ctx.fillText(`Coins: ${gameState.coins_collected}`, 20, 80);
    
    ctx.font = '16px Arial';
    const difficultyColor = 
      levelConfig.difficulty === 'EASY' ? '#4CAF50' : 
      levelConfig.difficulty === 'MEDIUM' ? '#FFA500' : '#FF4444';
    ctx.fillStyle = difficultyColor;
    ctx.fillText(`Level: ${gameState.currentLevel}/9 (${levelConfig.difficulty})`, 20, 105);
    
    ctx.fillStyle = '#ffdd88';
    ctx.font = '13px Arial';
    ctx.fillText(progressText, 20, 125);
    
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.fillText(`Speed: ${speed}%`, 20, 145);
    
    // Invincibility indicator
    if (gameState.invincibilityTimer > 0) {
      ctx.fillStyle = '#00ffff';
      ctx.font = 'bold 14px Arial';
      ctx.fillText('INVINCIBLE!', 20, 165);
    }
  } else if (gameState.gamePhase === "GAME_OVER_LOSE") {
    ctx.fillStyle = 'rgba(50, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawCenteredText("GAME OVER", -20, 48, 'red');
    ctx.font = '24px Arial';
    ctx.fillStyle = 'white';
    drawCenteredText(`Final Score: ${gameState.score}`, 20);
    drawCenteredText(`Coins: ${gameState.coins_collected}`, 50);
    drawCenteredText(`Level: ${gameState.currentLevel}/9`, 80);
    ctx.font = '18px Arial';
    drawCenteredText("Press R to Restart", 120);
  } else if (gameState.gamePhase === "GAME_OVER_WIN") {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawCenteredText("CONGRATULATIONS!", -40, 48, '#FFD700');
    ctx.font = '32px Arial';
    ctx.fillStyle = '#4CAF50';
    drawCenteredText("ALL 9 LEVELS COMPLETE!", 0);
    ctx.font = '24px Arial';
    ctx.fillStyle = 'white';
    drawCenteredText(`Final Score: ${gameState.score}`, 40);
    drawCenteredText(`Total Coins: ${gameState.coins_collected}`, 70);
    drawCenteredText(`Lives: ${gameState.lives}`, 100);
    ctx.font = '18px Arial';
    drawCenteredText("Press R to Play Again", 140);
  }
}

function drawCenteredText(text, yOffset, size = 20, color = 'white') {
  ctx.font = `bold ${size}px Arial`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.fillText(text, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + yOffset);
}