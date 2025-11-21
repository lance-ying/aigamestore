// render.js - Rendering functions
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStart(p) {
  p.background(20, 20, 40);
  
  // Title
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER);
  p.textSize(32);
  p.text("PRISON BREAKOUT", CANVAS_WIDTH/2, 80);
  p.textSize(24);
  p.text("CHALLENGE", CANVAS_WIDTH/2, 110);
  
  // Instructions
  p.fill(200);
  p.textSize(14);
  p.textAlign(p.LEFT);
  p.text("OBJECTIVE:", 100, 160);
  p.textSize(12);
  p.text("Escape the prison within 3 minutes!", 100, 180);
  p.text("Find keys, unlock doors, avoid guards!", 100, 200);
  
  p.textSize(14);
  p.text("CONTROLS:", 100, 240);
  p.textSize(12);
  p.text("A/D or Arrow Keys: Move", 100, 260);
  p.text("SPACE: Jump", 100, 280);
  p.text("Z: Interact", 100, 300);
  p.text("ESC: Pause", 100, 320);
  
  // High Score
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER);
  p.textSize(16);
  p.text(`HIGH SCORE: ${gameState.highScore}`, CANVAS_WIDTH/2, 350);
  
  // Start prompt
  p.fill(255);
  p.textSize(18);
  const blink = Math.floor(p.frameCount / 30) % 2;
  if (blink) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, 380);
  }
}

export function renderPlaying(p, cameraX) {
  // Background
  p.background(40, 40, 60);
  
  // Grid lines for depth
  p.stroke(50, 50, 70);
  p.strokeWeight(1);
  for (let i = 0; i < 20; i++) {
    const x = (i * 100) - (cameraX % 100);
    p.line(x, 0, x, CANVAS_HEIGHT);
  }
  p.noStroke();
  
  // Render platforms
  for (let platform of gameState.platforms) {
    platform.render(p, cameraX);
  }
  
  // Render objectives
  for (let obj of gameState.objectives) {
    obj.render(p, cameraX);
  }
  
  // Render guards
  for (let guard of gameState.guards) {
    guard.render(p, cameraX);
  }
  
  // Render player
  if (gameState.player) {
    gameState.player.render(p, cameraX);
  }
  
  // UI
  renderUI(p);
}

export function renderUI(p) {
  // Score
  p.fill(255);
  p.textAlign(p.RIGHT);
  p.textSize(16);
  p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 20, 25);
  
  // Timer
  const minutes = Math.floor(gameState.timer / 60);
  const seconds = Math.floor(gameState.timer % 60);
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  p.textAlign(p.CENTER);
  if (gameState.timer < 30) {
    p.fill(255, 0, 0);
  } else {
    p.fill(255);
  }
  p.text(`TIME: ${timeStr}`, CANVAS_WIDTH/2, 25);
  
  // Level
  p.fill(255);
  p.textAlign(p.LEFT);
  p.text(`LEVEL: ${gameState.level}/${gameState.maxLevel}`, 20, 25);
  
  // Objectives
  p.textSize(12);
  p.text(`OBJECTIVES: ${gameState.objectivesCompleted}/${gameState.totalObjectives}`, 20, 45);
  
  // Paused indicator
  if (gameState.gamePhase === "PAUSED") {
    p.fill(255, 255, 0);
    p.textAlign(p.RIGHT);
    p.textSize(14);
    p.text("PAUSED", CANVAS_WIDTH - 20, 50);
  }
}

export function renderGameOver(p) {
  p.background(20, 20, 40);
  
  p.fill(255, 50, 50);
  p.textAlign(p.CENTER);
  p.textSize(40);
  
  if (gameState.gameOverReason === "WIN") {
    p.fill(100, 255, 100);
    p.text("YOU ESCAPED!", CANVAS_WIDTH/2, 120);
    p.fill(255, 255, 100);
    p.textSize(24);
    p.text("ALL LEVELS COMPLETE!", CANVAS_WIDTH/2, 160);
  } else {
    p.text("GAME OVER!", CANVAS_WIDTH/2, 120);
    p.fill(255);
    p.textSize(20);
    if (gameState.gameOverReason === "CAUGHT") {
      p.text("You were caught by a guard!", CANVAS_WIDTH/2, 160);
    } else if (gameState.gameOverReason === "TIMEOUT") {
      p.text("Time's up!", CANVAS_WIDTH/2, 160);
    }
  }
  
  // Score
  p.fill(255, 255, 100);
  p.textSize(24);
  p.text(`FINAL SCORE: ${gameState.score}`, CANVAS_WIDTH/2, 220);
  
  if (gameState.score > gameState.highScore && gameState.gameOverReason !== "WIN") {
    p.fill(100, 255, 100);
    p.textSize(16);
    p.text("NEW HIGH SCORE!", CANVAS_WIDTH/2, 250);
  } else if (gameState.gameOverReason === "WIN") {
    p.fill(255, 255, 100);
    p.textSize(18);
    p.text(`HIGH SCORE: ${gameState.highScore}`, CANVAS_WIDTH/2, 250);
  }
  
  // Instructions
  p.fill(200);
  p.textSize(18);
  const blink = Math.floor(p.frameCount / 30) % 2;
  if (blink) {
    p.text("PRESS R TO RESTART", CANVAS_WIDTH/2, 330);
  }
}

export function renderLevelComplete(p) {
  p.background(20, 40, 20);
  
  p.fill(100, 255, 100);
  p.textAlign(p.CENTER);
  p.textSize(36);
  p.text("LEVEL COMPLETE!", CANVAS_WIDTH/2, 140);
  
  p.fill(255, 255, 100);
  p.textSize(24);
  p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH/2, 200);
  
  // Time bonus
  const timeBonus = Math.floor(gameState.timer) * 10;
  p.fill(200);
  p.textSize(18);
  p.text(`Time Bonus: +${timeBonus}`, CANVAS_WIDTH/2, 240);
  
  p.fill(255);
  p.textSize(20);
  const blink = Math.floor(p.frameCount / 30) % 2;
  if (blink) {
    p.text("PRESS ENTER FOR NEXT LEVEL", CANVAS_WIDTH/2, 310);
  }
  p.textSize(16);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH/2, 350);
}