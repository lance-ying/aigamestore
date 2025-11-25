// ui.js - UI rendering functions

import { gameState, GAME_PHASES, FISH_TYPES, ROD_UPGRADES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function drawStartScreen(p) {
  p.background(40, 80, 120);
  
  // Animated water background
  for (let i = 0; i < 5; i++) {
    p.fill(60, 120, 180, 50);
    p.noStroke();
    const y = 150 + i * 60 + p.sin(p.frameCount * 0.05 + i) * 20;
    p.ellipse(CANVAS_WIDTH / 2, y, 400, 80);
  }
  
  // Title
  p.fill(255, 255, 255);
  p.stroke(80, 150, 200);
  p.strokeWeight(4);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("WEBFISHING", CANVAS_WIDTH / 2, 60);
  
  // Subtitle
  p.noStroke();
  p.fill(200, 230, 255);
  p.textSize(18);
  p.text("Relax and Fish!", CANVAS_WIDTH / 2, 110);
  
  // Instructions
  p.fill(255, 255, 255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.CENTER);
  
  const instructions = [
    "OBJECTIVE:",
    "- Catch all 10 fish species to complete your journal!",
    "- Earn money and upgrade your fishing rod",
    "",
    "CONTROLS:",
    "Arrow Keys - Move around",
    "Space - Cast line / Reel in when fish bites",
    "Shift - Sprint",
    "Z - Open/Close shop",
    "",
    "TIPS:",
    "- Stand near water to cast your line",
    "- Watch for the ! when fish bites",
    "- Better rods unlock rarer fish"
  ];
  
  let yPos = 160;
  for (let line of instructions) {
    if (line.startsWith("OBJECTIVE:") || line.startsWith("CONTROLS:") || line.startsWith("TIPS:")) {
      p.fill(255, 220, 100);
      p.textSize(16);
    } else if (line.startsWith("-")) {
      p.fill(220, 220, 220);
      p.textSize(12);
    } else {
      p.fill(200, 200, 200);
      p.textSize(12);
    }
    p.text(line, 50, yPos);
    yPos += line === "" ? 8 : 18;
  }
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textSize(20);
  p.textAlign(p.CENTER, p.CENTER);
  const alpha = 150 + Math.sin(p.frameCount * 0.1) * 105;
  p.fill(255, 255, 100, alpha);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
}

export function drawGameOverScreen(p) {
  p.background(40, 40, 60, 230);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Title
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.stroke(isWin ? [50, 200, 50] : [200, 50, 50]);
  p.strokeWeight(3);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "CONGRATULATIONS!" : "GAME OVER", CANVAS_WIDTH / 2, 80);
  
  // Message
  p.noStroke();
  p.fill(255, 255, 255);
  p.textSize(20);
  if (isWin) {
    p.text("You completed the Fish Journal!", CANVAS_WIDTH / 2, 140);
  } else {
    p.text("Better luck next time!", CANVAS_WIDTH / 2, 140);
  }
  
  // Stats
  p.textSize(16);
  p.textAlign(p.LEFT, p.CENTER);
  const stats = [
    `Fish Caught: ${gameState.totalFishCaught}`,
    `Species Discovered: ${gameState.fishJournal.size}/${FISH_TYPES.length}`,
    `Money Earned: $${gameState.money}`,
    `Final Score: ${gameState.score}`,
    `Rod Level: ${ROD_UPGRADES[gameState.rodLevel].name}`
  ];
  
  let yPos = 190;
  for (let stat of stats) {
    p.text(stat, 180, yPos);
    yPos += 25;
  }
  
  // Restart prompt
  p.fill(255, 255, 100);
  p.textSize(18);
  p.textAlign(p.CENTER, p.CENTER);
  const alpha = 150 + Math.sin(p.frameCount * 0.1) * 105;
  p.fill(255, 255, 100, alpha);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}

