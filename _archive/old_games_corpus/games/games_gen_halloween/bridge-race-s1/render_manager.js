// render_manager.js - Rendering functions for game screens

import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';

export function renderStartScreen(p) {
  p.background(30, 30, 50);
  
  // Title
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("BRIDGE RACE", 300, 80);
  
  // Description
  p.fill(255);
  p.textSize(14);
  p.text("Race against AI opponents!", 300, 140);
  p.text("Collect colored blocks matching your character", 300, 160);
  p.text("Build bridges to cross water gaps", 300, 180);
  p.text("Knock opponents to steal their blocks", 300, 200);
  p.text("Be the first to reach the finish line!", 300, 220);
  
  // Controls
  p.textSize(12);
  p.fill(200, 200, 255);
  p.text("CONTROLS:", 300, 260);
  p.fill(255);
  p.text("Arrow Keys: Move your character", 300, 280);
  p.text("ESC: Pause/Unpause", 300, 300);
  p.text("R: Restart", 300, 320);
  
  // Start prompt
  p.fill(255, 255, 0);
  p.textSize(20);
  const alpha = 128 + 127 * Math.sin(p.frameCount * 0.1);
  p.fill(255, 255, 0, alpha);
  p.text("PRESS ENTER TO START", 300, 360);
}

export function renderPlayingScreen(p) {
  // Background
  p.background(100, 180, 120);
  
  // Draw grid pattern
  p.stroke(90, 160, 110);
  p.strokeWeight(1);
  for (let x = 0; x < 600; x += 30) {
    p.line(x, 0, x, 400);
  }
  for (let y = 0; y < 400; y += 30) {
    p.line(0, y, 600, y);
  }
  
  // Draw platforms
  for (let platform of gameState.platforms) {
    platform.render();
  }
  
  // Draw bridges
  for (let bridge of gameState.bridges) {
    bridge.render();
  }
  
  // Draw blocks
  for (let block of gameState.blocks) {
    block.render(p.frameCount);
  }
  
  // Draw AI opponents
  for (let ai of gameState.aiOpponents) {
    ai.render();
  }
  
  // Draw player
  if (gameState.player) {
    gameState.player.render();
  }
  
  // UI - Score and info
  p.fill(255);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text(`Score: ${gameState.score}`, 10, 10);
  p.text(`Level: ${gameState.level}`, 10, 30);
  
  if (gameState.player) {
    p.text(`Blocks: ${gameState.player.blocks}`, 10, 50);
  }
  
  // Rank display
  const finishedCount = [gameState.player, ...gameState.aiOpponents]
    .filter(r => r.hasFinished).length;
  if (finishedCount > 0) {
    p.textAlign(p.RIGHT, p.TOP);
    p.text(`Position: ${finishedCount}/${gameState.totalRacers}`, 590, 10);
  }
  
  // Pause indicator
  if (gameState.gamePhase === PHASE_PAUSED) {
    p.fill(255, 255, 255, 200);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.text("PAUSED", 590, 30);
  }
}

export function renderGameOverScreen(p) {
  p.background(30, 30, 50);
  
  const isWin = gameState.gamePhase === PHASE_GAME_OVER_WIN;
  
  // Title
  if (isWin) {
    p.fill(50, 255, 50);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text("YOU WIN!", 300, 100);
    
    p.fill(255, 215, 0);
    p.textSize(32);
    p.text(`Rank: ${gameState.playerRank}/${gameState.totalRacers}`, 300, 150);
  } else {
    p.fill(255, 50, 50);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text("RACE OVER", 300, 100);
    
    p.fill(255);
    p.textSize(24);
    p.text(`Final Position: ${gameState.playerRank}/${gameState.totalRacers}`, 300, 150);
  }
  
  // Stats
  p.fill(255);
  p.textSize(20);
  p.text(`Final Score: ${gameState.score}`, 300, 200);
  
  if (gameState.player && gameState.player.finishTime) {
    const time = (gameState.player.finishTime / 1000).toFixed(2);
    p.text(`Time: ${time}s`, 300, 230);
  }
  
  // Blocks collected
  const totalBlocks = gameState.blocks.filter(b => b.collected).length;
  p.textSize(16);
  p.text(`Blocks Collected: ${totalBlocks}`, 300, 270);
  
  // Restart prompt
  p.fill(255, 255, 0);
  p.textSize(20);
  const alpha = 128 + 127 * Math.sin(p.frameCount * 0.1);
  p.fill(255, 255, 0, alpha);
  p.text("PRESS R TO RESTART", 300, 340);
}