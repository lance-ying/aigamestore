// items.js - Item and pickup system
import { gameState, ROOM_WIDTH, ROOM_HEIGHT } from './globals.js';
import { distance, randomRange } from './utils.js';
import { createRandomWeapon } from './weapons.js';

export class Item {
  constructor(x, y, type, value = 0) {
    this.x = x;
    this.y = y;
    this.type = type; // "gold", "weapon", "scroll", "health"
    this.value = value;
    this.radius = 8;
    this.pickupRadius = 30;
    this.collected = false;
    this.floatOffset = Math.random() * Math.PI * 2;
    
    switch (type) {
      case "gold":
        this.color = [255, 215, 0];
        break;
      case "weapon":
        this.color = [150, 150, 255];
        this.weapon = value; // value is weapon object
        break;
      case "scroll":
        this.color = [200, 100, 255];
        this.scrollData = value; // value is scroll data
        break;
      case "health":
        this.color = [255, 100, 100];
        this.healAmount = value || 30;
        break;
    }
  }
  
  update() {
    const player = gameState.player;
    if (!player) return;
    
    const dist = distance(this.x, this.y, player.x, player.y);
    
    if (dist < this.pickupRadius) {
      this.collect(player);
    }
  }
  
  collect(player) {
    if (this.collected) return;
    this.collected = true;
    
    switch (this.type) {
      case "gold":
        gameState.gold += this.value;
        gameState.score += this.value;
        break;
        
      case "weapon":
        player.addWeapon(this.weapon);
        break;
        
      case "scroll":
        player.scrollBuffs.push(this.scrollData);
        this.applyScrollEffect(player);
        break;
        
      case "health":
        player.heal(this.healAmount);
        break;
    }
  }
  
  applyScrollEffect(player) {
    const scroll = this.scrollData;
    
    switch (scroll.effect) {
      case "damage":
        player.damageMultiplier += 0.2;
        break;
      case "speed":
        player.speed += 0.5;
        break;
      case "health":
        player.maxHealth += 20;
        player.health += 20;
        break;
      case "cooldown":
        player.skillCooldown *= 0.8;
        break;
    }
  }
  
  draw(p) {
    if (this.collected) return;
    
    const screenPos = this.getScreenPosition();
    const floatY = Math.sin(gameState.frameCount * 0.05 + this.floatOffset) * 3;
    
    p.push();
    
    // Glow effect
    p.noStroke();
    p.fill(...this.color, 100);
    p.circle(screenPos.x, screenPos.y + floatY, this.radius * 3);
    
    // Item
    p.fill(...this.color);
    p.stroke(255);
    p.strokeWeight(2);
    
    if (this.type === "scroll") {
      p.rectMode(p.CENTER);
      p.rect(screenPos.x, screenPos.y + floatY, this.radius * 2, this.radius * 2.5);
    } else {
      p.circle(screenPos.x, screenPos.y + floatY, this.radius * 2);
    }
    
    // Icon
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.fill(0);
    p.noStroke();
    
    const icon = {
      "gold": "G",
      "weapon": "W",
      "scroll": "S",
      "health": "+"
    }[this.type];
    
    p.text(icon, screenPos.x, screenPos.y + floatY);
    
    p.pop();
  }
  
  getScreenPosition() {
    return {
      x: this.x - gameState.cameraX + 300,
      y: this.y - gameState.cameraY + 200
    };
  }
}

export function createGoldDrop(x, y, amount) {
  return new Item(x, y, "gold", amount);
}

export function createWeaponDrop(x, y) {
  return new Item(x, y, "weapon", createRandomWeapon());
}

export function createScrollDrop(x, y) {
  const scrollTypes = [
    { name: "Power Scroll", effect: "damage", description: "+20% Damage" },
    { name: "Swift Scroll", effect: "speed", description: "+0.5 Speed" },
    { name: "Vitality Scroll", effect: "health", description: "+20 Max HP" },
    { name: "Haste Scroll", effect: "cooldown", description: "-20% Cooldowns" }
  ];
  
  const scroll = scrollTypes[Math.floor(Math.random() * scrollTypes.length)];
  return new Item(x, y, "scroll", scroll);
}

export function createHealthDrop(x, y) {
  return new Item(x, y, "health", 30);
}