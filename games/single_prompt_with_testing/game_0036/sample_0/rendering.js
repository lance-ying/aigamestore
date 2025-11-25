// rendering.js - All rendering functions

import { gameState, GAME_PHASE, CANVAS_WIDTH, CANVAS_HEIGHT, ROOMS } from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 15, 25);
  
  // Ominous red tint
  p.fill(80, 20, 20, 30);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Title
  p.fill(200, 80, 80);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("TULPAR", CANVAS_WIDTH / 2, 60);
  
  p.fill(150, 150, 130);
  p.textSize(16);
  p.text("Perpetual Sunset", CANVAS_WIDTH / 2, 95);
  
  // Description
  p.fill(200, 200, 180);
  p.textSize(13);
  p.textAlign(p.CENTER, p.TOP);
  const desc = [
    "You are Jimmy, co-pilot of the crashed freighter Tulpar.",
    "Survive as long as possible by managing food, power, and sanity.",
    "The ship is dying. So is the crew. So are you.",
    "",
    "God is not watching."
  ];
  
  for (let i = 0; i < desc.length; i++) {
    p.text(desc[i], CANVAS_WIDTH / 2, 130 + i * 20);
  }
  
  // Instructions
  p.fill(180, 180, 160);
  p.textSize(12);
  p.textAlign(p.CENTER, p.TOP);
  const instructions = [
    "ARROW KEYS - Move through ship",
    "SPACE - Interact with objects",
    "Z - Check status",
    "ESC - Pause"
  ];
  
  for (let i = 0; i < instructions.length; i++) {
    p.text(instructions[i], CANVAS_WIDTH / 2, 260 + i * 18);
  }
  
  // Start prompt
  const flash = Math.floor(p.frameCount / 30) % 2;
  if (flash === 0) {
    p.fill(255, 200, 100);
    p.textSize(18);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
  }
}

export function renderGameOver(p) {
  p.background(10, 5, 10);
  
  // Dark vignette
  for (let i = 0; i < 50; i++) {
    const alpha = p.map(i, 0, 50, 100, 0);
    p.noFill();
    p.stroke(0, alpha);
    p.strokeWeight(2);
    p.rect(i, i, CANVAS_WIDTH - i * 2, CANVAS_HEIGHT - i * 2);
  }
  
  // Game over message
  const isWin = gameState.gamePhase === GAME_PHASE.GAME_OVER_WIN;
  
  p.fill(isWin ? 150 : 200, isWin ? 200 : 80, isWin ? 150 : 80);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(42);
  p.text(isWin ? "IMPOSSIBLE" : "EXPIRED", CANVAS_WIDTH / 2, 100);
  
  // Stats
  p.fill(200, 200, 180);
  p.textSize(16);
  p.text(`Days Survived: ${gameState.daysSurvived}`, CANVAS_WIDTH / 2, 160);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 190);
  
  // Reason
  p.fill(180, 160, 160);
  p.textSize(14);
  p.text(gameState.gameOverReason, CANVAS_WIDTH / 2, 230);
  
  // Restart prompt
  const flash = Math.floor(p.frameCount / 30) % 2;
  if (flash === 0) {
    p.fill(255, 200, 100);
    p.textSize(18);
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 320);
  }
}