export function drawUI(p) {
  // Top bar background
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 30);
  
  // Money
  p.fill(255, 215, 0);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(14);
  p.text(`💰 $${gameState.money}`, 10, 15);
  
  // Fish count
  p.fill(100, 200, 255);
  p.text(`🐟 ${gameState.totalFishCaught}`, 120, 15);
  
  // Journal progress
  p.fill(150, 255, 150);
  p.text(`📖 ${gameState.fishJournal.size}/${FISH_TYPES.length}`, 200, 15);
  
  // Rod level
  p.fill(200, 200, 200);
  p.textAlign(p.RIGHT, p.CENTER);
  p.text(`${ROD_UPGRADES[gameState.rodLevel].name}`, CANVAS_WIDTH - 10, 15);
  
  // Paused indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.fill(255, 255, 0);
    p.textSize(12);
    p.textAlign(p.RIGHT, p.TOP);
    p.text("PAUSED", CANVAS_WIDTH - 10, 35);
  }
  
  // Last catch notification
  if (gameState.lastCatch && p.frameCount < gameState.lastCatch.displayUntil) {
    p.push();
    p.fill(0, 0, 0, 200);
    p.rect(CANVAS_WIDTH / 2 - 120, 50, 240, 60);
    
    p.fill(...gameState.lastCatch.color);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16);
    p.text(`Caught: ${gameState.lastCatch.name}!`, CANVAS_WIDTH / 2, 65);
    
    p.fill(255, 215, 0);
    p.textSize(14);
    p.text(`+$${gameState.lastCatch.value}`, CANVAS_WIDTH / 2, 88);
    p.pop();
  }
  
  // Shop prompt when Z can be pressed
  if (!gameState.shopOpen && !gameState.fishingLine) {
    p.fill(200, 200, 200, 150);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(11);
    p.text("Press Z to open Shop", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 15);
  }
}

export function drawShop(p) {
  // Shop background
  p.fill(0, 0, 0, 230);
  p.rect(50, 50, CANVAS_WIDTH - 100, CANVAS_HEIGHT - 100);
  
  // Title
  p.fill(255, 215, 0);
  p.stroke(200, 170, 0);
  p.strokeWeight(2);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  p.text("🛒 FISHING SHOP", CANVAS_WIDTH / 2, 80);
  
  // Current money
  p.noStroke();
  p.fill(200, 200, 200);
  p.textSize(14);
  p.text(`Your Money: $${gameState.money}`, CANVAS_WIDTH / 2, 110);
  
  // Rod upgrades
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(12);
  let yPos = 145;
  
  for (let i = 0; i < ROD_UPGRADES.length; i++) {
    const rod = ROD_UPGRADES[i];
    const isOwned = i <= gameState.rodLevel;
    const isNext = i === gameState.rodLevel + 1;
    const canAfford = gameState.money >= rod.cost;
    
    p.push();
    p.translate(70, yPos);
    
    // Background
    if (isOwned) {
      p.fill(50, 150, 50, 100);
    } else if (isNext && canAfford) {
      p.fill(150, 150, 50, 100);
    } else {
      p.fill(60, 60, 60, 100);
    }
    p.noStroke();
    p.rect(0, -18, CANVAS_WIDTH - 140, 36);
    
    // Rod info
    if (isOwned) {
      p.fill(100, 255, 100);
      p.text("✓ OWNED", 10, 0);
    } else if (isNext) {
      p.fill(canAfford ? [255, 255, 100] : [150, 150, 150]);
      p.text(`$${rod.cost}`, 10, 0);
    } else {
      p.fill(100, 100, 100);
      p.text("LOCKED", 10, 0);
    }
    
    p.fill(255, 255, 255);
    p.text(rod.name, 90, 0);
    
    p.fill(200, 200, 200);
    p.textSize(10);
    p.text(`Range: ${rod.castRange}px | Speed: ${rod.catchSpeed.toFixed(1)}x`, 220, 0);
    
    p.pop();
    yPos += 45;
  }
  
  // Instructions
  p.fill(255, 255, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(12);
  p.text("Catch fish to earn money. Better rods unlock rarer fish!", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 70);
  
  p.fill(255, 255, 100);
  p.textSize(14);
  p.text("Press Z to close shop", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 45);
}