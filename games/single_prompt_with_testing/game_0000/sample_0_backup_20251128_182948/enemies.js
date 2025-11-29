// enemies.js - Enemy classes

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class Enemy {
  constructor(p, x, y, room) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 20;
    this.vx = 0;
    this.vy = 0;
    this.health = 2;
    this.maxHealth = 2;
    this.room = room;
    this.dead = false;
    this.type = 'enemy';
    this.ai = 'patrol';
    this.patrolDirection = 1;
    this.patrolTimer = 0;
    this.animFrame = 0;
    this.animTimer = 0;
  }

  update() {
    if (this.dead) return;
    
    this.animTimer++;
    if (this.animTimer % 10 === 0) {
      this.animFrame = (this.animFrame + 1) % 3;
    }
    
    // Apply gravity
    this.vy += 0.3;
    if (this.vy > 8) this.vy = 8;
    
    // AI behavior
    if (this.ai === 'patrol') {
      this.patrolTimer++;
      if (this.patrolTimer > 60 || this.x < 10 || this.x > CANVAS_WIDTH - 30) {
        this.patrolDirection *= -1;
        this.patrolTimer = 0;
      }
      this.vx = this.patrolDirection * 1;
    } else if (this.ai === 'fly') {
      // Flying enemies
      const player = gameState.player;
      if (player && player.y < CANVAS_HEIGHT && this.room === gameState.currentRoom) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > 0 && dist < 150) {
          this.vx = (dx / dist) * 1.5;
          this.vy = (dy / dist) * 1.5;
        }
      }
    }
    
    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;
    
    // Platform collision for patrol enemies
    if (this.ai === 'patrol') {
      this.checkPlatformCollisions();
    }
    
    // Damage player on contact
    if (this.room === gameState.currentRoom) {
      const player = gameState.player;
      if (player && !player.invulnerable) {
        const dist = this.p.dist(this.x + this.width/2, this.y + this.height/2,
                                 player.x + player.width/2, player.y + player.height/2);
        if (dist < 20) {
          player.takeDamage(1);
        }
      }
    }
  }

  checkPlatformCollisions() {
    for (let platform of gameState.platforms) {
      if (platform.room !== this.room) continue;
      
      if (this.vy >= 0) {
        if (this.x + this.width > platform.x && 
            this.x < platform.x + platform.width &&
            this.y + this.height >= platform.y &&
            this.y + this.height <= platform.y + platform.height + this.vy) {
          this.y = platform.y - this.height;
          this.vy = 0;
        }
      }
    }
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.dead = true;
      gameState.score += 10;
      this.createDeathParticles();
    }
  }

  createDeathParticles() {
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * this.p.TWO_PI;
      const particle = {
        x: this.x + this.width/2,
        y: this.y + this.height/2,
        vx: Math.cos(angle) * 2,
        vy: Math.sin(angle) * 2 - 1,
        life: 30,
        maxLife: 30,
        room: this.room
      };
      gameState.particles.push(particle);
    }
  }

  render() {
    if (this.dead) return;
    
    this.p.push();
    
    // Infected glow
    this.p.fill(255, 140, 0, 100);
    this.p.noStroke();
    this.p.ellipse(this.x + this.width/2, this.y + this.height/2, 
                   this.width + 6, this.height + 6);
    
    // Body
    this.p.fill(80, 60, 40);
    this.p.ellipse(this.x + this.width/2, this.y + this.height/2, 
                   this.width, this.height);
    
    // Infected eyes
    this.p.fill(255, 120, 0);
    const eyeOffset = this.animFrame % 2;
    this.p.ellipse(this.x + 6, this.y + 8 + eyeOffset, 4, 5);
    this.p.ellipse(this.x + 14, this.y + 8 + eyeOffset, 4, 5);
    
    // Antennae or legs
    this.p.stroke(80, 60, 40);
    this.p.strokeWeight(2);
    this.p.noFill();
    if (this.ai === 'fly') {
      // Wings
      this.p.arc(this.x, this.y + this.height/2, 10, 8, 0, this.p.PI);
      this.p.arc(this.x + this.width, this.y + this.height/2, 10, 8, 0, this.p.PI);
    } else {
      // Legs
      this.p.line(this.x + 5, this.y + this.height, this.x + 3, this.y + this.height + 4);
      this.p.line(this.x + 15, this.y + this.height, this.x + 17, this.y + this.height + 4);
    }
    
    this.p.pop();
  }
}