export function renderShip(p) {
  p.push();
  
  // Base ship darkness
  p.fill(15, 12, 18);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Hallucination effect
  if (gameState.hallucinationIntensity > 0) {
    const tint = gameState.hallucinationIntensity * 20;
    p.fill(80, 20, 20, tint);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Flicker
    if (p.frameCount % 10 < 2) {
      p.fill(255, 0, 0, tint * 2);
      p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
  }
  
  // Draw rooms
  for (let [key, room] of Object.entries(ROOMS)) {
    const isCurrentRoom = gameState.player && gameState.player.currentRoom === key;
    
    // Room background
    p.fill(isCurrentRoom ? 35 : 25, isCurrentRoom ? 30 : 25, isCurrentRoom ? 40 : 30);
    p.rect(room.x, room.y, room.width, room.height, 5);
    
    // Room border
    p.noFill();
    p.stroke(isCurrentRoom ? 100 : 60, isCurrentRoom ? 90 : 50, isCurrentRoom ? 80 : 40);
    p.strokeWeight(2);
    p.rect(room.x, room.y, room.width, room.height, 5);
    
    // Room label
    p.fill(isCurrentRoom ? 180 : 120, isCurrentRoom ? 170 : 110, isCurrentRoom ? 150 : 100);
    p.noStroke();
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(11);
    p.text(room.name, room.x + room.width / 2, room.y + 5);
    
    // Room specific details
    if (key === "COCKPIT") {
      // Window showing perpetual sunset
      const sunsetColors = [
        [180, 80, 60],
        [150, 60, 80],
        [120, 40, 60]
      ];
      for (let i = 0; i < 3; i++) {
        p.fill(...sunsetColors[i], 100);
        p.rect(room.x + 10, room.y + 25 + i * 15, 180, 15);
      }
    } else if (key === "CARGO") {
      // Cargo boxes
      p.fill(50, 45, 40);
      p.rect(room.x + 20, room.y + 40, 30, 30);
      p.rect(room.x + 60, room.y + 40, 30, 30);
    }
  }
  
  // Corridors
  p.fill(20, 18, 25);
  p.rect(250, 0, 50, CANVAS_HEIGHT);
  p.rect(0, 200, CANVAS_WIDTH, 20);
  
  p.pop();
}

export function renderUI(p) {
  const barWidth = 150;
  const barHeight = 15;
  const startX = 10;
  let startY = 10;
  
  p.push();
  
  // Hunger bar
  p.fill(40, 40, 40);
  p.rect(startX, startY, barWidth, barHeight, 3);
  const hungerColor = gameState.hunger > 50 ? [100, 200, 100] : [200, 100, 50];
  p.fill(...hungerColor);
  p.rect(startX, startY, (gameState.hunger / 100) * barWidth, barHeight, 3);
  p.fill(255);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(10);
  p.text("HUNGER", startX + 5, startY + barHeight / 2);
  
  startY += 20;
  
  // Sanity bar
  p.fill(40, 40, 40);
  p.rect(startX, startY, barWidth, barHeight, 3);
  const sanityColor = gameState.sanity > 50 ? [100, 150, 200] : [150, 50, 150];
  p.fill(...sanityColor);
  p.rect(startX, startY, (gameState.sanity / 100) * barWidth, barHeight, 3);
  p.fill(255);
  p.text("SANITY", startX + 5, startY + barHeight / 2);
  
  startY += 20;
  
  // Power bar
  p.fill(40, 40, 40);
  p.rect(startX, startY, barWidth, barHeight, 3);
  const powerColor = gameState.power > 50 ? [200, 200, 100] : [200, 50, 50];
  p.fill(...powerColor);
  p.rect(startX, startY, (gameState.power / 100) * barWidth, barHeight, 3);
  p.fill(255);
  p.text("POWER", startX + 5, startY + barHeight / 2);
  
  // Days survived (top right)
  p.fill(200, 180, 160);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text(`DAY ${gameState.daysSurvived}`, CANVAS_WIDTH - 10, 10);
  
  // Food rations
  p.textSize(12);
  p.text(`RATIONS: ${gameState.foodRations}`, CANVAS_WIDTH - 10, 30);
  
  // Score
  p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 10, 50);
  
  // Status display
  if (gameState.showStatus) {
    const boxWidth = 200;
    const boxHeight = 120;
    const boxX = CANVAS_WIDTH / 2 - boxWidth / 2;
    const boxY = CANVAS_HEIGHT / 2 - boxHeight / 2;
    
    p.fill(20, 20, 30, 230);
    p.stroke(150, 140, 130);
    p.strokeWeight(2);
    p.rect(boxX, boxY, boxWidth, boxHeight, 5);
    
    p.noStroke();
    p.fill(200, 190, 180);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(14);
    p.text("STATUS", CANVAS_WIDTH / 2, boxY + 10);
    
    p.textSize(11);
    p.textAlign(p.LEFT, p.TOP);
    let textY = boxY + 35;
    p.text(`Health: ${Math.floor(gameState.health)}%`, boxX + 20, textY);
    textY += 18;
    p.text(`Hunger: ${Math.floor(gameState.hunger)}%`, boxX + 20, textY);
    textY += 18;
    p.text(`Sanity: ${Math.floor(gameState.sanity)}%`, boxX + 20, textY);
    textY += 18;
    p.text(`Ship Power: ${Math.floor(gameState.power)}%`, boxX + 20, textY);
  }
  
  // Paused indicator
  if (gameState.gamePhase === GAME_PHASE.PAUSED) {
    p.fill(255, 255, 255);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(14);
    p.text("PAUSED", CANVAS_WIDTH - 10, 70);
  }
  
  p.pop();
}

export function renderHallucinations(p) {
  if (gameState.hallucinationIntensity <= 0) return;
  
  p.push();
  
  // Random flashes
  if (p.random() < gameState.hallucinationIntensity / 100) {
    p.fill(255, 0, 0, 50);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }
  
  // Creepy text
  if (gameState.hallucinationTimer % 300 < 60 && gameState.sanity < 30) {
    const messages = [
      "I'm sorry",
      "It's all my fault",
      "They're watching",
      "Can't escape",
      "No rescue coming"
    ];
    const msg = messages[Math.floor(gameState.hallucinationTimer / 300) % messages.length];
    
    p.fill(200, 50, 50, 150);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(24);
    p.text(msg, CANVAS_WIDTH / 2 + p.random(-5, 5), CANVAS_HEIGHT / 2 + p.random(-5, 5));
  }
  
  p.pop();
}