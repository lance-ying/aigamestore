// render.js - Rendering functions

import {
  gameState,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  NUM_LANES,
  LANE_WIDTH,
  COLORS,
  TRACK_LENGTH,
  FINISH_LINE_OFFSET,
  GAME_PHASES
} from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 20, 40);
  
  // Title
  p.fill(255, 220, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text("BRIDGE RACE", CANVAS_WIDTH / 2, 80);
  
  // Level indicator
  p.fill(255);
  p.textSize(24);
  p.textStyle(p.NORMAL);
  p.text(`Level ${gameState.level}`, CANVAS_WIDTH / 2, 140);
  
  // Instructions
  p.fill(200, 200, 255);
  p.textSize(16);
  p.text("Race to the finish line!", CANVAS_WIDTH / 2, 200);
  p.text("Collect blocks and build bridges over water", CANVAS_WIDTH / 2, 225);
  p.text("Collide with opponents to steal their blocks", CANVAS_WIDTH / 2, 250);
  
  // Controls
  p.fill(150, 150, 200);
  p.textSize(14);
  p.text("Arrow Keys / A,D: Steer Left/Right", CANVAS_WIDTH / 2, 290);
  p.text("ESC: Pause    R: Restart", CANVAS_WIDTH / 2, 310);
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textSize(20);
  const flash = Math.sin(p.frameCount * 0.1) * 0.5 + 0.5;
  p.fill(255, 255, 100, 150 + flash * 105);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
}

export function renderGame(p) {
  // Calculate camera position
  if (gameState.player) {
    gameState.camera.y = gameState.player.worldY - CANVAS_HEIGHT * 0.7;
  }
  
  // Background
  p.background(100, 180, 100);
  
  // Draw track
  renderTrack(p);
  
  // Draw finish line
  renderFinishLine(p);
  
  // Draw bridges
  gameState.bridges.forEach(bridge => {
    const screenY = bridge.worldY - gameState.camera.y;
    if (screenY > -100 && screenY < CANVAS_HEIGHT + 100) {
      bridge.render(screenY);
    }
  });
  
  // Draw blocks
  gameState.blocks.forEach(block => {
    const screenY = block.worldY - gameState.camera.y;
    if (screenY > -50 && screenY < CANVAS_HEIGHT + 50) {
      block.render(screenY);
    }
  });
  
  // Draw dropped blocks
  gameState.droppedBlocks.forEach(block => {
    const screenY = block.worldY - gameState.camera.y;
    if (screenY > -50 && screenY < CANVAS_HEIGHT + 50) {
      block.render(screenY);
    }
  });
  
  // Draw AI racers
  gameState.aiRacers.forEach(ai => {
    const screenY = ai.body.position.y - gameState.camera.y;
    if (screenY > -50 && screenY < CANVAS_HEIGHT + 50) {
      ai.render(screenY);
    }
  });
  
  // Draw player
  if (gameState.player) {
    const screenY = gameState.player.body.position.y - gameState.camera.y;
    gameState.player.render(screenY);
  }
  
  // Draw UI
  renderUI(p);
}

function renderTrack(p) {
  const trackLeft = (CANVAS_WIDTH - NUM_LANES * LANE_WIDTH) / 2;
  
  // Draw track background
  p.fill(COLORS.GROUND);
  p.noStroke();
  p.rect(trackLeft, 0, NUM_LANES * LANE_WIDTH, CANVAS_HEIGHT);
  
  // Draw lane dividers
  p.stroke(150, 120, 80);
  p.strokeWeight(2);
  for (let i = 1; i < NUM_LANES; i++) {
    const x = trackLeft + i * LANE_WIDTH;
    p.line(x, 0, x, CANVAS_HEIGHT);
  }
  
  // Draw track borders
  p.stroke(80, 60, 40);
  p.strokeWeight(4);
  p.line(trackLeft, 0, trackLeft, CANVAS_HEIGHT);
  p.line(trackLeft + NUM_LANES * LANE_WIDTH, 0, trackLeft + NUM_LANES * LANE_WIDTH, CANVAS_HEIGHT);
}

