// renderer.js - Game rendering

import { gameState, GAME_PHASES, GRID_SIZE, GRID_COLS, GRID_ROWS, CANVAS_WIDTH, CANVAS_HEIGHT, ATTRACTION_TYPES } from './globals.js';
import { renderStartScreen, renderGameOverScreen, renderPausedIndicator, renderHUD, renderMenu, renderSNSFeed } from './ui.js';

export function renderGame(p) {
  if (gameState.gamePhase === GAME_PHASES.START) {
    renderStartScreen(p, gameState);
    return;
  }
  
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
      gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    renderGameOverScreen(p, gameState);
    return;
  }
  
  // Clear background
  p.background(50, 150, 80);
  
  // Render grid
  renderGrid(p);
  
  // Render attractions
  for (const attraction of gameState.attractions) {
    attraction.render(p, GRID_SIZE, gameState.cameraOffsetX, gameState.cameraOffsetY);
  }
  
  // Render guests
  for (const guest of gameState.guests) {
    guest.render(p, gameState.cameraOffsetX, gameState.cameraOffsetY);
  }
  
  // Render placement preview
  if (gameState.selectedAttractionType) {
    renderPlacementPreview(p);
  }
  
  // Render HUD
  renderHUD(p, gameState);
  
  // Render menu
  renderMenu(p, gameState);
  
  // Render SNS feed
  renderSNSFeed(p, gameState);
  
  // Render paused indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    renderPausedIndicator(p);
  }
}

function renderGrid(p) {
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      const screenX = x * GRID_SIZE - gameState.cameraOffsetX;
      const screenY = y * GRID_SIZE - gameState.cameraOffsetY;
      
      const cell = gameState.grid.cells[y][x];
      
      if (!cell.available) {
        p.fill(80, 80, 60);
      } else if (cell.occupied) {
        continue; // Skip, will be rendered as attraction
      } else {
        p.fill(100, 180, 100);
      }
      
      p.rect(screenX, screenY, GRID_SIZE - 1, GRID_SIZE - 1);
    }
  }
}

function renderPlacementPreview(p) {
  const data = ATTRACTION_TYPES[gameState.selectedAttractionType];
  const x = gameState.hoveredCell.x;
  const y = gameState.hoveredCell.y;
  
  const canPlace = gameState.grid.canPlace(x, y, data.size);
  
  const screenX = x * GRID_SIZE - gameState.cameraOffsetX;
  const screenY = y * GRID_SIZE - gameState.cameraOffsetY;
  const size = data.size * GRID_SIZE;
  
  p.fill(...(canPlace ? [100, 255, 100, 100] : [255, 100, 100, 100]));
  p.rect(screenX, screenY, size, size);
  
  p.fill(255);
  p.textSize(10);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(data.name, screenX + size / 2, screenY + size / 2);
}

export function logPlayerInfo(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  if (p.frameCount % 60 === 0) {
    p.logs.player_info.push({
      screen_x: 300, // Park is stationary, camera moves
      screen_y: 200,
      game_x: 300 + gameState.cameraOffsetX,
      game_y: 200 + gameState.cameraOffsetY,
      framecount: p.frameCount
    });
  }
}