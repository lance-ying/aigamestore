// entities.js - Game entity classes

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GENRE_TYPES } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 20;
    this.speed = 3;
    this.dashSpeed = 8;
    this.color = [100, 150, 255];
    this.facingDirection = 'right';
  }
  
  update(p) {
    if (gameState.cardBattleActive) return;
    
    let dx = 0;
    let dy = 0;
    
    if (gameState.controlMode === "HUMAN") {
      if (p.keyIsDown(37)) { dx = -1; this.facingDirection = 'left'; }
      if (p.keyIsDown(39)) { dx = 1; this.facingDirection = 'right'; }
      if (p.keyIsDown(38)) { dy = -1; this.facingDirection = 'up'; }
      if (p.keyIsDown(40)) { dy = 1; this.facingDirection = 'down'; }
    }
    
    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      dx *= 0.707;
      dy *= 0.707;
    }
    
    const speed = gameState.dashDuration > 0 ? this.dashSpeed : this.speed;
    
    const newX = this.x + dx * speed;
    const newY = this.y + dy * speed;
    
    // Check collisions before moving
    if (!this.checkCollision(newX, this.y, p)) {
      this.x = newX;
    }
    if (!this.checkCollision(this.x, newY, p)) {
      this.y = newY;
    }
    
    // Clamp to world bounds
    this.x = p.constrain(this.x, this.width / 2, gameState.worldWidth - this.width / 2);
    this.y = p.constrain(this.y, this.height / 2, gameState.worldHeight - this.height / 2);
    
    // Update dash
    if (gameState.dashDuration > 0) {
      gameState.dashDuration--;
    }
    if (gameState.dashCooldown > 0) {
      gameState.dashCooldown--;
    }
  }
  
  checkCollision(x, y, p) {
    // Check wall collisions
    for (let door of gameState.doors) {
      if (!door.isOpen && p.collideRectRect(x - this.width / 2, y - this.height / 2, 
                                            this.width, this.height,
                                            door.x, door.y, door.width, door.height)) {
        return true;
      }
    }
    return false;
  }
  
  draw(p) {
    p.push();
    p.fill(...this.color);
    p.stroke(255);
    p.strokeWeight(2);
    p.rectMode(p.CENTER);
    p.rect(this.x, this.y, this.width, this.height);
    
    // Draw facing indicator
    p.fill(255);
    p.noStroke();
    if (this.facingDirection === 'right') {
      p.triangle(this.x + 5, this.y, this.x + 10, this.y - 3, this.x + 10, this.y + 3);
    } else if (this.facingDirection === 'left') {
      p.triangle(this.x - 5, this.y, this.x - 10, this.y - 3, this.x - 10, this.y + 3);
    } else if (this.facingDirection === 'up') {
      p.triangle(this.x, this.y - 5, this.x - 3, this.y - 10, this.x + 3, this.y - 10);
    } else {
      p.triangle(this.x, this.y + 5, this.x - 3, this.y + 10, this.x + 3, this.y + 10);
    }
    p.pop();
  }
  
  shoot(p) {
    if (gameState.currentGenre === GENRE_TYPES.SHOOTER) {
      const projectile = new Projectile(this.x, this.y, this.facingDirection, true);
      gameState.projectiles.push(projectile);
      gameState.entities.push(projectile);
    }
  }
  
  dash(p) {
    if (gameState.dashCooldown <= 0 && gameState.currentGenre === GENRE_TYPES.EXPLORATION_2D) {
      gameState.dashDuration = 10;
      gameState.dashCooldown = 60;
    }
  }
}

