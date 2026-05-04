// entities.js - Entity classes for game objects

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, Body, World } = Matter;

import { gameState, PHYSICS, COLORS, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Player {
  constructor(p, x, y) {
    this.p = p;
    this.body = Bodies.rectangle(x, y, PHYSICS.PLAYER_SIZE, PHYSICS.PLAYER_SIZE * 1.5, {
      label: 'player',
      friction: 0.3,
      restitution: 0.1,
      density: 0.02,
      isStatic: false
    });
    World.add(gameState.world, this.body);
    
    this.color = COLORS.PLAYER_CAR;
    this.health = 100;
    this.isCrashed = false;
  }

  update() {
    // Keep player centered horizontally
    const targetX = CANVAS_WIDTH / 2;
    const currentX = this.body.position.x;
    
    if (Math.abs(currentX - targetX) > 2) {
      Body.setPosition(this.body, { x: targetX, y: this.body.position.y });
    }

    // Log player position periodically
    if (this.p.frameCount - gameState.lastPlayerLogFrame > 30) {
      this.p.logs.player_info.push({
        screen_x: this.body.position.x,
        screen_y: this.body.position.y,
        game_x: this.body.position.x,
        game_y: this.body.position.y + gameState.scrollOffset,
        framecount: this.p.frameCount,
        timestamp: Date.now()
      });
      gameState.lastPlayerLogFrame = this.p.frameCount;
    }

    // Check if player fell off screen
    if (this.body.position.y > CANVAS_HEIGHT + 50) {
      this.isCrashed = true;
    }
  }

  render() {
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    this.p.rotate(this.body.angle);
    
    // Car body
    this.p.fill(this.color);
    this.p.stroke(0);
    this.p.strokeWeight(2);
    this.p.rect(-PHYSICS.PLAYER_SIZE / 2, -PHYSICS.PLAYER_SIZE * 0.75, 
                PHYSICS.PLAYER_SIZE, PHYSICS.PLAYER_SIZE * 1.5);
    
    // Windshield
    this.p.fill(150, 200, 255);
    this.p.rect(-PHYSICS.PLAYER_SIZE / 3, -PHYSICS.PLAYER_SIZE * 0.5, 
                PHYSICS.PLAYER_SIZE * 0.66, PHYSICS.PLAYER_SIZE * 0.4);
    
    // Wheels
    this.p.fill(0);
    this.p.noStroke();
    this.p.ellipse(-PHYSICS.PLAYER_SIZE / 3, PHYSICS.PLAYER_SIZE * 0.5, 6, 8);
    this.p.ellipse(PHYSICS.PLAYER_SIZE / 3, PHYSICS.PLAYER_SIZE * 0.5, 6, 8);
    
    this.p.pop();
  }
}

export class RoadSegment {
  constructor(p, x, y, angle) {
    this.p = p;
    this.worldY = y + gameState.scrollOffset;
    
    this.body = Bodies.rectangle(x, y, PHYSICS.ROAD_SEGMENT_WIDTH, PHYSICS.ROAD_SEGMENT_HEIGHT, {
      label: 'road',
      isStatic: true,
      friction: 0.8,
      angle: angle
    });
    World.add(gameState.world, this.body);
    
    this.color = COLORS.ROAD;
    this.creationFrame = p.frameCount;
  }

  update() {
    // Remove if off screen
    if (this.body.position.y > CANVAS_HEIGHT + 100) {
      World.remove(gameState.world, this.body);
      return false;
    }
    return true;
  }

  render() {
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    this.p.rotate(this.body.angle);
    
    // Road segment
    this.p.fill(this.color);
    this.p.noStroke();
    this.p.rect(-PHYSICS.ROAD_SEGMENT_WIDTH / 2, -PHYSICS.ROAD_SEGMENT_HEIGHT / 2,
                PHYSICS.ROAD_SEGMENT_WIDTH, PHYSICS.ROAD_SEGMENT_HEIGHT);
    
    // Road markings
    this.p.fill(COLORS.ROAD_LINE);
    this.p.rect(-2, -PHYSICS.ROAD_SEGMENT_HEIGHT / 2, 4, PHYSICS.ROAD_SEGMENT_HEIGHT);
    
    this.p.pop();
  }
}

export class PoliceCar {
  constructor(p, x, y) {
    this.p = p;
    this.body = Bodies.rectangle(x, y, PHYSICS.POLICE_SIZE, PHYSICS.POLICE_SIZE * 1.5, {
      label: 'police',
      friction: 0.3,
      restitution: 0.2,
      density: 0.015
    });
    World.add(gameState.world, this.body);
    
    this.color = COLORS.POLICE_CAR;
    this.sirenOn = false;
    this.targetX = CANVAS_WIDTH / 2;
  }

  update() {
    // Police car AI - chase player
    if (gameState.player && gameState.player.body) {
      const playerX = gameState.player.body.position.x;
      const dx = playerX - this.body.position.x;
      
      // Apply force towards player
      const force = 0.0008;
      if (Math.abs(dx) > 10) {
        Body.applyForce(this.body, this.body.position, { 
          x: dx > 0 ? force : -force, 
          y: 0 
        });
      }
    }

    // Limit horizontal velocity
    if (Math.abs(this.body.velocity.x) > 5) {
      Body.setVelocity(this.body, { 
        x: this.body.velocity.x > 0 ? 5 : -5, 
        y: this.body.velocity.y 
      });
    }

    // Toggle siren
    this.sirenOn = (this.p.frameCount % 20) < 10;

    // Remove if off screen
    if (this.body.position.y > CANVAS_HEIGHT + 100) {
      World.remove(gameState.world, this.body);
      return false;
    }
    return true;
  }

  render() {
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    this.p.rotate(this.body.angle);
    
    // Car body
    this.p.fill(this.color);
    this.p.stroke(0);
    this.p.strokeWeight(2);
    this.p.rect(-PHYSICS.POLICE_SIZE / 2, -PHYSICS.POLICE_SIZE * 0.75, 
                PHYSICS.POLICE_SIZE, PHYSICS.POLICE_SIZE * 1.5);
    
    // Siren light
    if (this.sirenOn) {
      this.p.fill(0, 0, 255);
    } else {
      this.p.fill(255, 0, 0);
    }
    this.p.noStroke();
    this.p.ellipse(0, -PHYSICS.POLICE_SIZE * 0.6, 6, 6);
    
    // Wheels
    this.p.fill(0);
    this.p.ellipse(-PHYSICS.POLICE_SIZE / 3, PHYSICS.POLICE_SIZE * 0.5, 5, 7);
    this.p.ellipse(PHYSICS.POLICE_SIZE / 3, PHYSICS.POLICE_SIZE * 0.5, 5, 7);
    
    this.p.pop();
  }
}

export class Obstacle {
  constructor(p, x, y) {
    this.p = p;
    this.body = Bodies.circle(x, y, PHYSICS.OBSTACLE_SIZE, {
      label: 'obstacle',
      friction: 0.5,
      restitution: 0.3,
      density: 0.01
    });
    World.add(gameState.world, this.body);
    
    this.color = COLORS.OBSTACLE;
  }

  update() {
    // Remove if off screen
    if (this.body.position.y > CANVAS_HEIGHT + 100) {
      World.remove(gameState.world, this.body);
      return false;
    }
    return true;
  }

  render() {
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    
    // Rock/obstacle
    this.p.fill(this.color);
    this.p.stroke(0);
    this.p.strokeWeight(2);
    this.p.ellipse(0, 0, PHYSICS.OBSTACLE_SIZE * 2, PHYSICS.OBSTACLE_SIZE * 2);
    
    // Highlight
    this.p.fill(180, 150, 100);
    this.p.noStroke();
    this.p.ellipse(-PHYSICS.OBSTACLE_SIZE / 3, -PHYSICS.OBSTACLE_SIZE / 3, 
                   PHYSICS.OBSTACLE_SIZE / 2, PHYSICS.OBSTACLE_SIZE / 2);
    
    this.p.pop();
  }
}