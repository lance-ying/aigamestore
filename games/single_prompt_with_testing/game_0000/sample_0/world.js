// world.js - World generation and management

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';
import { Enemy, Boss } from './enemies.js';

export class Platform {
  constructor(p, x, y, width, height, room) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.room = room;
  }

  render() {
    this.p.push();
    this.p.fill(60, 60, 70);
    this.p.noStroke();
    this.p.rect(this.x, this.y, this.width, this.height);
    
    // Stone texture
    this.p.stroke(50, 50, 60, 100);
    for (let i = 0; i < 3; i++) {
      this.p.line(this.x, this.y + 5 + i * 5, this.x + this.width, this.y + 5 + i * 5);
    }
    this.p.pop();
  }
}

export class AbilityPickup {
  constructor(p, x, y, room, type) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 20;
    this.room = room;
    this.type = type; // 'dash' or 'spell'
    this.collected = false;
    this.animTimer = 0;
  }

  update() {
    if (this.collected) return;
    
    this.animTimer++;
    
    const player = gameState.player;
    if (player && this.room === gameState.currentRoom) {
      const dist = this.p.dist(this.x + this.width/2, this.y + this.height/2,
                               player.x + player.width/2, player.y + player.height/2);
      if (dist < 25) {
        this.collect(player);
      }
    }
  }

  collect(player) {
    this.collected = true;
    if (this.type === 'dash') {
      gameState.unlockedAbilities.dash = true;
    }
    gameState.score += 100;
  }

  render() {
    if (this.collected) return;
    
    this.p.push();
    
    const floatOffset = Math.sin(this.animTimer * 0.1) * 5;
    const y = this.y + floatOffset;
    
    // Glow
    this.p.fill(100, 200, 255, 100);
    this.p.noStroke();
    this.p.ellipse(this.x + this.width/2, y + this.height/2, 35, 35);
    
    // Core
    this.p.fill(150, 220, 255);
    this.p.ellipse(this.x + this.width/2, y + this.height/2, 18, 18);
    
    // Inner glow
    this.p.fill(200, 240, 255);
    this.p.ellipse(this.x + this.width/2, y + this.height/2, 10, 10);
    
    // Rotating particles
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * this.p.TWO_PI + this.animTimer * 0.05;
      const px = this.x + this.width/2 + Math.cos(angle) * 15;
      const py = y + this.height/2 + Math.sin(angle) * 15;
      this.p.fill(180, 230, 255, 200);
      this.p.ellipse(px, py, 4, 4);
    }
    
    this.p.pop();
  }
}

export function initializeWorld(p) {
  gameState.rooms = [];
  gameState.platforms = [];
  gameState.enemies = [];
  gameState.bosses = [];
  gameState.abilities = [];
  gameState.currentRoom = 0;
  
  // Room 0: Starting area
  gameState.rooms.push({ id: 0, type: 'start', name: 'Entrance' });
  createPlatforms(p, 0);
  
  // Room 1: First cavern
  gameState.rooms.push({ id: 1, type: 'cavern', name: 'Upper Cavern' });
  createPlatforms(p, 1);
  createEnemies(p, 1, 3);
  
  // Room 2: Boss room 1
  gameState.rooms.push({ id: 2, type: 'boss', name: 'Guardian Chamber' });
  createPlatforms(p, 2);
  const boss1 = new Boss(p, CANVAS_WIDTH/2 - 30, 150, 2, 'guardian');
  gameState.bosses.push(boss1);
  gameState.entities.push(boss1);
  
  // Room 3: Ability room
  gameState.rooms.push({ id: 3, type: 'ability', name: 'Ancient Shrine' });
  createPlatforms(p, 3);
  const dashAbility = new AbilityPickup(p, CANVAS_WIDTH/2 - 10, 200, 3, 'dash');
  gameState.abilities.push(dashAbility);
  gameState.entities.push(dashAbility);
  
  // Room 4: Deep cavern
  gameState.rooms.push({ id: 4, type: 'cavern', name: 'Deep Cavern' });
  createPlatforms(p, 4);
  createEnemies(p, 4, 5);
  
  // Room 5: Final boss room
  gameState.rooms.push({ id: 5, type: 'final_boss', name: 'Heart of Corruption' });
  createPlatforms(p, 5);
  const finalBoss = new Boss(p, CANVAS_WIDTH/2 - 30, 100, 5, 'corrupted_heart');
  gameState.bosses.push(finalBoss);
  gameState.entities.push(finalBoss);
}

