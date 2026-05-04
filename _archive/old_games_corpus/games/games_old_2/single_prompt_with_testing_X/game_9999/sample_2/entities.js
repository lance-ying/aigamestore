// entities.js
import { GRAVITY, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 24;
    this.height = 32;
    this.vx = 0;
    this.vy = 0;
    this.maxSpeed = 3;
    this.sprintSpeed = 5;
    this.jumpPower = -12;
    this.isGrounded = false;
    this.isJumping = false;
    this.jumpHoldTime = 0;
    this.maxJumpHoldTime = 15; // frames
    this.facing = 1; // 1 = right, -1 = left
    this.sprinting = false;
    this.invincibleTimer = 0;
  }

  update(p) {
    // Apply gravity
    if (!this.isGrounded) {
      this.vy += GRAVITY;
    }

    // Terminal velocity
    if (this.vy > 15) this.vy = 15;

    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Ground collision
    this.isGrounded = false;
    if (this.y + this.height >= GROUND_Y) {
      this.y = GROUND_Y - this.height;
      this.vy = 0;
      this.isGrounded = true;
      this.isJumping = false;
      this.jumpHoldTime = 0;
    }

    // Platform collision
    for (let platform of gameState.platforms) {
      if (this.vx > 0 || this.vx < 0) {
        // Side collision check first
        if (p.collideRectRect(this.x + this.vx, this.y, this.width, this.height, 
                              platform.x, platform.y, platform.width, platform.height)) {
          this.vx = 0;
        }
      }
      
      // Check if falling onto platform from above
      if (this.vy >= 0 && 
          this.y + this.height <= platform.y + 10 &&
          p.collideRectRect(this.x, this.y + this.vy, this.width, this.height, 
                            platform.x, platform.y, platform.width, platform.height)) {
        this.y = platform.y - this.height;
        this.vy = 0;
        this.isGrounded = true;
        this.isJumping = false;
        this.jumpHoldTime = 0;
      }
    }

    // Apply friction
    this.vx *= 0.8;
    if (Math.abs(this.vx) < 0.1) this.vx = 0;

    // Jump hold mechanics
    if (this.isJumping && this.jumpHoldTime > 0) {
      this.vy = this.jumpPower * (this.jumpHoldTime / this.maxJumpHoldTime);
      this.jumpHoldTime--;
    }

    // Update invincibility
    if (this.invincibleTimer > 0) {
      this.invincibleTimer--;
    }

    // Boundary check
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > CANVAS_WIDTH * 5) this.x = CANVAS_WIDTH * 5 - this.width;

    // Death by falling
    if (this.y > CANVAS_HEIGHT + 100) {
      this.takeDamage(p);
      if (gameState.health <= 0) {
        gameState.gamePhase = "GAME_OVER_LOSE";
      } else {
        this.respawn();
      }
    }
  }

  moveLeft(sprinting) {
    const speed = sprinting ? this.sprintSpeed : this.maxSpeed;
    this.vx = -speed;
    this.facing = -1;
    this.sprinting = sprinting;
  }

  moveRight(sprinting) {
    const speed = sprinting ? this.sprintSpeed : this.maxSpeed;
    this.vx = speed;
    this.facing = 1;
    this.sprinting = sprinting;
  }

  jump() {
    if (this.isGrounded) {
      this.vy = this.jumpPower;
      this.isGrounded = false;
      this.isJumping = true;
      this.jumpHoldTime = this.maxJumpHoldTime;
    }
  }

  stopJump() {
    this.jumpHoldTime = 0;
    this.isJumping = false;
  }

  takeDamage(p) {
    if (this.invincibleTimer <= 0) {
      gameState.health--;
      gameState.hitsTaken++;
      gameState.damageStreak = 0;
      this.invincibleTimer = 120; // 2 seconds at 60fps
      
      p.logs.player_info.push({
        screen_x: this.x - gameState.camera.x,
        screen_y: this.y,
        game_x: this.x,
        game_y: this.y,
        event: "damage_taken",
        health: gameState.health,
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }

  respawn() {
    this.x = 50;
    this.y = GROUND_Y - this.height;
    this.vx = 0;
    this.vy = 0;
    this.invincibleTimer = 180; // 3 seconds
  }

  draw(p) {
    p.push();
    
    // Flashing when invincible
    if (this.invincibleTimer > 0 && Math.floor(this.invincibleTimer / 5) % 2 === 0) {
      p.fill(255, 255, 255, 150);
    } else {
      // Leprechaun body - green coat
      p.fill(34, 139, 34);
    }
    
    // Body
    p.rect(this.x + 6, this.y + 12, 12, 14);
    
    // Head - skin tone
    p.fill(255, 220, 177);
    p.ellipse(this.x + 12, this.y + 8, 14, 14);
    
    // Hat - green
    p.fill(0, 100, 0);
    p.rect(this.x + 5, this.y + 2, 14, 4);
    p.triangle(this.x + 7, this.y + 2, this.x + 17, this.y + 2, this.x + 12, this.y - 4);
    
    // Hat band - black
    p.fill(0);
    p.rect(this.x + 5, this.y + 2, 14, 1);
    
    // Eyes
    p.fill(0);
    p.circle(this.x + 9 + (this.facing === 1 ? 1 : -1), this.y + 8, 2);
    p.circle(this.x + 15 + (this.facing === 1 ? 1 : -1), this.y + 8, 2);
    
    // Beard - orange/red
    p.fill(255, 140, 0);
    p.rect(this.x + 7, this.y + 11, 10, 4);
    
    // Legs
    p.fill(34, 139, 34);
    p.rect(this.x + 7, this.y + 26, 4, 6);
    p.rect(this.x + 13, this.y + 26, 4, 6);
    
    // Shoes - brown
    p.fill(101, 67, 33);
    p.rect(this.x + 6, this.y + 30, 5, 2);
    p.rect(this.x + 13, this.y + 30, 5, 2);
    
    p.pop();
  }
}

export class Enemy {
  constructor(x, y, type = 'walker') {
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 20;
    this.type = type; // 'walker', 'jumper'
    this.vx = type === 'walker' ? -1.5 : 0;
    this.vy = 0;
    this.boundsLeft = x - 80;
    this.boundsRight = x + 80;
    this.defeated = false;
    this.animFrame = 0;
  }

  update(p) {
    if (this.defeated) return;

    this.animFrame++;

    // Walker behavior
    if (this.type === 'walker') {
      this.x += this.vx;
      
      // Reverse at bounds
      if (this.x <= this.boundsLeft) {
        this.x = this.boundsLeft;
        this.vx = Math.abs(this.vx);
      } else if (this.x >= this.boundsRight) {
        this.x = this.boundsRight;
        this.vx = -Math.abs(this.vx);
      }
    }

    // Apply gravity
    this.vy += GRAVITY;
    this.y += this.vy;

    // Ground collision
    if (this.y + this.height >= GROUND_Y) {
      this.y = GROUND_Y - this.height;
      this.vy = 0;
    }

    // Platform collision
    for (let platform of gameState.platforms) {
      if (this.vy >= 0 && 
          this.y + this.height <= platform.y + 10 &&
          p.collideRectRect(this.x, this.y + this.vy, this.width, this.height, 
                            platform.x, platform.y, platform.width, platform.height)) {
        this.y = platform.y - this.height;
        this.vy = 0;
      }
    }

    // Check collision with player
    if (!this.defeated && gameState.player && 
        p.collideRectRect(this.x, this.y, this.width, this.height, 
                          gameState.player.x, gameState.player.y, 
                          gameState.player.width, gameState.player.height)) {
      
      // Stomp mechanic - player jumping on enemy from above
      if (gameState.player.vy > 0 && 
          gameState.player.y + gameState.player.height - 5 < this.y + this.height / 2) {
        this.defeated = true;
        gameState.player.vy = -8; // Bounce
        gameState.damageStreak++;
        gameState.score += 50 + Math.min(gameState.damageStreak * 10, 200);
      } else {
        // Player takes damage
        gameState.player.takeDamage(p);
        if (gameState.health <= 0) {
          gameState.gamePhase = "GAME_OVER_LOSE";
        }
      }
    }
  }

  draw(p) {
    if (this.defeated) return;

    p.push();
    
    // Monster body - purple/red
    p.fill(148, 0, 211);
    p.ellipse(this.x + this.width/2, this.y + this.height/2, this.width, this.height);
    
    // Eyes
    p.fill(255);
    const eyeOffset = Math.sin(this.animFrame * 0.1) * 2;
    p.circle(this.x + 7, this.y + 8 + eyeOffset, 6);
    p.circle(this.x + 13, this.y + 8 + eyeOffset, 6);
    
    // Pupils
    p.fill(0);
    p.circle(this.x + 7, this.y + 8 + eyeOffset, 3);
    p.circle(this.x + 13, this.y + 8 + eyeOffset, 3);
    
    // Teeth
    p.fill(255);
    for (let i = 0; i < 3; i++) {
      p.triangle(this.x + 5 + i * 4, this.y + 15, 
                 this.x + 7 + i * 4, this.y + 15, 
                 this.x + 6 + i * 4, this.y + 18);
    }
    
    p.pop();
  }
}

export class Coin {
  constructor(x, y, value = 1) {
    this.x = x;
    this.y = y;
    this.width = 16;
    this.height = 16;
    this.value = value; // 1 for coin, 10 for gold
    this.collected = false;
    this.animFrame = 0;
  }

  update(p) {
    if (this.collected) return;

    this.animFrame++;

    // Check collision with player
    if (gameState.player && 
        p.collideRectRect(this.x, this.y, this.width, this.height, 
                          gameState.player.x, gameState.player.y, 
                          gameState.player.width, gameState.player.height)) {
      this.collected = true;
      gameState.coinsCollected++;
      gameState.score += this.value;
    }
  }

  draw(p) {
    if (this.collected) return;

    p.push();
    
    // Rotation animation
    const scale = Math.abs(Math.cos(this.animFrame * 0.1));
    
    if (this.value === 1) {
      // Regular coin - yellow
      p.fill(255, 215, 0);
      p.ellipse(this.x + this.width/2, this.y + this.height/2, 
                this.width * scale, this.height);
      p.fill(255, 235, 100);
      p.ellipse(this.x + this.width/2, this.y + this.height/2, 
                this.width * scale * 0.6, this.height * 0.6);
    } else {
      // Gold - orange
      p.fill(255, 165, 0);
      p.ellipse(this.x + this.width/2, this.y + this.height/2, 
                this.width * scale, this.height);
      p.fill(255, 200, 100);
      p.ellipse(this.x + this.width/2, this.y + this.height/2, 
                this.width * scale * 0.6, this.height * 0.6);
      
      // Sparkle
      p.fill(255);
      p.circle(this.x + this.width/2 - 3, this.y + this.height/2 - 3, 2);
    }
    
    p.pop();
  }
}

export class Platform {
  constructor(x, y, width, height, type = 'normal') {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type; // 'normal', 'moving'
    this.initialX = x;
    this.moveSpeed = 1;
    this.moveRange = 100;
  }

  update() {
    if (this.type === 'moving') {
      this.x += this.moveSpeed;
      
      if (this.x > this.initialX + this.moveRange) {
        this.x = this.initialX + this.moveRange;
        this.moveSpeed = -Math.abs(this.moveSpeed);
      } else if (this.x < this.initialX - this.moveRange) {
        this.x = this.initialX - this.moveRange;
        this.moveSpeed = Math.abs(this.moveSpeed);
      }
    }
  }

  draw(p) {
    p.push();
    
    // Platform surface - brown/green
    p.fill(139, 90, 43);
    p.rect(this.x, this.y, this.width, this.height);
    
    // Grass on top
    p.fill(34, 139, 34);
    p.rect(this.x, this.y, this.width, 4);
    
    // Details
    p.fill(101, 67, 33);
    for (let i = 0; i < this.width; i += 20) {
      p.rect(this.x + i + 5, this.y + 6, 10, 2);
    }
    
    p.pop();
  }
}

export class Pickup {
  constructor(x, y, type = 'clover') {
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 20;
    this.type = type; // 'clover' (health)
    this.collected = false;
    this.animFrame = 0;
  }

  update(p) {
    if (this.collected) return;

    this.animFrame++;

    // Float animation
    this.y += Math.sin(this.animFrame * 0.1) * 0.3;

    // Check collision with player
    if (gameState.player && 
        p.collideRectRect(this.x, this.y, this.width, this.height, 
                          gameState.player.x, gameState.player.y, 
                          gameState.player.width, gameState.player.height)) {
      this.collected = true;
      
      if (this.type === 'clover') {
        gameState.health = Math.min(gameState.health + 1, gameState.maxHealth);
        gameState.score += 100;
      }
    }
  }

  draw(p) {
    if (this.collected) return;

    p.push();
    
    // Cloverleaf - green four-leaf design
    p.fill(0, 200, 0);
    
    // Four leaves
    for (let i = 0; i < 4; i++) {
      p.push();
      p.translate(this.x + this.width/2, this.y + this.height/2);
      p.rotate(i * Math.PI / 2);
      p.ellipse(0, -5, 8, 12);
      p.pop();
    }
    
    // Center
    p.fill(255, 255, 0);
    p.circle(this.x + this.width/2, this.y + this.height/2, 4);
    
    // Stem
    p.stroke(0, 150, 0);
    p.strokeWeight(2);
    p.line(this.x + this.width/2, this.y + this.height/2 + 2, 
           this.x + this.width/2, this.y + this.height/2 + 8);
    p.noStroke();
    
    p.pop();
  }
}

export class Goal {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 80;
    this.reached = false;
    this.animFrame = 0;
  }

  update(p) {
    if (this.reached) return;

    this.animFrame++;

    // Check collision with player
    if (gameState.player && 
        p.collideRectRect(this.x, this.y, this.width, this.height, 
                          gameState.player.x, gameState.player.y, 
                          gameState.player.width, gameState.player.height)) {
      this.reached = true;
      gameState.goalReached = true;
      gameState.gamePhase = "GAME_OVER_WIN";
      
      p.logs.game_info.push({
        event: "goal_reached",
        data: { stage: gameState.currentStage, world: gameState.currentWorld },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }

  draw(p) {
    p.push();
    
    // Flag pole
    p.fill(139, 90, 43);
    p.rect(this.x + 18, this.y, 4, this.height);
    
    // Flag - waving animation
    p.fill(255, 0, 0);
    const wave = Math.sin(this.animFrame * 0.1) * 3;
    p.beginShape();
    p.vertex(this.x + 22, this.y + 5);
    p.vertex(this.x + 22 + 25 + wave, this.y + 10);
    p.vertex(this.x + 22, this.y + 15);
    p.endShape(p.CLOSE);
    
    // Star on flag
    p.fill(255, 255, 0);
    p.circle(this.x + 30 + wave * 0.7, this.y + 10, 5);
    
    p.pop();
  }
}