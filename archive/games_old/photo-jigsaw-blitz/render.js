// render.js - Rendering functions for all game phases

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { getTotalLevels } from './levels.js';

export function renderGame(p) {
  // Clear background once
  p.background(40, 40, 50);
  
  if (gameState.gamePhase === GAME_PHASES.START) {
    renderStartScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING || gameState.gamePhase === GAME_PHASES.PAUSED) {
    renderPlayingScreen(p);
    if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      renderPauseOverlay(p);
    }
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    renderGameOverScreen(p);
  }
}

function renderStartScreen(p) {
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  
  // Title
  p.textSize(48);
  p.fill(255, 220, 100);
  p.text("PHOTO JIGSAW BLITZ", CANVAS_WIDTH / 2, 80);
  
  // Description
  p.textSize(16);
  p.fill(220);
  p.text("Assemble scattered puzzle pieces", CANVAS_WIDTH / 2, 140);
  p.text("into complete images before time runs out!", CANVAS_WIDTH / 2, 160);
  
  // Instructions
  p.textSize(14);
  p.fill(180, 220, 255);
  p.text("HOW TO PLAY:", CANVAS_WIDTH / 2, 200);
  
  p.fill(200);
  p.textSize(12);
  const instructions = [
    "SPACE - Select/deselect nearest piece",
    "ARROW KEYS - Move selected piece",
    "SHIFT + ARROWS - Fine movement",
    "Z - Rotate piece (levels 2-4)",
    "ESC - Pause game",
    "R - Restart to menu"
  ];
  
  let y = 225;
  instructions.forEach(inst => {
    p.text(inst, CANVAS_WIDTH / 2, y);
    y += 20;
  });
  
  // Start prompt
  p.textSize(20);
  p.fill(255, 255, 100);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
}

function renderPlayingScreen(p) {
  // Draw faint background grid
  p.stroke(60, 60, 70, 100);
  p.strokeWeight(1);
  for (let i = 0; i < CANVAS_WIDTH; i += 50) {
    p.line(i, 0, i, CANVAS_HEIGHT);
  }
  for (let j = 0; j < CANVAS_HEIGHT; j += 50) {
    p.line(0, j, CANVAS_WIDTH, j);
  }
  
  // Draw all pieces
  gameState.entities.forEach(piece => {
    piece.draw(p);
  });
  
  // Draw UI
  renderUI(p);
}

function renderUI(p) {
  // Score (top-left)
  p.fill(255, 255, 100);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(18);
  p.text(`SCORE: ${gameState.score}`, 10, 10);
  
  // Level and time (top-right)
  p.textAlign(p.RIGHT, p.TOP);
  p.fill(100, 255, 255);
  p.text(`LEVEL: ${gameState.currentLevel}`, CANVAS_WIDTH - 10, 10);
  
  const minutes = Math.floor(gameState.timeRemaining / 60);
  const seconds = Math.floor(gameState.timeRemaining % 60);
  const timeStr = `TIME: ${minutes}:${seconds.toString().padStart(2, '0')}`;
  
  const timeColor = gameState.timeRemaining < 30 ? [255, 100, 100] : [255, 255, 255];
  p.fill(...timeColor);
  p.text(timeStr, CANVAS_WIDTH - 10, 35);
  
  // Level info (bottom-left)
  if (gameState.levelData) {
    p.textAlign(p.LEFT, p.BOTTOM);
    p.textSize(14);
    p.fill(200);
    p.text(gameState.levelData.name, 10, CANVAS_HEIGHT - 10);
  }
  
  // Hint text (bottom-center)
  if (!gameState.selectedPieceId) {
    p.textAlign(p.CENTER, p.BOTTOM);
    p.textSize(12);
    p.fill(200, 200, 200, 150);
    p.text("Press SPACE to select a piece", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 10);
  }
}

function renderPauseOverlay(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Pause text (top-right as required)
  p.fill(255, 255, 100);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 60);
  
  // Center menu
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  
  p.textSize(16);
  p.fill(220);
  p.text("ESC - Resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
  p.text("R - Restart to Menu", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 35);
}

function renderGameOverScreen(p) {
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    p.textSize(48);
    p.fill(100, 255, 100);
    p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, 100);
    
    p.textSize(24);
    p.fill(255, 255, 100);
    p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH / 2, 160);
    
    if (gameState.currentLevel >= getTotalLevels()) {
      p.textSize(32);
      p.fill(255, 200, 100);
      p.text("ALL LEVELS COMPLETE!", CANVAS_WIDTH / 2, 220);
      p.textSize(20);
      p.fill(220);
      p.text("Congratulations!", CANVAS_WIDTH / 2, 260);
    } else {
      p.textSize(20);
      p.fill(220);
      p.text(`Get ready for Level ${gameState.currentLevel + 1}...`, CANVAS_WIDTH / 2, 220);
    }
  } else {
    p.textSize(48);
    p.fill(255, 100, 100);
    p.text("TIME'S UP!", CANVAS_WIDTH / 2, 100);
    
    p.textSize(24);
    p.fill(255, 255, 100);
    p.text(`FINAL SCORE: ${gameState.score}`, CANVAS_WIDTH / 2, 160);
    
    p.textSize(20);
    p.fill(220);
    p.text("Better luck next time!", CANVAS_WIDTH / 2, 220);
  }
  
  p.textSize(18);
  p.fill(255, 255, 100);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 320);
}