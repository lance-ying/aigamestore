// entities.js - Game entity classes

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, World, Body } = Matter;
import { gameState, CANVAS_HEIGHT, CANVAS_WIDTH } from './globals.js';

export class SushiCat {
  constructor(p, x, y) {
    this.p = p;
    this.startRadius = 15;
    this.radius = this.startRadius;
    this.maxRadius = 30;
    this.currentBodyRadius = this.startRadius; // Track the actual current body radius
    
    this.body = Bodies.circle(x, y, this.radius, {
      label: 'player',
      friction: 0.3,
      restitution: 0.6,
      density: 0.002,
      frictionAir: 0.01
    });
    
    World.add(gameState.world, this.body);
    
    this.color = [255, 180, 200]; // Pink cat
    this.eyeColor = [50, 50, 50];
    this.mouthColor = [200, 100, 120];
  }
  
  update() {
    // Update radius based on belly meter
    const growthFactor = gameState.bellyMeter / 100;
    this.radius = this.startRadius + (this.maxRadius - this.startRadius) * growthFactor;
    
    // Only scale if radius changed significantly
    if (Math.abs(this.radius - this.currentBodyRadius) > 0.5) {
      const scaleFactor = this.radius / this.currentBodyRadius;
      Body.scale(this.body, scaleFactor, scaleFactor);
      this.currentBodyRadius = this.radius;
    }
    
    // Log position if changed significantly
    const dx = Math.abs(this.body.position.x - gameState.lastPlayerLogX);
    const dy = Math.abs(this.body.position.y - gameState.lastPlayerLogY);
    
    if (dx > 5 || dy > 5) {
      this.p.logs.player_info.push({
        screen_x: this.body.position.x,
        screen_y: this.body.position.y,
        game_x: this.body.position.x,
        game_y: this.body.position.y,
        framecount: this.p.frameCount,
        timestamp: Date.now()
      });
      gameState.lastPlayerLogX = this.body.position.x;
      gameState.lastPlayerLogY = this.body.position.y;
    }
    
    // Check if cat fell off screen
    if (this.body.position.y > CANVAS_HEIGHT + 100) {
      this.remove();
      gameState.catDropped = false;
      
      // Check lose condition
      if (gameState.dropsRemaining <= 0 && gameState.bellyMeter < 100) {
        gameState.gamePhase = "GAME_OVER_LOSE";
        this.p.logs.game_info.push({
          data: { gamePhase: "GAME_OVER_LOSE", reason: "out_of_drops" },
          framecount: this.p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }
  
  render() {
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    this.p.rotate(this.body.angle);
    
    // Draw cat body
    this.p.fill(this.color);
    this.p.noStroke();
    this.p.circle(0, 0, this.radius * 2);
    
    // Draw ears
    this.p.fill(this.color);
    this.p.triangle(-this.radius * 0.6, -this.radius * 0.8, 
                   -this.radius * 0.3, -this.radius * 0.3,
                   -this.radius * 0.9, -this.radius * 0.3);
    this.p.triangle(this.radius * 0.6, -this.radius * 0.8, 
                   this.radius * 0.3, -this.radius * 0.3,
                   this.radius * 0.9, -this.radius * 0.3);
    
    // Draw eyes
    this.p.fill(this.eyeColor);
    this.p.circle(-this.radius * 0.3, -this.radius * 0.2, this.radius * 0.25);
    this.p.circle(this.radius * 0.3, -this.radius * 0.2, this.radius * 0.25);
    
    // Draw pupils
    this.p.fill(255);
    this.p.circle(-this.radius * 0.25, -this.radius * 0.25, this.radius * 0.12);
    this.p.circle(this.radius * 0.35, -this.radius * 0.25, this.radius * 0.12);
    
    // Draw mouth
    this.p.stroke(this.mouthColor);
    this.p.strokeWeight(2);
    this.p.noFill();
    this.p.arc(0, this.radius * 0.1, this.radius * 0.5, this.radius * 0.3, 0, this.p.PI);
    
    this.p.pop();
  }
  
  remove() {
    World.remove(gameState.world, this.body);
    gameState.player = null;
  }
}

export class Sushi {
  constructor(p, x, y, type) {
    this.p = p;
    this.type = type || this.p.floor(this.p.random(3)); // 0: nigiri, 1: maki, 2: sashimi
    this.collected = false;
    
    const size = 12;
    this.body = Bodies.circle(x, y, size, {
      label: 'sushi',
      isStatic: true,
      isSensor: true
    });
    
    World.add(gameState.world, this.body);
    
    // Color based on type
    switch(this.type) {
      case 0: // nigiri
        this.color1 = [255, 220, 180]; // rice
        this.color2 = [255, 100, 100]; // fish
        break;
      case 1: // maki
        this.color1 = [50, 50, 50]; // nori
        this.color2 = [255, 150, 80]; // salmon
        break;
      case 2: // sashimi
        this.color1 = [255, 150, 150]; // tuna
        this.color2 = [200, 100, 100]; // darker tuna
        break;
    }
  }
  
  render() {
    if (this.collected) return;
    
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    
    const size = 12;
    
    switch(this.type) {
      case 0: // nigiri
        this.p.fill(this.color1);
        this.p.noStroke();
        this.p.rect(-size, -size * 0.5, size * 2, size);
        this.p.fill(this.color2);
        this.p.rect(-size, -size * 0.8, size * 2, size * 0.6);
        break;
      case 1: // maki
        this.p.fill(this.color1);
        this.p.noStroke();
        this.p.circle(0, 0, size * 2);
        this.p.fill(this.color2);
        this.p.circle(0, 0, size);
        break;
      case 2: // sashimi
        this.p.fill(this.color1);
        this.p.noStroke();
        this.p.ellipse(0, 0, size * 2.5, size * 1.5);
        this.p.fill(this.color2);
        this.p.ellipse(0, 0, size * 2, size);
        break;
    }
    
    this.p.pop();
  }
  
  collect() {
    if (!this.collected) {
      this.collected = true;
      World.remove(gameState.world, this.body);
      
      // Increase belly meter
      const sushiValue = 100 / gameState.totalSushiInLevel;
      gameState.bellyMeter = Math.min(100, gameState.bellyMeter + sushiValue);
      gameState.score += 10;
      
      // Check win condition
      if (gameState.bellyMeter >= 100) {
        gameState.gamePhase = "GAME_OVER_WIN";
        this.p.logs.game_info.push({
          data: { gamePhase: "GAME_OVER_WIN", level: gameState.currentLevel },
          framecount: this.p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }
}

export class Obstacle {
  constructor(p, x, y, width, height, angle, type) {
    this.p = p;
    this.type = type || 'rect'; // rect, circle, triangle
    
    if (this.type === 'circle') {
      this.body = Bodies.circle(x, y, width / 2, {
        label: 'obstacle',
        isStatic: true,
        friction: 0.5,
        restitution: 0.8
      });
    } else if (this.type === 'triangle') {
      // Create triangle vertices
      const vertices = [
        { x: x, y: y - height / 2 },
        { x: x - width / 2, y: y + height / 2 },
        { x: x + width / 2, y: y + height / 2 }
      ];
      this.body = Bodies.fromVertices(x, y, vertices, {
        label: 'obstacle',
        isStatic: true,
        friction: 0.5,
        restitution: 0.8
      });
    } else {
      this.body = Bodies.rectangle(x, y, width, height, {
        label: 'obstacle',
        isStatic: true,
        angle: angle || 0,
        friction: 0.5,
        restitution: 0.8
      });
    }
    
    World.add(gameState.world, this.body);
    
    this.color = [100, 150, 200];
  }
  
  render() {
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    this.p.rotate(this.body.angle);
    
    this.p.fill(this.color);
    this.p.stroke(80, 120, 160);
    this.p.strokeWeight(2);
    
    if (this.body.circleRadius) {
      this.p.circle(0, 0, this.body.circleRadius * 2);
    } else {
      this.p.beginShape();
      const vertices = this.body.vertices;
      for (let v of vertices) {
        const vx = v.x - this.body.position.x;
        const vy = v.y - this.body.position.y;
        this.p.vertex(vx, vy);
      }
      this.p.endShape(this.p.CLOSE);
    }
    
    this.p.pop();
  }
  
  remove() {
    World.remove(gameState.world, this.body);
  }
}

export class Wall {
  constructor(p, x, y, width, height) {
    this.p = p;
    
    this.body = Bodies.rectangle(x, y, width, height, {
      label: 'wall',
      isStatic: true,
      friction: 0.3,
      restitution: 0.5
    });
    
    World.add(gameState.world, this.body);
    
    this.color = [80, 80, 80];
  }
  
  render() {
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    this.p.rotate(this.body.angle);
    
    this.p.fill(this.color);
    this.p.noStroke();
    
    const vertices = this.body.vertices;
    this.p.beginShape();
    for (let v of vertices) {
      const vx = v.x - this.body.position.x;
      const vy = v.y - this.body.position.y;
      this.p.vertex(vx, vy);
    }
    this.p.endShape(this.p.CLOSE);
    
    this.p.pop();
  }
  
  remove() {
    World.remove(gameState.world, this.body);
  }
}