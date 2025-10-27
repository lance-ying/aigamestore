// rendering.js - Rendering functions

import { gameState, GAME_PHASE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { LEVELS } from './levels.js';

export function renderGame(p) {
  const level = LEVELS[gameState.currentLevel];
  
  // Background
  p.background(...level.backgroundColor);

  // Beat pulse effect
  if (gameState.beatPulse > 0) {
    p.push();
    p.noFill();
    p.stroke(...level.color, gameState.beatPulse * 0.5);
    p.strokeWeight(4);
    p.rect(2, 2, CANVAS_WIDTH - 4, CANVAS_HEIGHT - 4);
    p.pop();
  }

  // Track segments
  renderTrack(p, level);

  // Turn point indicators
  renderTurnIndicators(p, level);

  // Obstacles
  for (const obstacle of gameState.obstacles) {
    obstacle.render(p, gameState.cameraOffset);
  }

  // Particles
  for (const particle of gameState.particles) {
    particle.render(p, gameState.cameraOffset);
  }

  // Player
  renderPlayer(p);

  // Tap feedback
  for (const feedback of gameState.tapFeedback) {
    feedback.render(p, gameState.cameraOffset);
  }

  // UI
  renderUI(p, level);
  
  // Beat indicator
  renderBeatIndicator(p, level);
}

function renderTrack(p, level) {
  p.push();
  p.translate(-gameState.cameraOffset, 0);
  
  for (const segment of gameState.trackSegments) {
    p.fill(...level.color);
    p.stroke(100);
    p.strokeWeight(2);
    
    const direction = segment.direction;
    if (direction === "RIGHT" || direction === "LEFT") {
      p.rect(segment.x - 25, segment.y - segment.width / 2, 50, segment.width);
    } else {
      p.rect(segment.x - segment.width / 2, segment.y - 25, segment.width, 50);
    }
  }
  
  p.pop();
}

function renderTurnIndicators(p, level) {
  p.push();
  p.translate(-gameState.cameraOffset, 0);
  
  // Show next few turn points
  for (let i = gameState.nextTurnIndex; i < Math.min(gameState.nextTurnIndex + 3, gameState.turnPoints.length); i++) {
    const turn = gameState.turnPoints[i];
    const playerDist = gameState.player.getTraveledDistance();
    const distToTurn = turn.distance - playerDist;
    
    // Only show if within viewing range
    if (distToTurn > -50 && distToTurn < 600) {
      // Calculate position on track
      const x = getXForDistance(turn.distance, level);
      const y = getYForDistance(turn.distance, level);
      
      // Pulsing effect based on proximity
      const proximity = Math.max(0, 1 - Math.abs(distToTurn) / 200);
      const pulseSize = 20 + proximity * 10;
      const alpha = 100 + proximity * 155;
      
      // Draw turn marker
      p.push();
      p.translate(x, y);
      
      // Outer glow
      p.noFill();
      p.stroke(255, 255, 0, alpha * 0.5);
      p.strokeWeight(3);
      p.circle(0, 0, pulseSize + 10);
      
      // Inner marker
      p.fill(255, 255, 0, alpha);
      p.noStroke();
      p.circle(0, 0, pulseSize);
      
      // Direction arrow
      p.fill(0);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(12);
      const arrow = getArrowForDirection(turn.direction);
      p.text(arrow, 0, 0);
      
      p.pop();
      
      // Distance indicator (only for next turn)
      if (i === gameState.nextTurnIndex && distToTurn > 0) {
        p.fill(255, 255, 255, 200);
        p.textAlign(p.CENTER, p.TOP);
        p.textSize(10);
        p.text(Math.round(distToTurn), x, y + pulseSize / 2 + 5);
      }
    }
  }
  
  p.pop();
}

function getArrowForDirection(direction) {
  switch (direction) {
    case "UP": return "↑";
    case "DOWN": return "↓";
    case "LEFT": return "←";
    case "RIGHT": return "→";
    default: return "?";
  }
}

function getXForDistance(distance, level) {
  let x = 100;
  let currentDir = { x: 1, y: 0 };
  let lastTurnDist = 0;

  for (const turn of level.turnPoints) {
    if (distance > turn.distance) {
      const segmentLength = turn.distance - lastTurnDist;
      x += currentDir.x * segmentLength;
      lastTurnDist = turn.distance;
      currentDir = getDirectionVector(turn.direction);
    } else {
      break;
    }
  }

  const remainingDist = distance - lastTurnDist;
  x += currentDir.x * remainingDist;
  return x;
}

function getYForDistance(distance, level) {
  let y = 200;
  let currentDir = { x: 1, y: 0 };
  let lastTurnDist = 0;

  for (const turn of level.turnPoints) {
    if (distance > turn.distance) {
      const segmentLength = turn.distance - lastTurnDist;
      y += currentDir.y * segmentLength;
      lastTurnDist = turn.distance;
      currentDir = getDirectionVector(turn.direction);
    } else {
      break;
    }
  }

  const remainingDist = distance - lastTurnDist;
  y += currentDir.y * remainingDist;
  return y;
}

function getDirectionVector(direction) {
  switch (direction) {
    case "UP": return { x: 0, y: -1 };
    case "DOWN": return { x: 0, y: 1 };
    case "LEFT": return { x: -1, y: 0 };
    case "RIGHT": return { x: 1, y: 0 };
    default: return { x: 1, y: 0 };
  }
}

function renderPlayer(p) {
  if (!gameState.player.alive) return;
  
  p.push();
  p.translate(-gameState.cameraOffset, 0);
  
  // Draw trail
  p.noFill();
  p.strokeWeight(5);
  
  for (let i = 0; i < gameState.player.segments.length - 1; i++) {
    const alpha = (i / gameState.player.segments.length) * 255;
    p.stroke(255, 200, 0, alpha);
    
    const seg = gameState.player.segments[i];
    const nextSeg = gameState.player.segments[i + 1];
    p.line(seg.x, seg.y, nextSeg.x, nextSeg.y);
  }
  
  // Draw head with glow
  if (gameState.player.glowIntensity > 0) {
    p.fill(255, 255, 255, gameState.player.glowIntensity);
    p.noStroke();
    p.circle(gameState.player.x, gameState.player.y, 15);
  }
  
  p.fill(255, 200, 0);
  p.noStroke();
  p.circle(gameState.player.x, gameState.player.y, 8);
  
  p.pop();
}

function renderBeatIndicator(p, level) {
  // Beat indicator in bottom left
  const beatInterval = 60000 / level.bpm;
  const timeSinceBeat = gameState.gameTime % beatInterval;
  const beatProgress = timeSinceBeat / beatInterval;
  
  const x = 30;
  const y = CANVAS_HEIGHT - 30;
  const size = 40;
  
  p.push();
  
  // Background circle
  p.noFill();
  p.stroke(100);
  p.strokeWeight(3);
  p.circle(x, y, size);
  
  // Beat progress arc
  p.noFill();
  p.stroke(255, 255, 0);
  p.strokeWeight(4);
  p.arc(x, y, size, size, -p.HALF_PI, -p.HALF_PI + beatProgress * p.TWO_PI);
  
  // Beat flash on exact beat
  if (beatProgress < 0.1) {
    const flashAlpha = (0.1 - beatProgress) / 0.1 * 255;
    p.fill(255, 255, 0, flashAlpha);
    p.noStroke();
    p.circle(x, y, size * 0.6);
  }
  
  // Label
  p.fill(255);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(10);
  p.text("BEAT", x, y + size / 2 + 12);
  
  p.pop();
}

function renderUI(p, level) {
  // Score
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text(`SCORE: ${gameState.score.toString().padStart(7, '0')}`, CANVAS_WIDTH - 20, 20);
  
  if (gameState.perfectStreak > 0) {
    p.textSize(12);
    p.text(`STREAK: ${gameState.perfectStreak}`, CANVAS_WIDTH - 20, 40);
  }
  
  // Level
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`LEVEL: ${gameState.currentLevel + 1}/${LEVELS.length}`, 20, 20);
  p.textSize(12);
  p.text(level.name, 20, 40);
  
  // Next turn hint
  if (gameState.nextTurnIndex < gameState.turnPoints.length) {
    const nextTurn = gameState.turnPoints[gameState.nextTurnIndex];
    const distToTurn = nextTurn.distance - gameState.player.getTraveledDistance();
    
    if (distToTurn > 0 && distToTurn < 300) {
      p.textAlign(p.CENTER, p.TOP);
      p.fill(255, 255, 0);
      p.textSize(14);
      p.text(`TURN ${getArrowForDirection(nextTurn.direction)} AHEAD`, CANVAS_WIDTH / 2, 20);
    }
  }
  
  // Pause indicator
  if (gameState.gamePhase === GAME_PHASE.PAUSED) {
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(14);
    p.fill(255, 255, 0);
    p.text("PAUSED", CANVAS_WIDTH - 20, 60);
  }
}

