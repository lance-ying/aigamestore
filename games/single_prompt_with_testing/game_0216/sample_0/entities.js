// entities.js - Entity classes and anomaly management

import { gameState, ROOM_NAMES, ANOMALY_TYPES, ANOMALY_DURATION } from './globals.js';

// Anomaly class
export class Anomaly {
  constructor(roomIndex, type, details) {
    this.roomIndex = roomIndex;
    this.type = type;
    this.details = details;
    this.spawnTime = gameState.frameCount;
    this.duration = ANOMALY_DURATION;
    this.detected = false;
    this.active = true;
    
    // Apply the anomaly to the room state
    this.applyToRoom();
    
    gameState.activeAnomalies.push(this);
    gameState.totalAnomalies++;
  }
  
  applyToRoom() {
    const room = gameState.roomStates[this.roomIndex];
    
    switch (this.type) {
      case 'FURNITURE_MOVED':
        if (room.objects.length > 0 && this.details.objectIndex < room.objects.length) {
          const obj = room.objects[this.details.objectIndex];
          obj.x = this.details.newX;
          obj.y = this.details.newY;
        }
        break;
        
      case 'OBJECT_DISAPPEARED':
        if (this.details.objectIndex < room.objects.length) {
          this.details.originalObject = { ...room.objects[this.details.objectIndex] };
          room.objects.splice(this.details.objectIndex, 1);
        }
        break;
        
      case 'OBJECT_APPEARED':
        room.objects.push(this.details.newObject);
        break;
        
      case 'INTRUDER':
        room.hasIntruder = true;
        room.intruderPosition = this.details.position;
        break;
        
      case 'DOOR_OPEN':
        room.doorOpen = true;
        break;
        
      case 'LIGHT_CHANGE':
        room.lighting = this.details.newLighting;
        break;
    }
  }
  
  update() {
    const age = gameState.frameCount - this.spawnTime;
    
    // Check if expired
    if (age >= this.duration && !this.detected) {
      this.expire();
    }
  }
  
  expire() {
    if (!this.detected) {
      gameState.anomaliesMissed++;
      gameState.strikes++;
      gameState.score += -75; // MISSED_ANOMALY_PENALTY
      
      // Show alert
      showAlert('Anomaly Expired! Strike!');
    }
    
    this.active = false;
  }
  
  report() {
    if (this.active && !this.detected) {
      this.detected = true;
      gameState.anomaliesDetected++;
      gameState.score += 100; // CORRECT_REPORT_POINTS
      
      // Show alert
      showAlert('Correct Report! +100');
      
      // Remove from active list
      const index = gameState.activeAnomalies.indexOf(this);
      if (index > -1) {
        gameState.activeAnomalies.splice(index, 1);
      }
      
      return true;
    }
    return false;
  }
}

// Particle effect for visual feedback
export class Particle {
  constructor(x, y, color, vx, vy) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.vx = vx;
    this.vy = vy;
    this.life = 1.0;
    this.decay = 0.02;
    this.size = Math.random() * 4 + 2;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2; // Gravity
    this.life -= this.decay;
  }
  
  isDead() {
    return this.life <= 0;
  }
  
  render(p) {
    p.push();
    p.noStroke();
    p.fill(this.color[0], this.color[1], this.color[2], this.life * 255);
    p.circle(this.x, this.y, this.size);
    p.pop();
  }
}

// Create particles for effects
export function createParticles(x, y, count, color) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed - 2;
    
    gameState.particles.push(new Particle(x, y, color, vx, vy));
  }
}

// Show UI alert message
export function showAlert(message) {
  gameState.uiAlertMessage = message;
  gameState.uiAlertTimer = 120; // 2 seconds
}

// Spawn a random anomaly
export function spawnRandomAnomaly() {
  // Don't spawn if at max
  if (gameState.activeAnomalies.length >= 3) {
    return;
  }
  
  // Random room (not current camera for challenge)
  let roomIndex = Math.floor(Math.random() * ROOM_NAMES.length);
  
  // Prefer rooms player isn't watching
  if (roomIndex === gameState.currentCamera && Math.random() > 0.3) {
    roomIndex = (roomIndex + 1) % ROOM_NAMES.length;
  }
  
  const room = gameState.roomStates[roomIndex];
  
  // Random anomaly type
  const typeIndex = Math.floor(Math.random() * ANOMALY_TYPES.length);
  const type = ANOMALY_TYPES[typeIndex];
  
  let details = {};
  
  switch (type) {
    case 'FURNITURE_MOVED':
      if (room.objects.length > 0) {
        const objIndex = Math.floor(Math.random() * room.objects.length);
        const obj = room.objects[objIndex];
        details = {
          objectIndex: objIndex,
          originalX: obj.x,
          originalY: obj.y,
          newX: obj.x + (Math.random() - 0.5) * 100,
          newY: obj.y + (Math.random() - 0.5) * 60
        };
      } else {
        return; // No objects to move
      }
      break;
      
    case 'OBJECT_DISAPPEARED':
      if (room.objects.length > 0) {
        const objIndex = Math.floor(Math.random() * room.objects.length);
        details = { objectIndex: objIndex };
      } else {
        return; // No objects to remove
      }
      break;
      
    case 'OBJECT_APPEARED':
      details = {
        newObject: {
          type: 'strange_object',
          x: 100 + Math.random() * 400,
          y: 150 + Math.random() * 150,
          width: 30 + Math.random() * 30,
          height: 30 + Math.random() * 30,
          color: [
            Math.floor(Math.random() * 100),
            Math.floor(Math.random() * 100),
            Math.floor(Math.random() * 100)
          ]
        }
      };
      break;
      
    case 'INTRUDER':
      details = {
        position: {
          x: 100 + Math.random() * 400,
          y: 150 + Math.random() * 150
        }
      };
      break;
      
    case 'DOOR_OPEN':
      if (!room.doorOpen) {
        details = {};
      } else {
        return; // Door already open
      }
      break;
      
    case 'LIGHT_CHANGE':
      const currentLighting = room.lighting;
      details = {
        originalLighting: currentLighting,
        newLighting: currentLighting > 0.6 ? 0.3 : 1.0
      };
      break;
  }
  
  new Anomaly(roomIndex, type, details);
}

// Check if a report is correct
export function checkReport(roomIndex, typeIndex) {
  const type = ANOMALY_TYPES[typeIndex];
  
  // Find matching active anomaly
  for (let anomaly of gameState.activeAnomalies) {
    if (anomaly.roomIndex === roomIndex && anomaly.type === type && !anomaly.detected) {
      return anomaly;
    }
  }
  
  return null;
}