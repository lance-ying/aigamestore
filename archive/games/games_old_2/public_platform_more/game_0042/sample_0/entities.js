// entities.js - Player and Enemy entities

import { gameState } from './globals.js';

export class Player {
  constructor() {
    this.maxHp = 80;
    this.hp = 80;
    this.block = 0;
    this.strength = 0;
    this.weak = 0;
    this.vulnerable = 0;
    this.x = 150;
    this.y = 250;
    this.masterDeck = [];
  }
  
  update() {
    // Player doesn't move, just exists
  }
  
  render(p) {
    p.push();
    
    // Draw player character
    p.fill(100, 150, 255);
    p.stroke(50, 100, 200);
    p.strokeWeight(3);
    p.ellipse(this.x, this.y, 60, 60);
    
    // Draw face
    p.fill(255);
    p.noStroke();
    p.ellipse(this.x - 10, this.y - 5, 8, 8);
    p.ellipse(this.x + 10, this.y - 5, 8, 8);
    p.fill(50, 100, 200);
    p.ellipse(this.x - 10, this.y - 5, 4, 4);
    p.ellipse(this.x + 10, this.y - 5, 4, 4);
    
    // Smile
    p.noFill();
    p.stroke(50, 100, 200);
    p.strokeWeight(2);
    p.arc(this.x, this.y + 5, 20, 15, 0, p.PI);
    
    // HP bar
    const barWidth = 80;
    const barHeight = 8;
    const barX = this.x - barWidth / 2;
    const barY = this.y + 40;
    
    p.fill(60, 60, 60);
    p.noStroke();
    p.rect(barX, barY, barWidth, barHeight);
    
    const hpPercent = this.hp / this.maxHp;
    p.fill(100, 255, 100);
    p.rect(barX, barY, barWidth * hpPercent, barHeight);
    
    p.stroke(0);
    p.strokeWeight(1);
    p.noFill();
    p.rect(barX, barY, barWidth, barHeight);
    
    // HP text
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text(`${this.hp}/${this.maxHp}`, this.x, barY + barHeight / 2);
    
    // Block indicator
    if (this.block > 0) {
      p.fill(200, 200, 255);
      p.stroke(100, 100, 200);
      p.strokeWeight(2);
      p.textSize(14);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(`🛡${this.block}`, this.x, this.y - 40);
    }
    
    // Status effects
    let statusY = this.y + 60;
    if (this.strength > 0) {
      p.fill(255, 100, 100);
      p.noStroke();
      p.textSize(10);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(`STR:${this.strength}`, this.x - 30, statusY);
    }
    if (this.weak > 0) {
      p.fill(150, 150, 255);
      p.text(`WEAK:${this.weak}`, this.x, statusY);
    }
    if (this.vulnerable > 0) {
      p.fill(255, 150, 150);
      p.text(`VULN:${this.vulnerable}`, this.x + 30, statusY);
    }
    
    p.pop();
  }
}

export class Enemy {
  constructor(type, floor) {
    this.type = type;
    this.floor = floor;
    
    // Scale with floor
    const scaling = 1 + (floor - 1) * 0.3;
    
    switch(type) {
      case "SLIME":
        this.name = "Slime";
        this.maxHp = Math.floor(12 * scaling);
        this.damage = Math.floor(5 * scaling);
        this.color = [100, 255, 100];
        break;
      case "GOBLIN":
        this.name = "Goblin";
        this.maxHp = Math.floor(15 * scaling);
        this.damage = Math.floor(6 * scaling);
        this.color = [255, 150, 100];
        break;
      case "WARRIOR":
        this.name = "Warrior";
        this.maxHp = Math.floor(20 * scaling);
        this.damage = Math.floor(8 * scaling);
        this.color = [200, 100, 100];
        break;
      case "BOSS":
        this.name = "Dark Witch";
        this.maxHp = Math.floor(80 * scaling);
        this.damage = Math.floor(12 * scaling);
        this.color = [150, 50, 200];
        break;
    }
    
    this.hp = this.maxHp;
    this.block = 0;
    this.weak = 0;
    this.vulnerable = 0;
    this.x = 0;
    this.y = 0;
    this.intent = "ATTACK";
    this.nextDamage = this.damage;
  }
  
  decideIntent() {
    const rand = Math.random();
    if (rand < 0.7) {
      this.intent = "ATTACK";
      this.nextDamage = this.damage + Math.floor(Math.random() * 3);
    } else {
      this.intent = "DEFEND";
      this.nextDamage = 0;
    }
  }
  
