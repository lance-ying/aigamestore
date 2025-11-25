// render.js - Rendering functions
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderGame(p) {
  // Single background call at top
  p.background(20, 20, 40);
  
  if (gameState.gamePhase === GAME_PHASES.START) {
    renderStartScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    renderPlayingScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    renderPlayingScreen(p);
    renderPauseOverlay(p);
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
             gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    renderGameOverScreen(p);
  }
}

function renderStartScreen(p) {
  p.push();
  
  // Title
  p.fill(138, 43, 226);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("TROVER SAVES", CANVAS_WIDTH / 2, 80);
  p.text("THE UNIVERSE", CANVAS_WIDTH / 2, 130);
  
  // Subtitle
  p.fill(255, 200);
  p.textSize(16);
  p.text("A Cosmic Comedy Adventure", CANVAS_WIDTH / 2, 170);
  
  // Story
  p.fill(200, 200, 255);
  p.textSize(12);
  p.textAlign(p.CENTER, p.TOP);
  const story = [
    "Your dogs have been dognapped by Glorkon,",
    "a beaked lunatic who stuffed them in his eye holes!",
    "",
    "Control Trover to traverse alien worlds,",
    "defeat enemies, and save the universe!"
  ];
  for (let i = 0; i < story.length; i++) {
    p.text(story[i], CANVAS_WIDTH / 2, 200 + i * 18);
  }
  
  // Instructions
  p.fill(255, 255, 150);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  p.text("CONTROLS:", 50, 300);
  p.fill(255);
  p.textSize(12);
  p.text("Arrow Keys: Move and Jump", 70, 320);
  p.text("Space: Shoot Energy Blast", 70, 335);
  p.text("Z: Dash (unlock with 3 gems)", 70, 350);
  
  // Start prompt
  p.fill(255, 255, 0);
  p.textSize(20);
  p.textAlign(p.CENTER);
  if (p.frameCount % 60 < 40) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 380);
  }
  
  p.pop();
}

function renderPlayingScreen(p) {
  p.push();
  
  // Update camera to follow player
  if (gameState.player) {
    const targetCameraX = gameState.player.x - CANVAS_WIDTH / 2;
    gameState.cameraOffsetX = p.constrain(targetCameraX, 0, gameState.worldWidth - CANVAS_WIDTH);
  }
  
  // Apply camera translation
  p.translate(-gameState.cameraOffsetX, 0);
  
  // Render background stars
  renderStarfield(p);
  
  // Render all entities
  for (let entity of gameState.entities) {
    if (entity && entity.render) {
      entity.render();
    }
  }
  
  // Render projectiles
  for (let projectile of gameState.projectiles) {
    if (projectile.active) {
      projectile.render();
    }
  }
  
  // Reset translation for UI
  p.translate(gameState.cameraOffsetX, 0);
  
  // Render UI
  renderUI(p);
  
  p.pop();
}

function renderStarfield(p) {
  p.push();
  p.fill(255, 255, 255, 150);
  p.noStroke();
  
  // Static stars based on world position
  for (let i = 0; i < 100; i++) {
    const x = (i * 137 + gameState.currentWorld * 50) % gameState.worldWidth;
    const y = (i * 217 + gameState.currentWorld * 30) % CANVAS_HEIGHT;
    const size = (i % 3) + 1;
    p.ellipse(x, y, size, size);
  }
  p.pop();
}

function renderUI(p) {
  p.push();
  
  // Health bar
  p.fill(50);
  p.rect(10, 10, 200, 20);
  const healthPercent = gameState.player ? gameState.player.health / gameState.player.maxHealth : 0;
  p.fill(...(healthPercent > 0.5 ? [0, 255, 0] : healthPercent > 0.25 ? [255, 255, 0] : [255, 0, 0]));
  p.rect(10, 10, 200 * healthPercent, 20);
  
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Health: ${Math.ceil(gameState.player ? gameState.player.health : 0)}`, 15, 13);
  
  // Score and stats
  p.text(`Score: ${gameState.score}`, 10, 40);
  p.text(`Gems: ${gameState.powerGemsCollected}`, 10, 55);
  p.text(`World: ${gameState.currentWorld}/3`, 10, 70);
  
  // Dash indicator
  if (gameState.dashUnlocked) {
    const dashReady = gameState.player && gameState.player.dashCooldown === 0;
    p.fill(...(dashReady ? [0, 255, 0] : [150, 150, 150]));
    p.text("DASH READY (Z)", 10, 85);
  }
  
  // World transition message
  if (gameState.worldTransitionTimer > 0) {
    p.fill(255, 255, 0);
    p.textSize(24);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(`ENTERING WORLD ${gameState.currentWorld}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  }
  
  p.pop();
}

function renderPauseOverlay(p) {
  p.push();
  p.fill(255);
  p.textSize(16);
  p.textAlign(p.RIGHT, p.TOP);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  p.pop();
}

function renderGameOverScreen(p) {
  p.push();
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Semi-transparent overlay
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Title
  p.fill(...(isWin ? [0, 255, 0] : [255, 0, 0]));
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "UNIVERSE SAVED!" : "GAME OVER", CANVAS_WIDTH / 2, 100);
  
  // Message
  p.fill(255);
  p.textSize(18);
  if (isWin) {
    p.text("You defeated Glorkon and rescued your dogs!", CANVAS_WIDTH / 2, 160);
    p.text("The universe is safe... for now.", CANVAS_WIDTH / 2, 185);
  } else {
    p.text("Glorkon's power was too great!", CANVAS_WIDTH / 2, 160);
    p.text("Your dogs remain trapped in his eye holes.", CANVAS_WIDTH / 2, 185);
  }
  
  // Stats
  p.textSize(16);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 230);
  p.text(`Power Gems Collected: ${gameState.powerGemsCollected}`, CANVAS_WIDTH / 2, 255);
  p.text(`Enemies Defeated: ${gameState.enemiesDefeated}`, CANVAS_WIDTH / 2, 280);
  
  // Restart prompt
  p.fill(255, 255, 0);
  p.textSize(20);
  if (p.frameCount % 60 < 40) {
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 340);
  }
  
  p.pop();
}