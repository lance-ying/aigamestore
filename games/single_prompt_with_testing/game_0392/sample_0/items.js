import { GAME_AREA_X, GAME_AREA_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class Item {
  constructor(p, x, y, type, color = null) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.type = type;
    this.color = color;
    this.vy = 2;
    this.vx = 0;
    this.active = true;
    this.collectRadius = 15;
    this.attractRadius = 60;
    this.spawnTime = this.p.frameCount;
    this.colorChangeTimer = 0;
    
    if (type === 'venturer' && color === 'random') {
      this.colorIndex = 0;
      this.colors = ['red', 'blue', 'green'];
      this.color = this.colors[0];
    }
  }

  update(player) {
    // Random Venturer color change
    if (this.type === 'venturer' && this.colors) {
      const dist = this.p.dist(this.x, this.y, player.x, player.y);
      if (dist > 50) {
        this.colorChangeTimer++;
        if (this.colorChangeTimer > 60) {
          this.colorChangeTimer = 0;
          this.colorIndex = (this.colorIndex + 1) % this.colors.length;
          this.color = this.colors[this.colorIndex];
        }
      }
    }
    
    // Auto-collect at top
    if (player.y < 60) {
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        this.vx = (dx / dist) * 8;
        this.vy = (dy / dist) * 8;
      }
    } else if (player.slowMode) {
      // Attract in slow mode
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.attractRadius) {
        this.vx = (dx / dist) * 4;
        this.vy = (dy / dist) * 4;
      } else {
        this.vy = 2;
        this.vx *= 0.95;
      }
    } else {
      this.vy = 2;
      this.vx *= 0.95;
    }
    
    this.x += this.vx;
    this.y += this.vy;
    
    // Remove if off screen
    if (this.y > CANVAS_HEIGHT + 20) {
      this.active = false;
    }
  }

  collect() {
    this.active = false;
    
    switch (this.type) {
      case 'power':
        gameState.power = Math.min(gameState.power + 0.01, gameState.maxPower);
        if (gameState.power >= 2.0 && gameState.player.options < 2) gameState.player.options = 2;
        if (gameState.power >= 3.0 && gameState.player.options < 3) gameState.player.options = 3;
        if (gameState.power >= 4.0 && gameState.player.options < 4) gameState.player.options = 4;
        break;
        
      case 'point':
        const heightBonus = Math.max(0, 60 - gameState.player.y) / 60;
        const points = Math.floor(gameState.pointItemValue * (1 + heightBonus));
        gameState.score += points;
        break;
        
      case 'venturer':
        if (this.color && gameState.venturer[this.color] !== undefined) {
          gameState.venturer[this.color]++;
          this.checkUFOSpawn();
        }
        break;
        
      case 'life-fragment':
        gameState.lifeFragments++;
        if (gameState.lifeFragments >= 4) {
          gameState.lives++;
          gameState.lifeFragments = 0;
        }
        break;
        
      case 'spell-fragment':
        gameState.spellFragments++;
        if (gameState.spellFragments >= 3) {
          gameState.spellCards++;
          gameState.spellFragments = 0;
        }
        break;
        
      case 'spell-card':
        gameState.spellCards++;
        break;
    }
  }

  checkUFOSpawn() {
    if (gameState.venturer.red >= gameState.venturerMax && 
        gameState.venturer.blue >= gameState.venturerMax && 
        gameState.venturer.green >= gameState.venturerMax) {
      // Rainbow UFO
      this.spawnUFO('rainbow');
      gameState.venturer.red -= gameState.venturerMax;
      gameState.venturer.blue -= gameState.venturerMax;
      gameState.venturer.green -= gameState.venturerMax;
    } else if (gameState.venturer.red >= gameState.venturerMax) {
      this.spawnUFO('red');
      gameState.venturer.red -= gameState.venturerMax;
    } else if (gameState.venturer.blue >= gameState.venturerMax) {
      this.spawnUFO('blue');
      gameState.venturer.blue -= gameState.venturerMax;
    } else if (gameState.venturer.green >= gameState.venturerMax) {
      this.spawnUFO('green');
      gameState.venturer.green -= gameState.venturerMax;
    }
  }

  spawnUFO(color) {
    const x = GAME_AREA_X + GAME_AREA_WIDTH / 2;
    const y = -30;
    gameState.ufos.push(new UFO(this.p, x, y, color));
    gameState.ufoActive = true;
  }

  render() {
    const p = this.p;
    p.push();
    
    switch (this.type) {
      case 'power':
        p.fill(255, 100, 100);
        p.noStroke();
        p.circle(this.x, this.y, 8);
        p.fill(255, 255, 255);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(8);
        p.text('P', this.x, this.y);
        break;
        
      case 'point':
        p.fill(100, 255, 100);
        p.noStroke();
        p.circle(this.x, this.y, 8);
        break;
        
      case 'venturer':
        const colors = {
          red: [255, 100, 100],
          blue: [100, 100, 255],
          green: [100, 255, 100]
        };
        const col = colors[this.color] || [255, 255, 255];
        p.fill(...col);
        p.noStroke();
        
        // Pentagon shape
        p.beginShape();
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * p.TWO_PI - p.HALF_PI;
          const x = this.x + p.cos(angle) * 10;
          const y = this.y + p.sin(angle) * 10;
          p.vertex(x, y);
        }
        p.endShape(p.CLOSE);
        
        // Flashing border for random type
        if (this.colors) {
          p.noFill();
          p.stroke(255, 255, 255, 200);
          p.strokeWeight(2);
          p.beginShape();
          for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * p.TWO_PI - p.HALF_PI;
            const x = this.x + p.cos(angle) * 10;
            const y = this.y + p.sin(angle) * 10;
            p.vertex(x, y);
          }
          p.endShape(p.CLOSE);
        }
        break;
        
      case 'life-fragment':
        p.fill(255, 200, 100);
        p.noStroke();
        p.star(this.x, this.y, 5, 10, 4);
        break;
        
      case 'spell-fragment':
        p.fill(200, 100, 255);
        p.noStroke();
        p.star(this.x, this.y, 4, 8, 5);
        break;
        
      case 'spell-card':
        p.fill(255, 100, 255);
        p.noStroke();
        p.rect(this.x - 8, this.y - 10, 16, 20);
        break;
    }
    
    p.pop();
  }
}

