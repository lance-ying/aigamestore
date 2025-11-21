// rendering.js - All rendering functions

import { CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_HEIGHT, gameState } from './globals.js';

export function drawStartScreen(p) {
  p.background(135, 206, 235);
  
  // Clouds
  drawClouds(p);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  
  // Title
  p.textSize(48);
  p.fill(255, 200, 50);
  p.stroke(200, 150, 30);
  p.strokeWeight(4);
  p.text("SQUARE BIRD", CANVAS_WIDTH / 2, 60);
  
  // Subtitle
  p.textSize(20);
  p.noStroke();
  p.fill(255, 150, 50);
  p.text("Flappy Chicken Edition", CANVAS_WIDTH / 2, 100);
  
  // Instructions
  p.textSize(16);
  p.fill(50);
  p.textAlign(p.CENTER, p.TOP);
  const instructions = [
    "Guide your square bird through obstacles!",
    "",
    "Press SPACE to lay eggs and jump",
    "Stack eggs to clear tall barriers and gaps",
    "",
    "Land perfectly on ground 3 times for FEVER MODE:",
    "Invulnerability + Bonus Points!",
    "",
    "Collect feathers for currency",
    "Survive as long as possible!"
  ];
  
  let y = 140;
  for (let line of instructions) {
    p.text(line, CANVAS_WIDTH / 2, y);
    y += 20;
  }
  
  // Start prompt
  p.textSize(24);
  p.fill(255, 200, 50);
  const pulse = p.sin(p.frameCount * 0.1) * 30 + 225;
  p.fill(pulse, 200, 50);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  
  drawGround(p);
}

export function drawPlayingScreen(p) {
  // Sky background
  const skyGradient = gameState.feverMode ? [255, 150, 255] : [135, 206, 235];
  p.background(...skyGradient);
  
  // Clouds
  drawClouds(p);
  
  // Draw entities
  for (let egg of gameState.eggs) {
    egg.draw();
  }
  
  for (let obstacle of gameState.obstacles) {
    obstacle.draw();
  }
  
  for (let feather of gameState.feathers) {
    feather.draw();
  }
  
  gameState.player.draw();
  
  drawGround(p);
  
  // UI
  drawUI(p);
}

export function drawPausedScreen(p) {
  drawPlayingScreen(p);
  
  // Pause overlay
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(20);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

export function drawGameOverScreen(p) {
  p.background(50, 50, 70);
  
  p.textAlign(p.CENTER, p.CENTER);
  
  // Game Over message
  p.textSize(48);
  if (gameState.gamePhase === "GAME_OVER_WIN") {
    p.fill(100, 255, 100);
    p.text("YOU WON!", CANVAS_WIDTH / 2, 100);
  } else {
    p.fill(255, 100, 100);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 100);
  }
  
  // Stats
  p.textSize(24);
  p.fill(255);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 160);
  p.text(`Distance: ${Math.floor(gameState.distance)}`, CANVAS_WIDTH / 2, 190);
  p.text(`Feathers: ${gameState.featherCount}`, CANVAS_WIDTH / 2, 220);
  
  // Restart prompt
  p.textSize(20);
  const pulse = p.sin(p.frameCount * 0.1) * 30 + 225;
  p.fill(pulse, pulse, 255);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 60);
}

function drawGround(p) {
  // Grass
  p.fill(50, 150, 50);
  p.noStroke();
  p.rect(0, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, GROUND_HEIGHT);
  
  // Grass blades
  p.stroke(40, 130, 40);
  p.strokeWeight(2);
  for (let i = 0; i < CANVAS_WIDTH; i += 15) {
    const offset = p.sin(i * 0.5 + p.frameCount * 0.05) * 3;
    p.line(i, CANVAS_HEIGHT - GROUND_HEIGHT, i + offset, CANVAS_HEIGHT - GROUND_HEIGHT - 10);
  }
  
  // Dirt
  p.fill(100, 70, 40);
  p.noStroke();
  p.rect(0, CANVAS_HEIGHT - GROUND_HEIGHT + 10, CANVAS_WIDTH, GROUND_HEIGHT - 10);
}

function drawClouds(p) {
  p.noStroke();
  const cloudPositions = [
    { x: 100, y: 50, size: 40 },
    { x: 300, y: 80, size: 50 },
    { x: 500, y: 60, size: 35 }
  ];
  
  for (let cloud of cloudPositions) {
    const offset = (p.frameCount * 0.2 + cloud.x) % (CANVAS_WIDTH + 100);
    p.fill(255, 255, 255, 180);
    p.ellipse(offset, cloud.y, cloud.size, cloud.size * 0.6);
    p.ellipse(offset + cloud.size * 0.4, cloud.y, cloud.size * 0.8, cloud.size * 0.5);
    p.ellipse(offset - cloud.size * 0.4, cloud.y, cloud.size * 0.7, cloud.size * 0.5);
  }
}

function drawUI(p) {
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.fill(255);
  p.stroke(0);
  p.strokeWeight(3);
  
  // Score
  p.text(`Score: ${gameState.score}`, 10, 10);
  p.text(`Distance: ${Math.floor(gameState.distance)}`, 10, 30);
  p.text(`Feathers: ${gameState.featherCount}`, 10, 50);
  
  // Fever mode indicator
  if (gameState.feverMode) {
    p.textSize(20);
    p.fill(255, 100, 255);
    p.text(`FEVER MODE! ${Math.ceil(gameState.feverTimer / 60)}s`, 10, 80);
  }
  
  // Perfect landing counter
  if (gameState.perfectLandings > 0 && !gameState.feverMode) {
    p.textSize(14);
    p.fill(100, 255, 100);
    p.text(`Perfect Landings: ${gameState.perfectLandings}/3`, 10, gameState.feverMode ? 110 : 80);
  }
  
  // Egg count
  p.textSize(14);
  p.fill(240, 230, 200);
  p.text(`Eggs: ${gameState.player.eggCount}`, 10, 70);
}