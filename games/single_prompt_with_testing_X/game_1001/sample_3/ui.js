// ui.js - UI rendering and management
import { gameState } from './globals.js';

export function createUI() {
  // Get game container
  const gameContainer = document.getElementById('gameContainer');
  
  // Create overlay container positioned relative to game container
  const overlay = document.createElement('div');
  overlay.id = 'gameOverlay';
  overlay.style.position = 'absolute';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.pointerEvents = 'none';
  overlay.style.fontFamily = 'Arial, sans-serif';
  overlay.style.color = 'white';
  gameContainer.appendChild(overlay);

  // Create HUD (always visible during gameplay)
  const hud = document.createElement('div');
  hud.id = 'hud';
  hud.style.position = 'absolute';
  hud.style.top = '10px';
  hud.style.left = '10px';
  hud.style.fontSize = '18px';
  hud.style.textShadow = '2px 2px 4px black';
  overlay.appendChild(hud);

  // Create start screen
  const startScreen = document.createElement('div');
  startScreen.id = 'startScreen';
  startScreen.style.position = 'absolute';
  startScreen.style.top = '50%';
  startScreen.style.left = '50%';
  startScreen.style.transform = 'translate(-50%, -50%)';
  startScreen.style.textAlign = 'center';
  startScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  startScreen.style.padding = '20px';
  startScreen.style.borderRadius = '10px';
  startScreen.style.maxWidth = '90%';
  startScreen.innerHTML = `
    <h1 style="margin: 0 0 15px 0; font-size: 28px; color: #00ff00;">TRACK RUNNER 3D</h1>
    <p style="font-size: 14px; margin: 8px 0;">Run through endless tracks!</p>
    <p style="font-size: 12px; margin: 8px 0;">Dodge trains, jump barriers, slide under obstacles</p>
    <p style="font-size: 12px; margin: 8px 0;">Collect coins and survive!</p>
    <p style="font-size: 18px; margin: 20px 0 0 0; color: #ffff00;">PRESS ENTER TO START</p>
  `;
  overlay.appendChild(startScreen);

  // Create pause screen
  const pauseScreen = document.createElement('div');
  pauseScreen.id = 'pauseScreen';
  pauseScreen.style.position = 'absolute';
  pauseScreen.style.top = '50%';
  pauseScreen.style.left = '50%';
  pauseScreen.style.transform = 'translate(-50%, -50%)';
  pauseScreen.style.textAlign = 'center';
  pauseScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  pauseScreen.style.padding = '30px';
  pauseScreen.style.borderRadius = '10px';
  pauseScreen.style.display = 'none';
  pauseScreen.innerHTML = `
    <h1 style="margin: 0; font-size: 36px; color: #ffff00;">PAUSED</h1>
    <p style="font-size: 16px; margin: 15px 0 0 0;">Press ESC to resume</p>
  `;
  overlay.appendChild(pauseScreen);

  // Create game over screen
  const gameOverScreen = document.createElement('div');
  gameOverScreen.id = 'gameOverScreen';
  gameOverScreen.style.position = 'absolute';
  gameOverScreen.style.top = '50%';
  gameOverScreen.style.left = '50%';
  gameOverScreen.style.transform = 'translate(-50%, -50%)';
  gameOverScreen.style.textAlign = 'center';
  gameOverScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  gameOverScreen.style.padding = '25px';
  gameOverScreen.style.borderRadius = '10px';
  gameOverScreen.style.display = 'none';
  overlay.appendChild(gameOverScreen);
}

export function updateUI() {
  const hud = document.getElementById('hud');
  const startScreen = document.getElementById('startScreen');
  const pauseScreen = document.getElementById('pauseScreen');
  const gameOverScreen = document.getElementById('gameOverScreen');

  // Update HUD
  if (gameState.gamePhase === 'PLAYING') {
    hud.style.display = 'block';
    hud.innerHTML = `
      <div>Score: ${Math.floor(gameState.score)}</div>
      <div>Distance: ${Math.floor(gameState.distance)}m</div>
      <div>Speed: ${(gameState.currentSpeed * 100).toFixed(0)}%</div>
    `;
  } else {
    hud.style.display = 'none';
  }

  // Show/hide screens based on game phase
  startScreen.style.display = gameState.gamePhase === 'START' ? 'block' : 'none';
  pauseScreen.style.display = gameState.gamePhase === 'PAUSED' ? 'block' : 'none';
  
  if (gameState.gamePhase === 'GAME_OVER_LOSE' || gameState.gamePhase === 'GAME_OVER_WIN') {
    gameOverScreen.style.display = 'block';
    gameOverScreen.innerHTML = `
      <h1 style="margin: 0 0 15px 0; font-size: 36px; color: #ff0000;">GAME OVER</h1>
      <p style="font-size: 20px; margin: 8px 0;">Final Score: ${Math.floor(gameState.score)}</p>
      <p style="font-size: 16px; margin: 8px 0;">Distance: ${Math.floor(gameState.distance)}m</p>
      <p style="font-size: 18px; margin: 20px 0 0 0; color: #ffff00;">PRESS R TO RESTART</p>
    `;
  } else {
    gameOverScreen.style.display = 'none';
  }
}

export function projectToScreen(position, camera, canvas) {
  const vector = position.clone();
  vector.project(camera);
  
  const x = (vector.x * 0.5 + 0.5) * canvas.width;
  const y = (vector.y * -0.5 + 0.5) * canvas.height;
  
  return { x, y };
}