// Helper function to draw stars
if (!window.p5.prototype.star) {
  window.p5.prototype.star = function(x, y, radius1, radius2, npoints) {
    let angle = this.TWO_PI / npoints;
    let halfAngle = angle / 2.0;
    this.beginShape();
    for (let a = -this.HALF_PI; a < this.TWO_PI - this.HALF_PI; a += angle) {
      let sx = x + this.cos(a) * radius2;
      let sy = y + this.sin(a) * radius2;
      this.vertex(sx, sy);
      sx = x + this.cos(a + halfAngle) * radius1;
      sy = y + this.sin(a + halfAngle) * radius1;
      this.vertex(sx, sy);
    }
    this.endShape(this.CLOSE);
  };
}

export class UFO {
  constructor(p, x, y, color) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.color = color;
    this.health = 50;
    this.maxHealth = 50;
    this.radius = 20;
    this.active = true;
    this.escaped = false;
    this.lifeTime = 600;
    this.timer = 0;
    this.absorbedItems = [];
    this.targetY = 100;
  }

  update() {
    this.timer++;
    
    // Move into position
    if (this.y < this.targetY) {
      this.y += 2;
    } else {
      // Float around
      this.x += Math.sin(this.timer * 0.03) * 2;
      this.x = this.p.constrain(this.x, GAME_AREA_X + 40, GAME_AREA_X + GAME_AREA_WIDTH - 40);
    }
    
    // Absorb items
    for (let item of gameState.items) {
      if (!item.active) continue;
      const dist = this.p.dist(this.x, this.y, item.x, item.y);
      if (dist < 80 && (item.type === 'power' || item.type === 'point')) {
        item.active = false;
        this.absorbedItems.push(item);
      }
    }
    
    // Escape after time
    if (this.timer > this.lifeTime) {
      this.escape();
    }
  }

  takeDamage(damage) {
    this.health -= damage;
    if (this.health <= 0) {
      this.die();
    }
  }

  escape() {
    this.active = false;
    this.escaped = true;
    gameState.ufoActive = false;
  }

  die() {
    this.active = false;
    gameState.ufoActive = false;
    
    // Clear all enemy bullets
    gameState.enemyBullets = [];
    
    // Return items based on UFO type
    const special = this.absorbedItems.length >= 20;
    
    switch (this.color) {
      case 'red':
        gameState.items.push(new Item(this.p, this.x, this.y, 'life-fragment'));
        if (special) {
          gameState.items.push(new Item(this.p, this.x + 20, this.y, 'life-fragment'));
        }
        // Convert P to points
        for (let item of this.absorbedItems) {
          if (item.type === 'power') {
            gameState.score += gameState.pointItemValue;
          } else {
            gameState.score += gameState.pointItemValue;
          }
        }
        break;
        
      case 'blue':
        if (special) {
          for (let item of this.absorbedItems) {
            if (item.type === 'point') {
              gameState.score += gameState.pointItemValue * 8;
            }
          }
        } else {
          for (let item of this.absorbedItems) {
            if (item.type === 'point') {
              gameState.score += gameState.pointItemValue * 3;
            }
          }
        }
        break;
        
      case 'green':
        gameState.items.push(new Item(this.p, this.x, this.y, 'spell-fragment'));
        if (special) {
          gameState.items.push(new Item(this.p, this.x, this.y, 'spell-card'));
        }
        for (let item of this.absorbedItems) {
          if (item.type === 'point') {
            gameState.score += gameState.pointItemValue * 2;
          }
        }
        break;
        
      case 'rainbow':
        if (special) {
          for (let i = 0; i < 3; i++) {
            const colors = ['red', 'blue', 'green'];
            gameState.items.push(new Item(this.p, this.x + (i - 1) * 20, this.y, 'venturer', colors[i]));
          }
          for (let item of this.absorbedItems) {
            if (item.type === 'power') {
              gameState.score += gameState.pointItemValue * 4;
            }
          }
        }
        // Swap P and points
        for (let item of this.absorbedItems) {
          if (item.type === 'power') {
            gameState.score += gameState.pointItemValue * 2;
          } else if (item.type === 'point') {
            gameState.power = Math.min(gameState.power + 0.01, gameState.maxPower);
          }
        }
        break;
    }
    
    gameState.score += 5000;
  }

  render() {
    const p = this.p;
    p.push();
    
    // UFO colors
    const colors = {
      red: [255, 100, 100],
      blue: [100, 150, 255],
      green: [100, 255, 150],
      rainbow: [255, 200, 255]
    };
    const col = colors[this.color] || [200, 200, 200];
    
    // UFO glow
    p.fill(...col, 50);
    p.noStroke();
    p.circle(this.x, this.y, this.radius * 3);
    
    // UFO body
    p.fill(...col);
    p.ellipse(this.x, this.y, this.radius * 3, this.radius * 1.5);
    p.fill(...col.map(c => c * 0.7));
    p.ellipse(this.x, this.y + 5, this.radius * 2, this.radius);
    
    // UFO dome
    p.fill(150, 200, 255, 150);
    p.circle(this.x, this.y - 5, this.radius);
    
    // Health bar
    p.fill(255, 0, 0);
    p.rect(this.x - 25, this.y - 30, 50, 3);
    p.fill(0, 255, 0);
    p.rect(this.x - 25, this.y - 30, 50 * (this.health / this.maxHealth), 3);
    
    // Timer indicator
    const timeLeft = 1 - (this.timer / this.lifeTime);
    p.fill(255, 255, 0, 100);
    p.arc(this.x, this.y, this.radius * 2, this.radius * 2, -p.HALF_PI, -p.HALF_PI + p.TWO_PI * timeLeft);
    
    p.pop();
  }
}