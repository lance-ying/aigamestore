import { gameState, GAME_PHASES, PLACEMENT_STATE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
  p.background(30, 30, 50);
  
  // Title
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("CANNON SHOT!", CANVAS_WIDTH/2, 80);
  
  // Subtitle
  p.fill(255, 255, 255);
  p.textSize(18);
  p.text("Physics Puzzle Game", CANVAS_WIDTH/2, 130);
  
  // Instructions
  p.fill(200, 200, 200);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    "Guide balls into colored buckets!",
    "",
    "PLACEMENT MODE:",
    "  Arrow Keys - Move object",
    "  Z/X - Rotate object",
    "  A/D - Switch object",
    "  SPACE - Place object",
    "",
    "FIRING MODE:",
    "  SPACE - Fire cannon / Reset",
    "",
    "Complete levels to unlock new cannons!"
  ];
  
  let y = 170;
  instructions.forEach(line => {
    p.text(line, 100, y);
    y += 20;
  });
  
  // Press Enter prompt
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  const flash = Math.sin(p.frameCount * 0.1) * 0.5 + 0.5;
  p.fill(255, 255, 100, 200 + flash * 55);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, 370);
}

export function renderGame(p) {
  // Background
  p.background(220, 240, 255);
  
  // Ground
  p.fill(160, 200, 120);
  p.noStroke();
  p.rect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 50);
  
  // Render buckets
  gameState.buckets.forEach(bucket => bucket.render());
  
  // Render obstacles
  gameState.entities.forEach(entity => {
    if (entity.render) entity.render();
  });
  
  // Render placed objects
  gameState.placedObjects.forEach(obj => obj.render(false));
  
  // Render available objects (being placed)
  gameState.availableObjects.forEach((obj, idx) => {
    obj.render(idx === gameState.selectedObjectIndex);
  });
  
  // Render balls
  gameState.balls.forEach(ball => ball.render());
  
  // Render cannon
  if (gameState.cannon) {
    gameState.cannon.render();
  }
  
  // UI
  renderUI(p);
}

function renderUI(p) {
  // Level info
  p.fill(0);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(18);
  p.text(`Level ${gameState.currentLevel}`, 10, 10);
  
  // Ball count
  p.text(`Balls: ${gameState.ballsFired}/${gameState.ballsToFire}`, 10, 35);
  
  // Instructions based on state
  p.textSize(14);
  p.fill(50);
  
  if (gameState.placementState === PLACEMENT_STATE.PLACING) {
    p.textAlign(p.CENTER, p.TOP);
    p.text("Place objects with SPACE | Move: Arrows | Rotate: Z/X | Switch: A/D", CANVAS_WIDTH/2, 60);
    
    // Show selected object
    if (gameState.availableObjects.length > 0) {
      const current = gameState.availableObjects[gameState.selectedObjectIndex];
      p.text(`Selected: ${current.type} (${gameState.selectedObjectIndex + 1}/${gameState.availableObjects.length})`, CANVAS_WIDTH/2, 80);
    }
  } else if (gameState.placementState === PLACEMENT_STATE.READY) {
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(100, 255, 100);
    p.textSize(20);
    p.text("PRESS SPACE TO FIRE!", CANVAS_WIDTH/2, 70);
  } else if (gameState.placementState === PLACEMENT_STATE.FIRING) {
    p.textAlign(p.CENTER, p.TOP);
    p.text("Firing...", CANVAS_WIDTH/2, 70);
  }
  
  // Level complete message
  if (gameState.levelComplete) {
    p.push();
    p.fill(0, 200, 0, 200);
    p.noStroke();
    p.rect(CANVAS_WIDTH/2 - 150, CANVAS_HEIGHT/2 - 60, 300, 120);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(32);
    p.text("LEVEL COMPLETE!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    
    p.textSize(16);
    p.text("Press SPACE to continue", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    p.pop();
  }
}

export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
  
  p.textSize(20);
  p.text("Press ESC to resume", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 50);
}

export function renderGameOver(p) {
  p.background(30, 30, 50);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    p.fill(100, 255, 100);
    p.text("VICTORY!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 60);
    
    p.fill(255);
    p.textSize(24);
    p.text(`Completed Level ${gameState.currentLevel}!`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 10);
  } else {
    p.fill(255, 100, 100);
    p.text("GAME OVER", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 60);
  }
  
  p.fill(200);
  p.textSize(20);
  p.text("Press R to restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
}