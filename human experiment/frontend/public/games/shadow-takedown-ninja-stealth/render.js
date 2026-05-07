// render.js - Rendering functions

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderGame(p) {
  // Clear background once
  p.background(20, 25, 30);

  if (gameState.gamePhase === GAME_PHASES.START) {
    renderStartScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING || gameState.gamePhase === GAME_PHASES.PAUSED) {
    // Render the game state normally when paused, but without the overlay
    renderPlaying(p);
  } else if (gameState.gamePhase === GAME_PHASES.LEVEL_COMPLETE) {
    renderLevelComplete(p);
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    renderGameOverWin(p);
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    renderGameOverLose(p);
  }
}

function renderStartScreen(p) {
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  
  // New Title: "press enter to begin"
  p.textSize(24); // Adjusted size for the new title
  p.text('press enter to begin', CANVAS_WIDTH / 2, 100); // Centered where the old title was
  
  // Description
  p.textSize(12);
  p.fill(200);
  p.text('Eliminate all PRIMARY TARGETS (marked in red)', CANVAS_WIDTH / 2, 160);
  p.text('while avoiding detection by guards.', CANVAS_WIDTH / 2, 180);
  
  // Instructions
  p.textSize(11);
  p.fill(180);
  p.text('ARROW KEYS - Move', CANVAS_WIDTH / 2, 220);
  p.text('SPACE - Silent takedown / Use vent / Detonate barrel', CANVAS_WIDTH / 2, 240);
  
  // Tips
  p.textSize(10);
  p.fill(150);
  p.text('Stay out of blue vision cones. If detected, it\'s game over!', CANVAS_WIDTH / 2, 290);
  p.text('Use vents (gray squares) to teleport across the map.', CANVAS_WIDTH / 2, 305);
}

function renderPlaying(p) {
  // Render walls
  for (let wall of gameState.walls) {
    wall.render();
  }
  
  // Render vents
  for (let vent of gameState.vents) {
    vent.render();
  }
  
  // Render barrels
  for (let barrel of gameState.barrels) {
    barrel.render();
  }
  
  // Render enemies (vision cones first)
  for (let enemy of gameState.enemies) {
    if (!enemy.eliminated) {
      enemy.render();
    }
  }
  
  // Render player
  if (gameState.player) {
    gameState.player.render();
  }
  
  // UI
  renderUI(p);
}

function renderUI(p) {
  // Level indicator (top-left)
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text(`LEVEL: ${gameState.currentLevel}`, 15, 15);
  
  // Score (top-right)
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`SCORE: ${gameState.score.toString().padStart(5, '0')}`, CANVAS_WIDTH - 15, 15);
  
  // Target count
  const targetsRemaining = gameState.primaryTargets.filter(t => !t.eliminated).length;
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.fill(255, 100, 100);
  p.text(`TARGETS: ${targetsRemaining}`, 15, 40);
}

function renderLevelComplete(p) {
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  
  // Calculate bonuses
  const levelBonus = gameState.currentLevel * 100;
  const stealthBonus = gameState.stealthBonusEligible ? 500 : 0;
  
  const elapsedTime = (gameState.levelCompleteTime - gameState.levelStartTime) / 1000;
  const maxTime = gameState.levelMaxTime[gameState.currentLevel - 1];
  const timeBonus = Math.max(0, Math.floor((maxTime - elapsedTime) * 5));
  
  p.textSize(32);
  p.fill(100, 255, 100);
  p.text('LEVEL COMPLETE!', CANVAS_WIDTH / 2, 80);
  
  p.textSize(16);
  p.fill(255);
  p.text(`Level ${gameState.currentLevel} Cleared`, CANVAS_WIDTH / 2, 130);
  
  // Score breakdown
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(14);
  const startY = 170;
  p.text(`Level Bonus:`, 150, startY);
  p.text(`+${levelBonus}`, 350, startY);
  
  if (stealthBonus > 0) {
    p.fill(100, 255, 100);
    p.text(`Stealth Bonus:`, 150, startY + 25);
    p.text(`+${stealthBonus}`, 350, startY + 25);
  }
  
  p.fill(255);
  p.text(`Time Bonus:`, 150, startY + 50);
  p.text(`+${timeBonus}`, 350, startY + 50);
  
  p.textSize(16);
  p.text(`Total Score:`, 150, startY + 90);
  p.text(`${gameState.score}`, 350, startY + 90);
  
  // Continue prompt
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  p.fill(100, 255, 100);
  const nextText = gameState.currentLevel >= gameState.maxLevel 
    ? 'PRESS ENTER TO CONTINUE' 
    : 'PRESS ENTER FOR NEXT LEVEL';
  p.text(nextText, CANVAS_WIDTH / 2, 340);
}

function renderGameOverWin(p) {
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  
  p.textSize(32);
  p.fill(255, 215, 0);
  p.text('MISSION COMPLETE!', CANVAS_WIDTH / 2, 100);
  
  p.textSize(20);
  p.fill(100, 255, 100);
  p.text('YOU ARE THE STEALTH MASTER!', CANVAS_WIDTH / 2, 150);
  
  p.textSize(16);
  p.fill(255);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 200);
  
  p.textSize(14);
  p.text('All targets eliminated across all levels.', CANVAS_WIDTH / 2, 240);
  
  p.textSize(18);
  p.fill(200);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 320);
}

function renderGameOverLose(p) {
  // Red flash effect
  p.fill(255, 0, 0, 30);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  
  p.textSize(40);
  p.fill(255, 50, 50);
  p.text('DETECTED!', CANVAS_WIDTH / 2, 120);
  
  p.textSize(24);
  p.fill(255);
  p.text('MISSION FAILED', CANVAS_WIDTH / 2, 170);
  
  p.textSize(16);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  
  p.textSize(14);
  p.fill(200);
  p.text('You were spotted by a guard.', CANVAS_WIDTH / 2, 260);
  
  p.textSize(18);
  p.fill(200);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 320);
}