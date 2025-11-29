// player.js - Player entity
import { gameState, PLAYER_MAX_HEALTH, PLAYER_MAX_STAMINA, PLAYER_SPEED, PLAYER_SPRINT_MULTIPLIER, STAMINA_SPRINT_COST, STAMINA_ATTACK_COST, STAMINA_REGEN_RATE, HEALTH_REGEN_RATE, HEALTH_REGEN_DELAY, WEAPONS, WORLD_WIDTH, WORLD_HEIGHT } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 30;
    this.health = PLAYER_MAX_HEALTH;
    this.maxHealth = PLAYER_MAX_HEALTH;
    this.stamina = PLAYER_MAX_STAMINA;
    this.maxStamina = PLAYER_MAX_STAMINA;
    this.speed = PLAYER_SPEED;
    this.lastDamageFrame = -1000;
    this.attackCooldown = 0;
    this.facing = 0; // 0: right, 1: down, 2: left, 3: up
  }

  update(p, inputs) {
    // Movement
    let dx = 0;
    let dy = 0;
    let moving = false;

    if (inputs.left) {
      dx -= 1;
      this.facing = 2;
      moving = true;
    }
    if (inputs.right) {
      dx += 1;
      this.facing = 0;
      moving = true;
    }
    if (inputs.up) {
      dy -= 1;
      this.facing = 3;
      moving = true;
    }
    if (inputs.down) {
      dy += 1;
      this.facing = 1;
      moving = true;
    }

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      dx *= 0.707;
      dy *= 0.707;
    }

    // Apply sprint
    let currentSpeed = this.speed;
    if (inputs.sprint && this.stamina > 0 && moving) {
      currentSpeed *= PLAYER_SPRINT_MULTIPLIER;
      this.stamina -= STAMINA_SPRINT_COST;
    }

    // Move with collision
    this.x += dx * currentSpeed;
    this.y += dy * currentSpeed;

    // Clamp to world bounds
    this.x = p.constrain(this.x, this.width / 2, WORLD_WIDTH - this.width / 2);
    this.y = p.constrain(this.y, this.height / 2, WORLD_HEIGHT - this.height / 2);

    // Stamina regeneration
    if (this.stamina < this.maxStamina) {
      this.stamina = Math.min(this.maxStamina, this.stamina + STAMINA_REGEN_RATE);
    }

    // Health regeneration (out of combat)
    if (p.frameCount - gameState.combatTimer > HEALTH_REGEN_DELAY) {
      if (this.health < this.maxHealth) {
        this.health = Math.min(this.maxHealth, this.health + HEALTH_REGEN_RATE);
      }
    }

    // Attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown--;
    }
  }

  attack(p) {
    if (this.attackCooldown > 0 || this.stamina < STAMINA_ATTACK_COST) {
      return null;
    }

    this.stamina -= STAMINA_ATTACK_COST;
    const weapon = WEAPONS[gameState.equippedWeapon];
    this.attackCooldown = weapon.attackSpeed;

    // Create attack hitbox in front of player
    const attackRange = weapon.range;
    let hitX = this.x;
    let hitY = this.y;

    switch (this.facing) {
      case 0: hitX += attackRange; break; // right
      case 1: hitY += attackRange; break; // down
      case 2: hitX -= attackRange; break; // left
      case 3: hitY -= attackRange; break; // up
    }

    return {
      x: hitX,
      y: hitY,
      radius: 20,
      damage: weapon.damage
    };
  }

  takeDamage(amount, p) {
    this.health -= amount;
    this.lastDamageFrame = p.frameCount;
    gameState.combatTimer = p.frameCount;
    if (this.health <= 0) {
      this.health = 0;
      return true; // player died
    }
    return false;
  }

  render(p, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    p.push();
    
    // Body
    p.fill(60, 120, 200);
    if (p.frameCount - this.lastDamageFrame < 10) {
      p.fill(255, 100, 100); // Flash red when hit
    }
    p.noStroke();
    p.rect(screenX - this.width / 2, screenY - this.height / 2, this.width, this.height, 5);

    // Eyes based on facing direction
    p.fill(255);
    if (this.facing === 0) { // right
      p.ellipse(screenX + 8, screenY - 5, 4, 4);
      p.ellipse(screenX + 8, screenY + 5, 4, 4);
    } else if (this.facing === 2) { // left
      p.ellipse(screenX - 8, screenY - 5, 4, 4);
      p.ellipse(screenX - 8, screenY + 5, 4, 4);
    } else if (this.facing === 3) { // up
      p.ellipse(screenX - 5, screenY - 8, 4, 4);
      p.ellipse(screenX + 5, screenY - 8, 4, 4);
    } else { // down
      p.ellipse(screenX - 5, screenY + 8, 4, 4);
      p.ellipse(screenX + 5, screenY + 8, 4, 4);
    }

    // Weapon indicator
    p.fill(100, 80, 60);
    if (this.facing === 0) {
      p.rect(screenX + 12, screenY, 8, 3);
    } else if (this.facing === 2) {
      p.rect(screenX - 20, screenY, 8, 3);
    } else if (this.facing === 3) {
      p.rect(screenX, screenY - 20, 3, 8);
    } else {
      p.rect(screenX, screenY + 12, 3, 8);
    }

    p.pop();
  }
}