export class Boss {
  constructor(p, x, y, room, type) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = 60;
    this.height = 60;
    this.vx = 0;
    this.vy = 0;
    this.health = 20;
    this.maxHealth = 20;
    this.room = room;
    this.dead = false;
    this.type = type; // 'guardian' or 'corrupted_heart'
    this.phase = 1;
    this.attackTimer = 0;
    this.moveTimer = 0;
    this.animFrame = 0;
    this.animTimer = 0;
  }

  update() {
    if (this.dead) return;
    
    this.animTimer++;
    if (this.animTimer % 5 === 0) {
      this.animFrame = (this.animFrame + 1) % 4;
    }
    
    this.attackTimer++;
    this.moveTimer++;
    
    const player = gameState.player;
    if (!player || this.room !== gameState.currentRoom) return;
    
    if (this.type === 'guardian') {
      this.updateGuardian(player);
    } else if (this.type === 'corrupted_heart') {
      this.updateCorruptedHeart(player);
    }
    
    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;
    
    // Bounds
    if (this.x < 50) this.x = 50;
    if (this.x > CANVAS_WIDTH - 50 - this.width) this.x = CANVAS_WIDTH - 50 - this.width;
    if (this.y < 50) this.y = 50;
    if (this.y > CANVAS_HEIGHT - 100) this.y = CANVAS_HEIGHT - 100;
    
    // Contact damage
    if (!player.invulnerable) {
      const dist = this.p.dist(this.x + this.width/2, this.y + this.height/2,
                               player.x + player.width/2, player.y + player.height/2);
      if (dist < 40) {
        player.takeDamage(1);
      }
    }
  }

  updateGuardian(player) {
    // Phase transition
    if (this.health < this.maxHealth / 2 && this.phase === 1) {
      this.phase = 2;
    }
    
    // Movement pattern
    if (this.moveTimer > 120) {
      this.moveTimer = 0;
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist > 0) {
        this.vx = (dx / dist) * 2;
        this.vy = (dy / dist) * 2;
      }
    } else if (this.moveTimer > 60) {
      this.vx *= 0.95;
      this.vy *= 0.95;
    }
    
    // Attack pattern
    if (this.attackTimer > (this.phase === 1 ? 90 : 60)) {
      this.attackTimer = 0;
      this.spawnProjectiles(player);
    }
  }

  updateCorruptedHeart(player) {
    // Final boss - more complex patterns
    if (this.health < this.maxHealth / 2 && this.phase === 1) {
      this.phase = 2;
    }
    
    // Circular movement
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2 - 50;
    const radius = 80;
    const angle = this.moveTimer * 0.02;
    
    const targetX = centerX + Math.cos(angle) * radius - this.width/2;
    const targetY = centerY + Math.sin(angle) * radius - this.height/2;
    
    this.vx = (targetX - this.x) * 0.05;
    this.vy = (targetY - this.y) * 0.05;
    
    // Attack pattern
    const attackInterval = this.phase === 1 ? 80 : 50;
    if (this.attackTimer > attackInterval) {
      this.attackTimer = 0;
      this.spawnRadialProjectiles();
    }
  }

  spawnProjectiles(player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    
    if (dist > 0) {
      const proj = {
        x: this.x + this.width/2,
        y: this.y + this.height/2,
        vx: (dx / dist) * 3,
        vy: (dy / dist) * 3,
        width: 10,
        height: 10,
        room: this.room,
        dead: false,
        lifetime: 180,
        type: 'enemy_projectile'
      };
      gameState.projectiles.push(proj);
    }
  }

  spawnRadialProjectiles() {
    const numProj = this.phase === 1 ? 6 : 8;
    for (let i = 0; i < numProj; i++) {
      const angle = (i / numProj) * this.p.TWO_PI;
      const proj = {
        x: this.x + this.width/2,
        y: this.y + this.height/2,
        vx: Math.cos(angle) * 2.5,
        vy: Math.sin(angle) * 2.5,
        width: 10,
        height: 10,
        room: this.room,
        dead: false,
        lifetime: 180,
        type: 'enemy_projectile'
      };
      gameState.projectiles.push(proj);
    }
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.dead = true;
      gameState.score += 500;
      gameState.defeatedBosses.push(this.type);
      
      // Unlock abilities
      if (this.type === 'guardian') {
        gameState.unlockedAbilities.spell = true;
      }
      
      // Check win condition
      if (this.type === 'corrupted_heart') {
        gameState.gamePhase = "GAME_OVER_WIN";
      }
      
      this.createDeathParticles();
    }
  }

  createDeathParticles() {
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * this.p.TWO_PI;
      const speed = 2 + Math.random() * 2;
      const particle = {
        x: this.x + this.width/2,
        y: this.y + this.height/2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 60,
        maxLife: 60,
        room: this.room
      };
      gameState.particles.push(particle);
    }
  }

  render() {
    if (this.dead) return;
    
    this.p.push();
    
    // Corruption aura
    const glowSize = 80 + Math.sin(this.animFrame * 0.5) * 10;
    this.p.fill(255, 100, 0, 80);
    this.p.noStroke();
    this.p.ellipse(this.x + this.width/2, this.y + this.height/2, glowSize, glowSize);
    
    if (this.type === 'guardian') {
      this.renderGuardian();
    } else if (this.type === 'corrupted_heart') {
      this.renderCorruptedHeart();
    }
    
    // Health bar
    this.p.fill(40, 40, 50);
    this.p.rect(this.x, this.y - 15, this.width, 6);
    this.p.fill(255, 50, 50);
    this.p.rect(this.x, this.y - 15, this.width * (this.health / this.maxHealth), 6);
    
    this.p.pop();
  }

  renderGuardian() {
    // Armored knight boss
    this.p.fill(60, 60, 70);
    this.p.rect(this.x + 10, this.y + 10, 40, 45, 5);
    
    // Helmet
    this.p.fill(80, 80, 90);
    this.p.arc(this.x + 30, this.y + 20, 35, 35, this.p.PI, this.p.TWO_PI);
    
    // Visor
    this.p.fill(255, 80, 0);
    this.p.rect(this.x + 15, this.y + 20, 30, 8);
    
    // Shoulder plates
    this.p.fill(70, 70, 80);
    this.p.ellipse(this.x + 10, this.y + 25, 15, 15);
    this.p.ellipse(this.x + 50, this.y + 25, 15, 15);
    
    // Corruption tendrils
    this.p.stroke(255, 100, 0, 150);
    this.p.strokeWeight(2);
    this.p.noFill();
    for (let i = 0; i < 3; i++) {
      const waveOffset = Math.sin(this.animTimer * 0.1 + i) * 5;
      this.p.beginShape();
      this.p.vertex(this.x + 20 + i * 10, this.y + 55);
      this.p.vertex(this.x + 20 + i * 10 + waveOffset, this.y + 65);
      this.p.endShape();
    }
  }

  renderCorruptedHeart() {
    // Pulsating corrupted heart
    const pulse = Math.sin(this.animTimer * 0.15) * 5;
    
    // Outer corruption
    this.p.fill(200, 80, 0, 150);
    this.p.noStroke();
    this.p.ellipse(this.x + this.width/2, this.y + this.height/2, 
                   this.width + pulse, this.height + pulse);
    
    // Heart shape
    this.p.fill(150, 30, 30);
    this.p.ellipse(this.x + 20, this.y + 20, 25 + pulse/2, 25 + pulse/2);
    this.p.ellipse(this.x + 40, this.y + 20, 25 + pulse/2, 25 + pulse/2);
    this.p.triangle(
      this.x + 10, this.y + 30,
      this.x + 50, this.y + 30,
      this.x + 30, this.y + 55
    );
    
    // Corruption veins
    this.p.stroke(255, 100, 0);
    this.p.strokeWeight(2);
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * this.p.TWO_PI + this.animTimer * 0.05;
      const len = 15 + pulse;
      this.p.line(
        this.x + this.width/2, 
        this.y + this.height/2,
        this.x + this.width/2 + Math.cos(angle) * len,
        this.y + this.height/2 + Math.sin(angle) * len
      );
    }
    
    // Pulsing core
    this.p.fill(255, 150, 0, 200);
    this.p.noStroke();
    this.p.ellipse(this.x + this.width/2, this.y + this.height/2, 
                   15 + pulse/2, 15 + pulse/2);
  }
}