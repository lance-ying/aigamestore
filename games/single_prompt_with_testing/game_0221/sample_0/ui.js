// ui.js - UI rendering for all game screens

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 15, 30);
  
  // Ancient stone background texture
  for (let i = 0; i < 100; i++) {
    p.noStroke();
    p.fill(40 + Math.random() * 20, 30 + Math.random() * 15, 35 + Math.random() * 20, 30);
    p.circle(Math.random() * CANVAS_WIDTH, Math.random() * CANVAS_HEIGHT, Math.random() * 50);
  }
  
  // Title
  p.fill(220, 180, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(42);
  p.textStyle(p.BOLD);
  p.text("THE FORGOTTEN CITY", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 100);
  
  // Subtitle
  p.fill(180, 150, 80);
  p.textSize(16);
  p.textStyle(p.NORMAL);
  p.text("Ancient Rome - Time Loop Mystery", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
  
  // Description
  p.fill(200, 200, 220);
  p.textSize(13);
  p.text("Explore the cursed city and collect all 8 ancient tablets", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  p.text("to break the time loop and save everyone from doom", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  // Controls
  p.fill(255, 220, 150);
  p.textSize(12);
  p.text("ARROW KEYS - Move   SPACE - Interact/Talk", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  p.text("SHIFT - Sprint   Z - Reset Loop (when unlocked)", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 58);
  p.text("ESC - Pause   R - Restart from Menu", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 76);
  
  // Start prompt (pulsing)
  const alpha = 150 + Math.sin(p.frameCount * 0.1) * 100;
  p.fill(255, 255, 100, alpha);
  p.textSize(20);
  p.textStyle(p.BOLD);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 120);
}

export function renderGame(p) {
  // Background - ancient stone ground
  p.background(85, 75, 60);
  
  // Draw ground texture (visible tiles)
  p.push();
  p.noStroke();
  const tileSize = 40;
  const startX = Math.floor(gameState.cameraX / tileSize) * tileSize;
  const startY = Math.floor(gameState.cameraY / tileSize) * tileSize;
  
  for (let x = startX; x < gameState.cameraX + CANVAS_WIDTH + tileSize; x += tileSize) {
    for (let y = startY; y < gameState.cameraY + CANVAS_HEIGHT + tileSize; y += tileSize) {
      const screenX = x - gameState.cameraX;
      const screenY = y - gameState.cameraY;
      
      const shade = (Math.floor(x / tileSize) + Math.floor(y / tileSize)) % 2 === 0 ? 0 : 10;
      p.fill(85 + shade, 75 + shade, 60 + shade);
      p.rect(screenX, screenY, tileSize, tileSize);
      
      // Grout lines
      p.stroke(65, 55, 40);
      p.strokeWeight(1);
      p.line(screenX, screenY, screenX + tileSize, screenY);
      p.line(screenX, screenY, screenX, screenY + tileSize);
    }
  }
  p.pop();
  
  // Render buildings (back layer)
  gameState.buildings.forEach(building => building.render(p));
  
  // Render tablets
  gameState.tablets.forEach(tablet => tablet.render(p));
  
  // Render NPCs
  gameState.npcs.forEach(npc => npc.render(p));
  
  // Render player
  if (gameState.player) {
    gameState.player.render(p);
  }
  
  // Render particles (effects on top)
  gameState.particles.forEach(particle => particle.render(p));
}

export function renderHUD(p) {
  // Semi-transparent HUD background
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 50);
  
  // Tablets collected
  p.fill(255, 215, 0);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(16);
  p.text(`Tablets: ${gameState.tabletsCollected}/${gameState.totalTablets}`, 10, 15);
  
  // Score
  p.fill(150, 255, 150);
  p.text(`Score: ${gameState.score}`, 10, 35);
  
  // Loop count
  if (gameState.loopCount > 0) {
    p.fill(255, 150, 150);
    p.textAlign(p.RIGHT, p.CENTER);
    p.text(`Loop: ${gameState.loopCount}`, CANVAS_WIDTH - 10, 15);
  }
  
  // Time loop unlock notification
  if (gameState.timeLoopUnlocked) {
    p.fill(255, 255, 0);
    p.textAlign(p.RIGHT, p.CENTER);
    p.textSize(12);
    p.text("Z - Reset Loop", CANVAS_WIDTH - 10, 35);
  }
  
  // Clues found indicator
  if (gameState.cluesFound.length > 0) {
    p.fill(150, 200, 255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text(`Clues Found: ${gameState.cluesFound.length}`, CANVAS_WIDTH / 2, 25);
  }
}

export function renderDialogue(p) {
  if (!gameState.activeDialogue) return;
  
  const dialogue = gameState.activeDialogue;
  const boxHeight = 100;
  const boxY = CANVAS_HEIGHT - boxHeight - 10;
  
  // Dialogue box
  p.fill(30, 20, 40, 230);
  p.stroke(200, 180, 100);
  p.strokeWeight(3);
  p.rect(10, boxY, CANVAS_WIDTH - 20, boxHeight, 5);
  
  // NPC name
  p.fill(220, 180, 100);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.textStyle(p.BOLD);
  p.text(dialogue.npc.name, 25, boxY + 10);
  
  // Dialogue text
  p.fill(255, 255, 255);
  p.textStyle(p.NORMAL);
  p.textSize(13);
  p.text(dialogue.text, 25, boxY + 35, CANVAS_WIDTH - 50, boxHeight - 45);
  
  // Continue indicator (pulsing)
  const alpha = 150 + Math.sin(p.frameCount * 0.15) * 100;
  p.fill(255, 255, 100, alpha);
  p.textAlign(p.RIGHT, p.BOTTOM);
  p.textSize(11);
  p.text("SPACE to continue", CANVAS_WIDTH - 25, boxY + boxHeight - 10);
}

export function renderPausedOverlay(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Paused text
  p.fill(255, 255, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  
  p.fill(200, 200, 200);
  p.textSize(18);
  p.textStyle(p.NORMAL);
  p.text("Press ESC to Resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
}

export function renderGameOver(p) {
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  // Overlay
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  if (isWin) {
    // Victory screen
    p.fill(255, 215, 0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.textStyle(p.BOLD);
    p.text("CURSE BROKEN!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
    
    p.fill(200, 255, 200);
    p.textSize(18);
    p.textStyle(p.NORMAL);
    p.text("You collected all 8 ancient tablets", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
    p.text("and saved the forgotten city from eternal doom!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 5);
    
    p.fill(255, 255, 255);
    p.textSize(16);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
    p.text(`Time Loops: ${gameState.loopCount}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 52);
    p.text(`Clues Discovered: ${gameState.cluesFound.length}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 74);
  } else {
    // Game over (curse triggered)
    p.fill(255, 50, 50);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.textStyle(p.BOLD);
    p.text("CURSE TRIGGERED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
    
    p.fill(255, 200, 200);
    p.textSize(18);
    p.textStyle(p.NORMAL);
    p.text("The Golden Rule was broken...", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
    p.text("Everyone perishes together.", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 15);
  }
  
  // Restart instruction
  p.fill(255, 255, 100);
  p.textSize(20);
  p.textStyle(p.BOLD);
  p.text("Press R to Restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
}