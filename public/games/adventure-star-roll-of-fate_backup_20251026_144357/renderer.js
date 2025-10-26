// renderer.js - Rendering functions

import { gameState, GAME_PHASE, CANVAS_WIDTH, CANVAS_HEIGHT, GRID_CONFIG, TILE_TYPES } from './globals.js';

export function renderGame(p) {
  p.background(40, 40, 50);
  
  switch (gameState.gamePhase) {
    case GAME_PHASE.START:
      renderStartScreen(p);
      break;
    case GAME_PHASE.PLAYING:
      renderPlaying(p);
      break;
    case GAME_PHASE.PAUSED:
      renderPlaying(p);
      renderPausedOverlay(p);
      break;
    case GAME_PHASE.LEVEL_TRANSITION:
      renderLevelTransition(p);
      break;
    case GAME_PHASE.GAME_OVER_WIN:
      renderGameOver(p, true);
      break;
    case GAME_PHASE.GAME_OVER_LOSE:
      renderGameOver(p, false);
      break;
  }
}

function renderStartScreen(p) {
  p.push();
  
  // Title
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('ADVENTURE STAR', CANVAS_WIDTH / 2, 80);
  
  p.textSize(24);
  p.fill(200, 200, 255);
  p.text('Roll of Fate', CANVAS_WIDTH / 2, 120);
  
  // High Score
  p.textSize(20);
  p.fill(255, 255, 100);
  p.text(`High Score: ${gameState.highScore}`, CANVAS_WIDTH / 2, 160);
  
  // Instructions
  p.textSize(16);
  p.fill(220, 220, 220);
  p.textAlign(p.CENTER, p.CENTER);
  
  const instructions = [
    'Navigate grid-based levels to reach the exit!',
    '',
    'Move with ARROW KEYS or WASD',
    'Press SPACE to interact with event tiles',
    'Manage your HP and reach the final exit to win!',
    '',
    'Each level gets harder with more enemies and traps.',
    'Your luck influences random event outcomes.'
  ];
  
  let y = 200;
  instructions.forEach(line => {
    p.text(line, CANVAS_WIDTH / 2, y);
    y += 22;
  });
  
  // Start prompt
  p.textSize(24);
  p.fill(100, 255, 100);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 370);
  
  p.pop();
}

function renderPlaying(p) {
  if (!gameState.currentMap || !gameState.player) return;
  
  // Render map
  renderMap(p, gameState.currentMap);
  
  // Render player
  gameState.player.render(p);
  
  // Render UI
  renderUI(p);
  
  // Render event message if active
  if (gameState.eventMessageTimer > 0) {
    renderEventMessage(p);
  }
  
  // Render interaction prompt
  if (gameState.needsInteraction) {
    renderInteractionPrompt(p);
  }
}

function renderMap(p, map) {
  const tileSize = GRID_CONFIG.tileSize;
  const offsetX = GRID_CONFIG.offsetX;
  const offsetY = GRID_CONFIG.offsetY;
  
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const tile = map.tiles[y][x];
      const screenX = offsetX + x * tileSize;
      const screenY = offsetY + y * tileSize;
      
      // Base tile
      if (tile.type === TILE_TYPES.WALL) {
        p.fill(60, 60, 70);
      } else if (tile.visited) {
        p.fill(200, 200, 210);
      } else {
        p.fill(150, 150, 160);
      }
      
      p.stroke(100, 100, 110);
      p.strokeWeight(1);
      p.rect(screenX, screenY, tileSize, tileSize);
      
      // Tile content
      if (tile.type === TILE_TYPES.EXIT) {
        p.fill(50, 255, 50);
        p.noStroke();
        p.rect(screenX + 3, screenY + 3, tileSize - 6, tileSize - 6);
        p.fill(0);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(20);
        p.text('E', screenX + tileSize / 2, screenY + tileSize / 2);
      } else if (!tile.interacted) {
        renderTileIcon(p, tile.type, screenX + tileSize / 2, screenY + tileSize / 2);
      }
    }
  }
}

