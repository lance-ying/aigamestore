// entities.js - Game entity classes

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, Body, World } = Matter;

import { gameState, CANVAS_HEIGHT } from './globals.js';

export class Player {
  constructor(p, x, y) {
    this.p = p;
    this.body = Bodies.rectangle(x, y, 30, 40, {
      label: 'player',
      friction: 0.3,
      restitution: 0,
      density: 0.002,
      inertia: Infinity
    });
    World.add(gameState.world, this.body);
    
    this.color = [255, 220, 0]; // SpongeBob yellow
    this.width = 30;
    this.height = 40;
    this.jumpCount = 0;
    this.maxJumps = 1;
    this.onGround = false;
    this.attackCooldown = 0;
    this.lastLoggedX = x;
    this.lastLoggedY = y;
  }
  
  update() {
    // Clamp velocity
    const maxSpeed = 8;
    if (Math.abs(this.body.velocity.x) > maxSpeed) {
      Body.setVelocity(this.body, {
        x: Math.sign(this.body.velocity.x) * maxSpeed,
        y: this.body.velocity.y
      });
    }
    
    // Check if on ground
    this.checkGroundStatus();
    
    // Update max jumps based on abilities
    this.maxJumps = gameState.abilities.doubleJump ? 2 : 1;
    
    // Reset jump count when on ground
    if (this.onGround) {
      this.jumpCount = 0;
    }
    
    // Update attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown--;
    }
    
    // Update invincibility
    if (gameState.invincible) {
      gameState.invincibilityTimer--;
      if (gameState.invincibilityTimer <= 0) {
        gameState.invincible = false;
      }
    }
    
    // Check for hazard death (fall off screen)
    if (this.body.position.y > CANVAS_HEIGHT + 50) {
      this.respawnAtCheckpoint();
    }
    
    // Log player position if changed significantly
    const dx = Math.abs(this.body.position.x - this.lastLoggedX);
    const dy = Math.abs(this.body.position.y - this.lastLoggedY);
    if (dx > 50 || dy > 50) {
      this.p.logs.player_info.push({
        screen_x: this.body.position.x,
        screen_y: this.body.position.y,
        game_x: this.body.position.x,
        game_y: this.body.position.y,
        framecount: this.p.frameCount,
        timestamp: Date.now()
      });
      this.lastLoggedX = this.body.position.x;
      this.lastLoggedY = this.body.position.y;
    }
  }
  
  checkGroundStatus() {
    // Simple ground detection - check if velocity.y is near zero and not moving up
    this.onGround = Math.abs(this.body.velocity.y) < 0.5;
  }
  
  render() {
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    this.p.rotate(this.body.angle);
    
    // Flash if invincible
    if (gameState.invincible && this.p.frameCount % 10 < 5) {
      this.p.noFill();
    } else {
      this.p.fill(this.color[0], this.color[1], this.color[2]);
    }
    
    this.p.noStroke();
    this.p.rectMode(this.p.CENTER);
    this.p.rect(0, 0, this.width, this.height);
    
    // Draw face
    this.p.fill(0);
    this.p.circle(-6, -5, 6); // Left eye
    this.p.circle(6, -5, 6);  // Right eye
    this.p.fill(255, 200, 200);
    this.p.arc(0, 5, 15, 10, 0, this.p.PI); // Smile
    
    this.p.pop();
    
    // Draw attack effect if attacking
    if (this.attackCooldown > 20) {
      this.p.push();
      this.p.translate(this.body.position.x, this.body.position.y);
      this.p.fill(255, 255, 0, 150);
      this.p.noStroke();
      this.p.circle(25, 0, 30);
      this.p.pop();
    }
  }
  
  moveLeft() {
    Body.applyForce(this.body, this.body.position, { x: -0.003, y: 0 });
  }
  
  moveRight() {
    Body.applyForce(this.body, this.body.position, { x: 0.003, y: 0 });
  }
  
  jump() {
    if (this.jumpCount < this.maxJumps) {
      Body.setVelocity(this.body, { 
        x: this.body.velocity.x, 
        y: -10 
      });
      this.jumpCount++;
    }
  }
  
  karateKick() {
    if (!gameState.abilities.karateKick || this.attackCooldown > 0) return;
    
    this.attackCooldown = 30;
    
    // Check for barriers in range
    gameState.barriers.forEach((barrier, index) => {
      if (!barrier.body) return;
      
      const dx = barrier.body.position.x - this.body.position.x;
      const dy = barrier.body.position.y - this.body.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 60) {
        // Destroy barrier
        World.remove(gameState.world, barrier.body);
        barrier.destroyed = true;
      }
    });
    
    // Remove destroyed barriers
    gameState.barriers = gameState.barriers.filter(b => !b.destroyed);
  }
  
  hookSwing() {
    if (!gameState.abilities.hookSwing) return;
    
    // Check for swing points in range
    for (let swing of gameState.swingPoints) {
      const dx = swing.x - this.body.position.x;
      const dy = swing.y - this.body.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 80) {
        // Apply swing force
        Body.setVelocity(this.body, { 
          x: 12, 
          y: -6 
        });
        return;
      }
    }
  }
  
  respawnAtCheckpoint() {
    gameState.health--;
    
    if (gameState.health <= 0) {
      gameState.gamePhase = "GAME_OVER_LOSE";
      this.p.logs.game_info.push({
        data: { gamePhase: "GAME_OVER_LOSE", reason: "health_depleted" },
        framecount: this.p.frameCount,
        timestamp: Date.now()
      });
      return;
    }
    
    // Respawn at checkpoint
    Body.setPosition(this.body, {
      x: gameState.lastCheckpoint.x,
      y: gameState.lastCheckpoint.y
    });
    Body.setVelocity(this.body, { x: 0, y: 0 });
    Body.setAngle(this.body, 0);
    
    gameState.invincible = true;
    gameState.invincibilityTimer = 120;
  }
  
  takeDamage() {
    if (gameState.invincible) return;
    
    gameState.health--;
    gameState.invincible = true;
    gameState.invincibilityTimer = 120;
    
    if (gameState.health <= 0) {
      gameState.gamePhase = "GAME_OVER_LOSE";
      this.p.logs.game_info.push({
        data: { gamePhase: "GAME_OVER_LOSE", reason: "health_depleted" },
        framecount: this.p.frameCount,
        timestamp: Date.now()
      });
    }
  }
}

