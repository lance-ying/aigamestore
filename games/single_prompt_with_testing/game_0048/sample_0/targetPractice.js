// targetPractice.js - Target practice mode logic

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_GAME_OVER_WIN } from './globals.js';
import { Target, Bullet, Particle } from './entities.js';
import { renderCrosshair } from './crosshair.js';

export function initTargetPractice(p) {
  gameState.targets = [];
  gameState.bullets = [];
  gameState.entities = [];
  gameState.score = 0;
  gameState.hits = 0;
  gameState.shots = 0;
  gameState.targetsDestroyed = 0;
  gameState.lastShotTime = 0;
  
  // Spawn initial targets
  spawnTarget(p);
  spawnTarget(p);
}

function spawnTarget(p) {
  const edge = Math.floor(Math.random() * 4);
  let x, y;
  
  switch (edge) {
    case 0: // Top
      x = Math.random() * CANVAS_WIDTH;
      y = 20;
      break;
    case 1: // Right
      x = CANVAS_WIDTH - 20;
      y = Math.random() * CANVAS_HEIGHT;
      break;
    case 2: // Bottom
      x = Math.random() * CANVAS_WIDTH;
      y = CANVAS_HEIGHT - 20;
      break;
    case 3: // Left
      x = 20;
      y = Math.random() * CANVAS_HEIGHT;
      break;
  }
  
  const speed = 1.5 + Math.random() * 1.5 + gameState.targetsDestroyed * 0.1;
  const size = 15 + Math.random() * 10;
  
  const target = new Target(x, y, speed, size);
  gameState.targets.push(target);
  gameState.entities.push(target);
}

export function updateTargetPractice(p) {
  // Update player
  if (gameState.player) {
    gameState.player.update(p);
  }
  
  // Update targets
  gameState.targets.forEach(target => {
    target.update(p);
  });
  
  // Update bullets
  gameState.bullets = gameState.bullets.filter(bullet => {
    bullet.update(p);
    
    if (!bullet.alive) return false;
    
    // Check collision with targets
    let hit = false;
    gameState.targets.forEach(target => {
      if (target.checkHit(bullet.x, bullet.y, p)) {
        target.destroy();
        bullet.alive = false;
        hit = true;
        gameState.score += 100;
        gameState.hits++;
        gameState.targetsDestroyed++;
        
        // Create particles
        createHitParticles(p, target.x, target.y);
        
        // Spawn new target
        setTimeout(() => spawnTarget(p), 500);
      }
    });
    
    return bullet.alive;
  });
  
  // Remove dead targets
  gameState.targets = gameState.targets.filter(t => t.alive);
  
  // Update particles
  gameState.entities = gameState.entities.filter(entity => {
    if (entity instanceof Particle) {
      entity.update();
      return entity.alive;
    }
    return true;
  });
  
  // Check win condition
  if (gameState.targetsDestroyed >= gameState.requiredHits) {
    gameState.gamePhase = PHASE_GAME_OVER_WIN;
  }
  
  // Spawn more targets if needed
  if (gameState.targets.length < 3 && gameState.targetsDestroyed < gameState.requiredHits) {
    if (Math.random() < 0.02) {
      spawnTarget(p);
    }
  }
}

function createHitParticles(p, x, y) {
  for (let i = 0; i < 12; i++) {
    const angle = (Math.PI * 2 * i) / 12;
    const speed = 2 + Math.random() * 3;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    const color = [255, 200 - Math.random() * 100, 50 + Math.random() * 50];
    const life = 30 + Math.random() * 20;
    const particle = new Particle(x, y, vx, vy, color, life);
    gameState.entities.push(particle);
  }
}

export function renderTargetPractice(p) {
  // Background gradient
  for (let y = 0; y < CANVAS_HEIGHT; y += 2) {
    const inter = y / CANVAS_HEIGHT;
    const c = p.lerpColor(p.color(25, 30, 45), p.color(45, 50, 70), inter);
    p.stroke(c);
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Grid background
  p.stroke(40, 45, 60, 100);
  p.strokeWeight(1);
  for (let x = 0; x < CANVAS_WIDTH; x += 40) {
    p.line(x, 0, x, CANVAS_HEIGHT);
  }
  for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Render entities
  gameState.entities.forEach(entity => {
    entity.render(p);
  });
  
  // Render bullets
  gameState.bullets.forEach(bullet => {
    bullet.render(p);
  });
  
  // Render player
  if (gameState.player) {
    gameState.player.render(p);
  }
  
  // Render crosshair at player position
  if (gameState.player) {
    renderCrosshair(p, gameState.player.x, gameState.player.y);
  }
  
  // HUD
  renderHUD(p);
}

function renderHUD(p) {
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  
  // Score
  p.fill(255, 220, 100);
  p.text(`Score: ${gameState.score}`, 10, 10);
  
  // Hits
  p.fill(100, 255, 150);
  p.text(`Targets: ${gameState.targetsDestroyed} / ${gameState.requiredHits}`, 10, 30);
  
  // Accuracy
  const accuracy = gameState.shots > 0 ? Math.round((gameState.hits / gameState.shots) * 100) : 0;
  p.fill(255, 150, 255);
  p.text(`Accuracy: ${accuracy}%`, 10, 50);
  
  // Mode indicator
  p.textAlign(p.RIGHT, p.TOP);
  p.fill(150, 200, 255);
  p.textSize(12);
  p.text("TARGET PRACTICE", CANVAS_WIDTH - 10, 10);
  p.text("Press Z for Designer", CANVAS_WIDTH - 10, 26);
}

export function handleTargetPracticeInput(keyCode, p) {
  if (!gameState.player) return;
  
  // Shooting
  if (keyCode === 32) { // Space
    const currentTime = Date.now();
    if (currentTime - gameState.lastShotTime > gameState.shotCooldown) {
      shoot(p);
      gameState.lastShotTime = currentTime;
    }
  }
}

export function handleTargetPracticeContinuousInput(p) {
  if (!gameState.player) return;
  
  // Movement
  if (p.keyIsDown(37)) { // Left
    gameState.player.moveLeft();
  }
  if (p.keyIsDown(39)) { // Right
    gameState.player.moveRight();
  }
  if (p.keyIsDown(38)) { // Up
    gameState.player.moveUp();
  }
  if (p.keyIsDown(40)) { // Down
    gameState.player.moveDown();
  }
}

function shoot(p) {
  if (!gameState.player) return;
  
  // Find closest target
  let closestTarget = null;
  let closestDist = Infinity;
  
  gameState.targets.forEach(target => {
    const dist = p.dist(gameState.player.x, gameState.player.y, target.x, target.y);
    if (dist < closestDist) {
      closestDist = dist;
      closestTarget = target;
    }
  });
  
  if (closestTarget) {
    const bullet = new Bullet(
      gameState.player.x,
      gameState.player.y,
      closestTarget.x,
      closestTarget.y
    );
    gameState.bullets.push(bullet);
    gameState.shots++;
  }
}