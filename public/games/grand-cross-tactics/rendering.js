// rendering.js - Screen rendering functions
import { gameState, GAME_PHASES, TURN_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { CardRenderer } from './cards.js';
import { updateAnimations } from './animations.js';

let cardRenderer;

export function initRendering(p) {
  cardRenderer = new CardRenderer(p);
}

export function renderGame(p) {
  p.background(20, 20, 30);

  if (gameState.gamePhase === GAME_PHASES.START) {
    renderStartScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    renderPlayingScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    renderPlayingScreen(p);
    renderPauseOverlay(p);
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    renderWinScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    renderGameOverScreen(p);
  }
}

function renderStartScreen(p) {
  p.push();
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  
  // Title
  p.textSize(48);
  p.text('GRAND CROSS', CANVAS_WIDTH / 2, 100);
  p.text('TACTICS', CANVAS_WIDTH / 2, 150);
  
  // Instructions
  p.textSize(16);
  p.fill(200, 200, 200);
  p.text('Command your hero through 5 challenging levels', CANVAS_WIDTH / 2, 210);
  p.text('Defeat all enemies to progress', CANVAS_WIDTH / 2, 230);
  
  p.textSize(14);
  p.fill(150, 150, 150);
  p.textAlign(p.LEFT, p.TOP);
  p.text('LEFT/RIGHT: Select card', 50, 270);
  p.text('SPACE: Play card', 50, 290);
  p.text('SHIFT: End turn', 50, 310);
  p.text('ESC: Pause', 50, 330);
  
  // Start prompt
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(28);
  p.fill(255, 215, 0);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 370);
  
  p.pop();
}

function renderPlayingScreen(p) {
  // Render UI
  renderScore(p);
  renderLevel(p);
  renderTurnIndicator(p);
  
  // Render entities
  if (gameState.player) {
    gameState.player.render();
  }
  
  for (const enemy of gameState.enemies) {
    if (!enemy.isDead()) {
      enemy.render();
    }
  }
  
  // Render animations
  updateAnimations(p);
  
  // Render cards during player turn
  if (gameState.currentTurnPhase === TURN_PHASES.PLAYER) {
    cardRenderer.render();
  }
  
  // Level cleared overlay
  if (gameState.currentTurnPhase === TURN_PHASES.LEVEL_CLEARED) {
    renderLevelClearedOverlay(p);
  }
}

function renderScore(p) {
  p.push();
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(24);
  p.text(`SCORE: ${String(gameState.totalScore).padStart(6, '0')}`, CANVAS_WIDTH - 10, 10);
  p.pop();
}

function renderLevel(p) {
  p.push();
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(24);
  p.text(`LEVEL: ${gameState.currentLevel}`, 10, 10);
  p.pop();
}

function renderTurnIndicator(p) {
  if (gameState.currentTurnPhase === TURN_PHASES.LEVEL_CLEARED) return;
  
  p.push();
  const text = gameState.currentTurnPhase === TURN_PHASES.PLAYER ? 'PLAYER TURN' : 'ENEMY TURN';
  const color = gameState.currentTurnPhase === TURN_PHASES.PLAYER ? [100, 149, 237] : [220, 20, 60];
  
  p.fill(...color);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(32);
  p.text(text, CANVAS_WIDTH / 2, 10);
  p.pop();
}

function renderPauseOverlay(p) {
  p.push();
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(60);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  
  p.textSize(20);
  p.text('ESC: Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  p.text('R: Restart to Menu', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
  p.pop();
}

function renderLevelClearedOverlay(p) {
  p.push();
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(`LEVEL ${gameState.currentLevel} CLEARED!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  
  p.fill(255);
  p.textSize(28);
  p.text('PRESS ENTER TO CONTINUE', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  p.pop();
}

function renderGameOverScreen(p) {
  p.push();
  p.fill(178, 34, 34);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(60);
  p.text('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
  
  p.fill(255);
  p.textSize(32);
  p.text(`FINAL SCORE: ${String(gameState.totalScore).padStart(6, '0')}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  
  p.textSize(28);
  p.fill(255, 215, 0);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
  p.pop();
}

function renderWinScreen(p) {
  p.push();
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('CONGRATULATIONS!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
  p.text('YOU WON!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  
  p.fill(255);
  p.textSize(32);
  p.text(`FINAL SCORE: ${String(gameState.totalScore).padStart(6, '0')}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
  
  p.textSize(28);
  p.fill(255, 215, 0);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 90);
  p.pop();
}