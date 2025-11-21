// entities.js - Entity classes with Matter.js bodies

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, Body, World } = Matter;

import { gameState, TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, CROP_TYPES } from './globals.js';

export class Player {
  constructor(p, x, y) {
    this.p = p;
    
    this.body = Bodies.rectangle(x, y, 30, 30, {
      label: 'player',
      friction: 0.9,
      frictionAir: 0.3,
      restitution: 0,
      inertia: Infinity
    });
    World.add(gameState.world, this.body);
    
    this.size = 30;
    this.moveSpeed = 0.015;
    this.sprintMultiplier = 1.8;
    this.lastLoggedX = x;
    this.lastLoggedY = y;
  }
  
  update() {
    // Constrain to canvas
    if (this.body.position.x < this.size / 2) {
      Body.setPosition(this.body, { x: this.size / 2, y: this.body.position.y });
    }
    if (this.body.position.x > CANVAS_WIDTH - this.size / 2) {
      Body.setPosition(this.body, { x: CANVAS_WIDTH - this.size / 2, y: this.body.position.y });
    }
    if (this.body.position.y < this.size / 2) {
      Body.setPosition(this.body, { x: this.body.position.x, y: this.size / 2 });
    }
    if (this.body.position.y > CANVAS_HEIGHT - this.size / 2) {
      Body.setPosition(this.body, { x: this.body.position.x, y: CANVAS_HEIGHT - this.size / 2 });
    }
    
    // Log position if changed significantly
    const dx = Math.abs(this.body.position.x - this.lastLoggedX);
    const dy = Math.abs(this.body.position.y - this.lastLoggedY);
    if (dx > 10 || dy > 10) {
      this.p.logs.player_info.push({
        screen_x: this.body.position.x,
        screen_y: this.body.position.y,
        game_x: this.body.position.x,
        game_y: this.body.position.y,
        framecount: this.p.frameCount,
        timestamp: Date.now()
      });
      this.lastLoggedX = this.body.position.x;
      this.lastLoggedY = this.body.position.y;
    }
  }
  
  render() {
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    
    // Body
    this.p.fill(100, 150, 255);
    this.p.noStroke();
    this.p.rect(-this.size / 2, -this.size / 2, this.size, this.size * 0.6);
    
    // Head
    this.p.fill(255, 220, 180);
    this.p.ellipse(0, -this.size / 3, this.size * 0.5, this.size * 0.5);
    
    // Hat
    this.p.fill(139, 69, 19);
    this.p.rect(-this.size / 3, -this.size / 2, this.size * 0.66, this.size * 0.2);
    this.p.ellipse(0, -this.size / 2, this.size * 0.5, this.size * 0.15);
    
    // Legs
    this.p.fill(60, 60, 120);
    this.p.rect(-this.size / 4, this.size * 0.1, this.size * 0.3, this.size * 0.4);
    this.p.rect(0, this.size * 0.1, this.size * 0.3, this.size * 0.4);
    
    this.p.pop();
  }
  
  move(dx, dy, sprint = false) {
    const speed = sprint ? this.moveSpeed * this.sprintMultiplier : this.moveSpeed;
    const energyCost = sprint ? 0.15 : 0.05;
    
    if (gameState.energy > 0) {
      Body.applyForce(this.body, this.body.position, { x: dx * speed, y: dy * speed });
      gameState.energy = Math.max(0, gameState.energy - energyCost);
    }
  }
  
  getGridPosition() {
    const col = Math.floor(this.body.position.x / TILE_SIZE);
    const row = Math.floor(this.body.position.y / TILE_SIZE);
    return { col, row };
  }
}

export class FarmTile {
  constructor(col, row) {
    this.col = col;
    this.row = row;
    this.x = col * TILE_SIZE + TILE_SIZE / 2;
    this.y = row * TILE_SIZE + TILE_SIZE / 2;
    
    this.tilled = false;
    this.watered = false;
    this.planted = false;
    this.cropType = null;
    this.growthStage = 0;
    this.daysGrowing = 0;
    this.needsWater = false;
  }
  
  till() {
    if (!this.tilled) {
      this.tilled = true;
      return true;
    }
    return false;
  }
  
