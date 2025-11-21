import { gameState, CANVAS_HEIGHT, ROBOT_MASTERS } from './globals.js';

export class Enemy {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.health = 5;
    this.vx = 0;
    this.vy = 0;
    this.width = 16;
    this.height = 16;
    this.shootCooldown = 0;
    this.animFrame = 0;
    this.animTimer = 0;
  }

  update(p) {
    // Basic AI
    if (this.type === 'walker') {
      this.vx = 1;
      this.x += this.vx;
      
      // Check platform collision
      let onPlatform = false;
      for (let plat of gameState.platformBlocks) {
        if (this.y + this.height >= plat.y && this.y + this.height <= plat.y + 5 &&
            this.x + this.width > plat.x && this.x < plat.x + plat.width) {
          onPlatform = true;
          break;
        }
      }
      
      if (!onPlatform) {
        this.vx = -this.vx;
      }
    } else if (this.type === 'flyer') {
      const player = gameState.player;
      if (player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 10) {
          this.vx = (dx / dist) * 1.5;
          this.vy = (dy / dist) * 1.5;
        }
        this.x += this.vx;
        this.y += this.vy;
      }
    }

    this.animTimer++;
    if (this.animTimer > 10) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 2;
    }

    // Shoot occasionally
    if (this.shootCooldown === 0 && gameState.player) {
      const dx = gameState.player.x - this.x;
      const dist = Math.abs(dx);
      if (dist < 150 && p.random() < 0.02) {
        this.shoot(p);
        this.shootCooldown = 60;
      }
    }
    if (this.shootCooldown > 0) this.shootCooldown--;
  }

  shoot(p) {
    const dx = gameState.player.x - this.x;
    const dy = gameState.player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    gameState.projectiles.push({
      x: this.x + this.width / 2,
      y: this.y + this.height / 2,
      vx: (dx / dist) * 3,
      vy: (dy / dist) * 3,
      damage: 3,
      color: [255, 100, 100],
      lifetime: 90,
      isPlayerProjectile: false,
      weapon: 'ENEMY'
    });
  }

  takeDamage(damage, weaponType) {
    this.health -= damage;
    if (this.health <= 0) {
      return true;
    }
    return false;
  }

  draw(p) {
    const screenX = this.x - gameState.camera.x;
    const screenY = this.y - gameState.camera.y;

    p.push();
    if (this.type === 'walker') {
      p.fill(150, 50, 50);
      p.rect(screenX, screenY, this.width, this.height);
      p.fill(200, 100, 100);
      p.rect(screenX + 3, screenY + 3, 4, 4);
      p.rect(screenX + 9, screenY + 3, 4, 4);
    } else if (this.type === 'flyer') {
      p.fill(100, 150, 200);
      p.ellipse(screenX + this.width / 2, screenY + this.height / 2, this.width, this.height);
      p.fill(150, 200, 255);
      p.ellipse(screenX + this.width / 2 - 3, screenY + this.height / 2, 4, 4);
      p.ellipse(screenX + this.width / 2 + 3, screenY + this.height / 2, 4, 4);
    }
    p.pop();
  }
}

export class RobotMaster {
  constructor(x, y, masterData, levelNum = 1) {
    this.x = x;
    this.y = y;
    this.masterData = masterData;
    
    // Scale health based on level - early bosses are easier
    const baseHealth = 28;
    const healthScale = 0.5 + (levelNum * 0.1); // Level 1: 60%, Level 6: 110%, Level 8: 130%
    this.maxHealth = Math.floor(baseHealth * healthScale);
    this.health = this.maxHealth;
    
    this.vx = 0;
    this.vy = 0;
    this.width = 24;
    this.height = 30;
    this.onGround = false;
    this.attackTimer = 0;
    this.attackPhase = 0;
    this.facing = -1;
    this.animFrame = 0;
    this.animTimer = 0;
    this.invincible = false;
    this.invincibleTimer = 0;
    this.levelNum = levelNum;
    
    // Attack speed scales with level
    this.attackSpeed = Math.max(30, 60 - (levelNum * 5)); // Faster attacks at higher levels
  }