  executeIntent() {
    if (this.intent === "ATTACK") {
      return { type: "ATTACK", damage: this.nextDamage };
    } else if (this.intent === "DEFEND") {
      this.block += Math.floor(5 + Math.random() * 5);
      return { type: "DEFEND", block: this.block };
    }
  }
  
  update() {
    // Enemies don't move, just exist
  }
  
  render(p) {
    if (this.hp <= 0) return;
    
    p.push();
    
    // Determine if selected
    const isSelected = gameState.selectedTargetIndex === gameState.enemies.indexOf(this);
    
    // Draw enemy
    p.fill(...this.color);
    p.stroke(this.color[0] * 0.6, this.color[1] * 0.6, this.color[2] * 0.6);
    p.strokeWeight(isSelected ? 4 : 2);
    
    if (this.type === "BOSS") {
      // Draw larger boss
      p.ellipse(this.x, this.y, 80, 80);
      
      // Evil eyes
      p.fill(255, 0, 0);
      p.noStroke();
      p.ellipse(this.x - 15, this.y - 10, 12, 12);
      p.ellipse(this.x + 15, this.y - 10, 12, 12);
      
      // Crown
      p.fill(255, 215, 0);
      p.triangle(this.x - 20, this.y - 40, this.x - 10, this.y - 50, this.x, this.y - 40);
      p.triangle(this.x, this.y - 40, this.x + 10, this.y - 50, this.x + 20, this.y - 40);
    } else {
      p.ellipse(this.x, this.y, 50, 50);
      
      // Eyes
      p.fill(0);
      p.noStroke();
      p.ellipse(this.x - 10, this.y - 5, 6, 6);
      p.ellipse(this.x + 10, this.y - 5, 6, 6);
    }
    
    // HP bar
    const barWidth = this.type === "BOSS" ? 100 : 60;
    const barHeight = 6;
    const barX = this.x - barWidth / 2;
    const barY = this.y + (this.type === "BOSS" ? 50 : 35);
    
    p.fill(60, 60, 60);
    p.noStroke();
    p.rect(barX, barY, barWidth, barHeight);
    
    const hpPercent = this.hp / this.maxHp;
    p.fill(255, 100, 100);
    p.rect(barX, barY, barWidth * hpPercent, barHeight);
    
    p.stroke(0);
    p.strokeWeight(1);
    p.noFill();
    p.rect(barX, barY, barWidth, barHeight);
    
    // HP text
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(8);
    p.text(`${this.hp}/${this.maxHp}`, this.x, barY + barHeight / 2);
    
    // Block indicator
    if (this.block > 0) {
      p.fill(200, 200, 255);
      p.stroke(100, 100, 200);
      p.strokeWeight(2);
      p.textSize(12);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(`🛡${this.block}`, this.x, this.y - (this.type === "BOSS" ? 50 : 35));
    }
    
    // Intent indicator
    p.textSize(10);
    p.noStroke();
    if (this.intent === "ATTACK") {
      p.fill(255, 100, 100);
      p.text(`⚔${this.nextDamage}`, this.x, barY + 15);
    } else if (this.intent === "DEFEND") {
      p.fill(100, 200, 255);
      p.text(`🛡DEF`, this.x, barY + 15);
    }
    
    // Status effects
    let statusY = barY + 25;
    if (this.weak > 0) {
      p.fill(150, 150, 255);
      p.text(`W:${this.weak}`, this.x - 20, statusY);
    }
    if (this.vulnerable > 0) {
      p.fill(255, 150, 150);
      p.text(`V:${this.vulnerable}`, this.x + 20, statusY);
    }
    
    p.pop();
  }
}

export function createEnemiesForFloor(floor) {
  const enemies = [];
  
  if (floor === 5) {
    // Boss floor
    const boss = new Enemy("BOSS", floor);
    boss.x = 450;
    boss.y = 200;
    enemies.push(boss);
  } else if (floor === 1) {
    // Easy start
    const slime1 = new Enemy("SLIME", floor);
    slime1.x = 400;
    slime1.y = 180;
    enemies.push(slime1);
    
    const slime2 = new Enemy("SLIME", floor);
    slime2.x = 480;
    slime2.y = 220;
    enemies.push(slime2);
  } else {
    // Mixed encounters
    const numEnemies = Math.min(2 + Math.floor(floor / 2), 3);
    for (let i = 0; i < numEnemies; i++) {
      let type;
      const rand = Math.random();
      if (rand < 0.4) type = "SLIME";
      else if (rand < 0.7) type = "GOBLIN";
      else type = "WARRIOR";
      
      const enemy = new Enemy(type, floor);
      enemy.x = 380 + i * 80;
      enemy.y = 160 + i * 40;
      enemies.push(enemy);
    }
  }
  
  return enemies;
}