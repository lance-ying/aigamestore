import { gameState } from './globals.js';

let uiOverlay = null;

export function setupUI() {
  uiOverlay = document.createElement('div');
  uiOverlay.style.position = 'absolute';
  uiOverlay.style.top = '0';
  uiOverlay.style.left = '50%';
  uiOverlay.style.transform = 'translateX(-50%)';
  uiOverlay.style.width = '600px';
  uiOverlay.style.height = '400px';
  uiOverlay.style.pointerEvents = 'none';
  uiOverlay.style.fontFamily = 'Arial, sans-serif';
  document.body.appendChild(uiOverlay);
}

export function renderUI() {
  if (!uiOverlay) return;
  
  if (gameState.gamePhase === "START") {
    uiOverlay.innerHTML = `
      <div style="text-align: center; padding-top: 120px; color: white;">
        <h1 style="font-size: 48px; margin: 0; text-shadow: 3px 3px 6px rgba(0,0,0,0.8);">SUBWAY RUNNER</h1>
        <p style="font-size: 20px; margin-top: 20px; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">Press ENTER to Start</p>
        <div style="font-size: 14px; margin-top: 40px; line-height: 1.8; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">
          <p>Arrow Keys / WASD: Move and Jump/Slide</p>
          <p>ESC: Pause | R: Restart</p>
        </div>
      </div>
    `;
  } else if (gameState.gamePhase === "PLAYING") {
    const speed = Math.floor(gameState.speed * 100);
    uiOverlay.innerHTML = `
      <div style="padding: 15px; color: white; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">
        <div style="font-size: 24px; font-weight: bold;">Score: ${gameState.score}</div>
        <div style="font-size: 18px; margin-top: 5px;">Coins: ${gameState.coins_collected}</div>
        <div style="font-size: 14px; margin-top: 5px;">Speed: ${speed}%</div>
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
        </div>
        <p style="font-size: 18px; margin-top: 40px; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">Press R to Restart</p>
      </div>
    `;
  }
}