// room.js
import { TILE_SIZE, CRATE_SIZE } from './globals.js';
import { Enemy } from './enemy.js';

export class Room {
  constructor(roomNumber, width, height) {
    this.roomNumber = roomNumber;
    this.width = width;
    this.height = height;
    this.walls = [];
    this.spikes = [];
    this.pits = [];
    this.crates = [];
    this.doors = [];
    this.levers = [];
    this.pressurePlates = [];
    this.hidingSpots = [];
    this.enemies = [];
    this.exitDoor = null;
    this.spawnPoint = { x: 50, y: 50 };
  }

  addWall(x, y, width, height) {
    this.walls.push({ x, y, width, height });
  }

  addSpike(x, y, width, height) {
    this.spikes.push({ x, y, width, height });
  }

  addPit(x, y, width, height) {
    this.pits.push({ x, y, width, height });
  }

  addCrate(x, y) {
    this.crates.push({ x, y, width: CRATE_SIZE, height: CRATE_SIZE });
  }

  addDoor(x, y, width, height, open = false, linkedToLever = false, linkedToPressurePlates = false) {
    this.doors.push({ x, y, width, height, open, linkedToLever, linkedToPressurePlates });
  }

  addLever(x, y) {
    this.levers.push({ x, y, width: 20, height: 30, activated: false });
  }

  addPressurePlate(x, y) {
    this.pressurePlates.push({ x, y, width: 40, height: 10, activated: false });
  }

  addHidingSpot(x, y, width, height) {
    this.hidingSpots.push({ x, y, width, height });
  }

  addEnemy(x, y, patrolPoints) {
    this.enemies.push(new Enemy(x, y, patrolPoints));
  }

  setExitDoor(x, y, width, height) {
    this.exitDoor = { x, y, width, height };
  }

  update(p) {
    for (let enemy of this.enemies) {
      enemy.update(p, this);
    }
  }