function createPlatforms(p, room) {
  // Floor
  gameState.platforms.push(new Platform(p, 0, CANVAS_HEIGHT - 20, CANVAS_WIDTH, 20, room));
  
  // Room-specific platforms
  if (room === 0) {
    // Starting platforms
    gameState.platforms.push(new Platform(p, 100, 320, 150, 15, room));
    gameState.platforms.push(new Platform(p, 350, 280, 150, 15, room));
  } else if (room === 1) {
    // Platforming challenge
    gameState.platforms.push(new Platform(p, 50, 300, 100, 15, room));
    gameState.platforms.push(new Platform(p, 200, 250, 100, 15, room));
    gameState.platforms.push(new Platform(p, 400, 200, 100, 15, room));
  } else if (room === 2) {
    // Boss arena
    gameState.platforms.push(new Platform(p, 100, 300, 400, 15, room));
    gameState.platforms.push(new Platform(p, 0, 250, 80, 15, room));
    gameState.platforms.push(new Platform(p, 520, 250, 80, 15, room));
  } else if (room === 3) {
    // Ability shrine
    gameState.platforms.push(new Platform(p, 200, 280, 200, 15, room));
  } else if (room === 4) {
    // Deep cavern
    gameState.platforms.push(new Platform(p, 50, 320, 120, 15, room));
    gameState.platforms.push(new Platform(p, 250, 280, 120, 15, room));
    gameState.platforms.push(new Platform(p, 430, 240, 120, 15, room));
    gameState.platforms.push(new Platform(p, 150, 180, 120, 15, room));
  } else if (room === 5) {
    // Final boss arena
    gameState.platforms.push(new Platform(p, 50, 320, 500, 15, room));
    gameState.platforms.push(new Platform(p, 0, 200, 50, 15, room));
    gameState.platforms.push(new Platform(p, 550, 200, 50, 15, room));
  }
  
  // Side walls for all rooms
  gameState.platforms.push(new Platform(p, 0, 0, 10, CANVAS_HEIGHT, room));
  gameState.platforms.push(new Platform(p, CANVAS_WIDTH - 10, 0, 10, CANVAS_HEIGHT, room));
}

function createEnemies(p, room, count) {
  const positions = [
    { x: 100, y: 250, ai: 'patrol' },
    { x: 300, y: 200, ai: 'fly' },
    { x: 450, y: 250, ai: 'patrol' },
    { x: 200, y: 150, ai: 'fly' },
    { x: 400, y: 180, ai: 'patrol' }
  ];
  
  for (let i = 0; i < count && i < positions.length; i++) {
    const pos = positions[i];
    const enemy = new Enemy(p, pos.x, pos.y, room);
    enemy.ai = pos.ai;
    gameState.enemies.push(enemy);
    gameState.entities.push(enemy);
  }
}

export function renderBackground(p, room) {
  // Depth-based gradient
  const depth = room / gameState.rooms.length;
  const r = 20 + depth * 40;
  const g = 15 + depth * 30;
  const b = 25 + depth * 50;
  
  p.background(r, g, b);
  
  // Cave details
  p.push();
  p.noStroke();
  
  // Stalactites
  for (let i = 0; i < 5; i++) {
    const x = 100 + i * 120 + (room * 37) % 50;
    p.fill(40, 40, 50, 150);
    p.triangle(x, 0, x - 10, 0, x - 5, 40 + (room * 13 + i * 7) % 30);
  }
  
  // Background rocks
  for (let i = 0; i < 3; i++) {
    const x = 150 + i * 200 + (room * 43) % 100;
    const y = 100 + i * 80 + (room * 29) % 50;
    p.fill(30, 30, 40, 100);
    p.ellipse(x, y, 80, 60);
  }
  
  p.pop();
}

export function renderUI(p) {
  const player = gameState.player;
  if (!player) return;
  
  p.push();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  
  // Health
  p.fill(255);
  p.text('Health:', 10, 10);
  for (let i = 0; i < player.maxHealth; i++) {
    if (i < player.health) {
      p.fill(255, 100, 100);
    } else {
      p.fill(60, 30, 30);
    }
    p.ellipse(80 + i * 20, 18, 12, 12);
  }
  
  // Soul meter
  p.fill(255);
  p.text('Soul:', 10, 35);
  p.fill(40, 40, 50);
  p.rect(60, 30, 100, 12);
  p.fill(150, 200, 255);
  p.rect(60, 30, (player.soul / player.maxSoul) * 100, 12);
  
  // Score
  p.fill(255);
  p.text(`Score: ${gameState.score}`, 10, 60);
  
  // Room info
  const currentRoom = gameState.rooms[gameState.currentRoom];
  if (currentRoom) {
    p.fill(200, 200, 220);
    p.textAlign(p.CENTER, p.TOP);
    p.text(currentRoom.name, CANVAS_WIDTH/2, 10);
  }
  
  // Ability indicators
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(12);
  let yPos = 10;
  
  if (gameState.unlockedAbilities.dash) {
    p.fill(player.dashCooldown > 0 ? [100, 100, 100] : [150, 220, 255]);
    p.text('SHIFT: Dash', CANVAS_WIDTH - 10, yPos);
    yPos += 20;
  }
  
  if (gameState.unlockedAbilities.spell) {
    p.fill(player.soul >= 33 ? [150, 220, 255] : [100, 100, 100]);
    p.text('Z: Spell', CANVAS_WIDTH - 10, yPos);
  }
  
  p.pop();
}