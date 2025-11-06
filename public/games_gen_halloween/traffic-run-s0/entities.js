// entities.js - Entity classes for game objects

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, Body, World } = Matter;

import {
  gameState,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_ACCELERATION,
  PLAYER_MAX_SPEED,
  TRAFFIC_CAR_WIDTH,
  TRAFFIC_CAR_HEIGHT,
  COIN_RADIUS,
  INTERSECTION_Y_START,
  INTERSECTION_HEIGHT,
  CANVAS_HEIGHT
} from './globals.js';

export class Player {
  constructor(p, x, y) {
    this.p = p;
    this.width = PLAYER_WIDTH;
    this.height = PLAYER_HEIGHT;
    
    // Create Matter.js body - rectangle player car
    this.body = Bodies.rectangle(x, y, this.width, this.height, {
      label: 'player',
      friction: 0.1,
      frictionAir: 0.01,
      restitution: 0,
      inertia: Infinity,
      density: 0.001
    });
    
    World.add(gameState.world, this.body);
    
    this.color = [255, 200, 0]; // Yellow car
    this.velocity = 0;
    this.atIntersection = false;
  }

  update() {
    const currentY = this.body.position.y;
    
    // Check if at intersection (stopped zone)
    const intersectionTop = gameState.intersectionY - 5;
    const intersectionBottom = gameState.intersectionY + INTERSECTION_HEIGHT;
    
    if (currentY >= intersectionTop && currentY <= intersectionTop + 10 && !gameState.isAccelerating) {
      this.atIntersection = true;
      Body.setVelocity(this.body, { x: 0, y: 0 });
      Body.setPosition(this.body, { x: this.body.position.x, y: intersectionTop });
    } else {
      this.atIntersection = false;
    }
    
    // Apply acceleration if active
    if (gameState.isAccelerating && gameState.canAccelerate) {
      this.velocity += PLAYER_ACCELERATION;
      if (this.velocity > PLAYER_MAX_SPEED) {
        this.velocity = PLAYER_MAX_SPEED;
      }
    }
    
    // Move upward (negative Y)
    if (this.velocity > 0) {
      Body.setVelocity(this.body, { x: 0, y: -this.velocity });
    }
    
    // Check if crossed intersection
    if (currentY < gameState.intersectionY - 20 && gameState.framesSinceLastCrossing > 60) {
      this.onCrossing();
    }
    
    // Keep player horizontally centered
    if (Math.abs(this.body.position.x - 300) > 1) {
      Body.setPosition(this.body, { x: 300, y: this.body.position.y });
    }
    
    // Log position changes
    if (Math.abs(currentY - gameState.lastLoggedPlayerY) > 10) {
      this.p.logs.player_info.push({
        screen_x: this.body.position.x,
        screen_y: this.body.position.y,
        game_x: this.body.position.x,
        game_y: this.body.position.y,
        framecount: this.p.frameCount,
        timestamp: Date.now()
      });
      gameState.lastLoggedPlayerY = currentY;
    }
  }

