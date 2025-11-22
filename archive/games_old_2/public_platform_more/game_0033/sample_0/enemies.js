// enemies.js - Enemy management
import { gameState, GRID_SIZE, TILE_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y, TILE_TYPES } from './globals.js';

export class Enemy {
  constructor(wave) {
    this.health = 30 + wave * 10;
    this.maxHealth = this.health;
    this.speed = 1 + wave * 0.1;
    this.pathIndex = 0;
    this.path = [];
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.value = 5 + wave * 2;
    this.size = 15;
    this.color = [200, 50, 50];
    
    this.calculatePath();
    if (this.path.length > 0) {
      this.x = this.path[0].x;
      this.y = this.path[0].y;
      if (this.path.length > 1) {
        this.targetX = this.path[1].x;
        this.targetY = this.path[1].y;
        this.pathIndex = 1;
      }
    }
  }
  
  calculatePath() {
    // Find start position (marked road at top)
    let startX = 3, startY = 0;
    for (let x = 0; x < GRID_SIZE; x++) {
      if (gameState.grid[0][x].type === TILE_TYPES.ROAD) {
        startX = x;
        break;
      }
    }
    
    this.path = [{
      x: GRID_OFFSET_X + startX * TILE_SIZE + TILE_SIZE / 2,
      y: GRID_OFFSET_Y + TILE_SIZE / 2
    }];
    
    // BFS to find path through roads
    const visited = new Set();
    const queue = [{ x: startX, y: startY, path: [{ x: startX, y: startY }] }];
    visited.add(`${startX},${startY}`);
    
    let longestPath = [{ x: startX, y: startY }];
    
    while (queue.length > 0) {
      const current = queue.shift();
      
      if (current.path.length > longestPath.length) {
        longestPath = [...current.path];
      }
      
      const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
      
      for (let [dx, dy] of directions) {
        const nx = current.x + dx;
        const ny = current.y + dy;
        const key = `${nx},${ny}`;
        
        if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE &&
            !visited.has(key) &&
            gameState.grid[ny][nx].type === TILE_TYPES.ROAD) {
          visited.add(key);
          queue.push({
            x: nx,
            y: ny,
            path: [...current.path, { x: nx, y: ny }]
          });
        }
      }
    }
    
    // Convert grid path to screen coordinates
    this.path = longestPath.map(pos => ({
      x: GRID_OFFSET_X + pos.x * TILE_SIZE + TILE_SIZE / 2,
      y: GRID_OFFSET_Y + pos.y * TILE_SIZE + TILE_SIZE / 2
    }));
    
    // Add exit point
    if (this.path.length > 0) {
      const lastPos = this.path[this.path.length - 1];
      this.path.push({
        x: lastPos.x,
        y: GRID_OFFSET_Y + GRID_SIZE * TILE_SIZE + 50
      });
    }
  }
  
  update() {
    if (this.path.length === 0 || this.pathIndex >= this.path.length) {
      return 'escaped';
    }
    
    const target = this.path[this.pathIndex];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < this.speed) {
      this.x = target.x;
      this.y = target.y;
      this.pathIndex++;
      
      if (this.pathIndex >= this.path.length) {
        return 'escaped';
      }
    } else {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }
    
    return 'alive';
  }
  
  takeDamage(damage) {
    this.health -= damage;
    if (this.health <= 0) {
      return true;
    }
    return false;
  }
  
  render(p) {
    // Enemy body
    p.fill(...this.color);
    p.stroke(0);
    p.strokeWeight(2);
    p.ellipse(this.x, this.y, this.size, this.size);
    
    // Health bar
    const barWidth = this.size + 5;
    const barHeight = 4;
    const healthPercent = this.health / this.maxHealth;
    
    p.fill(50);
    p.noStroke();
    p.rect(this.x - barWidth / 2, this.y - this.size / 2 - 8, barWidth, barHeight);
    
    p.fill(0, 200, 0);
    p.rect(this.x - barWidth / 2, this.y - this.size / 2 - 8, barWidth * healthPercent, barHeight);
  }
}

export function spawnEnemy(wave) {
  const enemy = new Enemy(wave);
  gameState.enemies.push(enemy);
  gameState.entities.push(enemy);
}

export function updateEnemies() {
  for (let i = gameState.enemies.length - 1; i >= 0; i--) {
    const enemy = gameState.enemies[i];
    const status = enemy.update();
    
    if (status === 'escaped') {
      gameState.enemies.splice(i, 1);
      const idx = gameState.entities.indexOf(enemy);
      if (idx !== -1) gameState.entities.splice(idx, 1);
      gameState.escapedEnemies++;
    }
  }
}