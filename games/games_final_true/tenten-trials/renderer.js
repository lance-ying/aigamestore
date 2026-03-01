// renderer.js - Rendering functions
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, HIT_ZONE } from './globals.js';
import { getCurrentLevelConfig } from './levelManager.js';

export function drawGame(p) {
  // Background
  p.background(30, 30, 40);
  
  if (gameState.gamePhase === GAME_PHASES.START) {
    drawStartScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    drawPlayingScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    drawPlayingScreen(p);
    drawPausedOverlay(p);
  } else if (gameState.gamePhase === GAME_PHASES.LEVEL_TRANSITION) {
    drawLevelTransition(p);
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    drawGameOverScreen(p, true);
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    drawGameOverScreen(p, false);
  }
}

function drawStartScreen(p) {
  p.textAlign(p.CENTER, p.CENTER);
  
  // Replaced title with "press enter to begin" as per feedback
  p.fill(255, 255, 0);
  p.textSize(48);
  p.text("press enter to begin", CANVAS_WIDTH / 2, 80);
  
  // Description (preserved as it doesn't contain game name)
  p.fill(200);
  p.textSize(16);
  p.text("Match falling symbols with the correct key", CANVAS_WIDTH / 2, 140);
  p.text("when they reach the hit zone at the bottom", CANVAS_WIDTH / 2, 160);
  
  // High Score (preserved as it doesn't contain game name)
  p.fill(255, 215, 0);
  p.textSize(20);
  p.text(`HIGH SCORE: ${gameState.highScore}`, CANVAS_WIDTH / 2, 200);
  
  // Key mappings (preserved as they don't contain game name)
  p.fill(150);
  p.textSize(14);
  p.text("KEY MAPPINGS:", CANVAS_WIDTH / 2, 240);
  
  p.fill(255, 0, 0);
  p.text("A = CIRCLE", 150, 270);
  p.fill(0, 0, 255);
  p.text("S = SQUARE", 150, 290);
  p.fill(0, 255, 0);
  p.text("D = TRIANGLE", 450, 270);
  p.fill(255, 255, 0);
  p.text("W = STAR", 450, 290);
  
  // Instructions (preserved as they don't contain game name)
  p.fill(200);
  p.textSize(16);
  p.text("Complete 15 matches per level", CANVAS_WIDTH / 2, 330);
  p.text("Watch your miss limit!", CANVAS_WIDTH / 2, 350);
  
  // Removed "PRESS ENTER TO START" prompt as the main title now serves this purpose.
}

function drawPlayingScreen(p) {
  // Draw hit zone
  p.fill(100, 100, 100, 100);
  p.noStroke();
  p.rect(0, HIT_ZONE.y, CANVAS_WIDTH, HIT_ZONE.height);
  
  // Draw hit zone border
  p.stroke(150, 150, 150);
  p.strokeWeight(2);
  p.noFill();
  p.rect(0, HIT_ZONE.y, CANVAS_WIDTH, HIT_ZONE.height);
  
  // Draw key hints in hit zone
  p.textAlign(p.CENTER, p.CENTER);
  p.noStroke();
  const hintY = HIT_ZONE.y + HIT_ZONE.height / 2;
  
  p.fill(255, 0, 0, 100);
  p.textSize(14);
  p.text("A", 100, hintY);
  
  p.fill(0, 0, 255, 100);
  p.text("S", 220, hintY);
  
  p.fill(0, 255, 0, 100);
  p.text("D", 380, hintY);
  
  p.fill(255, 255, 0, 100);
  p.text("W", 500, hintY);
  
  // Draw symbols
  for (const symbol of gameState.entities) {
    if (symbol.active) {
      symbol.draw();
    }
  }
  
  // Draw feedback effect
  if (gameState.feedbackEffect) {
    if (gameState.feedbackEffect.type === 'correct') {
      p.fill(255, 255, 255, gameState.feedbackEffect.timer * 15);
      p.rect(0, HIT_ZONE.y, CANVAS_WIDTH, HIT_ZONE.height);
    } else if (gameState.feedbackEffect.type === 'miss') {
      p.stroke(255, 0, 0);
      p.strokeWeight(4);
      p.noFill();
      p.rect(5, HIT_ZONE.y + 5, CANVAS_WIDTH - 10, HIT_ZONE.height - 10);
    }
  }
  
  // Draw UI
  drawUI(p);
}

function drawUI(p) {
  const config = getCurrentLevelConfig();
  
  // Level
  p.textAlign(p.LEFT, p.TOP);
  p.fill(255);
  p.noStroke();
  p.textSize(24);
  p.text(`LEVEL: ${gameState.currentLevel + 1}`, 10, 10);
  
  // Misses
  p.fill(255, 0, 0);
  p.textSize(20);
  p.text(`MISSES: ${gameState.misses}/${config.missLimit}`, 10, 40);
  
  // Score
  p.textAlign(p.RIGHT, p.TOP);
  p.fill(255);
  p.textSize(24);
  p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
  
  // Progress
  p.fill(200);
  p.textSize(18);
  p.text(`${gameState.correctMatches}/${config.targetMatches}`, CANVAS_WIDTH - 10, 40);
  
  // Combo
  if (gameState.combo >= 3) {
    p.textAlign(p.CENTER, p.TOP);
    p.fill(255, 215, 0);
    p.textSize(20);
    p.text(`COMBO x${gameState.combo}!`, CANVAS_WIDTH / 2, 10);
  }
}

function drawPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(255);
  p.textSize(32);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  
  p.textSize(18);
  p.text("PRESS ESC TO RESUME", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  
  // Small paused indicator
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 70);
}

function drawLevelTransition(p) {
  p.background(30, 30, 40);
  
  p.textAlign(p.CENTER, p.CENTER);
  
  // Level complete message
  p.fill(0, 255, 0);
  p.textSize(36);
  p.text(`LEVEL ${gameState.currentLevel + 1} COMPLETE!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  
  // Next level message
  p.fill(255, 255, 0);
  p.textSize(28);
  p.text(`PREPARE FOR LEVEL ${gameState.currentLevel + 2}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  
  // Current score
  p.fill(200);
  p.textSize(20);
  p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
}

function drawGameOverScreen(p, isWin) {
  p.textAlign(p.CENTER, p.CENTER);
  
  if (isWin) {
    p.fill(0, 255, 0);
    p.textSize(40);
    p.text("CONGRATULATIONS!", CANVAS_WIDTH / 2, 80);
    
    p.fill(255, 255, 0);
    p.textSize(28);
    p.text("YOU CLEARED ALL LEVELS!", CANVAS_WIDTH / 2, 130);
  } else {
    p.fill(255, 0, 0);
    p.textSize(48);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 100);
  }
  
  // Final score
  p.fill(255);
  p.textSize(32);
  p.text(`FINAL SCORE: ${gameState.score}`, CANVAS_WIDTH / 2, 200);
  
  // High score
  p.fill(255, 215, 0);
  p.textSize(24);
  if (gameState.score > gameState.highScore) {
    p.text("NEW HIGH SCORE!", CANVAS_WIDTH / 2, 240);
  } else {
    p.text(`HIGH SCORE: ${gameState.highScore}`, CANVAS_WIDTH / 2, 240);
  }
  
  // Restart prompt
  p.fill(200);
  p.textSize(20);
  const flash = p.frameCount % 60 < 30;
  if (flash) {
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 320);
  }
}