  onCrossing() {
    gameState.crossingsCompleted++;
    gameState.score += 100;
    gameState.framesSinceLastCrossing = 0;
    
    // Update difficulty
    gameState.currentDifficulty = Math.floor(gameState.crossingsCompleted / 2) + 1;
    
    // Reset for next intersection
    this.velocity = 0;
    gameState.isAccelerating = false;
    gameState.canAccelerate = true;
    
    // Spawn coin randomly
    if (this.p.random() < 0.4) {
      this.spawnCoin();
    }
    
    this.p.logs.game_info.push({
      data: { event: 'crossing_complete', crossings: gameState.crossingsCompleted, score: gameState.score },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }

  spawnCoin() {
    const coinY = gameState.intersectionY + INTERSECTION_HEIGHT / 2;
    const coin = new Coin(this.p, 300, coinY);
    gameState.coins.push(coin);
    gameState.entities.push(coin);
  }

  render() {
    const p = this.p;
    p.push();
    p.translate(this.body.position.x, this.body.position.y);
    p.rotate(this.body.angle);
    
    // Draw car body
    p.fill(this.color);
    p.stroke(0);
    p.strokeWeight(2);
    p.rectMode(p.CENTER);
    p.rect(0, 0, this.width, this.height, 3);
    
    // Draw windows
    p.fill(100, 150, 200);
    p.noStroke();
    p.rect(0, -8, 20, 15);
    p.rect(0, 8, 20, 12);
    
    // Draw front indicator
    p.fill(255, 0, 0);
    p.rect(0, -this.height/2 + 3, this.width - 10, 4);
    
    p.pop();
  }

  accelerate() {
    if (this.atIntersection && gameState.canAccelerate) {
      gameState.isAccelerating = true;
    }
  }

  stopAccelerating() {
    gameState.isAccelerating = false;
  }
}

export class TrafficCar {
  constructor(p, x, y, direction, speed) {
    this.p = p;
    this.width = TRAFFIC_CAR_WIDTH;
    this.height = TRAFFIC_CAR_HEIGHT;
    this.direction = direction; // 1 for right, -1 for left
    this.speed = speed;
    
    // Create Matter.js body
    this.body = Bodies.rectangle(x, y, this.width, this.height, {
      label: 'traffic',
      friction: 0,
      frictionAir: 0,
      restitution: 0,
      isStatic: false,
      density: 0.001
    });
    
    World.add(gameState.world, this.body);
    
    // Random car color
    const colors = [
      [200, 50, 50],   // Red
      [50, 100, 200],  // Blue
      [50, 200, 50],   // Green
      [150, 50, 150],  // Purple
      [200, 200, 200]  // Gray
    ];
    this.color = colors[Math.floor(this.p.random() * colors.length)];
    
    this.active = true;
  }

  update() {
    // Move horizontally
    Body.setVelocity(this.body, { x: this.speed * this.direction, y: 0 });
    
    // Remove if off screen
    if (this.body.position.x < -100 || this.body.position.x > 700) {
      this.active = false;
    }
  }

  render() {
    const p = this.p;
    p.push();
    p.translate(this.body.position.x, this.body.position.y);
    p.rotate(this.body.angle);
    
    // Draw car body
    p.fill(this.color);
    p.stroke(0);
    p.strokeWeight(2);
    p.rectMode(p.CENTER);
    p.rect(0, 0, this.width, this.height, 3);
    
    // Draw windows
    p.fill(100, 150, 200);
    p.noStroke();
    p.rect(0, 0, this.width - 20, this.height - 12);
    
    // Draw direction indicator (headlights)
    p.fill(255, 255, 200);
    if (this.direction === 1) {
      p.ellipse(this.width/2 - 5, -8, 5, 5);
      p.ellipse(this.width/2 - 5, 8, 5, 5);
    } else {
      p.ellipse(-this.width/2 + 5, -8, 5, 5);
      p.ellipse(-this.width/2 + 5, 8, 5, 5);
    }
    
    p.pop();
  }

  remove() {
    World.remove(gameState.world, this.body);
  }
}

export class Coin {
  constructor(p, x, y) {
    this.p = p;
    this.radius = COIN_RADIUS;
    
    // Create Matter.js body as sensor (no collision)
    this.body = Bodies.circle(x, y, this.radius, {
      label: 'coin',
      isSensor: true,
      isStatic: true
    });
    
    World.add(gameState.world, this.body);
    
    this.collected = false;
    this.rotation = 0;
  }

  update() {
    this.rotation += 0.1;
    
    // Check if player collects coin
    if (!this.collected && gameState.player) {
      const dx = this.body.position.x - gameState.player.body.position.x;
      const dy = this.body.position.y - gameState.player.body.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < this.radius + 20) {
        this.collect();
      }
    }
  }

  collect() {
    this.collected = true;
    gameState.score += 50;
    
    this.p.logs.game_info.push({
      data: { event: 'coin_collected', score: gameState.score },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }

  render() {
    if (this.collected) return;
    
    const p = this.p;
    p.push();
    p.translate(this.body.position.x, this.body.position.y);
    
    // Spinning coin effect
    const scale = Math.abs(Math.cos(this.rotation));
    p.scale(scale, 1);
    
    // Draw coin
    p.fill(255, 215, 0);
    p.stroke(200, 170, 0);
    p.strokeWeight(3);
    p.circle(0, 0, this.radius * 2);
    
    // Coin center
    p.fill(255, 235, 50);
    p.noStroke();
    p.circle(0, 0, this.radius * 1.2);
    
    p.pop();
  }

  remove() {
    World.remove(gameState.world, this.body);
  }
}