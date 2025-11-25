// room.js - Room generation and management

import { Enemy } from './enemy.js';
import {
  ROOM_WIDTH, ROOM_HEIGHT, WALL_THICKNESS,
  CANVAS_WIDTH, CANVAS_HEIGHT
} from './globals.js';

export class Room {
  constructor(index, difficulty, p) {
    this.index = index;
    this.difficulty = difficulty;
    this.p = p;
    
    this.cleared = false;
    this.enemies = [];
    this.pickups = [];
    
    // Room has exits in different directions
    this.exits = {
      top: index < 8,
      bottom: false,
      left: false,
      right: index < 8
    };
    
    // Generate room content
    this.generate();
  }
  
  generate() {
    const p = this.p;
    
    // Spawn enemies based on difficulty
    const enemyCount = 2 + Math.floor(this.difficulty / 2);
    
    for (let i = 0; i < enemyCount; i++) {
      const x = 100 + p.random(ROOM_WIDTH - 200);
      const y = 100 + p.random(ROOM_HEIGHT - 200);
      
      let type = 'basic';
      const roll = p.random();
      if (roll < 0.2 && this.difficulty > 1) {
        type = 'fast';
      } else if (roll < 0.35 && this.difficulty > 2) {
        type = 'heavy';
      }
      
      this.enemies.push(new Enemy(x, y, type, p));
    }
    
    // Chance for health pickup
    if (p.random() < 0.3) {
      this.pickups.push({
        x: ROOM_WIDTH / 2 + p.random(-50, 50),
        y: ROOM_HEIGHT / 2 + p.random(-50, 50),
        type: 'health',
        active: true
      });
    }
  }
  
  update(gameState) {
    // Update enemies
    for (const enemy of this.enemies) {
      enemy.update(gameState);
    }
    
    // Check if room is cleared
    if (!this.cleared && this.enemies.length === 0) {
      this.cleared = true;
      gameState.roomsCleared++;
    }
    
    // Check pickup collection
    const player = gameState.player;
    if (player) {
      for (const pickup of this.pickups) {
        if (!pickup.active) continue;
        
        const dx = player.x - pickup.x;
        const dy = player.y - pickup.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 20) {
          pickup.active = false;
          if (pickup.type === 'health') {
            player.heal(30);
          }
        }
      }
    }
  }
  
  render(p) {
    // Floor
    p.fill(30, 25, 40);
    p.noStroke();
    p.rect(0, 0, ROOM_WIDTH, ROOM_HEIGHT);
    
    // Floor pattern
    p.stroke(40, 35, 50);
    p.strokeWeight(1);
    const tileSize = 40;
    for (let x = 0; x < ROOM_WIDTH; x += tileSize) {
      for (let y = 0; y < ROOM_HEIGHT; y += tileSize) {
        p.line(x, 0, x, ROOM_HEIGHT);
        p.line(0, y, ROOM_WIDTH, y);
      }
    }
    
    // Walls
    p.fill(60, 50, 70);
    p.stroke(80, 70, 90);
    p.strokeWeight(2);
    
    // Top wall
    if (!this.exits.top) {
      p.rect(0, 0, ROOM_WIDTH, WALL_THICKNESS);
    } else {
      p.rect(0, 0, ROOM_WIDTH / 2 - 40, WALL_THICKNESS);
      p.rect(ROOM_WIDTH / 2 + 40, 0, ROOM_WIDTH / 2 - 40, WALL_THICKNESS);
    }
    
    // Bottom wall
    if (!this.exits.bottom) {
      p.rect(0, ROOM_HEIGHT - WALL_THICKNESS, ROOM_WIDTH, WALL_THICKNESS);
    } else {
      p.rect(0, ROOM_HEIGHT - WALL_THICKNESS, ROOM_WIDTH / 2 - 40, WALL_THICKNESS);
      p.rect(ROOM_WIDTH / 2 + 40, ROOM_HEIGHT - WALL_THICKNESS, ROOM_WIDTH / 2 - 40, WALL_THICKNESS);
    }
    
    // Left wall
    if (!this.exits.left) {
      p.rect(0, 0, WALL_THICKNESS, ROOM_HEIGHT);
    } else {
      p.rect(0, 0, WALL_THICKNESS, ROOM_HEIGHT / 2 - 40);
      p.rect(0, ROOM_HEIGHT / 2 + 40, WALL_THICKNESS, ROOM_HEIGHT / 2 - 40);
    }
    
    // Right wall
    if (!this.exits.right) {
      p.rect(ROOM_WIDTH - WALL_THICKNESS, 0, WALL_THICKNESS, ROOM_HEIGHT);
    } else {
      p.rect(ROOM_WIDTH - WALL_THICKNESS, 0, WALL_THICKNESS, ROOM_HEIGHT / 2 - 40);
      p.rect(ROOM_WIDTH - WALL_THICKNESS, ROOM_HEIGHT / 2 + 40, WALL_THICKNESS, ROOM_HEIGHT / 2 - 40);
      
      // Exit indicator
      if (this.cleared) {
        p.fill(100, 255, 100, 150);
        p.noStroke();
        p.rect(ROOM_WIDTH - WALL_THICKNESS, ROOM_HEIGHT / 2 - 40, WALL_THICKNESS, 80);
      }
    }
    
    // Render pickups
    for (const pickup of this.pickups) {
      if (!pickup.active) continue;
      
      p.push();
      p.translate(pickup.x, pickup.y);
      
      if (pickup.type === 'health') {
        // Health orb
        p.fill(255, 100, 100, 200);
        p.stroke(255, 150, 150);
        p.strokeWeight(2);
        p.ellipse(0, 0, 16, 16);
        
        p.fill(255, 200, 200);
        p.noStroke();
        p.ellipse(0, 0, 8, 8);
      }
      
      p.pop();
    }
    
    // Render enemies
    for (const enemy of this.enemies) {
      enemy.render(p);
    }
  }
}

export function generateRooms(p) {
  const rooms = [];
  
  // Create 9 rooms (3x3 grid conceptually, but linear progression)
  for (let i = 0; i < 9; i++) {
    const difficulty = Math.floor(i / 2) + 1;
    rooms.push(new Room(i, difficulty, p));
  }
  
  // Last room is the escape
  rooms[8].enemies = [];
  rooms[8].exits.right = true;
  rooms[8].isEscape = true;
  
  return rooms;
}