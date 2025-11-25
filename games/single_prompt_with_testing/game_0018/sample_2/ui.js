import { gameState, WIN_SCORE } from './globals.js';

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
  
  // Find the canvas and insert UI overlay right after it
  const canvas = gameState.renderer.domElement;
  canvas.style.position = 'relative';
  
  // Create a wrapper for canvas and UI
  const wrapper = document.createElement('div');
  wrapper.style.position = 'relative';
  wrapper.style.width = '600px';
  wrapper.style.height = '400px';
  wrapper.style.margin = '0 auto';
  
  // Move canvas into wrapper
  canvas.parentNode.insertBefore(wrapper, canvas);
  wrapper.appendChild(canvas);
  wrapper.appendChild(uiOverlay);
}

export function renderUI() {
  if (!uiOverlay) return;
  
  if (gameState.gamePhase === "START") {
    uiOverlay.innerHTML = `
      <div style="text-align: center; padding-top: 120px; color: white; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">
        <h1 style="font-size: 48px; margin: 0 0 20px 0; color: #ffff00;">SUBWAY RUNNER</h1>
        <p style="font-size: 20px; margin: 10px 0;">Dodge trains, jump barriers, slide under obstacles!</p>
        <p style="font-size: 16px; margin: 20px 0; color: #aaffaa;">Collect ${WIN_SCORE} points to win!</p>
        <div style="font-size: 24px; margin-top: 40px; animation: pulse 1.5s infinite;">
          PRESS ENTER TO START
        </div>
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      </style>
    `;
  } else if (gameState.gamePhase === "PLAYING") {
    uiOverlay.innerHTML = `
      <div style="padding: 15px; color: white; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">
        <div style="font-size: 24px; font-weight: bold; color: #ffff00;">Score: ${gameState.score}</div>
        <div style="font-size: 18px; margin-top: 5px; color: #aaffff;">Distance: ${Math.floor(gameState.distance)}m</div>
        <div style="font-size: 16px; margin-top: 5px; color: #ffaaaa;">Speed: ${(gameState.currentSpeed * 100).toFixed(0)}%</div>
      </div>
    `;
  } else if (gameState.gamePhase === "PAUSED") {
    uiOverlay.innerHTML = `
      <div style="text-align: center; padding-top: 150px; color: white; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">
        <h1 style="font-size: 48px; margin: 0 0 20px 0; color: #ffff00;">PAUSED</h1>
        <p style="font-size: 20px;">Press ESC to Resume</p>
        <div style="margin-top: 30px; font-size: 18px;">
          <div>Score: ${gameState.score}</div>
          <div>Distance: ${Math.floor(gameState.distance)}m</div>
        </div>
      </div>
    `;
  } else if (gameState.gamePhase === "GAME_OVER_WIN") {
    uiOverlay.innerHTML = `
      <div style="text-align: center; padding-top: 120px; color: white; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">
        <h1 style="font-size: 56px; margin: 0 0 20px 0; color: #00ff00;">VICTORY!</h1>
        <p style="font-size: 24px; color: #ffff00;">You reached ${WIN_SCORE} points!</p>
        <div style="margin-top: 30px; font-size: 20px;">
          <div>Final Score: ${gameState.score}</div>
          <div>Distance: ${Math.floor(gameState.distance)}m</div>
        </div>
        <p style="font-size: 20px; margin-top: 40px;">Press R to Restart</p>
      </div>
    `;
  } else if (gameState.gamePhase === "GAME_OVER_LOSE") {
    uiOverlay.innerHTML = `
      <div style="text-align: center; padding-top: 120px; color: white; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">
        <h1 style="font-size: 56px; margin: 0 0 20px 0; color: #ff0000;">GAME OVER</h1>
        <p style="font-size: 24px; color: #ffaaaa;">You crashed!</p>
        <div style="margin-top: 30px; font-size: 20px;">
          <div>Final Score: ${gameState.score}</div>
          <div>Distance: ${Math.floor(gameState.distance)}m</div>
        </div>
        <p style="font-size: 20px; margin-top: 40px;">Press R to Restart</p>
      </div>
    `;
  }
}