  plant(cropType) {
    if (this.tilled && !this.planted) {
      this.planted = true;
      this.cropType = cropType;
      this.growthStage = 0;
      this.daysGrowing = 0;
      this.needsWater = true;
      return true;
    }
    return false;
  }
  
  water() {
    if (this.planted && this.needsWater) {
      this.watered = true;
      this.needsWater = false;
      return true;
    }
    return false;
  }
  
  harvest() {
    if (this.planted && this.isReadyToHarvest()) {
      const crop = CROP_TYPES[this.cropType];
      this.planted = false;
      this.cropType = null;
      this.growthStage = 0;
      this.daysGrowing = 0;
      this.watered = false;
      this.needsWater = false;
      return crop;
    }
    return null;
  }
  
  isReadyToHarvest() {
    if (!this.planted || !this.cropType) return false;
    const crop = CROP_TYPES[this.cropType];
    return this.daysGrowing >= crop.growthTime;
  }
  
  advanceDay() {
    if (this.planted && this.watered) {
      this.daysGrowing++;
      const crop = CROP_TYPES[this.cropType];
      this.growthStage = Math.min(4, Math.floor((this.daysGrowing / crop.growthTime) * 4));
    }
    
    if (this.planted) {
      this.watered = false;
      this.needsWater = true;
    }
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Base grass
    p.fill(34, 139, 34);
    p.noStroke();
    p.rect(-TILE_SIZE / 2, -TILE_SIZE / 2, TILE_SIZE, TILE_SIZE);
    
    // Tilled soil
    if (this.tilled) {
      p.fill(this.watered ? 80 : 120, this.watered ? 50 : 80, 40);
      p.rect(-TILE_SIZE / 2 + 2, -TILE_SIZE / 2 + 2, TILE_SIZE - 4, TILE_SIZE - 4);
      
      // Soil lines
      p.stroke(60, 40, 20);
      p.strokeWeight(1);
      for (let i = 0; i < 3; i++) {
        p.line(-TILE_SIZE / 2 + 5, -TILE_SIZE / 2 + 10 + i * 8, TILE_SIZE / 2 - 5, -TILE_SIZE / 2 + 10 + i * 8);
      }
    }
    
    // Crop
    if (this.planted && this.cropType) {
      const crop = CROP_TYPES[this.cropType];
      const stage = this.growthStage;
      
      if (stage === 0) {
        // Seed
        p.fill(139, 90, 43);
        p.noStroke();
        p.ellipse(0, 0, 4, 4);
      } else if (stage === 1) {
        // Sprout
        p.stroke(50, 150, 50);
        p.strokeWeight(2);
        p.line(0, 5, 0, -5);
      } else if (stage === 2) {
        // Small plant
        p.stroke(50, 150, 50);
        p.strokeWeight(2);
        p.line(0, 8, 0, -8);
        p.line(-4, 2, 4, 2);
      } else if (stage === 3) {
        // Growing plant
        p.stroke(34, 139, 34);
        p.strokeWeight(3);
        p.line(0, 10, 0, -10);
        p.line(-6, 0, 6, 0);
        p.line(-4, -6, 4, -6);
      } else if (stage >= 4) {
        // Mature crop
        p.stroke(34, 139, 34);
        p.strokeWeight(3);
        p.line(0, 10, 0, -10);
        
        // Crop fruit/vegetable
        p.fill(crop.color);
        p.noStroke();
        if (this.cropType === "WHEAT") {
          for (let i = 0; i < 3; i++) {
            p.ellipse(-4 + i * 4, -10 - i * 2, 6, 8);
          }
        } else if (this.cropType === "CARROT") {
          p.triangle(-3, -5, 3, -5, 0, 5);
        } else if (this.cropType === "TOMATO") {
          p.ellipse(0, -8, 12, 12);
        } else if (this.cropType === "CORN") {
          p.rect(-3, -12, 6, 10);
        } else if (this.cropType === "PUMPKIN") {
          p.ellipse(0, -5, 14, 12);
        }
      }
      
      // Water indicator
      if (this.needsWater && !this.watered) {
        p.fill(255, 100, 100, 150);
        p.noStroke();
        p.ellipse(TILE_SIZE / 2 - 5, -TILE_SIZE / 2 + 5, 6, 6);
      }
    }
    
    p.pop();
  }
}