  update(p) {
    const GRAVITY = 0.6;
    const MOVE_SPEED = 1.5 + (this.levelNum * 0.2); // Faster movement at higher levels

    // AI behavior
    const player = gameState.player;
    if (player) {
      const dx = player.x - this.x;
      
      // Face player
      this.facing = dx > 0 ? 1 : -1;

      // Movement pattern
      if (this.attackTimer % 180 < 90) {
        if (Math.abs(dx) > 60) {
          this.vx = dx > 0 ? MOVE_SPEED : -MOVE_SPEED;
        } else {
          this.vx = 0;
        }
      } else {
        this.vx = 0;
      }

      // Attack pattern
      this.attackTimer++;
      if (this.attackTimer % this.attackSpeed === 0) {
        this.attack(p);
      }
    }

    // Gravity
    if (!this.onGround) {
      this.vy += GRAVITY;
    }

    // Jump occasionally
    if (this.onGround && p.random() < 0.03) {
      this.vy = -9;
      this.onGround = false;
    }

    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;

    // Platform collision
    this.onGround = false;
    for (let plat of gameState.platformBlocks) {
      if (this.vy > 0 && this.y + this.height > plat.y && this.y < plat.y &&
          this.x + this.width > plat.x && this.x < plat.x + plat.width) {
        this.y = plat.y - this.height;
        this.vy = 0;
        this.onGround = true;
      }
    }

    if (this.invincibleTimer > 0) {
      this.invincibleTimer--;
      if (this.invincibleTimer === 0) this.invincible = false;
    }

    this.animTimer++;
    if (this.animTimer > 8) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 2;
    }
  }

  attack(p) {
    const player = gameState.player;
    if (!player) return;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Different attack patterns based on boss type and level
    const numProjectiles = Math.min(3, 1 + Math.floor(this.levelNum / 2)); // More projectiles at higher levels
    
    if (this.levelNum <= 2) {
      // Simple single shot for early levels
      const angle = Math.atan2(dy, dx);
      gameState.projectiles.push({
        x: this.x + this.width / 2,
        y: this.y + this.height / 2,
        vx: Math.cos(angle) * 3,
        vy: Math.sin(angle) * 3,
        damage: 3,
        color: this.masterData.color,
        lifetime: 120,
        isPlayerProjectile: false,
        weapon: 'BOSS'
      });
    } else if (this.levelNum <= 4) {
      // Triple shot for medium levels
      for (let i = -1; i <= 1; i++) {
        const angle = Math.atan2(dy, dx) + i * 0.3;
        gameState.projectiles.push({
          x: this.x + this.width / 2,
          y: this.y + this.height / 2,
          vx: Math.cos(angle) * 4,
          vy: Math.sin(angle) * 4,
          damage: 4,
          color: this.masterData.color,
          lifetime: 120,
          isPlayerProjectile: false,
          weapon: 'BOSS'
        });
      }
    } else {
      // Spread shot for harder levels
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        gameState.projectiles.push({
          x: this.x + this.width / 2,
          y: this.y + this.height / 2,
          vx: Math.cos(angle) * 3.5,
          vy: Math.sin(angle) * 3.5,
          damage: 4,
          color: this.masterData.color,
          lifetime: 90,
          isPlayerProjectile: false,
          weapon: 'BOSS'
        });
      }
    }
  }

  takeDamage(damage, weaponType) {
    if (this.invincible) return false;

    // Check weakness
    if (weaponType === this.masterData.weakness) {
      damage *= 2;
    }

    this.health -= damage;
    this.invincible = true;
    this.invincibleTimer = 10;

    if (this.health <= 0) {
      this.health = 0;
      return true;
    }
    return false;
  }

  draw(p) {
    const screenX = this.x - gameState.camera.x;
    const screenY = this.y - gameState.camera.y;

    p.push();
    
    // Flicker when invincible
    if (this.invincible && Math.floor(this.invincibleTimer / 2) % 2 === 0) {
      p.pop();
      return;
    }

    // Body
    p.fill(...this.masterData.color);
    p.rect(screenX + 4, screenY + 8, 16, 18);
    
    // Head
    p.rect(screenX + 6, screenY, 12, 8);
    
    // Helmet detail
    const darker = this.masterData.color.map(c => c * 0.7);
    p.fill(...darker);
    p.rect(screenX + 4, screenY, 16, 3);
    
    // Eyes
    p.fill(255, 255, 255);
    p.rect(screenX + 8, screenY + 3, 3, 2);
    p.rect(screenX + 13, screenY + 3, 3, 2);
    
    // Arms
    p.fill(...this.masterData.color);
    p.rect(screenX + (this.facing > 0 ? 20 : 0), screenY + 10, 4, 10);
    
    // Legs
    p.rect(screenX + 6, screenY + 26, 5, 4);
    p.rect(screenX + 13, screenY + 26, 5, 4);

    p.pop();
  }
}