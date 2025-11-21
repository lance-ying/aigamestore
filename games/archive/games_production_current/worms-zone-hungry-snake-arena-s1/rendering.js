// rendering.js - Game rendering

import { 
  gameState, CANVAS_WIDTH, CANVAS_HEIGHT, ARENA_WIDTH, ARENA_HEIGHT,
  PHASE_START, PHASE_PLAYING, PHASE_PAUSED, 
  PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE
} from './globals.js';

export function renderGame(p) {
  // Clear background
  p.background(20, 25, 30);
  
  // Render based on game phase
  switch (gameState.gamePhase) {
    case PHASE_START:
      renderStartScreen(p);
      break;
    case PHASE_PLAYING:
      renderPlaying(p);
      break;
    case PHASE_PAUSED:
      renderPlaying(p);
      renderPauseOverlay(p);
      break;
    case PHASE_GAME_OVER_WIN:
    case PHASE_GAME_OVER_LOSE:
      renderPlaying(p);
      renderGameOverScreen(p);
      break;
  }
}

export function renderStartScreen(p) {
  p.push();
  
  // Title
  p.fill(100, 200, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("WORMS ZONE", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(255, 200, 100);
  p.textSize(20);
  p.text("Hungry Snake Arena", CANVAS_WIDTH / 2, 120);
  
  // Instructions
  p.fill(200, 200, 200);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  
  const instructions = [
    "HOW TO PLAY:",
    "• Steer with ARROW KEYS to navigate",
    "• Collect colorful food pellets to grow",
    "• Avoid hitting other worms' bodies",
    "• Make others crash into you to eliminate them",
    "• Eat their remains for massive growth",
    "",
    "POWER-UPS:",
    "• SPACE - Speed boost (drains mass)",
    "• Z - Activate magnet (collect nearby food)",
    "",
    "GOAL:",
    "• Grow to size 150 to win!",
    "• Climb the leaderboard by surviving"
  ];
  
  let y = 160;
  for (const line of instructions) {
    p.text(line, 80, y);
    y += 20;
  }
  
  // Start prompt
  p.fill(100, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  
  // Pulsing effect
  const alpha = 150 + Math.sin(p.frameCount * 0.1) * 100;
  p.fill(100, 255, 100, alpha);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  
  p.pop();
}

export function renderPlaying(p) {
  const camera = gameState.camera;
  
  // Draw arena grid
  p.push();
  p.stroke(40, 50, 60);
  p.strokeWeight(1);
  for (let x = 0; x < ARENA_WIDTH; x += 50) {
    p.line(x - camera.x, 0, x - camera.x, CANVAS_HEIGHT);
  }
  for (let y = 0; y < ARENA_HEIGHT; y += 50) {
    p.line(0, y - camera.y, CANVAS_WIDTH, y - camera.y);
  }
  p.pop();
  
  // Draw arena bounds
  p.push();
  p.noFill();
  p.stroke(80, 100, 120);
  p.strokeWeight(3);
  p.rect(-camera.x, -camera.y, ARENA_WIDTH, ARENA_HEIGHT);
  p.pop();
  
  // Draw food
  for (const food of gameState.food) {
    food.draw(p, camera);
  }
  
  // Draw powerups
  for (const powerup of gameState.powerups) {
    powerup.draw(p, camera);
  }
  
  // Draw AI worms
  for (const aiWorm of gameState.aiWorms) {
    aiWorm.draw(p, camera);
  }
  
  // Draw player worm
  if (gameState.player) {
    gameState.player.draw(p, camera);
  }
  
  // Draw UI
  renderUI(p);
}

export function renderUI(p) {
  p.push();
  
  // Score
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(18);
  p.text(`Score: ${gameState.score}`, 10, 10);
  
  // Player mass
  if (gameState.player && gameState.player.alive) {
    p.text(`Size: ${Math.floor(gameState.player.mass)}`, 10, 35);
    p.text(`Target: ${150}`, 10, 60);
    
    // Mass bar
    const barWidth = 150;
    const barHeight = 15;
    const barX = 10;
    const barY = 85;
    const progress = Math.min(1, gameState.player.mass / 150);
    
    p.noStroke();
    p.fill(60, 60, 60);
    p.rect(barX, barY, barWidth, barHeight);
    
    p.fill(100, 200, 255);
    p.rect(barX, barY, barWidth * progress, barHeight);
    
    p.stroke(255);
    p.strokeWeight(2);
    p.noFill();
    p.rect(barX, barY, barWidth, barHeight);
  }
  
  // Powerups display
  if (gameState.player) {
    p.fill(255);
    p.textSize(14);
    p.text(`Magnets: ${gameState.player.powerups.magnet}`, 10, 110);
    
    if (gameState.player.magnetActive) {
      p.fill(255, 100, 255);
      p.text(`MAGNET ACTIVE`, 10, 130);
    }
    if (gameState.player.speedBoostActive) {
      p.fill(255, 200, 0);
      p.text(`SPEED BOOST`, 10, gameState.player.magnetActive ? 150 : 130);
    }
  }
  
  // Leaderboard
  p.fill(255, 255, 255, 200);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("LEADERBOARD", CANVAS_WIDTH - 10, 10);
  
  p.textSize(12);
  let y = 35;
  for (let i = 0; i < Math.min(5, gameState.leaderboard.length); i++) {
    const entry = gameState.leaderboard[i];
    const color = entry.isPlayer ? [100, 255, 100] : [200, 200, 200];
    p.fill(...color);
    p.text(`${i + 1}. ${entry.name}: ${entry.mass}`, CANVAS_WIDTH - 10, y);
    y += 20;
  }
  
  // High score
  if (gameState.highScore > 0) {
    p.fill(255, 200, 100);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(14);
    p.text(`High Score: ${gameState.highScore}`, CANVAS_WIDTH / 2, 10);
  }
  
  p.pop();
}

export function renderPauseOverlay(p) {
  p.push();
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, CANVAS_HEIGHT - 30);
  p.pop();
}

export function renderGameOverScreen(p) {
  p.push();
  
  // Semi-transparent overlay
  p.fill(0, 0, 0, 180);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Game over message
  if (gameState.gamePhase === PHASE_GAME_OVER_WIN) {
    p.fill(100, 255, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text("VICTORY!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
    
    p.fill(255, 255, 100);
    p.textSize(24);
    p.text("You became the biggest worm!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
  } else {
    p.fill(255, 100, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text("GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
    
    p.fill(255, 200, 100);
    p.textSize(20);
    p.text("You crashed into another worm!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
  }
  
  // Final score
  p.fill(255);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
  
  if (gameState.score === gameState.highScore) {
    p.fill(255, 200, 100);
    p.textSize(18);
    p.text("NEW HIGH SCORE!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
  }
  
  // Restart prompt
  p.fill(200, 200, 200);
  p.textSize(20);
  
  const alpha = 150 + Math.sin(p.frameCount * 0.1) * 100;
  p.fill(200, 200, 200, alpha);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
  
  p.pop();
}