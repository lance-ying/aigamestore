// entities.js - Building and car entities

import { gameState, HOUSE_COLORS, GRID_COLS, GRID_ROWS } from './globals.js';

export class Building {
  constructor(x, y, colorIndex, type) {
    this.x = x;
    this.y = y;
    this.colorIndex = colorIndex;
    this.type = type;  // "HOUSE" or "DESTINATION"
    this.queue = [];  // Cars waiting to leave (for houses)
    this.capacity = 0;  // Current number waiting (visual indicator)
    this.maxCapacity = gameState.maxQueueSize;
    this.isOverloaded = false;
  }
  
  addToQueue() {
    this.queue.push(Date.now());
    this.capacity++;
    if (this.capacity >= this.maxCapacity) {
      this.isOverloaded = true;
    }
  }
  
  removeFromQueue() {
    if (this.queue.length > 0) {
      this.queue.shift();
      this.capacity = Math.max(0, this.capacity - 1);
    }
  }
  
  getColor() {
    return HOUSE_COLORS[this.colorIndex];
  }
}

export class Car {
  constructor(startBuilding, endBuilding) {
    this.x = startBuilding.x;
    this.y = startBuilding.y;
    this.startBuilding = startBuilding;
    this.endBuilding = endBuilding;
    this.colorIndex = startBuilding.colorIndex;
    this.path = [];
    this.pathIndex = 0;
    this.progress = 0;  // 0 to 1 along current segment
    this.hasPath = false;
    this.stuck = false;
    this.stuckTimer = 0;
  }
  
  updatePath(path) {
    if (path && path.length > 0) {
      this.path = path;
      this.pathIndex = 0;
      this.progress = 0;
      this.hasPath = true;
      this.stuck = false;
      this.stuckTimer = 0;
    } else {
      this.hasPath = false;
      this.stuck = true;
    }
  }
  
  move() {
    if (!this.hasPath || this.path.length === 0) {
      this.stuckTimer++;
      if (this.stuckTimer > 180) {  // Stuck for 3 seconds
        return false;  // Remove this car
      }
      return true;
    }
    
    if (this.pathIndex >= this.path.length - 1) {
      // Reached destination
      return false;
    }
    
    const current = this.path[this.pathIndex];
    const next = this.path[this.pathIndex + 1];
    
    // Check if road still exists
    const gridCell = gameState.grid[current.y][current.x];
    const isHighway = gridCell.type === "HIGHWAY";
    const speedMultiplier = isHighway ? gameState.highwaySpeedMultiplier : 1;
    
    const speed = gameState.carSpeed * speedMultiplier / 60;  // Adjust for smooth movement
    this.progress += speed;
    
    if (this.progress >= 1) {
      this.progress = 0;
      this.pathIndex++;
      
      if (this.pathIndex >= this.path.length - 1) {
        // Reached destination
        this.x = this.endBuilding.x;
        this.y = this.endBuilding.y;
        return false;
      }
    }
    
    // Interpolate position
    this.x = current.x + (next.x - current.x) * this.progress;
    this.y = current.y + (next.y - current.y) * this.progress;
    
    return true;
  }
  
  getColor() {
    return HOUSE_COLORS[this.colorIndex];
  }
}

export function spawnBuilding(p) {
  // Find empty spots
  const emptySpots = [];
  for (let y = 1; y < GRID_ROWS - 1; y++) {
    for (let x = 1; x < GRID_COLS - 1; x++) {
      if (gameState.grid[y][x].type === null) {
        // Check no buildings nearby
        let tooClose = false;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            if (ny >= 0 && ny < GRID_ROWS && nx >= 0 && nx < GRID_COLS) {
              if (gameState.grid[ny][nx].type === "HOUSE" || 
                  gameState.grid[ny][nx].type === "DESTINATION") {
                tooClose = true;
                break;
              }
            }
          }
          if (tooClose) break;
        }
        if (!tooClose) {
          emptySpots.push({ x, y });
        }
      }
    }
  }
  
  if (emptySpots.length < 2) return;  // Need at least 2 spots
  
  // Pick random color
  const colorIndex = Math.floor(p.random() * HOUSE_COLORS.length);
  
  // Spawn house
  const houseSpot = emptySpots[Math.floor(p.random() * emptySpots.length)];
  const house = new Building(houseSpot.x, houseSpot.y, colorIndex, "HOUSE");
  gameState.buildings.push(house);
  gameState.grid[houseSpot.y][houseSpot.x] = { type: "HOUSE", data: house };
  
  // Remove used spot
  const houseIdx = emptySpots.findIndex(s => s.x === houseSpot.x && s.y === houseSpot.y);
  emptySpots.splice(houseIdx, 1);
  
  if (emptySpots.length === 0) return;
  
  // Spawn destination - prefer spots far from house
  emptySpots.sort((a, b) => {
    const distA = Math.abs(a.x - houseSpot.x) + Math.abs(a.y - houseSpot.y);
    const distB = Math.abs(b.x - houseSpot.x) + Math.abs(b.y - houseSpot.y);
    return distB - distA;
  });
  
  const destSpot = emptySpots[Math.floor(p.random() * Math.min(5, emptySpots.length))];
  const destination = new Building(destSpot.x, destSpot.y, colorIndex, "DESTINATION");
  gameState.buildings.push(destination);
  gameState.grid[destSpot.y][destSpot.x] = { type: "DESTINATION", data: destination };
  
  // Award road tiles
  gameState.roadTilesAvailable += 3;
}

export function spawnCar(house) {
  // Find matching destination
  const destinations = gameState.buildings.filter(
    b => b.type === "DESTINATION" && b.colorIndex === house.colorIndex
  );
  
  if (destinations.length === 0) return null;
  
  const destination = destinations[0];
  const car = new Car(house, destination);
  return car;
}