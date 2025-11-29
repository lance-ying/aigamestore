import { gameState } from './globals.js';

let uiOverlay = null;

export function setupUI() {
  uiOverlay = document.createElement('div');
  uiOverlay.style.position = 'absolute';
  uiOverlay.style.top = '0';
  uiOverlay.style.left = '0';
  uiOverlay.style.width = '600px';
  uiOverlay.style.height = '400px';
  uiOverlay.style.pointerEvents = 'none';
  uiOverlay.style.fontFamily = 'Arial, sans-serif';
  
  const container = document.getElementById('gameContainer');
  container.appendChild(uiOverlay);
}

export function renderUI() {
  if (!uiOverlay) return;
  
  if (gameState.gamePhase === "START") {
    uiOverlay.innerHTML = `
      <div style="text-align: center; padding-top: 40px; color: white;">
        <h1 style="font-size: 42px; margin: 0; text-shadow: 3px 3px 6px rgba(0,0,0,0.8);">SUBWAY RUNNER 3D</h1>
        <p style="font-size: 16px; margin: 15px auto; max-width: 500px; line-height: 1.4; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">
          Race through an endless subway on three parallel train tracks! Dodge oncoming trains, jump over barriers, slide under obstacles, and collect coins to advance through 9 challenging levels. You have 3 lives!
        </p>
        <p style="font-size: 18px; margin-top: 20px; text-shadow: 2px 2px 4px rgba(0,0,0,0.8); font-weight: bold;">Press ENTER to Start</p>
        <div style="font-size: 13px; margin-top: 30px; line-height: 1.6; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">
          <p style="margin: 5px 0;"><strong>Controls:</strong></p>
          <p style="margin: 3px 0;">Arrow Left / A: Move to left lane</p>
          <p style="margin: 3px 0;">Arrow Right / D: Move to right lane</p>
          <p style="margin: 3px 0;">Arrow Up / W: Jump over obstacles</p>
          <p style="margin: 3px 0;">Arrow Down / S: Slide under barriers</p>
          <p style="margin: 3px 0;">ESC: Pause/Unpause | R: Restart</p>
        </div>
      </div>
    `;
  } else if (gameState.gamePhase === "PLAYING") {
    const speed = Math.floor(gameState.speed * 100);
    const levelConfig = gameState.currentLevelConfig;
    const difficultyColor = 
      levelConfig.difficulty === 'EASY' ? '#4CAF50' : 
      levelConfig.difficulty === 'MEDIUM' ? '#FFA500' : '#FF4444';
    
    // Calculate coins needed for next level
    let coinsNeeded = 0;
    let nextLevelNum = levelConfig.level + 1;
    if (nextLevelNum <= 9) {
      coinsNeeded = levelConfig.coinsRequired - gameState.coins_collected;
    }
    
    const progressText = nextLevelNum <= 9 
      ? `${coinsNeeded} coins to Level ${nextLevelNum}`
      : 'MAX LEVEL';
    
    // Lives display with hearts
    const livesHTML = '❤️'.repeat(gameState.lives) + '🖤'.repeat(gameState.maxLives - gameState.lives);
    
    // Invincibility indicator
    const invincibleText = gameState.invincibilityTimer > 0 
      ? `<div style="font-size: 14px; margin-top: 3px; color: #00ffff; font-weight: bold;">INVINCIBLE!</div>`
      : '';
    
    uiOverlay.innerHTML = `
      <div style="padding: 15px; color: white; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">
        <div style="font-size: 24px; font-weight: bold;">Score: ${gameState.score}</div>
        <div style="font-size: 20px; margin-top: 5px;">Lives: ${livesHTML}</div>
        ${invincibleText}
        <div style="font-size: 18px; margin-top: 5px;">Coins: ${gameState.coins_collected}</div>
        <div style="font-size: 16px; margin-top: 5px;">
          Level: <span style="color: ${difficultyColor}; font-weight: bold;">${gameState.currentLevel}/9 (${levelConfig.difficulty})</span>
        </div>
        <div style="font-size: 13px; margin-top: 3px; color: #ffdd88;">${progressText}</div>
        <div style="font-size: 14px; margin-top: 5px;">Speed: ${speed}%</div>
      </div>
    `;
  } else if (gameState.gamePhase === "LEVEL_COMPLETE") {
    const nextLevel = gameState.currentLevel + 1;
    uiOverlay.innerHTML = `
      <div style="text-align: center; padding-top: 120px; color: white;">
        <h1 style="font-size: 48px; margin: 0; color: #4CAF50; text-shadow: 3px 3px 6px rgba(0,0,0,0.8);">LEVEL ${gameState.currentLevel} COMPLETE!</h1>
        <div style="font-size: 24px; margin-top: 30px; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">
          <p>Coins Collected: ${gameState.coins_collected}</p>
          <p>Score: ${gameState.score}</p>
          <p>Lives Remaining: ${gameState.lives}</p>
        </div>
        <p style="font-size: 20px; margin-top: 40px; text-shadow: 2px 2px 4px rgba(0,0,0,0.8); color: #ffdd88;">
          ${nextLevel <= 9 ? `Proceeding to Level ${nextLevel}...` : 'Preparing Final Level...'}
        </p>
      </div>
    `;
  } else if (gameState.gamePhase === "PAUSED") {
    uiOverlay.innerHTML = `
      <div style="text-align: center; padding-top: 150px; color: white;">
        <h1 style="font-size: 48px; margin: 0; text-shadow: 3px 3px 6px rgba(0,0,0,0.8);">PAUSED</h1>
        <p style="font-size: 20px; margin-top: 20px; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">Press ESC to Resume</p>
      </div>
    `;
  } else if (gameState.gamePhase === "GAME_OVER_LOSE") {
    uiOverlay.innerHTML = `
      <div style="text-align: center; padding-top: 120px; color: white;">
        <h1 style="font-size: 48px; margin: 0; color: #ff4444; text-shadow: 3px 3px 6px rgba(0,0,0,0.8);">GAME OVER</h1>
        <div style="font-size: 24px; margin-top: 30px; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">
          <p>Final Score: ${gameState.score}</p>
          <p>Coins Collected: ${gameState.coins_collected}</p>
          <p>Level Reached: ${gameState.currentLevel}/9</p>
        </div>
        <p style="font-size: 18px; margin-top: 40px; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">Press R to Restart</p>
      </div>
    `;
  } else if (gameState.gamePhase === "GAME_OVER_WIN") {
    uiOverlay.innerHTML = `
      <div style="text-align: center; padding-top: 100px; color: white;">
        <h1 style="font-size: 48px; margin: 0; color: #FFD700; text-shadow: 3px 3px 6px rgba(0,0,0,0.8);">CONGRATULATIONS!</h1>
        <h2 style="font-size: 32px; margin-top: 20px; color: #4CAF50; text-shadow: 3px 3px 6px rgba(0,0,0,0.8);">ALL 9 LEVELS COMPLETE!</h2>
        <div style="font-size: 24px; margin-top: 30px; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">
          <p>Final Score: ${gameState.score}</p>
          <p>Total Coins: ${gameState.coins_collected}</p>
          <p>Lives Remaining: ${gameState.lives}</p>
        </div>
        <p style="font-size: 18px; margin-top: 40px; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">Press R to Play Again</p>
      </div>
    `;
  }
}