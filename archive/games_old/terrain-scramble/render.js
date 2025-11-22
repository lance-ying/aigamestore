// render.js - Rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, LEVELS } from './globals.js';

export function renderGame(p, vehicle, terrainManager) {
  // Sky background
  drawSky(p);
  
  // Update camera
  if (vehicle && gameState.gamePhase === "PLAYING") {
    const targetX = vehicle.getPosition().x - CANVAS_WIDTH / 3;
    gameState.camera.x += (targetX - gameState.camera.x) * 0.1;
  }
  
  // Render terrain
  if (terrainManager) {
    terrainManager.render(p, gameState.camera.x);
  }
  
  // Render fuel canisters
  for (let canister of gameState.fuelCanisters) {
    canister.render(p, gameState.camera.x);
  }
  
  // Render particles
  for (let effect of gameState.particleEffects) {
    effect.render(p, gameState.camera.x);
  }
  
  // Render vehicle
  if (vehicle) {
    p.push();
    p.translate(-gameState.camera.x, 0);
    vehicle.render(p);
    p.pop();
  }
  
  // Render UI
  renderUI(p);
}

function drawSky(p) {
  // Gradient sky
  for (let y = 0; y < CANVAS_HEIGHT; y++) {
    const inter = p.map(y, 0, CANVAS_HEIGHT, 0, 1);
    const c = p.lerpColor(p.color(135, 206, 235), p.color(200, 230, 255), inter);
    p.stroke(c);
    p.line(0, y, CANVAS_WIDTH, y);
  }
}

function renderUI(p) {
  p.push();
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.noStroke();
  
  // Score
  p.text(`Score: ${gameState.score}`, 10, 10);
  
  // Level
  p.text(`Level: ${gameState.currentLevel}`, CANVAS_WIDTH - 80, 10);
  
  // Distance
  const level = LEVELS[gameState.currentLevel - 1];
  p.text(`Distance: ${gameState.distance}/${level.track_length_meters}m`, CANVAS_WIDTH - 180, 30);
  
  // Fuel gauge
  p.textAlign(p.CENTER, p.TOP);
  p.text('Fuel', CANVAS_WIDTH / 2, 10);
  
  // Fuel bar background
  p.fill(50);
  p.stroke(255);
  p.strokeWeight(2);
  p.rect(CANVAS_WIDTH / 2 - 75, 30, 150, 15);
  
  // Fuel bar
  const fuelPercent = gameState.fuel / gameState.maxFuel;
  const fuelColor = fuelPercent > 0.5 ? [50, 200, 50] : fuelPercent > 0.25 ? [200, 200, 50] : [200, 50, 50];
  p.fill(...fuelColor);
  p.noStroke();
  p.rect(CANVAS_WIDTH / 2 - 74, 31, 148 * fuelPercent, 13);
  
  // Paused indicator
  if (gameState.gamePhase === "PAUSED") {
    p.textAlign(p.RIGHT, p.TOP);
    p.fill(255, 255, 0);
    p.textSize(14);
    p.text("PAUSED", CANVAS_WIDTH - 10, 60);
  }
  
  p.pop();
}

export function renderStartScreen(p) {
  p.background(20, 30, 50);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  
  // Title
  p.textSize(48);
  p.text("TERRAIN SCRAMBLE", CANVAS_WIDTH / 2, 80);
  
  // Description
  p.textSize(14);
  p.fill(200);
  p.text("Navigate treacherous terrain in your physics vehicle!", CANVAS_WIDTH / 2, 140);
  p.text("Collect fuel, perform flips, and reach the goal!", CANVAS_WIDTH / 2, 165);
  
  // Instructions
  p.textSize(16);
  p.fill(255, 255, 100);
  p.text("Controls:", CANVAS_WIDTH / 2, 210);
  
  p.textSize(14);
  p.fill(200);
  p.text("Arrow Right - Accelerate", CANVAS_WIDTH / 2, 235);
  p.text("Arrow Left - Brake / Reverse", CANVAS_WIDTH / 2, 255);
  p.text("ESC - Pause", CANVAS_WIDTH / 2, 275);
  p.text("R - Restart", CANVAS_WIDTH / 2, 295);
  
  // High score
  p.textSize(16);
  p.fill(255, 200, 100);
  p.text(`High Score: ${gameState.highScore}`, CANVAS_WIDTH / 2, 330);
  
  // Start prompt
  p.textSize(20);
  p.fill(100, 255, 100);
  const pulse = (Math.sin(p.frameCount * 0.1) + 1) / 2;
  p.fill(100, 255 * pulse + 100, 100);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
}

export function renderGameOver(p) {
  p.push();
  
  // Semi-transparent overlay
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  
  if (gameState.gamePhase === "GAME_OVER_WIN") {
    p.textSize(48);
    p.fill(100, 255, 100);
    p.text("YOU WIN!", CANVAS_WIDTH / 2, 120);
    
    p.textSize(24);
    p.fill(255);
    p.text("All Levels Complete!", CANVAS_WIDTH / 2, 170);
  } else {
    p.textSize(48);
    p.fill(255, 100, 100);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 120);
    
    p.textSize(20);
    p.fill(255, 200, 100);
    p.text(gameState.loseReason || "Try Again!", CANVAS_WIDTH / 2, 170);
  }
  
  p.textSize(24);
  p.fill(255);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  p.text(`High Score: ${gameState.highScore}`, CANVAS_WIDTH / 2, 250);
  
  p.textSize(18);
  p.fill(200);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 310);
  
  p.pop();
}

export function renderLevelComplete(p) {
  p.push();
  
  // Semi-transparent overlay
  p.fill(0, 0, 0, 100);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  
  p.textSize(36);
  p.fill(100, 255, 100);
  p.text(`LEVEL ${gameState.currentLevel} COMPLETE!`, CANVAS_WIDTH / 2, 180);
  
  p.textSize(20);
  p.fill(255);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  
  if (gameState.currentLevel < LEVELS.length) {
    p.textSize(16);
    p.fill(200);
    p.text("Loading next level...", CANVAS_WIDTH / 2, 260);
  }
  
  p.pop();
}