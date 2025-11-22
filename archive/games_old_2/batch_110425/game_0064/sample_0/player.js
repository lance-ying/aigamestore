// player.js - Player class and related functions
import { CANVAS_WIDTH, GROUND_Y, GRAVITY, JUMP_FORCE, PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_SPEED, gameState } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = PLAYER_WIDTH;
    this.height = PLAYER_HEIGHT;
    this.vx = 0;
    this.vy = 0;
    this.facingRight = true;
    this.isAttacking = false;
    this.attackTimer = 0;
    this.attackCooldown = 30;
    this.isJumping = false;
    this.isDashing = false;
    this.dashTimer = 0;
    this.hitTimer = 0;
    this.animFrame = 0;
    this.animTimer = 0;
  }

  update() {
    // Apply gravity
    if (this.y < GROUND_Y - this.height) {
      this.vy += GRAVITY;
    } else {
      this.y = GROUND_Y - this.height;
      this.vy = 0;
      this.isJumping = false;
    }

    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Boundary check
    if (this.x < 0) this.x = 0;
    if (this.x > CANVAS_WIDTH - this.width) this.x = CANVAS_WIDTH - this.width;

    // Update timers
    if (this.attackTimer > 0) this.attackTimer--;
    if (this.attackTimer === 0) this.isAttacking = false;
    
    if (this.dashTimer > 0) {
      this.dashTimer--;
      if (this.dashTimer === 0) this.isDashing = false;
    }
    
    if (this.hitTimer > 0) this.hitTimer--;

    // Animation
    this.animTimer++;
    if (this.animTimer % 10 === 0) {
      this.animFrame = (this.animFrame + 1) % 4;
    }

    // Deceleration
    this.vx *= 0.85;
  }

  moveLeft() {
    if (!this.isDashing && !this.isAttacking) {
      this.vx = -PLAYER_SPEED;
      this.facingRight = false;
    }
  }

  moveRight() {
    if (!this.isDashing && !this.isAttacking) {
      this.vx = PLAYER_SPEED;
      this.facingRight = true;
    }
  }

  jump() {
    if (!this.isJumping && this.y >= GROUND_Y - this.height - 1) {
      this.vy = JUMP_FORCE;
      this.isJumping = true;
    }
  }

  attack() {
    if (this.attackTimer <= 0 && !this.isDashing) {
      this.isAttacking = true;
      this.attackTimer = this.attackCooldown;
      return true;
    }
    return false;
  }

  shadowStrike() {
    if (gameState.skills.shadowStrike.cooldown <= 0) {
      this.isDashing = true;
      this.dashTimer = 20;
      this.vx = this.facingRight ? 12 : -12;
      gameState.skills.shadowStrike.cooldown = gameState.skills.shadowStrike.maxCooldown;
      return true;
    }
    return false;
  }

  ninjaFury() {
    if (gameState.skills.ninjaFury.cooldown <= 0) {
      gameState.skills.ninjaFury.cooldown = gameState.skills.ninjaFury.maxCooldown;
      return true;
    }
    return false;
  }

  takeDamage(damage) {
    if (this.hitTimer <= 0 && !this.isDashing) {
      gameState.playerStats.health -= damage;
      this.hitTimer = 60;
      if (gameState.playerStats.health <= 0) {
        gameState.playerStats.health = 0;
      }
    }
  }

  render(p) {
    p.push();
    
    // Flash when hit
    if (this.hitTimer > 0 && this.hitTimer % 10 < 5) {
      p.tint(255, 100, 100);
    }
    
    // Draw shadow
    p.fill(0, 0, 0, 50);
    p.noStroke();
    p.ellipse(this.x + this.width / 2, GROUND_Y + 5, this.width * 0.8, 10);
    
    // Draw player body
    p.fill(this.isDashing ? 150 : 60, 60, 80);
    p.stroke(40, 40, 60);
    p.strokeWeight(2);
    p.rect(this.x, this.y, this.width, this.height, 5);
    
    // Draw ninja mask/head
    p.fill(40, 40, 60);
    p.ellipse(this.x + this.width / 2, this.y + 12, this.width * 0.8, 20);
    
    // Draw eyes
    p.fill(255, 50, 50);
    p.noStroke();
    const eyeY = this.y + 10;
    if (this.facingRight) {
      p.ellipse(this.x + this.width * 0.6, eyeY, 6, 4);
    } else {
      p.ellipse(this.x + this.width * 0.4, eyeY, 6, 4);
    }
    
    // Draw weapon (katana)
    if (this.isAttacking) {
      p.stroke(200, 200, 220);
      p.strokeWeight(3);
      const weaponX = this.facingRight ? this.x + this.width : this.x;
      const weaponExtend = this.facingRight ? 25 : -25;
      p.line(weaponX, this.y + 20, weaponX + weaponExtend, this.y + 15);
      
      // Attack effect
      p.noStroke();
      p.fill(255, 255, 100, 150);
      p.arc(weaponX + weaponExtend, this.y + 15, 30, 30, 
            this.facingRight ? -0.5 : 2.6, 
            this.facingRight ? 0.5 : 3.6);
    }
    
    // Dash effect
    if (this.isDashing) {
      for (let i = 0; i < 3; i++) {
        p.fill(100, 100, 150, 100 - i * 30);
        p.noStroke();
        const offsetX = this.facingRight ? -i * 8 : i * 8;
        p.rect(this.x + offsetX, this.y, this.width, this.height, 5);
      }
    }
    
    p.pop();
  }

  getAttackBox() {
    const extend = 35;
    if (this.facingRight) {
      return {
        x: this.x + this.width - 5,
        y: this.y,
        width: extend,
        height: this.height
      };
    } else {
      return {
        x: this.x - extend + 5,
        y: this.y,
        width: extend,
        height: this.height
      };
    }
  }

  getCollisionBox() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }
}