// entities.js - Game entities
import { CANVAS_WIDTH, CANVAS_HEIGHT, NUM_LANES, LANE_WIDTH, UNIT_SIZE, UNIT_SPEED, UNIT_HP, UNIT_DAMAGE, CHAMPION_SIZE, CHAMPION_HP, CHAMPION_DAMAGE } from './globals.js';

export class Cannon {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.angle = 0;
    this.length = 40;
    this.width = 30;
  }
  
  setAngle(angle) {
    this.angle = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, angle));
  }
  
  draw(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Base
    p.fill(60, 60, 80);
    p.noStroke();
    p.rect(-this.width / 2, -10, this.width, 20, 5);
    
    // Barrel
    p.rotate(this.angle);
    p.fill(80, 80, 100);
    p.rect(-8, -this.length, 16, this.length, 5);
    
    // Muzzle
    p.fill(120, 120, 140);
    p.ellipse(0, -this.length, 20, 20);
    
    p.pop();
  }
  
  getFirePosition() {
    return {
      x: this.x + Math.sin(this.angle) * this.length,
      y: this.y - Math.cos(this.angle) * this.length
    };
  }
  
  getFireDirection() {
    return {
      x: Math.sin(this.angle),
      y: -Math.cos(this.angle)
    };
  }
}

export class Unit {
  constructor(x, y, vx, vy, team = 'player', isChampion = false, speedBoost = false) {
    this.x = x;
    this.y = y;
    this.vx = vx * (speedBoost ? 2 : 1);
    this.vy = vy * (speedBoost ? 2 : 1);
    this.team = team;
    this.isChampion = isChampion;
    this.size = isChampion ? CHAMPION_SIZE : UNIT_SIZE;
    this.hp = isChampion ? CHAMPION_HP : UNIT_HP;
    this.maxHP = this.hp;
    this.damage = isChampion ? CHAMPION_DAMAGE : UNIT_DAMAGE;
    this.active = true;
    this.speedBoost = speedBoost;
    
    // Combat
    this.target = null;
    this.attackCooldown = 0;
  }
  
  update(p) {
    if (!this.active) return;
    
    this.x += this.vx;
    this.y += this.vy;
    
    // Remove if out of bounds
    if (this.y < -20 || this.y > CANVAS_HEIGHT + 20 || 
        this.x < -20 || this.x > CANVAS_WIDTH + 20) {
      this.active = false;
    }
    
    // Attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown--;
    }
  }
  
  draw(p) {
    if (!this.active) return;
    
    p.push();
    
    // Unit body
    if (this.team === 'player') {
      if (this.isChampion) {
        // Champion - golden warrior
        p.fill(255, 215, 0);
        p.stroke(200, 170, 0);
        p.strokeWeight(2);
        p.ellipse(this.x, this.y, this.size, this.size);
        
        // Crown
        p.fill(255, 255, 100);
        p.noStroke();
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
          p.ellipse(
            this.x + Math.cos(angle) * (this.size / 2),
            this.y + Math.sin(angle) * (this.size / 2),
            4, 4
          );
        }
      } else {
        // Regular unit - blue
        p.fill(100, 150, 255);
        p.stroke(70, 120, 220);
        p.strokeWeight(1);
        p.ellipse(this.x, this.y, this.size, this.size);
        
        if (this.speedBoost) {
          // Speed lines
          p.stroke(150, 200, 255);
          p.strokeWeight(2);
          for (let i = 0; i < 3; i++) {
            p.line(this.x - this.size / 2, this.y + i * 3 - 3, 
                   this.x - this.size / 2 - 5, this.y + i * 3 - 3);
          }
        }
      }
    } else {
      // Enemy unit - red
      p.fill(255, 100, 100);
      p.stroke(220, 70, 70);
      p.strokeWeight(1);
      p.ellipse(this.x, this.y, this.size, this.size);
    }
    
    // Health bar for champions and damaged units
    if (this.isChampion || this.hp < this.maxHP) {
      const barWidth = this.size * 1.2;
      const barHeight = 3;
      const healthPercent = this.hp / this.maxHP;
      
      p.noStroke();
      p.fill(40, 40, 40);
      p.rect(this.x - barWidth / 2, this.y - this.size / 2 - 6, barWidth, barHeight);
      
      p.fill(100, 255, 100);
      p.rect(this.x - barWidth / 2, this.y - this.size / 2 - 6, barWidth * healthPercent, barHeight);
    }
    
    p.pop();
  }
  
  takeDamage(damage) {
    this.hp -= damage;
    if (this.hp <= 0) {
      this.active = false;
    }
  }
  
  attack(target) {
    if (this.attackCooldown <= 0) {
      target.takeDamage(this.damage);
      this.attackCooldown = 30; // 0.5 seconds at 60 FPS
    }
  }
}

export class Gate {
  constructor(x, y, type, value) {
    this.x = x;
    this.y = y;
    this.type = type; // 'multiply' or 'add'
    this.value = value;
    this.width = 50;
    this.height = 30;
    this.used = false;
    this.pulseOffset = Math.random() * Math.PI * 2;
  }
  
  draw(p, frameCount) {
    p.push();
    
    // Pulsing effect
    const pulse = Math.sin(frameCount * 0.1 + this.pulseOffset) * 0.15 + 1;
    
    // Gate frame
    p.fill(this.used ? 80 : 150, this.used ? 80 : 100, this.used ? 80 : 200, this.used ? 100 : 255);
    p.stroke(200, 220, 255);
    p.strokeWeight(2);
    p.rect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height, 5);
    
    // Symbol
    p.fill(255, 255, 255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14 * pulse);
    
    const text = this.type === 'multiply' ? `x${this.value}` : `+${this.value}`;
    p.text(text, this.x, this.y);
    
    // Particles around gate
    if (!this.used) {
      for (let i = 0; i < 3; i++) {
        const angle = frameCount * 0.05 + i * (Math.PI * 2 / 3);
        const radius = 30 + Math.sin(frameCount * 0.1) * 5;
        p.fill(200, 220, 255, 150);
        p.ellipse(
          this.x + Math.cos(angle) * radius,
          this.y + Math.sin(angle) * radius,
          4, 4
        );
      }
    }
    
    p.pop();
  }
  
  checkCollision(unit, p) {
    if (this.used) return false;
    
    return p.collideCircleCircle(
      unit.x, unit.y, unit.size,
      this.x, this.y, Math.max(this.width, this.height)
    );
  }
}