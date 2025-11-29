// rendering.js - Rendering functions

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { getLevelConfig } from './levels.js';

export function drawStartScreen(p) {
  p.background(30, 20, 50);
  
  // Title
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(255, 220, 100);
  p.textSize(48);
  p.text("Magic Sort!", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(200, 180, 255);
  p.textSize(16);
  p.text("Separate the colors into individual bottles!", CANVAS_WIDTH / 2, 140);
  
  // Instructions
  p.fill(255, 255, 255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    "ARROW KEYS: Navigate bottles",
    "SPACE: Select / Pour",
    "Z: Undo move (limited uses)",
    "SHIFT: Shuffle bottles (limited uses)",
    "ESC: Pause game",
    "R: Restart to menu"
  ];
  
  let yPos = 180;
  for (const instruction of instructions) {
    p.text(instruction, 100, yPos);
    yPos += 25;
  }
  
  // Start prompt
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(255, 255, 100);
  p.textSize(20);
  const pulse = 200 + Math.sin(p.frameCount * 0.1) * 55;
  p.fill(255, 255, pulse);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 350);
}

export function drawPlayingScreen(p) {
  p.background(30, 20, 50);
  
  // Draw bottles
  for (let i = 0; i < gameState.bottles.length; i++) {
    const bottle = gameState.bottles[i];
    const isSelected = gameState.selectedSourceBottleIndex === i;
    const isHighlighted = gameState.highlightedBottleIndex === i;
    
    let isValidDestination = false;
    if (gameState.selectedSourceBottleIndex !== null && 
        gameState.selectedSourceBottleIndex !== i) {
      const source = gameState.bottles[gameState.selectedSourceBottleIndex];
      isValidDestination = source.canPourInto(bottle);
    }
    
    bottle.draw(p, isSelected, isHighlighted, isValidDestination);
  }
  
  // Draw pouring animation
  if (gameState.pouringAnimation) {
    drawPouringAnimation(p);
  }
  
  // Draw UI
  drawGameUI(p);
}

export function drawPouringAnimation(p) {
  const anim = gameState.pouringAnimation;
  anim.progress++;
  
  if (anim.progress >= anim.duration) {
    gameState.pouringAnimation = null;
    return;
  }
  
  const source = gameState.bottles[anim.sourceIndex];
  const dest = gameState.bottles[anim.destIndex];
  
  const t = anim.progress / anim.duration;
  const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  
  const startX = source.x + source.width / 2;
  const startY = source.y;
  const endX = dest.x + dest.width / 2;
  const endY = dest.y;
  
  const currentX = startX + (endX - startX) * easeT;
  const currentY = startY + (endY - startY) * easeT - Math.sin(easeT * Math.PI) * 30;
  
  p.noStroke();
  p.fill(...anim.color, 200);
  p.circle(currentX, currentY, 15);
}

export function drawGameUI(p) {
  // Level indicator
  p.fill(255, 255, 255);
  p.textSize(16);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`LEVEL: ${gameState.currentLevel}`, 10, 10);
  
  // Score
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`SCORE: ${gameState.totalScore.toString().padStart(5, '0')}`, CANVAS_WIDTH - 10, 10);
  
  // Moves
  p.textAlign(p.CENTER, p.TOP);
  p.text(`MOVES: ${gameState.levelMovesMade}`, CANVAS_WIDTH / 2, 10);
  
  // Undo counter
  p.textAlign(p.LEFT, p.BOTTOM);
  p.textSize(14);
  p.fill(gameState.undoUsesLeft > 0 ? [100, 255, 100] : [150, 150, 150]);
  p.text(`Z: Undo (${gameState.undoUsesLeft})`, 10, CANVAS_HEIGHT - 10);
  
  // Shuffle counter
  p.fill(gameState.shuffleUsesLeft > 0 ? [100, 200, 255] : [150, 150, 150]);
  p.text(`SHIFT: Shuffle (${gameState.shuffleUsesLeft})`, 10, CANVAS_HEIGHT - 30);
  
  // Pause indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.fill(255, 255, 255);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(14);
    p.text("PAUSED", CANVAS_WIDTH - 10, 30);
  }
}

export function drawGameOverScreen(p, isWin) {
  p.background(30, 20, 50);
  
  p.textAlign(p.CENTER, p.CENTER);
  
  if (isWin) {
    p.fill(100, 255, 100);
    p.textSize(48);
    p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, 100);
    
    const levelScore = calculateLevelScoreForDisplay();
    p.fill(255, 255, 255);
    p.textSize(24);
    p.text(`Level Score: +${levelScore}`, CANVAS_WIDTH / 2, 180);
    p.text(`Total Score: ${gameState.totalScore}`, CANVAS_WIDTH / 2, 220);
    p.text(`Moves: ${gameState.levelMovesMade}`, CANVAS_WIDTH / 2, 260);
    
    p.fill(255, 255, 100);
    p.textSize(20);
    const pulse = 200 + Math.sin(p.frameCount * 0.1) * 55;
    p.fill(255, 255, pulse);
    
    if (gameState.currentLevel < gameState.maxLevels) {
      p.text("PRESS ENTER FOR NEXT LEVEL", CANVAS_WIDTH / 2, 330);
    } else {
      p.text("YOU WON THE GAME!", CANVAS_WIDTH / 2, 300);
      p.textSize(16);
      p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 350);
    }
  } else {
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 120);
    
    p.fill(255, 255, 255);
    p.textSize(20);
    p.text("No more moves available!", CANVAS_WIDTH / 2, 180);
    p.text(`Final Score: ${gameState.totalScore}`, CANVAS_WIDTH / 2, 220);
    
    p.fill(255, 255, 100);
    const pulse = 200 + Math.sin(p.frameCount * 0.1) * 55;
    p.fill(255, 255, pulse);
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 280);
  }
}

function calculateLevelScoreForDisplay() {
  const config = getLevelConfig(gameState.currentLevel);
  if (!config) return 0;
  
  let score = 100;
  const movesBonus = Math.max(0, (config.maxMoves - gameState.levelMovesMade) * 5);
  score += movesBonus;
  
  const timeElapsed = (Date.now() - gameState.levelStartTime) / 1000;
  const timeBonus = Math.max(0, Math.floor((config.maxTime - timeElapsed) * 2));
  score += timeBonus;
  
  return score;
}