export class Platform {
  constructor(p, x, y, width, height, isStatic = true) {
    this.p = p;
    this.body = Bodies.rectangle(x, y, width, height, {
      label: 'platform',
      isStatic: isStatic,
      friction: 1,
      restitution: 0
    });
    World.add(gameState.world, this.body);
    
    this.color = [100, 200, 100];
    this.width = width;
    this.height = height;
  }
  
  render() {
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    this.p.rotate(this.body.angle);
    
    this.p.fill(this.color[0], this.color[1], this.color[2]);
    this.p.noStroke();
    this.p.rectMode(this.p.CENTER);
    this.p.rect(0, 0, this.width, this.height);
    
    // Add texture
    this.p.stroke(80, 160, 80);
    for (let i = -this.width/2; i < this.width/2; i += 20) {
      this.p.line(i, -this.height/2, i, this.height/2);
    }
    
    this.p.pop();
  }
}

export class Enemy {
  constructor(p, x, y, type = 'basic') {
    this.p = p;
    this.type = type;
    this.body = Bodies.circle(x, y, 15, {
      label: 'enemy',
      friction: 0.5,
      restitution: 0.3,
      density: 0.001
    });
    World.add(gameState.world, this.body);
    
    this.color = [200, 50, 50];
    this.radius = 15;
    this.patrolSpeed = 2;
    this.direction = 1;
    this.patrolRange = 100;
    this.startX = x;
  }
  
  update() {
    // Simple patrol AI
    if (this.body.position.x > this.startX + this.patrolRange) {
      this.direction = -1;
    } else if (this.body.position.x < this.startX - this.patrolRange) {
      this.direction = 1;
    }
    
    Body.setVelocity(this.body, {
      x: this.patrolSpeed * this.direction,
      y: this.body.velocity.y
    });
  }
  
  render() {
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    
    this.p.fill(this.color[0], this.color[1], this.color[2]);
    this.p.noStroke();
    this.p.circle(0, 0, this.radius * 2);
    
    // Draw angry eyes
    this.p.fill(255, 0, 0);
    this.p.circle(-5, -3, 5);
    this.p.circle(5, -3, 5);
    
    this.p.pop();
  }
}

