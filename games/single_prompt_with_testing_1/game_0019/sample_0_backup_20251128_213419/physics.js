// physics.js - Manual physics implementation
import { gameState } from './globals.js';

export function updatePhysics() {
  // Physics is handled in individual entity update methods
  // This file can be used for collision detection optimization
}

export function checkCollision(box1, box2) {
  const b1Min = {
    x: box1.position.x - box1.size.x / 2,
    y: box1.position.y - box1.size.y / 2,
    z: box1.position.z - box1.size.z / 2
  };
  const b1Max = {
    x: box1.position.x + box1.size.x / 2,
    y: box1.position.y + box1.size.y / 2,
    z: box1.position.z + box1.size.z / 2
  };
  
  const b2Min = {
    x: box2.position.x - box2.size.x / 2,
    y: box2.position.y - box2.size.y / 2,
    z: box2.position.z - box2.size.z / 2
  };
  const b2Max = {
    x: box2.position.x + box2.size.x / 2,
    y: box2.position.y + box2.size.y / 2,
    z: box2.position.z + box2.size.z / 2
  };
  
  return (
    b1Min.x <= b2Max.x && b1Max.x >= b2Min.x &&
    b1Min.y <= b2Max.y && b1Max.y >= b2Min.y &&
    b1Min.z <= b2Max.z && b1Max.z >= b2Min.z
  );
}