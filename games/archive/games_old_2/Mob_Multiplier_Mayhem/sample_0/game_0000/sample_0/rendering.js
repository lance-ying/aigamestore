import { gameState, GAME_PHASES, CANNON_CONFIG, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderGame(p) {
  p.background(30, 30, 30);

  if (gameState.gamePhase === GAME_PHASES.START) {
    renderStartScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    renderPlayingScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    renderPlayingScreen(p);
    renderPausedOverlay(p);
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
             gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    renderGameOverScreen(p);
  }
}

function renderStartScreen(p) {
  p.push();
  
  // Title
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("MOB MULTIPLIER MAYHEM", CANVAS_WIDTH / 2, 80);
  
  // Description
  p.fill(200);
  p.textSize(14);
  p.text("Fire projectiles through multiplier gates", CANVAS_WIDTH / 2, 140);
  p.text("to spawn units that attack the enemy base!", CANVAS_WIDTH / 2, 160);
  
  // Instructions
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    "CONTROLS:",
    "← → : Aim cannon",
    "SPACE: Fire projectile",
    "SHIFT: Deploy Tank Champion",
    "Z: Deploy Speed Champion",
    "",
    "ESC: Pause game",
    "R: Restart to menu"
  ];
  
  let yPos = 200;
  for (const line of instructions) {
    p.text(line, 150, yPos);
    yPos += 18;
  }
  
  // Objective
  p.fill(100, 200, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  p.text("Destroy the enemy base before time runs out!", CANVAS_WIDTH / 2, 340);
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textSize(18);
  const flash = Math.floor(p.frameCount / 30) % 2 === 0;
  if (flash) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
  }
  
  p.pop();
}

function renderPlayingScreen(p) {
  // Render speed boost zones
  p.push();
  p.fill(50, 150, 200, 50);
  p.noStroke();
  for (const zone of gameState.speedBoostZones) {
    p.rect(zone.x, zone.y, zone.width, zone.height);
    
    // Particle effect
    if (p.frameCount % 5 === 0) {
      p.fill(100, 200, 255, 100);
      for (let i = 0; i < 3; i++) {
        const px = zone.x + p.random(zone.width);
        const py = zone.y + zone.height - p.random(20);
        p.circle(px, py, 3);
      }
    }
  }
  p.pop();

  // Render obstacles
  p.push();
  p.fill(150, 150, 150);
  p.stroke(100);
  p.strokeWeight(2);
  for (const obs of gameState.obstacles) {
    p.rect(obs.x, obs.y, obs.width, obs.height);
    if (obs.destructible) {
      p.fill(180, 150, 100);
      p.rect(obs.x, obs.y, obs.width, obs.height);
      p.fill(150, 150, 150);
    }
  }
  p.pop();

  // Render gates
  for (const gate of gameState.gates) {
    gate.render();
  }

  // Render enemy base
  if (gameState.enemyBase) {
    gameState.enemyBase.render();
  }

  // Render entities
  for (const proj of gameState.projectiles) {
    proj.render();
  }
  
  for (const mob of gameState.mobUnits) {
    mob.render();
  }
  
  for (const champion of gameState.champions) {
    champion.render();
  }

  // Render cannon
  renderCannon(p);

  // Render UI
  renderUI(p);
}

function renderCannon(p) {
  p.push();
  
  const angle = gameState.cannonAngle;
  
  // Base
  p.fill(80, 80, 80);
  p.noStroke();
  p.circle(CANNON_CONFIG.x, CANNON_CONFIG.y, CANNON_CONFIG.width * 1.5);
  
  // Barrel
  p.push();
  p.translate(CANNON_CONFIG.x, CANNON_CONFIG.y);
  p.rotate(angle);
  p.fill(100, 100, 100);
  p.stroke(70);
  p.strokeWeight(2);
  p.rect(0, -CANNON_CONFIG.width / 2, CANNON_CONFIG.length, CANNON_CONFIG.width);
  p.pop();
  
  p.pop();
}

