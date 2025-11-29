// renderer.js - Rendering functions

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  GAME_DURATION,
  NUM_SEGMENTS
} from './globals.js';
import { Tunnel } from './tunnel.js';

const tunnel = new Tunnel();

export function render(p) {
  p.background(10, 5, 20);
  
  p.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  if (gameState.gamePhase === PHASE_START) {
    renderStartScreen(p);
  } else if (gameState.gamePhase === PHASE_PLAYING) {
    renderGame(p);
    renderUI(p);
  } else if (gameState.gamePhase === PHASE_PAUSED) {
    renderGame(p);
    renderUI(p);
    renderPauseOverlay(p);
  } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
             gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
    renderGame(p);
    renderGameOverScreen(p);
  }
}

function renderStartScreen(p) {
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  // Title
  p.fill(100, 200, 255);
  p.noStroke();
  p.textSize(48);
  p.text('OCTAGON RUSH', 0, -120);
  
  // Subtitle with glow
  p.fill(150, 220, 255, 200);
  p.textSize(16);
  p.text('SURVIVE THE TUNNEL', 0, -80);
  
  // Description
  p.fill(200);
  p.textSize(14);
  p.textAlign(p.CENTER, p.TOP);
  const desc = 'Navigate through an infinite octagonal tunnel.\nAvoid obstacles and survive for 60 seconds!';
  p.text(desc, 0, -40);
  
  // Instructions
  p.textAlign(p.LEFT, p.TOP);
  p.fill(180);
  p.textSize(13);
  p.text('CONTROLS:', -200, 20);
  p.fill(200);
  p.textSize(12);
  p.text('← → : Rotate tunnel', -200, 40);
  p.text('SPACE : Flip 180°', -200, 60);
  p.text('ESC : Pause', -200, 80);
  p.text('R : Restart', -200, 100);
  
  // Start prompt with pulsing effect
  const pulse = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(255, 255, 100, pulse * 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  p.text('PRESS ENTER TO START', 0, 140);
  
  p.pop();
}

function renderGame(p) {
  // Render tunnel
  tunnel.render(p, gameState.tunnelRotation, gameState.scrollOffset);
  tunnel.renderDepthLines(p, gameState.tunnelRotation, gameState.scrollOffset);
  
  // Render obstacles
  for (const obstacle of gameState.obstacles) {
    obstacle.render(p, gameState.tunnelRotation, gameState.scrollOffset);
  }
  
  // Render player
  if (gameState.player) {
    // Handle flip animation
    if (gameState.isFlipping) {
      const t = gameState.flipProgress;
      const smoothT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      
      const startAngle = (gameState.flipStartSegment * Math.PI * 2) / NUM_SEGMENTS;
      const targetAngle = (gameState.flipTargetSegment * Math.PI * 2) / NUM_SEGMENTS;
      
      let angleDiff = targetAngle - startAngle;
      if (Math.abs(angleDiff) > Math.PI) {
        angleDiff = angleDiff > 0 ? angleDiff - Math.PI * 2 : angleDiff + Math.PI * 2;
      }
      
      const currentAngle = startAngle + angleDiff * smoothT;
      const tempSegment = ((currentAngle / (Math.PI * 2)) * NUM_SEGMENTS) % NUM_SEGMENTS;
      
      // Render at interpolated position
      renderPlayerAtAngle(p, currentAngle);
    } else {
      gameState.player.render(p, gameState.tunnelRotation);
    }
  }
}

function renderPlayerAtAngle(p, angle) {
  const TUNNEL_RADIUS = 150;
  const PLAYER_SIZE = 20;
  
  const x = TUNNEL_RADIUS * Math.cos(angle + gameState.tunnelRotation);
  const y = TUNNEL_RADIUS * Math.sin(angle + gameState.tunnelRotation);
  
  p.push();
  p.translate(x, y);
  
  p.fill(100, 200, 255);
  p.stroke(255);
  p.strokeWeight(2);
  
  const displayAngle = angle + gameState.tunnelRotation + Math.PI;
  p.rotate(displayAngle);
  
  p.beginShape();
  p.vertex(0, -PLAYER_SIZE / 2);
  p.vertex(-PLAYER_SIZE / 3, PLAYER_SIZE / 2);
  p.vertex(PLAYER_SIZE / 3, PLAYER_SIZE / 2);
  p.endShape(p.CLOSE);
  
  p.noFill();
  p.stroke(100, 200, 255, 100);
  p.strokeWeight(4);
  p.circle(0, 0, PLAYER_SIZE * 1.5);
  
  p.pop();
}

function renderUI(p) {
  p.push();
  p.textAlign(p.LEFT, p.TOP);
  
  // Score
  p.fill(255);
  p.noStroke();
  p.textSize(16);
  p.text(`SCORE: ${gameState.score}`, -CANVAS_WIDTH / 2 + 10, -CANVAS_HEIGHT / 2 + 10);
  
  // Time remaining
  const timeLeft = Math.max(0, GAME_DURATION - gameState.gameTime);
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`TIME: ${timeLeft.toFixed(1)}s`, CANVAS_WIDTH / 2 - 10, -CANVAS_HEIGHT / 2 + 10);
  
  // Speed indicator
  p.textAlign(p.LEFT, p.TOP);
  p.fill(200);
  p.textSize(12);
  p.text(`SPEED: ${gameState.speed.toFixed(1)}`, -CANVAS_WIDTH / 2 + 10, -CANVAS_HEIGHT / 2 + 30);
  
  p.pop();
}

function renderPauseOverlay(p) {
  p.push();
  p.textAlign(p.RIGHT, p.TOP);
  p.fill(255, 255, 100);
  p.noStroke();
  p.textSize(14);
  p.text('PAUSED', CANVAS_WIDTH / 2 - 10, -CANVAS_HEIGHT / 2 + 50);
  p.pop();
}

function renderGameOverScreen(p) {
  p.push();
  
  // Semi-transparent overlay
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(-CANVAS_WIDTH / 2, -CANVAS_HEIGHT / 2, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.textAlign(p.CENTER, p.CENTER);
  
  // Result message
  if (gameState.gamePhase === PHASE_GAME_OVER_WIN) {
    p.fill(100, 255, 100);
    p.textSize(48);
    p.text('VICTORY!', 0, -80);
    
    p.fill(200, 255, 200);
    p.textSize(20);
    p.text('You survived the tunnel!', 0, -30);
  } else {
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text('GAME OVER', 0, -80);
    
    p.fill(255, 200, 200);
    p.textSize(20);
    p.text('You crashed!', 0, -30);
  }
  
  // Final score
  p.fill(255, 255, 150);
  p.textSize(24);
  p.text(`FINAL SCORE: ${gameState.score}`, 0, 20);
  
  // Time survived
  p.fill(200);
  p.textSize(16);
  p.text(`Time: ${gameState.gameTime.toFixed(1)}s`, 0, 50);
  
  // Restart prompt
  const pulse = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(255, 255, 100, pulse * 255);
  p.textSize(18);
  p.text('PRESS R TO RESTART', 0, 100);
  
  p.pop();
}