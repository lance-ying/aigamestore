// entities.js - Game entities
import { gameState, GRAVITY, JUMP_FORCE, MOVE_SPEED, SPRINT_MULTIPLIER, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 30;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.facing = 1; // 1 = right, -1 = left
    this.sprinting = false;
  }

  update(p) {
    // Apply gravity
    this.vy += GRAVITY;
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    
    // Ground collision
    this.onGround = false;
    
    // Check platform collisions
    gameState.platforms.forEach(platform => {
      if (this.vy >= 0 && 
          this.x + this.width > platform.x && 
          this.x < platform.x + platform.width &&
          this.y + this.height > platform.y &&
          this.y + this.height < platform.y + platform.height) {
        this.y = platform.y - this.height;
        this.vy = 0;
        this.onGround = true;
      }
    });
    
    // Floor collision
    if (this.y + this.height >= CANVAS_HEIGHT) {
      this.y = CANVAS_HEIGHT - this.height;
      this.vy = 0;
      this.onGround = true;
    }
    
    // Wall collision
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > CANVAS_WIDTH) this.x = CANVAS_WIDTH - this.width;
    
    // Decay horizontal velocity
    this.vx *= 0.8;
    
    // Update invincibility frames
    if (gameState.invincibilityFrames > 0) {
      gameState.invincibilityFrames--;
    }
  }

  moveLeft() {
    const speed = this.sprinting ? MOVE_SPEED * SPRINT_MULTIPLIER : MOVE_SPEED;
    this.vx = -speed;
    this.facing = -1;
  }

  moveRight() {
    const speed = this.sprinting ? MOVE_SPEED * SPRINT_MULTIPLIER : MOVE_SPEED;
    this.vx = speed;
    this.facing = 1;
  }

  jump() {
    if (this.onGround) {
      this.vy = JUMP_FORCE;
      this.onGround = false;
    }
  }

  takeDamage(amount) {
    if (gameState.invincibilityFrames <= 0) {
      gameState.health -= amount;
      gameState.invincibilityFrames = 60;
      if (gameState.health <= 0) {
        gameState.health = 0;
      }
    }
  }

  draw(p) {
    p.push();
    
    // Flash when invincible
    if (gameState.invincibilityFrames > 0 && Math.floor(gameState.invincibilityFrames / 5) % 2 === 0) {
      p.fill(255, 150, 150);
    } else {
      p.fill(200, 120, 80); // Skin color
    }
    
    // Body
    p.rect(this.x, this.y + 10, this.width, this.height - 10);
    
    // Head
    p.fill(210, 130, 90);
    p.ellipse(this.x + this.width / 2, this.y + 8, 16, 16);
    
    // Pirate hat
    p.fill(50, 50, 50);
    p.triangle(
      this.x + this.width / 2 - 10, this.y + 5,
      this.x + this.width / 2 + 10, this.y + 5,
      this.x + this.width / 2, this.y - 3
    );
    
    // Eye
    p.fill(255);
    p.ellipse(this.x + this.width / 2 + (this.facing * 3), this.y + 8, 4, 4);
    
    // Eye patch
    p.fill(20, 20, 20);
    p.ellipse(this.x + this.width / 2 - (this.facing * 3), this.y + 8, 5, 5);
    
    p.pop();
  }
}

export class Platform {
  constructor(x, y, width, height, type = 'normal') {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type;
  }

  draw(p) {
    p.push();
    
    if (this.type === 'grass') {
      p.fill(101, 67, 33);
      p.rect(this.x, this.y, this.width, this.height);
      p.fill(76, 175, 80);
      p.rect(this.x, this.y - 3, this.width, 3);
    } else if (this.type === 'stone') {
      p.fill(120, 120, 120);
      p.rect(this.x, this.y, this.width, this.height);
      p.stroke(100, 100, 100);
      p.noFill();
      for (let i = 0; i < this.width; i += 20) {
        p.line(this.x + i, this.y, this.x + i, this.y + this.height);
      }
      p.noStroke();
    } else {
      p.fill(139, 90, 43);
      p.rect(this.x, this.y, this.width, this.height);
    }
    
    p.pop();
  }
}

export class Hazard {
  constructor(x, y, width, height, type, damage = 10) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type;
    this.damage = damage;
    this.animFrame = 0;
  }

  update(p) {
    this.animFrame++;
    
    // Check collision with player
    if (gameState.player) {
      const px = gameState.player.x;
      const py = gameState.player.y;
      const pw = gameState.player.width;
      const ph = gameState.player.height;
      
      if (px + pw > this.x && px < this.x + this.width &&
          py + ph > this.y && py < this.y + this.height) {
        gameState.player.takeDamage(this.damage);
      }
    }
  }

  draw(p) {
    p.push();
    
    if (this.type === 'quicksand') {
      p.fill(194, 178, 128);
      p.rect(this.x, this.y, this.width, this.height);
      
      // Animated bubbles
      for (let i = 0; i < 3; i++) {
        const offset = (this.animFrame + i * 20) % 60;
        const alpha = 255 - (offset * 4);
        p.fill(194, 178, 128, alpha);
        p.ellipse(
          this.x + 10 + i * 15,
          this.y + this.height - offset,
          5, 5
        );
      }
    } else if (this.type === 'spikes') {
      p.fill(80, 80, 80);
      p.rect(this.x, this.y + this.height - 5, this.width, 5);
      
      p.fill(120, 120, 120);
      for (let i = 0; i < this.width; i += 10) {
        p.triangle(
          this.x + i, this.y + this.height - 5,
          this.x + i + 5, this.y + this.height - 15,
          this.x + i + 10, this.y + this.height - 5
        );
      }
    }
    
    p.pop();
  }
}

