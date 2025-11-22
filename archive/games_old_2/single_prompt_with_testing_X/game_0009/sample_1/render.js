// render.js - Rendering functions

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  DROP_ZONE_Y,
  BALL_RADIUS,
  LEVELS,
  BALL_SKINS,
  THEMES
} from './globals.js';

import { getRequiredKnockdowns } from './level.js';

export function renderStartScreen(p) {
  const theme = THEMES[gameState.selectedThemeIndex];
  p.background(theme.bg[0], theme.bg[1], theme.bg[2]);
  
  // Title
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text("SPILL IT!", CANVAS_WIDTH / 2, 80);
  
  // Instructions
  p.textSize(16);
  p.textStyle(p.NORMAL);
  p.fill(255, 255, 255, 220);
  p.text("Drop balls to knock over glasses!", CANVAS_WIDTH / 2, 140);
  p.text("You need to topple at least 80% of the glasses", CANVAS_WIDTH / 2, 165);
  p.text("to complete each level!", CANVAS_WIDTH / 2, 185);
  
  // Controls
  p.textSize(14);
  p.fill(255, 255, 255, 200);
  p.text("← → or A/D: Move drop position", CANVAS_WIDTH / 2, 230);
  p.text("SPACE: Drop ball", CANVAS_WIDTH / 2, 250);
  p.text("ESC: Pause", CANVAS_WIDTH / 2, 270);
  
  // Level and unlocks
  p.textSize(16);
  p.fill(255, 255, 100);
  p.text(`Current Level: ${gameState.currentLevel + 1}`, CANVAS_WIDTH / 2, 310);
  p.fill(150, 255, 150);
  p.text(`Levels Completed: ${gameState.levelsCompleted}`, CANVAS_WIDTH / 2, 330);
  
  // Start prompt
  p.textSize(20);
  p.fill(255);
  const blinkAlpha = Math.abs(Math.sin(p.frameCount * 0.05)) * 255;
  p.fill(255, 255, 255, blinkAlpha);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
}

export function renderGame(p) {
  const theme = THEMES[gameState.selectedThemeIndex];
  p.background(theme.bg[0], theme.bg[1], theme.bg[2]);
  
  // Drop zone indicator line
  p.stroke(255, 255, 255, 100);
  p.strokeWeight(2);
  p.line(0, DROP_ZONE_Y, CANVAS_WIDTH, DROP_ZONE_Y);
  
  // Current drop position indicator
  p.noStroke();
  p.fill(255, 255, 255, 150);
  p.circle(gameState.dropX, DROP_ZONE_Y, BALL_RADIUS * 2);
  p.fill(255, 255, 255, 80);
  p.circle(gameState.dropX, DROP_ZONE_Y, BALL_RADIUS * 2.5);
  
  // Render all entities
  gameState.entities.forEach(entity => {
    if (entity.render) {
      entity.render();
    }
  });
  
  // UI
  renderUI(p);
}

function renderUI(p) {
  // Top bar background
  p.noStroke();
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, 60);
  
  // Level info
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(18);
  p.text(`Level ${gameState.currentLevel + 1}`, 10, 10);
  
  // Balls remaining
  p.textSize(16);
  p.text(`Balls: ${gameState.ballsRemaining}`, 10, 35);
  
  // Visual balls
  for (let i = 0; i < gameState.ballsRemaining; i++) {
    const skin = BALL_SKINS[gameState.selectedSkinIndex];
    p.fill(skin.color[0], skin.color[1], skin.color[2]);
    p.circle(80 + i * 25, 43, 16);
  }
  
  // Glasses knocked over
  p.textAlign(p.RIGHT, p.TOP);
  const required = getRequiredKnockdowns();
  const progressColor = gameState.glassesKnockedOver >= required ? [100, 255, 100] : [255, 255, 100];
  p.fill(progressColor[0], progressColor[1], progressColor[2]);
  p.text(`Glasses: ${gameState.glassesKnockedOver} / ${gameState.totalGlasses}`, CANVAS_WIDTH - 10, 10);
  p.fill(200, 200, 200);
  p.textSize(14);
  p.text(`(Need ${required})`, CANVAS_WIDTH - 10, 33);
}

export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 180);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  
  p.textSize(20);
  p.fill(255, 255, 255, 200);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

export function renderGameOver(p) {
  const theme = THEMES[gameState.selectedThemeIndex];
  p.background(theme.bg[0], theme.bg[1], theme.bg[2]);
  
  // Render game state in background
  gameState.entities.forEach(entity => {
    if (entity.render) {
      entity.render();
    }
  });
  
  // Overlay
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.textAlign(p.CENTER, p.CENTER);
  
  if (gameState.gamePhase === PHASE_GAME_OVER_WIN) {
    // Win screen
    p.fill(100, 255, 100);
    p.textSize(48);
    p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, 100);
    
    p.fill(255);
    p.textSize(24);
    p.text(`Glasses Knocked: ${gameState.glassesKnockedOver} / ${gameState.totalGlasses}`, CANVAS_WIDTH / 2, 160);
    
    // Unlocks
    const unlockedSkins = BALL_SKINS.filter(s => s.unlockLevel <= gameState.levelsCompleted);
    const unlockedThemes = THEMES.filter(t => t.unlockLevel <= gameState.levelsCompleted);
    
    if (unlockedSkins.length > gameState.selectedSkinIndex + 1 || 
        unlockedThemes.length > gameState.selectedThemeIndex + 1) {
      p.fill(255, 255, 100);
      p.textSize(20);
      p.text("New Unlocks Available!", CANVAS_WIDTH / 2, 210);
    }
    
    p.fill(255, 255, 255, 200);
    p.textSize(18);
    p.text("Press ENTER for next level", CANVAS_WIDTH / 2, 280);
    p.text("Press R to return to menu", CANVAS_WIDTH / 2, 310);
    
  } else {
    // Lose screen
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text("LEVEL FAILED", CANVAS_WIDTH / 2, 120);
    
    p.fill(255);
    p.textSize(24);
    const required = getRequiredKnockdowns();
    p.text(`Needed: ${required}`, CANVAS_WIDTH / 2, 180);
    p.text(`Got: ${gameState.glassesKnockedOver}`, CANVAS_WIDTH / 2, 210);
    
    p.fill(255, 255, 255, 200);
    p.textSize(18);
    p.text("Press ENTER to retry", CANVAS_WIDTH / 2, 280);
    p.text("Press R to return to menu", CANVAS_WIDTH / 2, 310);
  }
}