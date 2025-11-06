// entities.js - Game entities

import Matter from 'https://esm.sh/matter-js@0.19.0';
const { Bodies, World } = Matter;

import { gameState, ITEM_TYPES, CLAW_CONFIG, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Item {
  constructor(x, y, type) {
    this.type = type;
    this.config = ITEM_TYPES[type];
    this.value = this.config.value;
    this.weight = this.config.weight;
    this.size = this.config.size;
    this.color = this.config.color;
    
    // Create Matter.js body
    this.body = Bodies.circle(x, y, this.size, {
      label: 'item',
      isStatic: true,
      friction: 0,
      restitution: 0
    });
    
    World.add(gameState.world, this.body);
    
    this.grabbed = false;
    this.markedForRemoval = false;
  }
  
  render(p) {
    if (this.markedForRemoval) return;
    
    p.push();
    p.translate(this.body.position.x, this.body.position.y);
    
    // Draw item based on type
    if (this.type === 'DIAMOND') {
      // Draw diamond shape
      p.fill(...this.color);
      p.noStroke();
      p.beginShape();
      p.vertex(0, -this.size);
      p.vertex(this.size * 0.6, 0);
      p.vertex(0, this.size);
      p.vertex(-this.size * 0.6, 0);
      p.endShape(p.CLOSE);
      
      // Add sparkle
      p.stroke(255, 255, 255, 150);
      p.strokeWeight(2);
      p.line(-this.size * 0.3, 0, this.size * 0.3, 0);
      p.line(0, -this.size * 0.3, 0, this.size * 0.3);
    } else if (this.type === 'ROCK') {
      // Draw rock with rough edges
      p.fill(...this.color);
      p.stroke(80);
      p.strokeWeight(2);
      p.beginShape();
      const sides = 8;
      for (let i = 0; i < sides; i++) {
        const angle = (i / sides) * p.TWO_PI;
        const radius = this.size * (0.8 + Math.sin(i * 2.3) * 0.2);
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        p.vertex(x, y);
      }
      p.endShape(p.CLOSE);
    } else {
      // Draw gold nugget
      p.fill(...this.color);
      p.stroke(200, 160, 0);
      p.strokeWeight(2);
      p.circle(0, 0, this.size * 2);
      
      // Add shine effect
      p.fill(255, 255, 200, 100);
      p.noStroke();
      p.circle(-this.size * 0.3, -this.size * 0.3, this.size * 0.8);
    }
    
    p.pop();
  }
  
  destroy() {
    this.markedForRemoval = true;
    if (this.body && gameState.world) {
      World.remove(gameState.world, this.body);
    }
  }
}

export class Claw {
  constructor() {
    this.size = 15;
  }
  
  render(p) {
    // Draw cable from fixed point to current claw position
    p.stroke(80, 60, 40);
    p.strokeWeight(2);
    p.line(CLAW_CONFIG.CABLE_START_X, CLAW_CONFIG.CABLE_START_Y, gameState.clawX, gameState.clawY);
    
    // Draw claw at current position
    p.push();
    p.translate(gameState.clawX, gameState.clawY);
    
    // Claw body
    p.fill(150, 150, 150);
    p.noStroke();
    p.circle(0, 0, this.size * 2);
    
    // Claw hooks
    p.stroke(100, 100, 100);
    p.strokeWeight(3);
    p.noFill();
    
    const hookAngle = gameState.clawState === "SWINGING" ? 0.3 : 0.1;
    
    // Left hook
    p.arc(-this.size * 0.5, 0, this.size, this.size, -hookAngle, p.PI + hookAngle);
    
    // Right hook
    p.arc(this.size * 0.5, 0, this.size, this.size, -hookAngle - p.PI, hookAngle);
    
    p.pop();
    
    // Draw grabbed item if any
    if (gameState.grabbedItem && !gameState.grabbedItem.markedForRemoval) {
      gameState.grabbedItem.body.position.x = gameState.clawX;
      gameState.grabbedItem.body.position.y = gameState.clawY + this.size + gameState.grabbedItem.size;
      gameState.grabbedItem.render(p);
    }
  }
}

export function createLevelItems(p) {
  const items = [];
  const itemCount = 10 + gameState.level * 2;
  
  const types = Object.keys(ITEM_TYPES);
  
  for (let i = 0; i < itemCount; i++) {
    const type = types[Math.floor(p.random(types.length))];
    
    // Adjust probabilities - more valuable items are rarer
    const rand = p.random();
    let selectedType;
    if (rand < 0.4) {
      selectedType = 'ROCK';
    } else if (rand < 0.7) {
      selectedType = 'SMALL_GOLD';
    } else if (rand < 0.9) {
      selectedType = 'LARGE_GOLD';
    } else {
      selectedType = 'DIAMOND';
    }
    
    const x = p.random(50, CANVAS_WIDTH - 50);
    const y = p.random(150, CANVAS_HEIGHT - 50);
    
    const item = new Item(x, y, selectedType);
    items.push(item);
  }
  
  return items;
}