export class Enemy {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.width = 18;
    this.height = 18;
    this.type = type;
    this.health = 30;
    this.maxHealth = 30;
    this.speed = 1.5;
    this.color = [255, 100, 100];
    this.shootCooldown = 0;
    this.active = true;
    this.aggroRange = 200;
  }
  
  update(p) {
    if (!this.active || gameState.cardBattleActive) return;
    
    const player = gameState.player;
    if (!player) return;
    
    const dist = p.dist(this.x, this.y, player.x, player.y);
    
    if (dist < this.aggroRange) {
      // Move toward player
      const angle = p.atan2(player.y - this.y, player.x - this.x);
      this.x += p.cos(angle) * this.speed;
      this.y += p.sin(angle) * this.speed;
      
      // Shoot at player
      if (gameState.currentGenre === GENRE_TYPES.SHOOTER && this.shootCooldown <= 0) {
        const direction = angle > -p.PI / 4 && angle < p.PI / 4 ? 'right' :
                          angle >= p.PI / 4 && angle < 3 * p.PI / 4 ? 'down' :
                          angle >= 3 * p.PI / 4 || angle < -3 * p.PI / 4 ? 'left' : 'up';
        const projectile = new Projectile(this.x, this.y, direction, false);
        gameState.projectiles.push(projectile);
        gameState.entities.push(projectile);
        this.shootCooldown = 90;
      }
    }
    
    if (this.shootCooldown > 0) {
      this.shootCooldown--;
    }
    
    // Check collision with player
    if (p.collideRectRect(this.x - this.width / 2, this.y - this.height / 2,
                          this.width, this.height,
                          player.x - player.width / 2, player.y - player.height / 2,
                          player.width, player.height)) {
      gameState.playerHealth -= 0.5;
    }
    
    if (this.health <= 0) {
      this.active = false;
    }
  }
  
  draw(p) {
    if (!this.active) return;
    
    p.push();
    p.fill(...this.color);
    p.stroke(150, 0, 0);
    p.strokeWeight(2);
    p.rectMode(p.CENTER);
    p.rect(this.x, this.y, this.width, this.height);
    
    // Health bar
    p.fill(255, 0, 0);
    p.noStroke();
    p.rect(this.x - this.width / 2, this.y - this.height / 2 - 5, this.width, 3);
    p.fill(0, 255, 0);
    p.rect(this.x - this.width / 2, this.y - this.height / 2 - 5, 
           this.width * (this.health / this.maxHealth), 3);
    p.pop();
  }
}

export class Projectile {
  constructor(x, y, direction, isPlayer) {
    this.x = x;
    this.y = y;
    this.direction = direction;
    this.isPlayer = isPlayer;
    this.speed = 6;
    this.width = 8;
    this.height = 8;
    this.active = true;
    this.damage = 10;
  }
  
  update(p) {
    if (!this.active) return;
    
    switch (this.direction) {
      case 'up': this.y -= this.speed; break;
      case 'down': this.y += this.speed; break;
      case 'left': this.x -= this.speed; break;
      case 'right': this.x += this.speed; break;
    }
    
    // Check bounds
    if (this.x < 0 || this.x > gameState.worldWidth || 
        this.y < 0 || this.y > gameState.worldHeight) {
      this.active = false;
      return;
    }
    
    // Check collisions
    if (this.isPlayer) {
      for (let enemy of gameState.enemies) {
        if (enemy.active && p.collideRectRect(this.x - this.width / 2, this.y - this.height / 2,
                                               this.width, this.height,
                                               enemy.x - enemy.width / 2, enemy.y - enemy.height / 2,
                                               enemy.width, enemy.height)) {
          enemy.health -= this.damage;
          this.active = false;
          gameState.score += 10;
          break;
        }
      }
    } else {
      const player = gameState.player;
      if (player && p.collideRectRect(this.x - this.width / 2, this.y - this.height / 2,
                                       this.width, this.height,
                                       player.x - player.width / 2, player.y - player.height / 2,
                                       player.width, player.height)) {
        gameState.playerHealth -= 5;
        this.active = false;
      }
    }
  }
  
  draw(p) {
    if (!this.active) return;
    
    p.push();
    p.fill(...(this.isPlayer ? [255, 255, 100] : [255, 100, 100]));
    p.noStroke();
    p.ellipse(this.x, this.y, this.width, this.height);
    p.pop();
  }
}

export class Crystal {
  constructor(x, y, id) {
    this.x = x;
    this.y = y;
    this.id = id;
    this.width = 15;
    this.height = 15;
    this.collected = false;
    this.rotation = 0;
  }
  
  update(p) {
    if (this.collected) return;
    
    this.rotation += 0.05;
    
    const player = gameState.player;
    if (player && p.dist(this.x, this.y, player.x, player.y) < 25) {
      this.collected = true;
      gameState.crystalsCollected++;
      gameState.score += 100;
    }
  }
  
  draw(p) {
    if (this.collected) return;
    
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.rotation);
    p.fill(100, 255, 255);
    p.stroke(255);
    p.strokeWeight(2);
    p.beginShape();
    for (let i = 0; i < 6; i++) {
      const angle = p.TWO_PI / 6 * i;
      const r = i % 2 === 0 ? this.width : this.width / 2;
      p.vertex(p.cos(angle) * r, p.sin(angle) * r);
    }
    p.endShape(p.CLOSE);
    p.pop();
  }
}

