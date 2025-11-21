// rendering.js - Rendering functions

import { 
  gameState, 
  PHASE_START, 
  PHASE_PLAYING, 
  PHASE_PAUSED, 
  PHASE_GAME_OVER_WIN, 
  PHASE_GAME_OVER_LOSE,
  MODE_SALLY,
  MODE_FATHER,
  MODE_TRANSITION,
  CANVAS_WIDTH,
  CANVAS_HEIGHT
} from './globals.js';

export function renderStartScreen(p) {
  p.background(30, 20, 40);
  
  // Title with glow effect
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  // Glow
  p.fill(150, 100, 200, 50);
  p.textSize(48);
  p.text("SALLY'S LAW", CANVAS_WIDTH / 2 + 2, 80 + 2);
  
  // Main title
  p.fill(200, 150, 255);
  p.textSize(48);
  p.text("SALLY'S LAW", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(180, 180, 200);
  p.textSize(16);
  p.text("A Two-Phase Puzzle Platformer", CANVAS_WIDTH / 2, 120);
  
  // Instructions box
  p.fill(40, 30, 50, 200);
  p.rect(50, 160, CANVAS_WIDTH - 100, 180);
  
  p.fill(220, 220, 240);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  
  let y = 175;
  p.text("THE STORY:", 70, y);
  y += 20;
  p.textSize(12);
  p.text("Sally experiences miraculous luck as obstacles disappear", 70, y);
  y += 15;
  p.text("and paths open just in time. But it's not luck—it's love.", 70, y);
  y += 25;
  
  p.textSize(14);
  p.text("HOW TO PLAY:", 70, y);
  y += 20;
  p.textSize(12);
  p.text("PHASE 1 - Control Sally:", 70, y);
  y += 15;
  p.text("  • Sally runs forward automatically", 90, y);
  y += 15;
  p.text("  • SPACE: Jump over obstacles", 90, y);
  y += 20;
  
  p.text("PHASE 2 - Control Father (Spirit):", 70, y);
  y += 15;
  p.text("  • ARROW KEYS: Select objects", 90, y);
  y += 15;
  p.text("  • SPACE: Activate switches/platforms", 90, y);
  y += 15;
  p.text("  • Z: Fast forward time", 90, y);
  y += 15;
  p.text("  • Create the miracles Sally experienced!", 90, y);
  
  // Start prompt
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(255, 255, 150);
  p.textSize(18);
  const blinkAlpha = 150 + Math.sin(p.frameCount * 0.1) * 100;
  p.fill(255, 255, 150, blinkAlpha);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
  
  p.pop();
}

export function renderPlayingScreen(p, sally, platforms, hazards, goal, interactableObjects) {
  // Sky gradient background
  for (let i = 0; i < CANVAS_HEIGHT; i++) {
    const inter = i / CANVAS_HEIGHT;
    const c = p.lerpColor(p.color(100, 150, 200), p.color(180, 200, 220), inter);
    p.stroke(c);
    p.line(0, i, CANVAS_WIDTH, i);
  }
  
  // Render game objects
  goal.render();
  
  for (let hazard of hazards) {
    hazard.render();
  }
  
  for (let i = 0; i < platforms.length; i++) {
    const selected = gameState.playMode === MODE_FATHER && 
                    gameState.selectedObjectIndex === i && 
                    platforms[i].movable;
    platforms[i].render(selected);
  }
  
  // Render interactable objects
  for (let i = 0; i < interactableObjects.length; i++) {
    const objIndex = platforms.length + i;
    const selected = gameState.playMode === MODE_FATHER && 
                    gameState.selectedObjectIndex === objIndex;
    interactableObjects[i].render(selected);
  }
  
  // Render Sally
  if (sally) {
    sally.render();
  }
  
  // UI overlay
  renderUI(p);
}

export function renderUI(p) {
  p.push();
  
  // Mode indicator
  p.fill(40, 40, 60, 200);
  p.rect(10, 10, 200, 80);
  
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  
  if (gameState.playMode === MODE_SALLY) {
    p.fill(255, 180, 200);
    p.text("PHASE 1: SALLY", 20, 20);
    p.fill(200);
    p.textSize(11);
    p.text("Watch her miraculous journey", 20, 40);
    p.text("SPACE: Jump", 20, 55);
  } else if (gameState.playMode === MODE_FATHER) {
    p.fill(150, 200, 255);
    p.text("PHASE 2: FATHER", 20, 20);
    p.fill(200);
    p.textSize(11);
    p.text("Create the miracles!", 20, 40);
    p.text("ARROWS: Select  SPACE: Activate", 20, 55);
    p.text("Z: Fast forward", 20, 70);
  }
  
  // Level info
  p.fill(40, 40, 60, 200);
  p.rect(CANVAS_WIDTH - 110, 10, 100, 40);
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text(`Level ${gameState.currentLevel + 1}`, CANVAS_WIDTH - 20, 20);
  
  // Pause indicator
  if (gameState.gamePhase === PHASE_PAUSED) {
    p.fill(0, 0, 0, 100);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.fill(255, 255, 255);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }
  
  p.pop();
}

export function renderTransitionScreen(p) {
  p.background(30, 20, 40);
  
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  if (gameState.playMode === MODE_TRANSITION) {
    if (gameState.transitionTimer < 60) {
      // Sally completed phase 1
      p.fill(255, 180, 200);
      p.textSize(32);
      p.text("Sally Made It!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
      
      p.fill(200);
      p.textSize(16);
      p.text("But how...?", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    } else {
      // Transitioning to father phase
      p.fill(150, 200, 255);
      p.textSize(32);
      p.text("Father's Turn", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
      
      p.fill(200);
      p.textSize(16);
      p.text("Create the miracles Sally experienced", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }
  }
  
  p.pop();
}

export function renderGameOverScreen(p) {
  p.background(30, 20, 40);
  
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  if (gameState.gamePhase === PHASE_GAME_OVER_WIN) {
    // Victory screen
    p.fill(255, 215, 0);
    p.textSize(48);
    p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
    
    p.fill(200, 255, 200);
    p.textSize(20);
    p.text("Sally's father's love guides her path", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
    
    p.fill(180);
    p.textSize(16);
    p.text(`Level ${gameState.currentLevel + 1} Completed`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
    
  } else {
    // Game over screen
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text("TRY AGAIN", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
    
    p.fill(200);
    p.textSize(18);
    
    if (gameState.playMode === MODE_SALLY) {
      p.text("Sally couldn't make it through", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
    } else {
      p.text("The timing wasn't right", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
    }
  }
  
  // Restart prompt
  p.fill(255, 255, 150);
  p.textSize(18);
  const blinkAlpha = 150 + Math.sin(p.frameCount * 0.1) * 100;
  p.fill(255, 255, 150, blinkAlpha);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
  
  p.pop();
}