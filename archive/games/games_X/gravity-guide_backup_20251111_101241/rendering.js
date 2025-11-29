// rendering.js - Rendering for different game phases

import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_LEVEL_COMPLETE, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { renderLevel } from './levelManager.js';

export function render(p) {
  // Clear background
  p.background(20, 30, 40);

  switch (gameState.gamePhase) {
    case PHASE_START:
      renderStartScreen(p);
      break;
    case PHASE_PLAYING:
      renderLevel(p);
      break;
    case PHASE_PAUSED:
      renderLevel(p);
      renderPauseOverlay(p);
      break;
    case PHASE_LEVEL_COMPLETE:
      renderLevelCompleteScreen(p);
      break;
    case PHASE_GAME_OVER_WIN:
      renderGameWinScreen(p);
      break;
    case PHASE_GAME_OVER_LOSE:
      renderGameOverScreen(p);
      break;
  }
}

function renderStartScreen(p) {
  p.push();
  
  // Title
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.fill(100, 200, 255);
  p.noStroke();
  p.text('GRAVITY GUIDE', CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.textSize(16);
  p.fill(200);
  p.text('Precision Puzzle Physics', CANVAS_WIDTH / 2, 120);
  
  // Description
  p.textSize(14);
  p.fill(180);
  const descY = 160;
  p.text('Guide falling objects into the target zone', CANVAS_WIDTH / 2, descY);
  p.text('Complete 5 challenging levels', CANVAS_WIDTH / 2, descY + 25);
  p.text('Limited objects per level - catch enough to win!', CANVAS_WIDTH / 2, descY + 50);
  
  // Instructions
  p.textSize(16);
  p.fill(255, 255, 100);
  p.text('CONTROLS', CANVAS_WIDTH / 2, 250);
  
  p.textSize(14);
  p.fill(220);
  p.text('← → Arrow Keys: Move Platform', CANVAS_WIDTH / 2, 280);
  p.text('ESC: Pause/Unpause', CANVAS_WIDTH / 2, 305);
  p.text('R: Restart', CANVAS_WIDTH / 2, 330);
  
  // High Score
  if (gameState.highScore > 0) {
    p.textSize(16);
    p.fill(255, 200, 100);
    p.text(`HIGH SCORE: ${gameState.highScore}`, CANVAS_WIDTH / 2, 360);
  }
  
  // Start prompt
  p.textSize(20);
  p.fill(100, 255, 100);
  const flash = Math.sin(p.frameCount * 0.1) * 0.5 + 0.5;
  p.fill(100 + flash * 155, 255, 100 + flash * 155);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
  
  p.pop();
}

function renderPauseOverlay(p) {
  p.push();
  
  // Semi-transparent overlay
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Pause indicator
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.fill(255, 255, 100);
  p.text('PAUSED', CANVAS_WIDTH - 10, 10);
  
  // Center message
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.fill(255);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  
  p.textSize(16);
  p.fill(200);
  p.text('Press ESC to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  p.text('Press R to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 45);
  
  p.pop();
}

function renderLevelCompleteScreen(p) {
  p.push();
  
  // Background
  p.fill(20, 50, 80);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Title
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.fill(100, 255, 100);
  p.text(`LEVEL ${gameState.currentLevel} COMPLETE!`, CANVAS_WIDTH / 2, 80);
  
  // Stats
  p.textSize(18);
  p.fill(255);
  p.text(`Level Score: ${gameState.levelScore}`, CANVAS_WIDTH / 2, 150);
  p.text(`Total Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
  
  // Objectives summary
  p.textSize(16);
  p.fill(200);
  p.text(`Objects Caught: ${gameState.levelObjectives.objectsCaught}/${gameState.levelObjectives.objectsRequired}`, 
    CANVAS_WIDTH / 2, 220);
  
  // Bonuses
  const perfect = gameState.levelObjectives.objectsLost === 0;
  
  if (perfect) {
    p.fill(255, 200, 100);
    p.text('Perfect Bonus: +200', CANVAS_WIDTH / 2, 255);
  }
  
  // Next level prompt
  p.textSize(20);
  const flash = Math.sin(p.frameCount * 0.1) * 0.5 + 0.5;
  p.fill(100 + flash * 155, 255, 100 + flash * 155);
  p.text('PRESS ENTER FOR NEXT LEVEL', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
  
  p.textSize(14);
  p.fill(200);
  p.text('Press R to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20);
  
  p.pop();
}

function renderGameWinScreen(p) {
  p.push();
  
  // Background with celebration effect
  const colorShift = Math.sin(p.frameCount * 0.05);
  p.fill(20 + colorShift * 10, 50 + colorShift * 20, 80 + colorShift * 30);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Title
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.fill(255, 215, 0);
  p.text('CONGRATULATIONS!', CANVAS_WIDTH / 2, 70);
  
  p.textSize(24);
  p.fill(255);
  p.text('You completed all levels!', CANVAS_WIDTH / 2, 110);
  
  // Final score
  p.textSize(32);
  p.fill(100, 255, 100);
  p.text(`FINAL SCORE: ${gameState.score}`, CANVAS_WIDTH / 2, 170);
  
  // High score
  if (gameState.score >= gameState.highScore) {
    p.textSize(20);
    p.fill(255, 200, 100);
    p.text('NEW HIGH SCORE!', CANVAS_WIDTH / 2, 210);
  } else {
    p.textSize(16);
    p.fill(200);
    p.text(`High Score: ${gameState.highScore}`, CANVAS_WIDTH / 2, 210);
  }
  
  // Stats
  p.textSize(14);
  p.fill(180);
  p.text('You are a master of gravity!', CANVAS_WIDTH / 2, 260);
  
  // Prompts
  p.textSize(18);
  p.fill(255);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
  
  p.pop();
}

function renderGameOverScreen(p) {
  p.push();
  
  // Background
  p.fill(40, 20, 20);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Title
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.fill(255, 100, 100);
  p.text('GAME OVER', CANVAS_WIDTH / 2, 100);
  
  // Level failed
  p.textSize(20);
  p.fill(255);
  p.text(`Level ${gameState.currentLevel} Failed`, CANVAS_WIDTH / 2, 150);
  
  // Score
  p.textSize(24);
  p.fill(200);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 200);
  
  // Stats
  p.textSize(16);
  p.fill(180);
  p.text(`Objects Caught: ${gameState.levelObjectives.objectsCaught}/${gameState.levelObjectives.objectsRequired}`, 
    CANVAS_WIDTH / 2, 240);
  
  // High score
  if (gameState.highScore > 0) {
    p.textSize(16);
    p.fill(255, 200, 100);
    p.text(`High Score: ${gameState.highScore}`, CANVAS_WIDTH / 2, 280);
  }
  
  // Prompt
  p.textSize(20);
  const flash = Math.sin(p.frameCount * 0.1) * 0.5 + 0.5;
  p.fill(255, 100 + flash * 155, 100 + flash * 155);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
  
  p.pop();
}