export class NPC {
  constructor(x, y, type, message) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.message = message;
    this.width = 18;
    this.height = 18;
    this.color = [150, 255, 150];
    this.showMessage = false;
  }
  
  update(p) {
    const player = gameState.player;
    if (player && p.dist(this.x, this.y, player.x, player.y) < 40) {
      this.showMessage = true;
    } else {
      this.showMessage = false;
    }
  }
  
  draw(p) {
    p.push();
    p.fill(...this.color);
    p.stroke(100, 200, 100);
    p.strokeWeight(2);
    p.ellipse(this.x, this.y, this.width, this.height);
    
    // Eyes
    p.fill(0);
    p.noStroke();
    p.ellipse(this.x - 4, this.y - 2, 3, 3);
    p.ellipse(this.x + 4, this.y - 2, 3, 3);
    
    if (this.showMessage) {
      p.fill(255, 255, 200);
      p.stroke(0);
      p.strokeWeight(1);
      p.rect(this.x - 60, this.y - 40, 120, 25, 5);
      p.fill(0);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(10);
      p.text(this.message, this.x, this.y - 32, 110, 20);
    }
    p.pop();
  }
  
  interact(p) {
    if (this.type === "card_battle") {
      this.initiateCardBattle();
    }
  }
  
  initiateCardBattle() {
    gameState.cardBattleActive = true;
    gameState.cardBattleEnemy = this;
    gameState.selectedCardIndex = 0;
    gameState.battleTurn = "player";
    gameState.battleResult = null;
    
    // Generate random cards
    gameState.playerCards = [
      { name: "Strike", power: 15 },
      { name: "Block", power: 10 },
      { name: "Slash", power: 20 }
    ];
    gameState.enemyCards = [
      { name: "Attack", power: 12 },
      { name: "Defend", power: 8 },
      { name: "Blast", power: 18 }
    ];
  }
}

export class Door {
  constructor(x, y, width, height, requiredSwitch) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.requiredSwitch = requiredSwitch;
    this.isOpen = false;
  }
  
  update(p) {
    if (this.requiredSwitch && gameState.switchStates[this.requiredSwitch]) {
      this.isOpen = true;
    }
  }
  
  draw(p) {
    if (this.isOpen) return;
    
    p.push();
    p.fill(100, 70, 50);
    p.stroke(60, 40, 30);
    p.strokeWeight(2);
    p.rect(this.x, this.y, this.width, this.height);
    
    // Door pattern
    p.stroke(80, 60, 40);
    p.line(this.x + this.width / 2, this.y, this.x + this.width / 2, this.y + this.height);
    p.pop();
  }
}

export class Switch {
  constructor(x, y, id) {
    this.x = x;
    this.y = y;
    this.id = id;
    this.width = 20;
    this.height = 20;
    this.activated = false;
  }
  
  update(p) {
    const player = gameState.player;
    if (player && p.dist(this.x, this.y, player.x, player.y) < 30) {
      if (!this.activated) {
        this.activated = true;
        gameState.switchStates[this.id] = true;
      }
    }
  }
  
  draw(p) {
    p.push();
    p.fill(...(this.activated ? [100, 255, 100] : [255, 100, 100]));
    p.stroke(0);
    p.strokeWeight(2);
    p.rect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    p.pop();
  }
}

export class Portal {
  constructor(x, y, isFinal) {
    this.x = x;
    this.y = y;
    this.isFinal = isFinal;
    this.radius = 30;
    this.rotation = 0;
  }
  
  update(p) {
    this.rotation += 0.05;
    
    const player = gameState.player;
    if (player && p.dist(this.x, this.y, player.x, player.y) < this.radius) {
      if (this.isFinal && gameState.crystalsCollected >= gameState.totalCrystals) {
        gameState.gamePhase = "GAME_OVER_WIN";
      }
    }
  }
  
  draw(p) {
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.rotation);
    
    // Outer ring
    p.noFill();
    p.stroke(150, 100, 255);
    p.strokeWeight(3);
    p.ellipse(0, 0, this.radius * 2, this.radius * 2);
    
    // Inner rings
    for (let i = 1; i < 4; i++) {
      p.stroke(150, 100, 255, 200 - i * 50);
      p.ellipse(0, 0, this.radius * 2 * (1 - i * 0.2), this.radius * 2 * (1 - i * 0.2));
    }
    
    // Center
    p.fill(150, 100, 255, 150);
    p.noStroke();
    p.ellipse(0, 0, this.radius, this.radius);
    
    p.pop();
    
    // Label
    if (this.isFinal) {
      p.push();
      p.fill(255);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(10);
      p.text("FINAL PORTAL", this.x, this.y - this.radius - 10);
      p.pop();
    }
  }
}