export class EnchantedParrot {
  constructor(x, y, patrolWidth) {
    this.x = x;
    this.y = y;
    this.width = 15;
    this.height = 15;
    this.patrolStart = x;
    this.patrolWidth = patrolWidth;
    this.speed = 1.5;
    this.direction = 1;
    this.wingFlap = 0;
    this.damage = 15;
  }

  update(p) {
    this.x += this.speed * this.direction;
    this.wingFlap = (this.wingFlap + 1) % 20;
    
    // Patrol bounds
    if (this.x > this.patrolStart + this.patrolWidth) {
      this.direction = -1;
    } else if (this.x < this.patrolStart) {
      this.direction = 1;
    }
    
    // Check collision with player
    if (gameState.player) {
      const px = gameState.player.x;
      const py = gameState.player.y;
      const pw = gameState.player.width;
      const ph = gameState.player.height;
      
      if (px + pw > this.x && px < this.x + this.width &&
          py + ph > this.y && py < this.y + this.height) {
        gameState.player.takeDamage(this.damage);
      }
    }
  }

  draw(p) {
    p.push();
    
    // Body
    p.fill(255, 50, 150); // Magical purple parrot
    p.ellipse(this.x + this.width / 2, this.y + this.height / 2, this.width, this.height);
    
    // Wings
    const wingOffset = this.wingFlap < 10 ? -3 : 3;
    p.fill(200, 0, 200);
    p.ellipse(this.x, this.y + this.height / 2 + wingOffset, 8, 12);
    p.ellipse(this.x + this.width, this.y + this.height / 2 + wingOffset, 8, 12);
    
    // Eye
    p.fill(255, 255, 0);
    p.ellipse(this.x + this.width / 2 + (this.direction * 2), this.y + this.height / 2, 4, 4);
    
    p.pop();
  }
}

export class Collectible {
  constructor(x, y, type = 'coin') {
    this.x = x;
    this.y = y;
    this.width = 12;
    this.height = 12;
    this.type = type;
    this.collected = false;
    this.animFrame = 0;
  }

  update(p) {
    this.animFrame++;
    
    if (!this.collected && gameState.player) {
      const px = gameState.player.x;
      const py = gameState.player.y;
      const pw = gameState.player.width;
      const ph = gameState.player.height;
      
      if (px + pw > this.x && px < this.x + this.width &&
          py + ph > this.y && py < this.y + this.height) {
        this.collect();
      }
    }
  }

  collect() {
    this.collected = true;
    if (this.type === 'coin') {
      gameState.score += 10;
    } else if (this.type === 'spyglass') {
      gameState.hasSpyglass = true;
      gameState.score += 50;
    }
  }

  draw(p) {
    if (this.collected) return;
    
    p.push();
    
    const bobOffset = Math.sin(this.animFrame * 0.1) * 3;
    
    if (this.type === 'coin') {
      p.fill(255, 215, 0);
      p.ellipse(this.x + this.width / 2, this.y + this.height / 2 + bobOffset, this.width, this.height);
      p.fill(255, 235, 100);
      p.ellipse(this.x + this.width / 2, this.y + this.height / 2 + bobOffset, this.width - 4, this.height - 4);
    } else if (this.type === 'spyglass') {
      p.fill(80, 60, 40);
      p.rect(this.x, this.y + bobOffset, this.width, this.height / 2);
      p.fill(150, 200, 255);
      p.ellipse(this.x + this.width / 2, this.y + this.height / 4 + bobOffset, 8, 8);
    }
    
    p.pop();
  }
}

export class Chest {
  constructor(x, y, stoneId) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 25;
    this.stoneId = stoneId;
    this.opened = false;
    this.interactable = false;
  }

  update(p) {
    if (!this.opened && gameState.player) {
      const px = gameState.player.x;
      const py = gameState.player.y;
      const pw = gameState.player.width;
      const ph = gameState.player.height;
      
      const distance = Math.abs((this.x + this.width / 2) - (px + pw / 2));
      this.interactable = distance < 40;
    }
  }

  open() {
    if (!this.opened && this.interactable) {
      this.opened = true;
      gameState.sacredStones++;
      gameState.score += 100;
      return true;
    }
    return false;
  }

  draw(p) {
    p.push();
    
    // Chest base
    p.fill(101, 67, 33);
    p.rect(this.x, this.y + 10, this.width, this.height - 10);
    
    // Chest lid
    if (this.opened) {
      p.fill(139, 90, 43);
      p.rect(this.x - 5, this.y - 5, this.width + 10, 8);
    } else {
      p.fill(139, 90, 43);
      p.rect(this.x, this.y, this.width, 12);
    }
    
    // Lock
    if (!this.opened) {
      p.fill(200, 180, 0);
      p.rect(this.x + this.width / 2 - 3, this.y + 8, 6, 8);
    }
    
    // Interaction prompt
    if (this.interactable && !this.opened) {
      p.fill(255, 255, 255);
      p.textAlign(p.CENTER);
      p.textSize(10);
      p.text('Press Z', this.x + this.width / 2, this.y - 10);
    }
    
    p.pop();
  }
}