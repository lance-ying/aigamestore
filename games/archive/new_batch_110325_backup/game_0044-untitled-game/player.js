// player.js
import { PLAYER_SIZE, gameState, TILE_SIZE } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = PLAYER_SIZE;
    this.height = PLAYER_SIZE;
    this.speed = 2;
    this.sprintSpeed = 3.5;
    this.vx = 0;
    this.vy = 0;
    this.facing = 'right';
    this.isHiding = false;
    this.isInteracting = false;
    this.canPush = false;
    this.pushTarget = null;
    this.animFrame = 0;
    this.animTimer = 0;
  }

  update(p, room) {
    if (this.isInteracting) return;

    let moveSpeed = this.speed;
    
    // Check if sprinting (Shift key)
    if (p.keyIsDown(16)) {
      moveSpeed = this.sprintSpeed;
      this.makesNoise = true;
    } else {
      this.makesNoise = false;
    }

    // Check if crouching (Down arrow) - can hide in hiding spots
    if (p.keyIsDown(40)) {
      this.isHiding = this.checkHidingSpot(room);
    } else {
      this.isHiding = false;
    }

    this.vx = 0;
    this.vy = 0;

    // Movement input
    if (p.keyIsDown(37)) { // Left
      this.vx = -moveSpeed;
      this.facing = 'left';
    }
    if (p.keyIsDown(39)) { // Right
      this.vx = moveSpeed;
      this.facing = 'right';
    }
    if (p.keyIsDown(38)) { // Up
      this.vy = -moveSpeed;
    }
    if (p.keyIsDown(40) && !this.isHiding) { // Down (if not hiding)
      this.vy = moveSpeed;
    }

    // Animation
    if (this.vx !== 0 || this.vy !== 0) {
      this.animTimer++;
      if (this.animTimer > 8) {
        this.animFrame = (this.animFrame + 1) % 4;
        this.animTimer = 0;
      }
    } else {
      this.animFrame = 0;
    }

    // Check collision before moving
    let newX = this.x + this.vx;
    let newY = this.y + this.vy;

    if (!this.checkCollision(newX, this.y, room)) {
      this.x = newX;
    }
    if (!this.checkCollision(this.x, newY, room)) {
      this.y = newY;
    }

    // Check if near pushable object
    this.checkPushTarget(room);

    // Keep player in bounds
    this.x = p.constrain(this.x, 0, room.width * TILE_SIZE - this.width);
    this.y = p.constrain(this.y, 0, room.height * TILE_SIZE - this.height);
  }

  checkCollision(x, y, room) {
    const p = window.gameInstance;
    
    // Check walls
    for (let wall of room.walls) {
      if (p.collideRectRect(x, y, this.width, this.height, 
                           wall.x, wall.y, wall.width, wall.height)) {
        return true;
      }
    }

    // Check crates (can't walk through them)
    for (let crate of room.crates) {
      if (p.collideRectRect(x, y, this.width, this.height,
                           crate.x, crate.y, crate.width, crate.height)) {
        return true;
      }
    }

    // Check locked doors
    for (let door of room.doors) {
      if (!door.open && p.collideRectRect(x, y, this.width, this.height,
                                         door.x, door.y, door.width, door.height)) {
        return true;
      }
    }

    return false;
  }

  checkPushTarget(room) {
    const p = window.gameInstance;
    this.pushTarget = null;
    
    for (let crate of room.crates) {
      let dist = p.dist(this.x + this.width/2, this.y + this.height/2,
                       crate.x + crate.width/2, crate.y + crate.height/2);
      if (dist < 50) {
        this.pushTarget = crate;
        break;
      }
    }
  }

  checkHidingSpot(room) {
    const p = window.gameInstance;
    for (let spot of room.hidingSpots) {
      if (p.collideRectRect(this.x, this.y, this.width, this.height,
                           spot.x, spot.y, spot.width, spot.height)) {
        return true;
      }
    }
    return false;
  }

  push(room) {
    if (!this.pushTarget) return;

    const p = window.gameInstance;
    let crate = this.pushTarget;
    
    // Determine push direction based on player position relative to crate
    let dx = crate.x - this.x;
    let dy = crate.y - this.y;
    
    let pushX = 0, pushY = 0;
    if (Math.abs(dx) > Math.abs(dy)) {
      pushX = dx > 0 ? 4 : -4;
    } else {
      pushY = dy > 0 ? 4 : -4;
    }

    // Try to push
    let newX = crate.x + pushX;
    let newY = crate.y + pushY;

    // Check if new position is valid
    let canPush = true;
    
    // Check walls
    for (let wall of room.walls) {
      if (p.collideRectRect(newX, newY, crate.width, crate.height,
                           wall.x, wall.y, wall.width, wall.height)) {
        canPush = false;
        break;
      }
    }

    // Check other crates
    for (let other of room.crates) {
      if (other !== crate && p.collideRectRect(newX, newY, crate.width, crate.height,
                                               other.x, other.y, other.width, other.height)) {
        canPush = false;
        break;
      }
    }

    if (canPush) {
      crate.x = newX;
      crate.y = newY;
      
      // Check pressure plates
      this.checkPressurePlates(room);
    }
  }

  checkPressurePlates(room) {
    const p = window.gameInstance;
    
    for (let plate of room.pressurePlates) {
      plate.activated = false;
      
      for (let crate of room.crates) {
        if (p.collideRectRect(crate.x, crate.y, crate.width, crate.height,
                             plate.x, plate.y, plate.width, plate.height)) {
          plate.activated = true;
          break;
        }
      }
    }

    // Check if all plates are activated
    let allActivated = room.pressurePlates.length > 0 && 
                       room.pressurePlates.every(p => p.activated);
    
    if (allActivated) {
      // Open linked doors
      for (let door of room.doors) {
        if (door.linkedToPressurePlates) {
          door.open = true;
        }
      }
    }
  }

  interact(room) {
    const p = window.gameInstance;
    
    // Check levers
    for (let lever of room.levers) {
      let dist = p.dist(this.x + this.width/2, this.y + this.height/2,
                       lever.x + lever.width/2, lever.y + lever.height/2);
      if (dist < 40) {
        lever.activated = !lever.activated;
        
        // Open/close linked doors
        for (let door of room.doors) {
          if (door.linkedToLever) {
            door.open = lever.activated;
          }
        }
      }
    }
  }

  render(p) {
    p.push();
    
    // Draw shadow
    p.fill(0, 0, 0, 50);
    p.noStroke();
    p.ellipse(this.x + this.width/2, this.y + this.height, this.width * 0.8, 8);

    if (this.isHiding) {
      // Transparent when hiding
      p.fill(255, 255, 100, 100);
    } else {
      p.fill(255, 255, 100);
    }
    
    // Body
    p.noStroke();
    p.rect(this.x + 4, this.y + 8, this.width - 8, this.height - 8, 4);
    
    // Head
    p.fill(255, 220, 180);
    p.circle(this.x + this.width/2, this.y + 8, 12);
    
    // Yellow raincoat details
    p.fill(220, 200, 60);
    p.rect(this.x + 6, this.y + 14, this.width - 12, 3);
    
    // Simple walking animation
    if (this.animFrame % 2 === 0) {
      p.fill(255, 255, 100);
      p.rect(this.x + 4, this.y + this.height - 6, 4, 6);
      p.rect(this.x + this.width - 8, this.y + this.height - 4, 4, 4);
    } else {
      p.fill(255, 255, 100);
      p.rect(this.x + 4, this.y + this.height - 4, 4, 4);
      p.rect(this.x + this.width - 8, this.y + this.height - 6, 4, 6);
    }

    // Hood
    p.fill(240, 220, 70);
    p.arc(this.x + this.width/2, this.y + 8, 14, 14, p.PI, p.TWO_PI);

    p.pop();
  }
}