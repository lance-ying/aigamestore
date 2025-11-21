// room.js - Room generation and management
import { gameState, ROOM_WIDTH, ROOM_HEIGHT, ENEMY_NORMAL } from './globals.js';
import { spawnEnemies } from './enemies.js';
import { randomRange } from './utils.js';

export class Room {
  constructor(type, act) {
    this.type = type; // "normal", "elite", "boss"
    this.act = act;
    this.cleared = false;
    this.enemies = [];
    this.exitPosition = null;
    
    // Generate room layout
    this.generateLayout();
    
    // Spawn enemies
    this.enemies = spawnEnemies(this.type, this.act);
  }
  
  generateLayout() {
    // Exit is on the right side for progression
    this.exitPosition = {
      x: ROOM_WIDTH - 50,
      y: ROOM_HEIGHT / 2,
      radius: 30
    };
  }
  
  update() {
    // Check if room is cleared
    if (!this.cleared) {
      this.cleared = this.enemies.every(e => !e.alive);
      
      if (this.cleared) {
        gameState.roomsCleared++;
      }
    }
  }
  
  draw(p) {
    // Draw floor
    p.push();
    p.noStroke();
    
    // Grid pattern
    const gridSize = 40;
    for (let x = 0; x < ROOM_WIDTH; x += gridSize) {
      for (let y = 0; y < ROOM_HEIGHT; y += gridSize) {
        const screenX = x - gameState.cameraX + 300;
        const screenY = y - gameState.cameraY + 200;
        
        if (screenX > -gridSize && screenX < 600 + gridSize && 
            screenY > -gridSize && screenY < 400 + gridSize) {
          p.fill((x + y) % (gridSize * 2) === 0 ? 40 : 45);
          p.rect(screenX, screenY, gridSize, gridSize);
        }
      }
    }
    
    // Draw walls
    p.stroke(100);
    p.strokeWeight(4);
    p.noFill();
    
    const wallScreenPos = {
      x: -gameState.cameraX + 300,
      y: -gameState.cameraY + 200
    };
    
    p.rect(wallScreenPos.x, wallScreenPos.y, ROOM_WIDTH, ROOM_HEIGHT);
    
    // Draw exit
    if (this.cleared) {
      const exitScreen = {
        x: this.exitPosition.x - gameState.cameraX + 300,
        y: this.exitPosition.y - gameState.cameraY + 200
      };
      
      p.fill(100, 255, 100);
      p.noStroke();
      p.circle(exitScreen.x, exitScreen.y, this.exitPosition.radius * 2);
      
      // Pulsing effect
      const pulse = Math.sin(gameState.frameCount * 0.1) * 5;
      p.fill(150, 255, 150, 100);
      p.circle(exitScreen.x, exitScreen.y, (this.exitPosition.radius + pulse) * 2);
      
      // Text
      p.fill(0);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(12);
      p.text("EXIT", exitScreen.x, exitScreen.y);
    }
    
    p.pop();
  }
  
  checkExit(player) {
    if (!this.cleared) return false;
    
    const dist = Math.sqrt(
      Math.pow(player.x - this.exitPosition.x, 2) +
      Math.pow(player.y - this.exitPosition.y, 2)
    );
    
    return dist < this.exitPosition.radius + player.radius;
  }
}

export function generateNextRoom() {
  const { currentRoom, currentAct } = gameState;
  
  let roomType = "normal";
  
  // Determine room type based on progression
  if (currentRoom === 2) {
    // Every 3rd room is elite
    roomType = "elite";
  } else if (currentRoom === 3) {
    // Every 4th room is boss
    roomType = "boss";
  }
  
  return new Room(roomType, currentAct);
}