function renderFinishLine(p) {
  const screenY = FINISH_LINE_OFFSET - gameState.camera.y;
  
  if (screenY > -50 && screenY < CANVAS_HEIGHT + 50) {
    const trackLeft = (CANVAS_WIDTH - NUM_LANES * LANE_WIDTH) / 2;
    
    // Checkered pattern
    p.noStroke();
    const checkSize = 20;
    for (let x = 0; x < NUM_LANES * LANE_WIDTH; x += checkSize) {
      for (let y = 0; y < 40; y += checkSize) {
        const isBlack = ((Math.floor(x / checkSize) + Math.floor(y / checkSize)) % 2) === 0;
        p.fill(isBlack ? 0 : 255);
        p.rect(trackLeft + x, screenY - 20 + y, checkSize, checkSize);
      }
    }
    
    // Text
    p.fill(255, 215, 0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(24);
    p.textStyle(p.BOLD);
    p.text("FINISH", CANVAS_WIDTH / 2, screenY - 40);
  }
}

function renderUI(p) {
  if (!gameState.player) return;
  
  // Semi-transparent background
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 80);
  
  // Blocks count
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(18);
  p.textStyle(p.BOLD);
  p.text(`Blocks: ${gameState.player.blocks}`, 10, 10);
  
  // Level
  p.text(`Level ${gameState.level}`, 10, 35);
  
  // Position
  const position = gameState.finishResults.findIndex(r => r.isPlayer) + 1;
  if (position > 0) {
    p.fill(255, 215, 0);
    p.textAlign(p.RIGHT, p.TOP);
    p.text(`Position: ${position}/${gameState.finishResults.length}`, CANVAS_WIDTH - 10, 10);
  } else {
    // Show current ranking
    let playerPos = 1;
    gameState.aiRacers.forEach(ai => {
      if (ai.worldY < gameState.player.worldY) {
        playerPos++;
      }
    });
    p.textAlign(p.RIGHT, p.TOP);
    p.text(`Position: ${playerPos}/4`, CANVAS_WIDTH - 10, 10);
  }
  
  // Distance to finish
  const distToFinish = Math.max(0, gameState.player.worldY - FINISH_LINE_OFFSET);
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`Distance: ${Math.floor(distToFinish)}m`, CANVAS_WIDTH - 10, 35);
  
  // Mini progress bar
  const progress = Math.max(0, Math.min(1, 1 - (gameState.player.worldY - FINISH_LINE_OFFSET) / TRACK_LENGTH));
  p.fill(50);
  p.rect(10, 60, CANVAS_WIDTH - 20, 10);
  p.fill(100, 255, 100);
  p.rect(10, 60, (CANVAS_WIDTH - 20) * progress, 10);
}

export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  
  p.textSize(20);
  p.textStyle(p.NORMAL);
  p.text("Press ESC to continue", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

export function renderGameOver(p) {
  // Render game in background
  renderGame(p);
  
  // Overlay
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Title
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text(isWin ? "YOU WIN!" : "RACE OVER", CANVAS_WIDTH / 2, 100);
  
  // Results
  p.fill(255);
  p.textSize(20);
  p.textStyle(p.NORMAL);
  
  const playerResult = gameState.finishResults.find(r => r.isPlayer);
  if (playerResult) {
    const position = gameState.finishResults.indexOf(playerResult) + 1;
    const suffix = position === 1 ? "st" : position === 2 ? "nd" : position === 3 ? "rd" : "th";
    p.text(`You finished ${position}${suffix} place!`, CANVAS_WIDTH / 2, 170);
    p.text(`Time: ${(playerResult.time / 1000).toFixed(2)}s`, CANVAS_WIDTH / 2, 200);
  }
  
  // Level info
  p.textSize(16);
  p.text(`Level ${gameState.level} Complete`, CANVAS_WIDTH / 2, 240);
  
  // Restart prompt
  p.fill(255, 255, 100);
  p.textSize(24);
  const flash = Math.sin(p.frameCount * 0.1) * 0.5 + 0.5;
  p.fill(255, 255, 100, 150 + flash * 105);
  p.text("PRESS R TO CONTINUE", CANVAS_WIDTH / 2, 320);
}