// player.js - Player entity and controls

import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  PLAYER_SIZE, 
  PLAYER_SPEED,
  BOOST_MULTIPLIER,
  MAX_CABLE_TWIST,
  UNTWIST_COST,
  UNTWIST_AMOUNT,
  OPTIMIZE_COST,
  OPTIMIZE_COOLDOWN,
  BOOST_ENERGY_COST,
  gameState
} from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = PLAYER_SIZE;
    this.vx = 0;
    this.vy = 0;
    this.rotation = 0;
  }
  
  update(p) {
    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;
    
    // Boundary constraints
    this.x = p.constrain(this.x, this.size / 2, CANVAS_WIDTH - this.size / 2);
    this.y = p.constrain(this.y, this.size / 2, CANVAS_HEIGHT - this.size / 2);
    
    // Track cable twist based on rotation
    if (this.vx !== 0 || this.vy !== 0) {
      const movementAngle = Math.atan2(this.vy, this.vx);
      const angleDiff = movementAngle - this.rotation;
      gameState.cableTwist += angleDiff * 2;
      this.rotation = movementAngle;
      
      // Clamp cable twist
      gameState.cableTwist = p.constrain(gameState.cableTwist, -MAX_CABLE_TWIST, MAX_CABLE_TWIST);
    }
    
    // Reset velocity
    this.vx = 0;
    this.vy = 0;
  }
  
  move(direction, p) {
    const speed = gameState.boostActive ? PLAYER_SPEED * BOOST_MULTIPLIER : PLAYER_SPEED;
    
    switch(direction) {
      case 'UP':
        this.vy = -speed;
        break;
      case 'DOWN':
        this.vy = speed;
        break;
      case 'LEFT':
        this.vx = -speed;
        break;
      case 'RIGHT':
        this.vx = speed;
        break;
    }
  }
  
  activateBoost() {
    if (gameState.energy > 0) {
      gameState.boostActive = true;
      return true;
    }
    return false;
  }
  
  deactivateBoost() {
    gameState.boostActive = false;
  }
  
  untwistCable() {
    if (gameState.energy >= UNTWIST_COST) {
      gameState.energy -= UNTWIST_COST;
      const direction = gameState.cableTwist > 0 ? -1 : 1;
      gameState.cableTwist += direction * UNTWIST_AMOUNT;
      gameState.cableTwist = Math.max(-MAX_CABLE_TWIST, Math.min(MAX_CABLE_TWIST, gameState.cableTwist));
      return true;
    }
    return false;
  }
  
  quickOptimize() {
    if (gameState.energy >= OPTIMIZE_COST && gameState.optimizeCooldown <= 0) {
      gameState.energy -= OPTIMIZE_COST;
      gameState.optimizeCooldown = OPTIMIZE_COOLDOWN;
      
      // Improve performance metrics
      gameState.currentFPS = Math.min(gameState.currentFPS + 10, 90);
      gameState.gpuTemp = Math.max(gameState.gpuTemp - 5, 45);
      gameState.cpuTemp = Math.max(gameState.cpuTemp - 5, 45);
      gameState.score += 50;
      
      return true;
    }
    return false;
  }
  
  draw(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // VR Headset representation
    // Main headset body
    p.fill(40, 50, 70);
    p.stroke(100, 120, 150);
    p.strokeWeight(2);
    p.rectMode(p.CENTER);
    p.rect(0, 0, this.size, this.size * 0.7, 5);
    
    // Lenses
    p.fill(150, 180, 220, 150);
    p.noStroke();
    p.circle(-this.size * 0.2, 0, this.size * 0.25);
    p.circle(this.size * 0.2, 0, this.size * 0.25);
    
    // Status indicator
    const statusColor = gameState.boostActive ? [0, 255, 100] : [100, 150, 255];
    p.fill(...statusColor);
    p.circle(0, -this.size * 0.25, 6);
    
    // Direction indicator
    p.fill(255, 200, 0);
    p.triangle(
      0, -this.size * 0.4,
      -5, -this.size * 0.25,
      5, -this.size * 0.25
    );
    
    p.pop();
  }
}

export function handlePlayerInput(p) {
  if (gameState.gamePhase !== "PLAYING" || !gameState.player) return;
  
  const player = gameState.player;
  
  // Movement
  if (p.keyIsDown(38)) { // UP
    player.move('UP', p);
  }
  if (p.keyIsDown(40)) { // DOWN
    player.move('DOWN', p);
  }
  if (p.keyIsDown(37)) { // LEFT
    player.move('LEFT', p);
  }
  if (p.keyIsDown(39)) { // RIGHT
    player.move('RIGHT', p);
  }
  
  // Boost (Space)
  if (p.keyIsDown(32)) {
    player.activateBoost();
  } else {
    player.deactivateBoost();
  }
}