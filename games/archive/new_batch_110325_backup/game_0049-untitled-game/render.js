// render.js - Main rendering functions
import { gameState, GAME_PHASES, SCREENS, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { renderWorld } from './world.js';
import { renderTraining } from './training.js';
import { renderBattle } from './battle.js';
import { renderEquipment } from './equipment.js';

export function renderStartScreen(p) {
  // Background
  p.fill(135, 206, 250);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Clouds
  drawCloud(p, 100, 50, 60);
  drawCloud(p, 400, 80, 50);
  drawCloud(p, 500, 40, 70);
  
  // Title
  p.fill(255, 200, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text("DUCK LIFE 7", 300, 80);
  p.textSize(28);
  p.text("BATTLE", 300, 120);
  
  // Duck illustration
  drawTitleDuck(p, 300, 200, 60);
  
  // Instructions
  p.fill(50);
  p.textSize(16);
  p.text("Train your duck and become the champion!", 300, 280);
  p.textSize(14);
  p.text("Complete training mini-games to boost stats", 300, 310);
  p.text("Battle rival ducks to earn rewards", 300, 330);
  p.text("Unlock equipment to enhance your abilities", 300, 350);
  
  // Start prompt
  p.fill(255, 255, 0);
  p.textSize(20);
  const flash = Math.floor(p.frameCount / 30) % 2 === 0;
  if (flash) {
    p.text("PRESS ENTER TO START", 300, 380);
  }
}

export function renderGameOverScreen(p) {
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Background
  p.fill(isWin ? 100 : 40, isWin ? 200 : 40, isWin ? 100 : 60);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Message
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "VICTORY!" : "GAME OVER", 300, 100);
  
  // Stats
  p.textSize(20);
  p.text(isWin ? "You are the Champion!" : "You were defeated...", 300, 160);
  
  p.textSize(16);
  p.text(`Total Wins: ${gameState.player.wins}`, 300, 210);
  p.text(`Final Stats:`, 300, 240);
  p.textSize(14);
  p.text(`Power: ${gameState.player.power} | Health: ${gameState.player.maxHealth} | Defence: ${gameState.player.defence}`, 300, 265);
  p.text(`Speed: ${gameState.player.speed} | Special: ${gameState.player.special}`, 300, 285);
  
  // Duck
  const duckColor = isWin ? [255, 215, 0] : [150, 150, 150];
  drawTitleDuck(p, 300, 330, 40);
  
  // Restart prompt
  p.fill(255, 255, 0);
  p.textSize(18);
  p.text("PRESS R TO RESTART", 300, 380);
}

export function renderPlayingScreen(p) {
  if (gameState.screen === SCREENS.WORLD) {
    renderWorld(p);
  } else if (gameState.screen === SCREENS.TRAINING_GAME) {
    renderTraining(p);
  } else if (gameState.screen === SCREENS.BATTLE) {
    renderBattle(p);
  } else if (gameState.screen === SCREENS.EQUIPMENT) {
    renderEquipment(p);
  }
}

export function renderPausedIndicator(p) {
  p.fill(255, 255, 0);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

function drawCloud(p, x, y, size) {
  p.fill(255, 255, 255, 200);
  p.noStroke();
  p.ellipse(x, y, size, size * 0.6);
  p.ellipse(x - size * 0.3, y, size * 0.8, size * 0.5);
  p.ellipse(x + size * 0.3, y, size * 0.8, size * 0.5);
}

function drawTitleDuck(p, x, y, size) {
  p.push();
  p.translate(x, y);
  
  // Body
  p.fill(255, 200, 0);
  p.ellipse(0, 0, size * 2, size * 1.5);
  
  // Head
  p.ellipse(-size * 0.7, -size * 0.8, size * 1.4, size * 1.4);
  
  // Beak
  p.fill(255, 150, 0);
  p.triangle(-size * 1.2, -size * 0.8, -size * 1.8, -size * 0.5, -size * 1.8, -size * 1.1);
  
  // Eye
  p.fill(0);
  p.circle(-size * 0.9, -size * 0.9, size * 0.3);
  p.fill(255);
  p.circle(-size * 0.85, -size * 0.95, size * 0.15);
  
  // Wing
  p.fill(240, 180, 0);
  p.ellipse(size * 0.5, 0, size, size * 0.8);
  
  // Feet
  p.fill(255, 150, 0);
  p.ellipse(-size * 0.4, size * 0.8, size * 0.5, size * 0.4);
  p.ellipse(size * 0.4, size * 0.8, size * 0.5, size * 0.4);
  
  p.pop();
}