function renderTileIcon(p, type, x, y) {
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  p.strokeWeight(1);
  
  switch (type) {
    case TILE_TYPES.EVENT_TREASURE:
      p.fill(255, 215, 0);
      p.stroke(200, 150, 0);
      p.text('★', x, y);
      break;
    case TILE_TYPES.EVENT_TRAP:
      p.fill(200, 50, 50);
      p.stroke(150, 0, 0);
      p.text('!', x, y);
      break;
    case TILE_TYPES.EVENT_ENEMY:
      p.fill(255, 100, 100);
      p.stroke(200, 0, 0);
      p.text('☠', x, y);
      break;
    case TILE_TYPES.EVENT_NPC:
      p.fill(150, 150, 255);
      p.stroke(100, 100, 200);
      p.text('N', x, y);
      break;
    case TILE_TYPES.EVENT_MYSTERY:
      p.fill(200, 150, 255);
      p.stroke(150, 100, 200);
      p.text('?', x, y);
      break;
  }
  p.pop();
}

function renderUI(p) {
  p.push();
  
  // HP Bar
  const hpBarX = 10;
  const hpBarY = 10;
  const hpBarWidth = 150;
  const hpBarHeight = 20;
  
  p.fill(80, 80, 80);
  p.stroke(200, 200, 200);
  p.strokeWeight(2);
  p.rect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);
  
  const hpPercent = gameState.player.hp / gameState.player.maxHP;
  const hpColor = hpPercent > 0.5 ? [50, 255, 50] : hpPercent > 0.25 ? [255, 200, 50] : [255, 50, 50];
  p.fill(...hpColor);
  p.noStroke();
  p.rect(hpBarX + 2, hpBarY + 2, (hpBarWidth - 4) * hpPercent, hpBarHeight - 4);
  
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text(`HP: ${gameState.player.hp}/${gameState.player.maxHP}`, hpBarX + 5, hpBarY + 4);
  
  // Score
  p.fill(255, 220, 100);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(18);
  p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
  
  // Level
  p.fill(150, 200, 255);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(20);
  p.text(`LEVEL ${gameState.currentLevel}`, CANVAS_WIDTH / 2, 10);
  
  p.pop();
}

function renderEventMessage(p) {
  p.push();
  
  const boxWidth = 500;
  const boxHeight = 80;
  const boxX = (CANVAS_WIDTH - boxWidth) / 2;
  const boxY = CANVAS_HEIGHT - boxHeight - 20;
  
  // Box background
  p.fill(0, 0, 0, 200);
  p.stroke(255, 220, 100);
  p.strokeWeight(2);
  p.rect(boxX, boxY, boxWidth, boxHeight, 10);
  
  // Message text
  p.fill(255, 255, 255);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(16);
  p.text(gameState.eventMessage, CANVAS_WIDTH / 2, boxY + boxHeight / 2);
  
  p.pop();
}

function renderInteractionPrompt(p) {
  p.push();
  
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(14);
  p.text('Press SPACE to interact', CANVAS_WIDTH / 2, 50);
  
  p.pop();
}

function renderPausedOverlay(p) {
  p.push();
  
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  
  p.textSize(18);
  p.text('Press ESC to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  
  p.pop();
}

function renderLevelTransition(p) {
  p.background(20, 20, 30);
  
  p.push();
  
  p.fill(100, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text(`Level ${gameState.currentLevel - 1} Complete!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  
  p.fill(200, 200, 255);
  p.textSize(24);
  p.text(`Preparing Level ${gameState.currentLevel}...`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  
  p.pop();
}

function renderGameOver(p, isWin) {
  p.background(20, 20, 30);
  
  p.push();
  
  if (isWin) {
    p.fill(100, 255, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(56);
    p.text('YOU WIN!', CANVAS_WIDTH / 2, 100);
    
    p.fill(255, 220, 100);
    p.textSize(28);
    p.text('★ Congratulations! ★', CANVAS_WIDTH / 2, 160);
  } else {
    p.fill(255, 100, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text('GAME OVER', CANVAS_WIDTH / 2, 120);
  }
  
  p.fill(255, 255, 255);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  
  if (gameState.score > gameState.highScore) {
    p.fill(255, 220, 100);
    p.textSize(20);
    p.text('NEW HIGH SCORE!', CANVAS_WIDTH / 2, 260);
  } else {
    p.fill(200, 200, 200);
    p.textSize(18);
    p.text(`High Score: ${gameState.highScore}`, CANVAS_WIDTH / 2, 260);
  }
  
  p.fill(150, 200, 255);
  p.textSize(20);
  p.text('Press R to Restart', CANVAS_WIDTH / 2, 330);
  
  p.pop();
}