  render(p) {
    // Floor
    p.fill(40, 35, 30);
    p.noStroke();
    p.rect(0, 0, this.width * TILE_SIZE, this.height * TILE_SIZE);

    // Floor tiles pattern
    p.stroke(50, 45, 40);
    p.strokeWeight(1);
    for (let i = 0; i < this.width; i++) {
      for (let j = 0; j < this.height; j++) {
        p.noFill();
        p.rect(i * TILE_SIZE, j * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }

    // Pits
    for (let pit of this.pits) {
      p.fill(10, 5, 5);
      p.noStroke();
      p.rect(pit.x, pit.y, pit.width, pit.height);
      
      // Pit details
      p.stroke(20, 10, 10);
      p.strokeWeight(2);
      for (let i = 0; i < 3; i++) {
        p.line(pit.x, pit.y + i * pit.height/3, pit.x + pit.width, pit.y + i * pit.height/3);
      }
    }

    // Walls
    for (let wall of this.walls) {
      // Wall shadow
      p.fill(20, 18, 15);
      p.noStroke();
      p.rect(wall.x + 3, wall.y + 3, wall.width, wall.height);
      
      // Wall
      p.fill(80, 70, 60);
      p.rect(wall.x, wall.y, wall.width, wall.height);
      
      // Wall details
      p.stroke(60, 50, 45);
      p.strokeWeight(1);
      for (let i = 1; i < wall.width / 20; i++) {
        p.line(wall.x + i * 20, wall.y, wall.x + i * 20, wall.y + wall.height);
      }
      for (let j = 1; j < wall.height / 20; j++) {
        p.line(wall.x, wall.y + j * 20, wall.x + wall.width, wall.y + j * 20);
      }
    }

    // Pressure plates
    for (let plate of this.pressurePlates) {
      p.fill(plate.activated ? 100 : 60, plate.activated ? 100 : 60, 60);
      p.noStroke();
      p.rect(plate.x, plate.y, plate.width, plate.height, 2);
      
      if (plate.activated) {
        p.fill(150, 255, 150);
        p.circle(plate.x + plate.width/2, plate.y + plate.height/2, 8);
      }
    }

    // Hiding spots (cabinets/wardrobes)
    for (let spot of this.hidingSpots) {
      p.fill(50, 40, 30);
      p.noStroke();
      p.rect(spot.x, spot.y, spot.width, spot.height, 4);
      
      p.fill(30, 25, 20);
      p.rect(spot.x + 5, spot.y + 5, spot.width - 10, spot.height - 10, 2);
      
      // Door handle
      p.fill(180, 160, 100);
      p.circle(spot.x + spot.width - 15, spot.y + spot.height/2, 6);
    }

    // Spikes
    for (let spike of this.spikes) {
      p.fill(100, 100, 100);
      p.noStroke();
      
      let numSpikes = Math.floor(spike.width / 15);
      for (let i = 0; i < numSpikes; i++) {
        let x = spike.x + i * (spike.width / numSpikes);
        p.triangle(x, spike.y + spike.height,
                  x + spike.width / numSpikes / 2, spike.y,
                  x + spike.width / numSpikes, spike.y + spike.height);
      }
    }

    // Crates
    for (let crate of this.crates) {
      // Shadow
      p.fill(0, 0, 0, 50);
      p.noStroke();
      p.rect(crate.x + 2, crate.y + 2, crate.width, crate.height);
      
      // Crate
      p.fill(120, 90, 60);
      p.rect(crate.x, crate.y, crate.width, crate.height, 2);
      
      // Crate details
      p.stroke(80, 60, 40);
      p.strokeWeight(2);
      p.line(crate.x + 5, crate.y + 5, crate.x + crate.width - 5, crate.y + crate.height - 5);
      p.line(crate.x + crate.width - 5, crate.y + 5, crate.x + 5, crate.y + crate.height - 5);
      
      // Corner details
      p.noStroke();
      p.fill(100, 75, 50);
      p.rect(crate.x, crate.y, 8, 8);
      p.rect(crate.x + crate.width - 8, crate.y, 8, 8);
      p.rect(crate.x, crate.y + crate.height - 8, 8, 8);
      p.rect(crate.x + crate.width - 8, crate.y + crate.height - 8, 8, 8);
    }

    // Levers
    for (let lever of this.levers) {
      // Base
      p.fill(60, 60, 60);
      p.noStroke();
      p.rect(lever.x, lever.y + 15, lever.width, 15, 2);
      
      // Lever arm
      p.stroke(80, 80, 80);
      p.strokeWeight(4);
      if (lever.activated) {
        p.line(lever.x + lever.width/2, lever.y + 20, lever.x + lever.width/2 + 10, lever.y + 5);
        p.fill(100, 255, 100);
      } else {
        p.line(lever.x + lever.width/2, lever.y + 20, lever.x + lever.width/2 - 10, lever.y + 5);
        p.fill(255, 100, 100);
      }
      
      // Lever handle
      p.noStroke();
      if (lever.activated) {
        p.circle(lever.x + lever.width/2 + 10, lever.y + 5, 8);
      } else {
        p.circle(lever.x + lever.width/2 - 10, lever.y + 5, 8);
      }
    }

    // Doors
    for (let door of this.doors) {
      if (!door.open) {
        // Closed door
        p.fill(100, 80, 60);
        p.noStroke();
        p.rect(door.x, door.y, door.width, door.height, 4);
        
        p.fill(80, 60, 45);
        p.rect(door.x + 5, door.y + 5, door.width - 10, door.height - 10, 2);
        
        // Lock indicator
        p.fill(200, 50, 50);
        p.circle(door.x + door.width/2, door.y + door.height/2, 12);
      } else {
        // Open door (mostly transparent)
        p.fill(100, 80, 60, 100);
        p.noStroke();
        p.rect(door.x - door.width * 0.8, door.y, door.width * 0.3, door.height, 4);
      }
    }

    // Exit door
    if (this.exitDoor) {
      p.fill(50, 150, 50);
      p.noStroke();
      p.rect(this.exitDoor.x, this.exitDoor.y, this.exitDoor.width, this.exitDoor.height, 4);
      
      p.fill(100, 200, 100);
      p.rect(this.exitDoor.x + 5, this.exitDoor.y + 5, 
             this.exitDoor.width - 10, this.exitDoor.height - 10, 2);
      
      // Exit symbol
      p.fill(255);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(20);
      p.text("EXIT", this.exitDoor.x + this.exitDoor.width/2, 
             this.exitDoor.y + this.exitDoor.height/2);
    }

    // Render enemies
    for (let enemy of this.enemies) {
      enemy.render(p);
    }
  }
}

export function createRooms() {
  const rooms = [];

  // Room 0: Tutorial - Simple movement and crate pushing
  const room0 = new Room(0, 15, 10);
  room0.spawnPoint = { x: 50, y: 50 };
  
  // Outer walls
  room0.addWall(0, 0, 600, 20);
  room0.addWall(0, 0, 20, 400);
  room0.addWall(580, 0, 20, 400);
  room0.addWall(0, 380, 600, 20);
  
  // Simple obstacle
  room0.addWall(200, 100, 100, 20);
  
  // Crate puzzle
  room0.addCrate(150, 200);
  room0.addPressurePlate(400, 250);
  room0.addDoor(500, 150, 20, 80, false, false, true);
  
  // Hiding spot
  room0.addHidingSpot(50, 250, 40, 50);
  
  room0.setExitDoor(540, 150, 40, 80);
  rooms.push(room0);

  // Room 1: Introduce enemy patrol
  const room1 = new Room(1, 15, 10);
  room1.spawnPoint = { x: 50, y: 50 };
  
  room1.addWall(0, 0, 600, 20);
  room1.addWall(0, 0, 20, 400);
  room1.addWall(580, 0, 20, 400);
  room1.addWall(0, 380, 600, 20);
  
  // Central wall
  room1.addWall(250, 100, 20, 200);
  
  // Enemy patrol
  room1.addEnemy(350, 150, [
    { x: 350, y: 150 },
    { x: 450, y: 150 },
    { x: 450, y: 250 },
    { x: 350, y: 250 }
  ]);
  
  // Hiding spots
  room1.addHidingSpot(50, 150, 40, 50);
  room1.addHidingSpot(300, 300, 40, 50);
  
  // Lever puzzle
  room1.addLever(150, 300);
  room1.addDoor(500, 150, 20, 100, false, true, false);
  
  room1.setExitDoor(540, 150, 40, 100);
  rooms.push(room1);

  // Room 2: Spike traps and timing
  const room2 = new Room(2, 15, 10);
  room2.spawnPoint = { x: 50, y: 50 };
  
  room2.addWall(0, 0, 600, 20);
  room2.addWall(0, 0, 20, 400);
  room2.addWall(580, 0, 20, 400);
  room2.addWall(0, 380, 600, 20);
  
  // Spike corridor
  room2.addSpike(150, 180, 200, 40);
  room2.addWall(150, 150, 200, 20);
  room2.addWall(150, 230, 200, 20);
  
  // Safe path with crate
  room2.addCrate(80, 190);
  room2.addPressurePlate(200, 200);
  
  // Enemy guarding exit
  room2.addEnemy(450, 200, [
    { x: 450, y: 200 },
    { x: 500, y: 200 },
    { x: 500, y: 280 },
    { x: 450, y: 280 }
  ]);
  
  room2.addHidingSpot(380, 300, 40, 50);
  room2.addDoor(400, 100, 20, 60, false, false, true);
  
  room2.setExitDoor(540, 100, 40, 60);
  rooms.push(room2);

  // Room 3: Final challenge - Multiple elements
  const room3 = new Room(3, 15, 10);
  room3.spawnPoint = { x: 50, y: 50 };
  
  room3.addWall(0, 0, 600, 20);
  room3.addWall(0, 0, 20, 400);
  room3.addWall(580, 0, 20, 400);
  room3.addWall(0, 380, 600, 20);
  
  // Complex layout
  room3.addWall(150, 80, 20, 100);
  room3.addWall(350, 220, 20, 100);
  
  // Multiple crates and plates
  room3.addCrate(100, 150);
  room3.addCrate(250, 250);
  room3.addPressurePlate(200, 120);
  room3.addPressurePlate(400, 280);
  
  // Pit hazard
  room3.addPit(200, 180, 120, 60);
  
  // Two enemies
  room3.addEnemy(280, 100, [
    { x: 280, y: 100 },
    { x: 320, y: 100 },
    { x: 320, y: 150 },
    { x: 280, y: 150 }
  ]);
  
  room3.addEnemy(450, 280, [
    { x: 450, y: 280 },
    { x: 500, y: 280 }
  ]);
  
  // Hiding spots
  room3.addHidingSpot(50, 250, 40, 50);
  room3.addHidingSpot(480, 100, 40, 50);
  
  // Final door
  room3.addDoor(500, 50, 20, 60, false, false, true);
  
  room3.setExitDoor(540, 50, 40, 60);
  rooms.push(room3);

  return rooms;
}