export class Coin {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.radius = 8;
    this.collected = false;
    this.rotation = 0;
  }
  
  update() {
    if (this.collected) return;
    
    this.rotation += 0.1;
    
    // Check collision with player
    if (gameState.player) {
      const dx = this.x - gameState.player.body.position.x;
      const dy = this.y - gameState.player.body.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < this.radius + 20) {
        this.collect();
      }
    }
  }
  
  collect() {
    this.collected = true;
    gameState.score += 10;
    
    // Check for ability unlocks
    if (!gameState.abilities.karateKick && gameState.score >= gameState.abilityThresholds.karateKick) {
      gameState.abilities.karateKick = true;
      this.p.logs.game_info.push({
        data: { event: "ability_unlocked", ability: "karateKick" },
        framecount: this.p.frameCount,
        timestamp: Date.now()
      });
    }
    
    if (!gameState.abilities.doubleJump && gameState.score >= gameState.abilityThresholds.doubleJump) {
      gameState.abilities.doubleJump = true;
      this.p.logs.game_info.push({
        data: { event: "ability_unlocked", ability: "doubleJump" },
        framecount: this.p.frameCount,
        timestamp: Date.now()
      });
    }
    
    if (!gameState.abilities.hookSwing && gameState.score >= gameState.abilityThresholds.hookSwing) {
      gameState.abilities.hookSwing = true;
      this.p.logs.game_info.push({
        data: { event: "ability_unlocked", ability: "hookSwing" },
        framecount: this.p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  render() {
    if (this.collected) return;
    
    this.p.push();
    this.p.translate(this.x, this.y);
    this.p.rotate(this.rotation);
    
    this.p.fill(255, 215, 0);
    this.p.stroke(180, 140, 0);
    this.p.strokeWeight(2);
    this.p.circle(0, 0, this.radius * 2);
    
    this.p.fill(180, 140, 0);
    this.p.noStroke();
    this.p.textAlign(this.p.CENTER, this.p.CENTER);
    this.p.textSize(10);
    this.p.text('$', 0, 0);
    
    this.p.pop();
  }
}

export class Barrier {
  constructor(p, x, y, width, height) {
    this.p = p;
    this.body = Bodies.rectangle(x, y, width, height, {
      label: 'barrier',
      isStatic: true,
      friction: 0
    });
    World.add(gameState.world, this.body);
    
    this.color = [150, 100, 200];
    this.width = width;
    this.height = height;
    this.destroyed = false;
  }
  
  render() {
    if (this.destroyed) return;
    
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    
    this.p.fill(this.color[0], this.color[1], this.color[2]);
    this.p.stroke(100, 60, 150);
    this.p.strokeWeight(2);
    this.p.rectMode(this.p.CENTER);
    this.p.rect(0, 0, this.width, this.height);
    
    // Draw X pattern
    this.p.stroke(180, 150, 220);
    this.p.line(-this.width/2, -this.height/2, this.width/2, this.height/2);
    this.p.line(this.width/2, -this.height/2, -this.width/2, this.height/2);
    
    this.p.pop();
  }
}

export class Checkpoint {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.activated = false;
    this.width = 30;
    this.height = 60;
  }
  
  update() {
    if (this.activated) return;
    
    if (gameState.player) {
      const dx = this.x - gameState.player.body.position.x;
      const dy = this.y - gameState.player.body.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 40) {
        this.activate();
      }
    }
  }
  
  activate() {
    this.activated = true;
    gameState.lastCheckpoint = { x: this.x, y: this.y };
    
    this.p.logs.game_info.push({
      data: { event: "checkpoint_activated", x: this.x, y: this.y },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }
  
  render() {
    this.p.push();
    this.p.translate(this.x, this.y);
    
    if (this.activated) {
      this.p.fill(0, 255, 0);
    } else {
      this.p.fill(100, 100, 100);
    }
    
    this.p.noStroke();
    this.p.rectMode(this.p.CENTER);
    this.p.rect(0, 0, this.width, this.height);
    
    // Flag
    this.p.fill(255, 255, 0);
    this.p.triangle(0, -30, 0, -10, 20, -20);
    
    this.p.pop();
  }
}

export class Portal {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.radius = 40;
    this.rotation = 0;
  }
  
  update() {
    this.rotation += 0.05;
    
    // Check if player reached portal with all abilities
    if (gameState.player) {
      const dx = this.x - gameState.player.body.position.x;
      const dy = this.y - gameState.player.body.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < this.radius + 20) {
        // Check if player has collected enough and has abilities
        if (gameState.abilities.doubleJump && 
            gameState.abilities.hookSwing && 
            gameState.abilities.karateKick) {
          this.triggerWin();
        }
      }
    }
  }
  
  triggerWin() {
    gameState.gamePhase = "GAME_OVER_WIN";
    this.p.logs.game_info.push({
      data: { 
        gamePhase: "GAME_OVER_WIN", 
        score: gameState.score,
        abilities: gameState.abilities 
      },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }
  
  render() {
    this.p.push();
    this.p.translate(this.x, this.y);
    this.p.rotate(this.rotation);
    
    // Swirling portal effect
    for (let i = 0; i < 3; i++) {
      this.p.noFill();
      this.p.stroke(100 + i * 50, 150 + i * 30, 255);
      this.p.strokeWeight(3);
      this.p.circle(0, 0, this.radius - i * 10);
    }
    
    this.p.fill(50, 100, 200, 150);
    this.p.noStroke();
    this.p.circle(0, 0, this.radius - 20);
    
    this.p.pop();
  }
}

export class SwingPoint {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.rotation = 0;
  }
  
  update() {
    this.rotation += 0.02;
  }
  
  render() {
    this.p.push();
    this.p.translate(this.x, this.y);
    
    // Hook attachment
    this.p.fill(100, 100, 100);
    this.p.noStroke();
    this.p.circle(0, 0, 10);
    
    // Rope indicator
    this.p.stroke(150, 100, 50);
    this.p.strokeWeight(2);
    this.p.line(0, 0, 0, 20);
    
    // Hook
    this.p.push();
    this.p.translate(0, 20);
    this.p.rotate(this.rotation);
    this.p.fill(180, 180, 180);
    this.p.noStroke();
    this.p.arc(0, 0, 20, 20, 0, this.p.PI);
    this.p.pop();
    
    this.p.pop();
  }
}