export function renderStartScreen(p) {
  p.background(20, 20, 40);
  
  // Title
  p.fill(255, 200, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("BEAT LINE", CANVAS_WIDTH / 2, 80);
  
  // Description
  p.fill(200, 200, 255);
  p.textSize(14);
  p.text("Navigate the rhythmic path", CANVAS_WIDTH / 2, 140);
  p.text("Time your turns to the beat", CANVAS_WIDTH / 2, 160);
  
  // Instructions
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  const startY = 200;
  p.text("SPACE - Turn at turn points (follow the arrows!)", 100, startY);
  p.text("ESC - Pause/Unpause", 100, startY + 20);
  p.text("R - Restart to menu", 100, startY + 40);
  p.text("Watch for yellow markers on the track!", 100, startY + 60);
  p.text("Press SPACE when you reach them to turn", 100, startY + 80);
  
  // Start prompt
  p.fill(255, 255, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  const pulse = Math.sin(p.frameCount * 0.1) * 0.5 + 0.5;
  p.fill(255, 255, 0, 150 + pulse * 105);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 340);
  
  // Levels preview
  p.fill(150);
  p.textSize(11);
  p.text("3 Levels • Increasing Difficulty", CANVAS_WIDTH / 2, 370);
}

export function renderGameOverScreen(p) {
  p.background(0, 0, 0, 200);
  
  const isWin = gameState.gamePhase === GAME_PHASE.GAME_OVER_WIN;
  
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text(isWin ? "VICTORY!" : "GAME OVER", CANVAS_WIDTH / 2, 120);
  
  if (!isWin) {
    p.fill(255, 200, 200);
    p.textSize(16);
    p.text(gameState.gameOverReason, CANVAS_WIDTH / 2, 160);
  }
  
  p.fill(255);
  p.textSize(20);
  p.text(`FINAL SCORE: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  
  if (isWin) {
    p.fill(200, 255, 200);
    p.textSize(14);
    p.text("You've mastered all levels!", CANVAS_WIDTH / 2, 260);
  }
  
  p.fill(255, 255, 0);
  p.textSize(16);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 320);
}

export function renderLevelCompleteScreen(p) {
  p.background(0, 0, 0, 200);
  
  p.fill(100, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, 120);
  
  p.fill(255);
  p.textSize(20);
  p.text(`Level Score: ${gameState.levelScore}`, CANVAS_WIDTH / 2, 200);
  p.text(`Total Score: ${gameState.score}`, CANVAS_WIDTH / 2, 230);
  
  if (gameState.currentLevel < LEVELS.length - 1) {
    p.fill(255, 255, 0);
    p.textSize(16);
    const pulse = Math.sin(p.frameCount * 0.1) * 0.5 + 0.5;
    p.fill(255, 255, 0, 150 + pulse * 105);
    p.text("PRESS SPACE FOR NEXT LEVEL", CANVAS_WIDTH / 2, 300);
  }
  
  p.fill(150);
  p.textSize(12);
  p.text("or press R to restart", CANVAS_WIDTH / 2, 340);
}