function renderUI(p) {
  p.push();
  
  // Score
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
  
  // Level
  p.textAlign(p.LEFT, p.TOP);
  p.text(`LEVEL: ${gameState.currentLevel}`, 10, 10);
  
  // Timer
  p.textAlign(p.CENTER, p.TOP);
  const timerColor = gameState.levelTimer < 20 ? [255, 100, 100] : [255, 255, 255];
  p.fill(...timerColor);
  p.text(`TIME: ${Math.ceil(gameState.levelTimer)}s`, CANVAS_WIDTH / 2, 10);
  
  // Champion icons
  if (gameState.levelConfig) {
    const iconSize = 40;
    const iconY = CANVAS_HEIGHT - iconSize - 10;
    
    // Tank champion
    if (gameState.levelConfig.championAvailable.tank) {
      const tankX = 10;
      const tankCooldown = gameState.championCooldowns.tank;
      
      p.fill(200, 50, 50);
      p.stroke(255);
      p.strokeWeight(2);
      p.rect(tankX, iconY, iconSize, iconSize);
      
      p.fill(255);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(20);
      p.text("T", tankX + iconSize / 2, iconY + iconSize / 2);
      
      // Cooldown overlay
      if (tankCooldown > 0) {
        const cooldownPercent = tankCooldown / gameState.levelConfig.championCooldowns.tank;
        p.fill(0, 0, 0, 150);
        p.rect(tankX, iconY, iconSize, iconSize * cooldownPercent);
        
        p.fill(255);
        p.textSize(14);
        p.text(Math.ceil(tankCooldown), tankX + iconSize / 2, iconY + iconSize / 2);
      }
      
      p.fill(200);
      p.textSize(10);
      p.text("SHIFT", tankX + iconSize / 2, iconY + iconSize + 8);
    }
    
    // Speed champion
    if (gameState.levelConfig.championAvailable.speed) {
      const speedX = 60;
      const speedCooldown = gameState.championCooldowns.speed;
      
      p.fill(50, 200, 50);
      p.stroke(255);
      p.strokeWeight(2);
      p.rect(speedX, iconY, iconSize, iconSize);
      
      p.fill(255);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(20);
      p.text("S", speedX + iconSize / 2, iconY + iconSize / 2);
      
      // Cooldown overlay
      if (speedCooldown > 0) {
        const cooldownPercent = speedCooldown / gameState.levelConfig.championCooldowns.speed;
        p.fill(0, 0, 0, 150);
        p.rect(speedX, iconY, iconSize, iconSize * cooldownPercent);
        
        p.fill(255);
        p.textSize(14);
        p.text(Math.ceil(speedCooldown), speedX + iconSize / 2, iconY + iconSize / 2);
      }
      
      p.fill(200);
      p.textSize(10);
      p.text("Z", speedX + iconSize / 2, iconY + iconSize + 8);
    }
  }
  
  p.pop();
}

function renderPausedOverlay(p) {
  p.push();
  
  // Semi-transparent overlay
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Paused text
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  
  p.textSize(18);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  p.text("Press R to restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
  
  p.pop();
}

function renderGameOverScreen(p) {
  p.push();
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Background
  p.background(30, 30, 30);
  
  // Title
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "VICTORY!" : "GAME OVER", CANVAS_WIDTH / 2, 120);
  
  // Message
  p.fill(255);
  p.textSize(20);
  if (isWin) {
    p.text("You destroyed all enemy bases!", CANVAS_WIDTH / 2, 180);
    p.text(`Completed all ${gameState.currentLevel} levels!`, CANVAS_WIDTH / 2, 210);
  } else {
    p.text("Time ran out!", CANVAS_WIDTH / 2, 180);
    p.text(`Reached Level ${gameState.currentLevel}`, CANVAS_WIDTH / 2, 210);
  }
  
  // Score
  p.fill(255, 220, 100);
  p.textSize(32);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 260);
  
  // Instructions
  p.fill(200);
  p.textSize(18);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 330);
  
  p.pop();
}