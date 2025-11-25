// rendering.js - Rendering functions

import {
  gameState,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  CANVAS_WIDTH,
  CANVAS_HEIGHT
} from './globals.js';
import { drawWorld } from './world.js';

export function drawStartScreen(p) {
  p.background(20, 20, 30);
  
  // Title
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  // Glowing title effect
  p.fill(255, 255, 150, 100);
  p.noStroke();
  p.textSize(64);
  p.text('ONESHOT', CANVAS_WIDTH / 2 + 2, 80 + 2);
  
  p.fill(255, 255, 200);
  p.stroke(200, 200, 100);
  p.strokeWeight(3);
  p.textSize(64);
  p.text('ONESHOT', CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(150, 150, 180);
  p.noStroke();
  p.textSize(16);
  p.text('World Machine Edition', CANVAS_WIDTH / 2, 130);
  
  // Description
  p.fill(200, 200, 220);
  p.textSize(14);
  p.textAlign(p.CENTER, p.TOP);
  const desc = [
    'Guide Niko through a dying world to restore the Sun.',
    'Navigate puzzle rooms, activate switches, and unlock doors.',
    'Find the lightbulb and bring it to the Sun Chamber.',
    '',
    'The world is aware of your presence.',
    'Your choices matter. You only have one shot.'
  ];
  let yPos = 160;
  desc.forEach(line => {
    p.text(line, CANVAS_WIDTH / 2, yPos);
    yPos += 20;
  });
  
  // Controls
  p.fill(180, 180, 200);
  p.textSize(13);
  p.textAlign(p.LEFT, p.TOP);
  const controls = [
    'Arrow Keys - Move',
    'Space - Interact with switches',
    'Z - Pick up / Place lightbulb',
    'Shift - Sprint (uses stamina)',
    'Esc - Pause game'
  ];
  yPos = 290;
  controls.forEach(line => {
    p.text(line, 50, yPos);
    yPos += 18;
  });
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  const pulseAlpha = 150 + Math.sin(p.frameCount * 0.1) * 100;
  p.fill(255, 255, 100, pulseAlpha);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 365);
  
  p.pop();
}

export function drawPlayingScreen(p) {
  // Draw world
  drawWorld(p);
  
  // Draw player
  if (gameState.player) {
    gameState.player.draw(p);
    
    // Log player info periodically
    if (p.frameCount % 30 === 0) {
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.player.x,
        game_y: gameState.player.y,
        framecount: p.frameCount
      });
    }
  }
  
  // Draw UI
  drawUI(p);
}

export function drawPausedScreen(p) {
  // Draw game in background
  drawPlayingScreen(p);
  
  // Overlay
  p.push();
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Paused text
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(20);
  p.text('PAUSED', CANVAS_WIDTH - 10, 10);
  
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(16);
  p.text('Press ESC to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  p.pop();
}

export function drawGameOverScreen(p) {
  if (gameState.gamePhase === PHASE_GAME_OVER_WIN) {
    drawWinScreen(p);
  } else {
    drawLoseScreen(p);
  }
}

function drawWinScreen(p) {
  p.background(30, 30, 40);
  
  // Draw sun restoration animation
  const sunSize = 150;
  const rays = 24;
  
  p.push();
  p.translate(CANVAS_WIDTH / 2, 150);
  
  // Sun glow
  p.fill(255, 255, 100, 100);
  p.noStroke();
  p.circle(0, 0, sunSize * 2);
  
  // Sun core
  p.fill(255, 255, 150);
  p.circle(0, 0, sunSize);
  
  // Rays
  for (let i = 0; i < rays; i++) {
    const angle = (i / rays) * Math.PI * 2 + p.frameCount * 0.03;
    const rayLength = sunSize * 0.8;
    const x1 = Math.cos(angle) * (sunSize / 2);
    const y1 = Math.sin(angle) * (sunSize / 2);
    const x2 = Math.cos(angle) * (sunSize / 2 + rayLength);
    const y2 = Math.sin(angle) * (sunSize / 2 + rayLength);
    p.stroke(255, 255, 150, 200);
    p.strokeWeight(4);
    p.line(x1, y1, x2, y2);
  }
  
  p.pop();
  
  // Text
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  p.fill(255, 255, 150);
  p.noStroke();
  p.textSize(48);
  p.text('SUN RESTORED', CANVAS_WIDTH / 2, 270);
  
  p.fill(200, 200, 220);
  p.textSize(20);
  p.text('You saved the world!', CANVAS_WIDTH / 2, 310);
  
  p.fill(180, 180, 200);
  p.textSize(16);
  const timeElapsed = ((gameState.endTime - gameState.startTime) / 1000).toFixed(1);
  p.text(`Time: ${timeElapsed}s | Score: ${gameState.score}`, CANVAS_WIDTH / 2, 340);
  
  p.fill(255, 255, 100);
  p.textSize(18);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 375);
  
  p.pop();
}

function drawLoseScreen(p) {
  p.background(20, 15, 25);
  
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  p.fill(200, 100, 100);
  p.textSize(48);
  p.text('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  
  p.fill(150, 150, 170);
  p.textSize(18);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
  
  p.fill(200, 200, 100);
  p.textSize(18);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
  
  p.pop();
}

function drawUI(p) {
  p.push();
  
  // Score
  p.fill(255, 255, 255);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`Score: ${gameState.score}`, 10, 10);
  
  // Switches activated
  p.text(`Switches: ${gameState.switchesActivated}/4`, 10, 30);
  
  // Stamina bar (if sprinting or stamina not full)
  const player = gameState.player;
  if (player && player.stamina < player.maxStamina) {
    p.fill(50, 50, 60);
    p.rect(10, 55, 100, 10);
    p.fill(100, 200, 255);
    p.rect(10, 55, (player.stamina / player.maxStamina) * 100, 10);
    p.noFill();
    p.stroke(200, 200, 220);
    p.strokeWeight(1);
    p.rect(10, 55, 100, 10);
  }
  
  // Lightbulb status
  if (gameState.hasLightbulb) {
    p.fill(255, 255, 150);
    p.textSize(14);
    p.text('⚡ Carrying Lightbulb', 10, 75);
  }
  
  // Hint text
  if (!gameState.hasLightbulb && gameState.switchesActivated >= 2) {
    p.fill(200, 255, 200);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(12);
    p.text('The lightbulb room should be accessible now...', CANVAS_WIDTH / 2, 10);
  }
  
  if (gameState.hasLightbulb) {
    p.fill(255, 255, 150);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(12);
    p.text('Take the lightbulb to the Sun Chamber!', CANVAS_WIDTH / 2, 10);
  }
  
  p.pop();
}